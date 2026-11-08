// Data API (replaces direct Firestore access). Called by src/lib/firebase/firestore.ts.
//
//   POST /api/db/get    { collection, id }                      -> { doc | null }
//   POST /api/db/query  { collection, conditions, orderBy?, direction?, limit?, startAfterId? }
//                                                               -> { docs, hasMore }
//   POST /api/db/write  { ops: [{ type: add|set|update|delete, collection, id?, data? }] }
//                                                               -> { ids }   (all-or-nothing)
//
// Every read and write is checked against src/lib/server/access.ts.

import { inTransaction } from "@/lib/mysql/db";
import { Access } from "@/lib/server/access";
import { getSession } from "@/lib/server/auth";
import {
  applyUpdate,
  assertCollection,
  assertId,
  ensureCollection,
  getDoc,
  newId,
  normalize,
  putDoc,
  queryDocs,
  removeDoc,
  StoreError,
  type DocData,
  type QueryCondition,
} from "@/lib/server/docstore";
import { handle, json, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ action: string }> };

interface WriteOp {
  type: "add" | "set" | "update" | "delete";
  collection: string;
  id?: string;
  data?: DocData;
}

function asData(v: unknown): DocData {
  if (v === null || typeof v !== "object" || Array.isArray(v)) {
    throw new StoreError(400, "invalid-argument", "Document data must be an object.");
  }
  return normalize(v) as DocData;
}

const denied = () => new StoreError(403, "permission-denied", "Missing or insufficient permissions.");

export async function POST(request: Request, { params }: Params) {
  const { action } = await params;
  return handle(request, async (db) => {
    const body = await readJson(request, 5_000_000);
    const session = await getSession(db, request);
    const access = new Access(db, session);

    switch (action) {
      case "get": {
        const collection = assertCollection(body.collection);
        const id = assertId(body.id);
        const doc = await getDoc(db, collection, id);
        if (!doc) return json({ doc: null });
        if (!(await access.canRead(collection, doc))) throw denied();
        return json({ doc });
      }

      case "query": {
        const collection = assertCollection(body.collection);
        const conditions = Array.isArray(body.conditions) ? (body.conditions as QueryCondition[]) : [];
        if (conditions.length > 20) throw new StoreError(400, "invalid-argument", "Too many conditions.");
        const result = await queryDocs(
          db,
          collection,
          conditions,
          {
            orderBy: typeof body.orderBy === "string" ? body.orderBy : undefined,
            direction: body.direction === "asc" ? "asc" : "desc",
            limit: typeof body.limit === "number" ? body.limit : undefined,
            startAfterId: typeof body.startAfterId === "string" ? body.startAfterId : undefined,
          },
          (doc) => access.canRead(collection, doc)
        );
        return json(result);
      }

      case "write": {
        const ops = Array.isArray(body.ops) ? (body.ops as WriteOp[]) : [];
        if (ops.length === 0 || ops.length > 500) {
          throw new StoreError(400, "invalid-argument", "A write must contain 1 to 500 operations.");
        }
        // Validate and create any missing tables before the transaction
        // (CREATE TABLE inside a transaction would commit it early).
        for (const op of ops) {
          assertCollection(op.collection);
          if (op.type !== "add") assertId(op.id);
          if (!["add", "set", "update", "delete"].includes(op.type)) {
            throw new StoreError(400, "invalid-argument", "Unknown write type.");
          }
          await ensureCollection(db, op.collection);
        }

        const ids = await inTransaction(db, async () => {
          const out: string[] = [];
          for (const op of ops) {
            const collection = op.collection;
            const id = op.type === "add" ? newId() : (op.id as string);
            const existing = op.type === "add" ? null : await getDoc(db, collection, id, true);

            if (op.type === "delete") {
              if (existing) {
                if (!(await access.canDelete(collection, id, existing))) throw denied();
                await removeDoc(db, collection, id);
              }
            } else if (op.type === "update") {
              if (!existing) throw new StoreError(404, "not-found", `No document to update: ${collection}/${id}`);
              const next = applyUpdate(existing, asData(op.data));
              if (!(await access.canUpdate(collection, id, existing, next))) throw denied();
              await putDoc(db, collection, id, next);
            } else {
              // add, or set (replace): Firestore checks "update" rules when the document exists.
              const data = asData(op.data);
              delete data.id;
              const allowed = existing
                ? await access.canUpdate(collection, id, existing, data)
                : await access.canCreate(collection, id, data);
              if (!allowed) throw denied();
              await putDoc(db, collection, id, data);
            }
            access.forget(collection, id);
            out.push(id);
          }
          return out;
        });
        return json({ ids });
      }

      default:
        throw new StoreError(404, "not-found", "Unknown action.");
    }
  });
}
