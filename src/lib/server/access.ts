// Who may read and change what (server only).
//
// A port of firestore.rules and storage.rules, enforced on every request
// to /api/db and /api/files. Collections not listed are admin-only.
//
// Tightened compared with the Firebase rules:
// - users can't change their own role, status, verification or commission
//   fields (Firebase allowed any owner update, so a user could make
//   themselves admin); operators can't approve themselves either.
// - a passenger can only create payments for themselves.
// - signing up from the browser can only create a "passenger" profile.

import type { Db } from "@/lib/mysql/db";
import { getDoc, type Doc, type DocData } from "./docstore";
import type { Session } from "./auth";

type Data = DocData;

const BOOKING_STATUSES = new Set([
  "pending", "quoted", "confirmed", "driver_assigned", "driver_en_route",
  "arrived", "in_progress", "completed", "cancelled", "no_show",
]);
const DOCUMENT_TYPES = new Set([
  "driving_licence", "insurance", "mot_certificate", "pco_licence", "dbs_check",
  "vehicle_registration", "profile_photo", "vehicle_photo", "operator_licence",
]);

/** Profile fields only an admin may change. */
const USER_PROTECTED = [
  "uid", "email", "role", "status", "active", "emailVerified", "isVerified",
  "approvalStatus", "commission", "rating", "totalReviews",
];
const OPERATOR_PROTECTED = [
  "userId", "approvalStatus", "active", "commissionRate", "averageRating",
  "totalBookings", "totalRevenue",
];

function has(data: Data, ...keys: string[]): boolean {
  return keys.some((k) => k in data);
}

function unchanged(before: Data, after: Data, keys: string[]): boolean {
  return keys.every((k) => JSON.stringify(before[k] ?? null) === JSON.stringify(after[k] ?? null));
}

export class Access {
  private cache = new Map<string, Promise<Doc | null>>();

  constructor(private db: Db, readonly session: Session | null) {}

  get uid(): string | null {
    return this.session?.uid ?? null;
  }

  get isAuthenticated(): boolean {
    return this.session !== null;
  }

  load(collection: string, id: unknown): Promise<Doc | null> {
    if (typeof id !== "string" || !id) return Promise.resolve(null);
    const key = `${collection}/${id}`;
    let p = this.cache.get(key);
    if (!p) {
      p = getDoc(this.db, collection, id);
      this.cache.set(key, p);
    }
    return p;
  }

  /** Forget cached copies after a write in the same request. */
  forget(collection: string, id: string): void {
    this.cache.delete(`${collection}/${id}`);
  }

  async role(): Promise<string | null> {
    if (!this.session || this.session.anonymous) return null;
    const me = await this.load("users", this.session.uid);
    return typeof me?.role === "string" ? me.role : null;
  }

  async isAdmin(): Promise<boolean> {
    const r = await this.role();
    return r === "admin" || r === "super_admin";
  }

  async isSuperAdmin(): Promise<boolean> {
    return (await this.role()) === "super_admin";
  }

  async is(role: "driver" | "operator" | "passenger"): Promise<boolean> {
    return (await this.role()) === role;
  }

  isMe(id: unknown): boolean {
    return this.uid !== null && id === this.uid;
  }

  /** Operator approved by an admin (operators/{uid} or their profile). */
  async isOperatorApproved(): Promise<boolean> {
    if (!(await this.is("operator"))) return false;
    const op = await this.load("operators", this.uid);
    if (op?.approvalStatus === "approved") return true;
    const me = await this.load("users", this.uid);
    return me?.isVerified === true;
  }

  async isOperatorOfBooking(bookingId: unknown): Promise<boolean> {
    if (!this.uid) return false;
    const b = await this.load("bookings", bookingId);
    return b?.operatorId === this.uid;
  }

  // -------------------------------------------------------------------------
  // Documents
  // -------------------------------------------------------------------------

  async canRead(collection: string, doc: Doc): Promise<boolean> {
    if (await this.isAdmin()) return true;
    const authed = this.isAuthenticated;
    switch (collection) {
      case "users":
        return this.isMe(doc.id);
      case "passengers":
        return this.isMe(doc.id) || (await this.is("operator"));
      case "drivers":
      case "operators":
      case "vehicles":
      case "reviews":
      case "pricing_rules":
      case "driver_locations":
      case "promo_codes":
      case "settings":
      case "zones":
        return authed;
      case "driverDocuments": {
        if (this.isMe(doc.driverId)) return true;
        if (!(await this.is("operator"))) return false;
        const driver = await this.load("drivers", doc.driverId);
        return driver?.operatorId === this.uid;
      }
      case "bookings":
        return (
          this.isMe(doc.passengerId) ||
          this.isMe(doc.driverId) ||
          (this.isMe(doc.operatorId) && (await this.isOperatorApproved()))
        );
      case "quotes":
        return (
          this.isMe(doc.passengerId) ||
          ((await this.isOperatorOfBooking(doc.bookingId)) && (await this.isOperatorApproved()))
        );
      case "payments":
        return (
          this.isMe(doc.userId) ||
          ((await this.isOperatorOfBooking(doc.bookingId)) && (await this.isOperatorApproved()))
        );
      case "notifications":
      case "saved_locations":
      case "payouts":
      case "fare_calculations":
        return this.isMe(doc.userId);
      case "documents":
        return this.isMe(doc.driverId) || (await this.isOperatorApproved());
      case "support_tickets":
        return this.isMe(doc.userId) || (await this.isOperatorApproved());
      case "scheduled_rides": {
        if (this.isMe(doc.passengerId)) return true;
        const b = await this.load("bookings", doc.bookingId);
        return this.isMe(b?.driverId);
      }
      case "driver_earnings":
        return this.isMe(doc.driverId);
      case "operator_earnings":
        return this.isMe(doc.operatorId);
      default:
        return false;
    }
  }

  async canCreate(collection: string, id: string, data: Data): Promise<boolean> {
    if (await this.isAdmin()) {
      // Admins can create anything except super admins (only a super admin can).
      if (collection === "users" && data.role === "super_admin") return this.isSuperAdmin();
      return true;
    }
    const authed = this.isAuthenticated;
    switch (collection) {
      case "users":
        return this.isMe(id) && data.role === "passenger";
      case "passengers":
        return this.isMe(id) && data.userId === this.uid;
      case "driverDocuments":
        return (
          (await this.is("driver")) &&
          id.startsWith(`${this.uid}__`) &&
          data.driverId === this.uid &&
          data.status === "pending" &&
          !has(data, "reviewedAt", "reviewedBy")
        );
      case "operators":
        return (
          this.isMe(id) &&
          data.userId === this.uid &&
          (data.approvalStatus === undefined || data.approvalStatus === "pending")
        );
      case "vehicles":
        return this.is("driver");
      case "bookings":
        if (data.status !== undefined && typeof data.status === "string" && !BOOKING_STATUSES.has(data.status)) {
          return false;
        }
        if (authed) return data.passengerId === this.uid;
        return typeof data.passengerId === "string" && data.passengerId.startsWith("guest-");
      case "guest_bookings":
        return true;
      case "quotes":
        return (await this.is("operator")) && (await this.isOperatorApproved());
      case "payments":
        return (
          (await this.is("passenger")) &&
          data.userId === this.uid &&
          typeof data.amount === "number" &&
          data.amount > 0
        );
      case "reviews":
        return (
          authed &&
          data.passengerId === this.uid &&
          typeof data.rating === "number" &&
          data.rating >= 1 &&
          data.rating <= 5
        );
      case "notifications":
        return (await this.is("operator")) || (await this.is("driver"));
      case "documents":
        return (
          (await this.is("driver")) &&
          data.driverId === this.uid &&
          typeof data.documentType === "string" &&
          DOCUMENT_TYPES.has(data.documentType)
        );
      case "support_tickets":
        return (
          authed &&
          data.userId === this.uid &&
          ["low", "medium", "high", "urgent"].includes(data.priority as string) &&
          ["open", "in_progress", "resolved", "closed"].includes(data.status as string) &&
          ["booking_issue", "payment_issue", "driver_issue", "vehicle_issue", "account_issue", "complaint", "other"].includes(
            data.category as string
          )
        );
      case "driver_locations":
        return (await this.is("driver")) && this.isMe(id);
      case "saved_locations":
        return authed && data.userId === this.uid;
      case "fare_calculations":
        return authed;
      case "scheduled_rides":
        return (await this.is("passenger")) && data.passengerId === this.uid;
      default:
        return false;
    }
  }

  async canUpdate(collection: string, id: string, before: Data, after: Data): Promise<boolean> {
    if (await this.isAdmin()) {
      if (collection === "users" && (before.role === "super_admin" || after.role === "super_admin")) {
        return this.isSuperAdmin();
      }
      return true;
    }
    switch (collection) {
      case "users":
        return this.isMe(id) && unchanged(before, after, USER_PROTECTED);
      case "passengers":
        return this.isMe(id);
      case "driverDocuments":
        return (
          (await this.is("driver")) &&
          before.driverId === this.uid &&
          after.driverId === this.uid &&
          after.status === "pending" &&
          !has(after, "reviewedAt", "reviewedBy")
        );
      case "operators":
        return this.isMe(id) && unchanged(before, after, OPERATOR_PROTECTED);
      case "vehicles":
        return (await this.is("driver")) && before.driverId === this.uid && after.driverId === this.uid;
      case "bookings":
        if (typeof after.status === "string" && !BOOKING_STATUSES.has(after.status)) return false;
        return (
          this.isMe(before.passengerId) ||
          this.isMe(before.driverId) ||
          (this.isMe(before.operatorId) && (await this.isOperatorApproved()))
        );
      case "quotes":
        return (await this.is("operator")) && before.operatorId === this.uid;
      case "payments":
        return (await this.is("operator")) && (await this.isOperatorApproved());
      case "reviews":
        return this.isMe(before.passengerId) && after.passengerId === before.passengerId;
      case "notifications":
      case "saved_locations":
        return this.isMe(before.userId) && after.userId === before.userId;
      case "documents":
        return (
          ((await this.is("driver")) && before.driverId === this.uid && before.status === "pending") ||
          ((await this.is("operator")) && (await this.isOperatorApproved()))
        );
      case "support_tickets":
        return this.isMe(before.userId) || (await this.isOperatorApproved());
      case "driver_locations":
        return (await this.is("driver")) && this.isMe(id);
      case "scheduled_rides":
        return this.isMe(before.passengerId) && after.passengerId === before.passengerId;
      default:
        return false;
    }
  }

  async canDelete(collection: string, id: string, before: Data): Promise<boolean> {
    if (collection === "users" || collection === "audit_logs") return this.isSuperAdmin();
    if (await this.isAdmin()) return true;
    switch (collection) {
      case "vehicles":
        return (await this.is("driver")) && before.driverId === this.uid;
      case "notifications":
      case "saved_locations":
        return this.isMe(before.userId);
      case "driver_locations":
        return (await this.is("driver")) && this.isMe(id);
      case "scheduled_rides":
        return this.isMe(before.passengerId);
      default:
        return false;
    }
  }

  // -------------------------------------------------------------------------
  // Files (port of storage.rules)
  // -------------------------------------------------------------------------

  async canFile(
    op: "read" | "create" | "update" | "delete",
    path: string,
    file?: { contentType: string; size: number }
  ): Promise<boolean> {
    if (await this.isAdmin()) return true;
    const seg = path.split("/");
    const write = op !== "read";
    const isImage = !!file && file.contentType.startsWith("image/");
    const isDocument = !!file && (isImage || file.contentType === "application/pdf");
    const under = (mb: number) => !!file && file.size > 0 && file.size < mb * 1024 * 1024;
    const MB2 = 2, MB5 = 5, MB10 = 10;
    const writeOk = (cond: boolean) => (op === "delete" ? true : cond);

    const match = (pattern: string[]) =>
      seg.length === pattern.length && pattern.every((p, i) => p.startsWith("{") || p === seg[i]);

    // users/{userId}/profile/{file}
    if (match(["users", "{u}", "profile", "{f}"])) {
      if (!write) return true;
      return this.isMe(seg[1]) && writeOk(isImage && under(MB2));
    }
    // users/{userId}/documents/{file}
    if (match(["users", "{u}", "documents", "{f}"])) {
      if (!write) return this.isMe(seg[1]);
      return this.isMe(seg[1]) && writeOk(isDocument && under(MB10));
    }
    // drivers/{driverId}/documents/{docType}/{file}
    if (match(["drivers", "{d}", "documents", "{t}", "{f}"])) {
      if (!write) {
        if (this.isMe(seg[1])) return true;
        if (!(await this.is("operator"))) return false;
        const driver = await this.load("drivers", seg[1]);
        return driver?.operatorId === this.uid;
      }
      if (!this.isMe(seg[1])) return false;
      if (op === "create" && !/^[a-z0-9_]{1,60}$/.test(seg[3])) return false;
      return writeOk(isDocument && under(MB10));
    }
    // drivers/{driverId}/profile/{file}
    if (match(["drivers", "{d}", "profile", "{f}"])) {
      if (!write) return true;
      return this.isMe(seg[1]) && writeOk(isImage && under(MB2));
    }
    // operators/{operatorId}/documents/{file}
    if (match(["operators", "{o}", "documents", "{f}"])) {
      if (!write) return this.isMe(seg[1]);
      return this.isMe(seg[1]) && writeOk(isDocument && under(MB10));
    }
    // operators/{operatorId}/logo|banners/{file}
    if (match(["operators", "{o}", "logo", "{f}"]) || match(["operators", "{o}", "banners", "{f}"])) {
      if (!write) return true;
      return this.isMe(seg[1]) && writeOk(isImage && under(MB5));
    }
    // bookings/{bookingId}/receipts|attachments/{file}
    if (match(["bookings", "{b}", "receipts", "{f}"]) || match(["bookings", "{b}", "attachments", "{f}"])) {
      if (!write) {
        if (!this.isAuthenticated) return false;
        const b = await this.load("bookings", seg[1]);
        return !!b && (this.isMe(b.passengerId) || this.isMe(b.driverId) || this.isMe(b.operatorId));
      }
      if (seg[2] === "attachments" && op === "create") return this.isAuthenticated && isImage && under(MB10);
      return false;
    }
    // support_tickets/{ticketId}/attachments/{file}
    if (match(["support_tickets", "{t}", "attachments", "{f}"])) {
      const t = await this.load("support_tickets", seg[1]);
      const own = !!t && this.isMe(t.userId);
      if (!write) return own;
      return op === "create" && own && isDocument && under(MB10);
    }
    // vehicles/{vehicleId}/photos/{file}
    if (match(["vehicles", "{v}", "photos", "{f}"])) {
      if (!write) return true;
      const v = await this.load("vehicles", seg[1]);
      return !!v && this.isMe(v.driverId) && writeOk(isImage && under(MB5));
    }
    // promo_codes/{promoId}/images/{file}
    if (match(["promo_codes", "{p}", "images", "{f}"])) {
      return !write;
    }
    return false;
  }
}
