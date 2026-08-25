import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentWritten,
} from "firebase-functions/v2/firestore";
import { https, schedule } from "firebase-functions/v2";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import Stripe from "stripe";

initializeApp();

const db = getFirestore();
const messaging = getMessaging();
const storage = getStorage();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

// ============================================================
// TYPES
// ============================================================

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  role: "passenger" | "driver" | "operator" | "admin" | "super_admin";
  emailVerified: boolean;
  active: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  fcmToken?: string;
}

interface DriverData {
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  approvalStatus: "pending" | "approved" | "rejected" | "suspended";
  active: boolean;
  averageRating: number;
  totalTrips: number;
  totalEarnings: number;
  vehicleId: string;
  operatorId: string;
  licensed: boolean;
  insured: boolean;
}

interface OperatorData {
  userId: string;
  companyName: string;
  email: string;
  phone: string;
  approvalStatus: "pending" | "approved" | "rejected" | "suspended";
  active: boolean;
  averageRating: number;
  totalBookings: number;
  totalRevenue: number;
  commissionRate: number;
  driverCount: number;
}

interface BookingData {
  passengerId: string;
  driverId?: string;
  operatorId?: string;
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoffLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  pickupTime: FirebaseFirestore.Timestamp;
  vehicleType: "saloon" | "estate" | "mpv" | "executive" | "minibus";
  status:
    | "pending"
    | "quoted"
    | "confirmed"
    | "driver_assigned"
    | "driver_en_route"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  bookingStatus: "active" | "completed" | "cancelled";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  passengerCount: number;
  luggage: number;
  specialRequirements: string;
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedPrice: number;
  finalPrice?: number;
  promoCode?: string;
  discountAmount?: number;
  paymentId?: string;
  rating?: number;
  review?: string;
}

interface PaymentData {
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded"
    | "partially_refunded"
    | "cancelled";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  stripePaymentIntentId: string;
  stripePaymentMethodId?: string;
  refundAmount: number;
}

interface QuoteData {
  bookingId: string;
  operatorId: string;
  driverId?: string;
  price: number;
  currency: string;
  estimatedDuration: number;
  estimatedDistance: number;
  vehicleType: string;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  status: "pending" | "accepted" | "rejected" | "expired";
}

interface NotificationData {
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
  createdAt: FirebaseFirestore.Timestamp;
  read: boolean;
  readAt?: FirebaseFirestore.Timestamp;
}

interface DriverLocationData {
  location: FirebaseFirestore.GeoPoint;
  heading: number;
  speed: number;
  updatedAt: FirebaseFirestore.Timestamp;
  available: boolean;
  currentBookingId?: string;
}

interface PromoCodeData {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minBookingValue?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: FirebaseFirestore.Timestamp;
  validUntil: FirebaseFirestore.Timestamp;
  isActive: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  operatorId?: string;
}

interface PayoutData {
  userId: string;
  userType: "driver" | "operator";
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: FirebaseFirestore.Timestamp;
  processedAt?: FirebaseFirestore.Timestamp;
  periodStart: FirebaseFirestore.Timestamp;
  periodEnd: FirebaseFirestore.Timestamp;
  bookingIds: string[];
  totalEarnings: number;
  commission: number;
  netAmount: number;
  paymentMethod: string;
  transactionId?: string;
}

interface SupportTicketData {
  userId: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  assignedTo?: string;
  category: string;
  bookingId?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateEstimatedDuration(distanceMiles: number): number {
  const averageSpeedMph = 20; // UK city average
  return Math.ceil((distanceMiles / averageSpeedMph) * 60);
}

async function sendNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
  type: string = "general"
): Promise<void> {
  try {
    // Store notification in Firestore
    await db.collection("notifications").add({
      userId,
      type,
      title,
      body,
      data,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    });

    // Get user's FCM token
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserData;

    if (userData?.fcmToken) {
      await messaging.send({
        token: userData.fcmToken,
        notification: { title, body },
        data,
        android: {
          priority: "high",
          notification: {
            channelId: "uk-taxi-platform",
            priority: "max",
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: "default",
            },
          },
        },
      });
    }
  } catch (error) {
    logger.error(`Failed to send notification to ${userId}:`, error);
  }
}

async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<void> {
  try {
    // In production, integrate with SendGrid, Mailgun, or similar
    // For now, log the email
    logger.info(`Email sent to ${to}: ${subject}`);
    logger.info(`HTML Body: ${htmlBody}`);

    // Store email record for auditing
    await db.collection("email_logs").add({
      to,
      subject,
      htmlBody,
      textBody: textBody || htmlBody.replace(/<[^>]*>/g, ""),
      sentAt: FieldValue.serverTimestamp(),
      status: "sent",
    });
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
}

async function createAuditLog(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  beforeData?: Record<string, unknown>,
  afterData?: Record<string, unknown>
): Promise<void> {
  try {
    await db.collection("audit_logs").add({
      userId,
      action,
      entityType,
      entityId,
      beforeData: beforeData || null,
      afterData: afterData || null,
      timestamp: FieldValue.serverTimestamp(),
      ipAddress: null,
    });
  } catch (error) {
    logger.error("Failed to create audit log:", error);
  }
}

// ============================================================
// ON BOOKING CREATED
// ============================================================

export const onBookingCreated = onDocumentCreated(
  "bookings/{bookingId}",
  async (event) => {
    const bookingData = event.data?.data() as BookingData;
    const bookingId = event.params.bookingId;

    if (!bookingData) {
      logger.error("No booking data found for", bookingId);
      return;
    }

    logger.info(`New booking created: ${bookingId}`, bookingData);

    try {
      // 1. Calculate final price server-side
      const finalPrice = await calculateFinalPrice(bookingData);

      // 2. Check for promo code and apply discount
      let discountAmount = 0;
      let finalAmount = finalPrice;

      if (bookingData.promoCode) {
        const promoResult = await applyPromoCode(
          bookingData.promoCode,
          finalPrice
        );
        if (promoResult.valid) {
          discountAmount = promoResult.discountAmount;
          finalAmount = finalPrice - discountAmount;
        }
      }

      // 3. Update booking with calculated price
      await db.collection("bookings").doc(bookingId).update({
        finalPrice,
        discountAmount,
        estimatedPrice: finalAmount,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 4. Create fare calculation record
      await db.collection("fare_calculations").add({
        bookingId,
        userId: bookingData.passengerId,
        estimatedPrice: bookingData.estimatedPrice,
        finalPrice,
        discountAmount,
        finalAmount,
        vehicleType: bookingData.vehicleType,
        distance: bookingData.estimatedDistance,
        duration: bookingData.estimatedDuration,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 5. Notify passenger
      await sendNotification(
        bookingData.passengerId,
        "Booking Created",
        `Your booking has been received. Estimated price: £${finalAmount.toFixed(2)}`,
        {
          bookingId,
          type: "booking_created",
          finalPrice: finalAmount.toString(),
        },
        "booking_created"
      );

      // 6. Create audit log
      await createAuditLog(
        bookingData.passengerId,
        "booking_created",
        "booking",
        bookingId,
        undefined,
        { ...bookingData, finalPrice, discountAmount, finalAmount }
      );

      // 7. Find and notify available operators
      const nearbyOperators = await findNearbyOperators(
        bookingData.pickupLocation.latitude,
        bookingData.pickupLocation.longitude
      );

      for (const operator of nearbyOperators) {
        await sendNotification(
          operator.userId,
          "New Booking Available",
          `New ${bookingData.vehicleType} booking from ${bookingData.pickupLocation.address}`,
          {
            bookingId,
            type: "new_booking_available",
            pickupAddress: bookingData.pickupLocation.address,
            vehicleType: bookingData.vehicleType,
          },
          "new_booking_available"
        );
      }

      logger.info(
        `Booking ${bookingId} processed successfully. Final price: £${finalAmount.toFixed(2)}`
      );
    } catch (error) {
      logger.error(`Error processing booking ${bookingId}:`, error);

      // Update booking status to indicate error
      await db.collection("bookings").doc(bookingId).update({
        status: "pending",
        updatedAt: FieldValue.serverTimestamp(),
        error: "Failed to process booking",
      });

      throw error;
    }
  }
);

async function calculateFinalPrice(booking: BookingData): Promise<number> {
  // Get pricing rules for the vehicle type
  const pricingSnapshot = await db
    .collection("pricing_rules")
    .where("vehicleType", "==", booking.vehicleType)
    .where("active", "==", true)
    .get();

  if (pricingSnapshot.empty) {
    // Use default pricing
    const baseRates: Record<string, { base: number; perMile: number; perMinute: number; minimum: number }> = {
      saloon: { base: 3.5, perMile: 1.8, perMinute: 0.25, minimum: 8.0 },
      estate: { base: 4.0, perMile: 2.0, perMinute: 0.3, minimum: 9.0 },
      mpv: { base: 5.0, perMile: 2.5, perMinute: 0.35, minimum: 12.0 },
      executive: { base: 6.0, perMile: 3.0, perMinute: 0.45, minimum: 15.0 },
      minibus: { base: 7.0, perMile: 3.5, perMinute: 0.5, minimum: 18.0 },
    };

    const rates = baseRates[booking.vehicleType] || baseRates.saloon;
    let price = rates.base + booking.estimatedDistance * rates.perMile +
      booking.estimatedDuration * rates.perMinute;

    // Apply time-based surge pricing
    const pickupDate = booking.pickupTime.toDate();
    const hour = pickupDate.getHours();
    const day = pickupDate.getDay();

    // Friday/Saturday evening surge (10pm - 3am)
    if ((day === 5 || day === 6) && (hour >= 22 || hour < 3)) {
      price *= 1.5;
    }
    // Weekday evening rush (5pm - 7pm)
    else if (day >= 1 && day <= 5 && hour >= 17 && hour < 19) {
      price *= 1.25;
    }
    // Late night (11pm - 5am)
    else if (hour >= 23 || hour < 5) {
      price *= 1.3;
    }

    return Math.max(price, rates.minimum);
  }

  // Use operator-specific pricing
  const pricingRule = pricingSnapshot.docs[0].data();
  let price =
    pricingRule.basePrice +
    booking.estimatedDistance * pricingRule.perMile +
    booking.estimatedDuration * pricingRule.perMinute;

  // Apply surge multiplier if active
  if (pricingRule.surgeMultiplier > 1) {
    price *= pricingRule.surgeMultiplier;
  }

  return Math.max(price, pricingRule.minimumPrice);
}

async function applyPromoCode(
  promoCode: string,
  bookingAmount: number
): Promise<{ valid: boolean; discountAmount: number; promoId?: string }> {
  try {
    const promoSnapshot = await db
      .collection("promo_codes")
      .where("code", "==", promoCode.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (promoSnapshot.empty) {
      return { valid: false, discountAmount: 0 };
    }

    const promoDoc = promoSnapshot.docs[0];
    const promoData = promoDoc.data() as PromoCodeData;
    const now = new Date();

    // Check validity
    if (
      promoData.validFrom.toDate() > now ||
      promoData.validUntil.toDate() < now
    ) {
      return { valid: false, discountAmount: 0 };
    }

    if (promoData.usageLimit > 0 && promoData.usedCount >= promoData.usageLimit) {
      return { valid: false, discountAmount: 0 };
    }

    if (
      promoData.minBookingValue &&
      bookingAmount < promoData.minBookingValue
    ) {
      return { valid: false, discountAmount: 0 };
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoData.discountType === "percentage") {
      discountAmount = (bookingAmount * promoData.discountValue) / 100;
      if (promoData.maxDiscount) {
        discountAmount = Math.min(discountAmount, promoData.maxDiscount);
      }
    } else {
      discountAmount = Math.min(promoData.discountValue, bookingAmount);
    }

    // Increment usage count
    await db.collection("promo_codes").doc(promoDoc.id).update({
      usedCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      valid: true,
      discountAmount,
      promoId: promoDoc.id,
    };
  } catch (error) {
    logger.error("Error applying promo code:", error);
    return { valid: false, discountAmount: 0 };
  }
}

async function findNearbyOperators(
  latitude: number,
  longitude: number
): Promise<OperatorData[]> {
  try {
    const operatorsSnapshot = await db
      .collection("operators")
      .where("approvalStatus", "==", "approved")
      .where("active", "==", true)
      .get();

    return operatorsSnapshot.docs.map((doc) => ({
      userId: doc.id,
      ...doc.data(),
    })) as OperatorData[];
  } catch (error) {
    logger.error("Error finding nearby operators:", error);
    return [];
  }
}

// ============================================================
// ON BOOKING STATUS CHANGED
// ============================================================

export const onBookingStatusChanged = onDocumentUpdated(
  "bookings/{bookingId}",
  async (event) => {
    const beforeData = event.data?.before.data() as BookingData;
    const afterData = event.data?.after.data() as BookingData;
    const bookingId = event.params.bookingId;

    if (!beforeData || !afterData) {
      logger.error("Missing booking data for status change", bookingId);
      return;
    }

    // Only process if status actually changed
    if (beforeData.status === afterData.status) {
      return;
    }

    const oldStatus = beforeData.status;
    const newStatus = afterData.status;

    logger.info(
      `Booking ${bookingId} status changed: ${oldStatus} → ${newStatus}`
    );

    try {
      switch (newStatus) {
        case "confirmed":
          await handleBookingConfirmed(bookingId, afterData);
          break;

        case "driver_assigned":
          await handleDriverAssigned(bookingId, afterData);
          break;

        case "driver_en_route":
          await handleDriverEnRoute(bookingId, afterData);
          break;

        case "arrived":
          await handleDriverArrived(bookingId, afterData);
          break;

        case "in_progress":
          await handleTripStarted(bookingId, afterData);
          break;

        case "completed":
          await handleTripCompleted(bookingId, afterData);
          break;

        case "cancelled":
          await handleBookingCancelled(bookingId, afterData, beforeData);
          break;

        case "no_show":
          await handleNoShow(bookingId, afterData);
          break;
      }

      // Update the booking status timestamp
      await db.collection("bookings").doc(bookingId).update({
        statusHistory: FieldValue.arrayUnion({
          status: newStatus,
          timestamp: FieldValue.serverTimestamp(),
          previousStatus: oldStatus,
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Create audit log
      await createAuditLog(
        afterData.passengerId,
        `booking_${newStatus}`,
        "booking",
        bookingId,
        { status: oldStatus },
        { status: newStatus }
      );
    } catch (error) {
      logger.error(
        `Error processing status change for booking ${bookingId}:`,
        error
      );
      throw error;
    }
  }
);

async function handleBookingConfirmed(
  bookingId: string,
  booking: BookingData
): Promise<void> {
  // Notify passenger
  await sendNotification(
    booking.passengerId,
    "Booking Confirmed",
    `Your booking has been confirmed. A driver will be assigned shortly.`,
    {
      bookingId,
      type: "booking_confirmed",
    },
    "booking_confirmed"
  );

  // Send confirmation email
  const passengerDoc = await db
    .collection("users")
    .doc(booking.passengerId)
    .get();
  const passengerData = passengerDoc.data() as UserData;

  if (passengerData) {
    await sendEmail(
      passengerData.email,
      "Booking Confirmation - Blue Star Airport Transfers LTD",
      `
        <h1>Booking Confirmed</h1>
        <p>Dear ${passengerData.displayName},</p>
        <p>Your booking has been confirmed.</p>
        <p><strong>Pickup:</strong> ${booking.pickupLocation.address}</p>
        <p><strong>Drop-off:</strong> ${booking.dropoffLocation.address}</p>
        <p><strong>Vehicle Type:</strong> ${booking.vehicleType}</p>
        <p><strong>Estimated Price:</strong> £${(booking.finalPrice || booking.estimatedPrice).toFixed(2)}</p>
        <p>A driver will be assigned shortly.</p>
        <p>Thank you for choosing Blue Star Airport Transfers LTD.</p>
      `
    );
  }

  // Notify operator if assigned
  if (booking.operatorId) {
    await sendNotification(
      booking.operatorId,
      "Booking Confirmed",
      `Booking ${bookingId} has been confirmed.`,
      {
        bookingId,
        type: "booking_confirmed",
      },
      "booking_confirmed"
    );
  }
}

async function handleDriverAssigned(
  bookingId: string,
  booking: BookingData
): Promise<void> {
  if (!booking.driverId) return;

  // Notify driver
  await sendNotification(
    booking.driverId,
    "New Booking Assignment",
    `You have been assigned a new booking from ${booking.pickupLocation.address}.`,
    {
      bookingId,
      type: "driver_assigned",
      pickupAddress: booking.pickupLocation.address,
    },
    "driver_assigned"
  );

  // Notify passenger
  await sendNotification(
    booking.passengerId,
    "Driver Assigned",
    `A driver has been assigned to your booking. Track your driver in real-time.`,
    {
      bookingId,
      type: "driver_assigned",
      driverId: booking.driverId,
    },
    "driver_assigned"
  );

  // Update driver availability
  await db
    .collection("driver_locations")
    .doc(booking.driverId)
    .update({
      available: false,
      currentBookingId: bookingId,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

async function handleDriverEnRoute(
  bookingId: string,
  booking: BookingData
): Promise<void> {
  if (!booking.driverId) return;

  // Notify passenger
  await sendNotification(
    booking.passengerId,
    "Driver En Route",
    `Your driver is on the way to pick you up.`,
    {
      bookingId,
      type: "driver_en_route",
      driverId: booking.driverId,
    },
    "driver_en_route"
  );
}

async function handleDriverArrived(
  bookingId: string,
  booking: BookingData
): Promise<void> {
  if (!booking.driverId) return;

  // Notify passenger
  await sendNotification(
    booking.passengerId,
    "Driver Arrived",
    `Your driver has arrived at the pickup location.`,
    {
      bookingId,
      type: "driver_arrived",
      driverId: booking.driverId,
    },
    "driver_arrived"
  );
}

async function handleTripStarted(
  bookingId: string,
  booking: BookingData
): Promise<void> {
  if (!booking.driverId) return;

  // Notify passenger
  await sendNotification(
    booking.passengerId,
    "Trip Started",
    `Your trip has started. Enjoy your ride!`,
    {
      bookingId,
      type: "trip_started",
      driverId: booking.driverId,
    },
    "trip_started"
  );
}

async function handleTripCompleted(
  bookingId: string,
  booking: BookingData
): Promise<void> {
  if (!booking.driverId) return;

  // Notify passenger
  await sendNotification(
    booking.passengerId,
    "Trip Completed",
    `Your trip has been completed. Please rate your experience.`,
    {
      bookingId,
      type: "trip_completed",
      driverId: booking.driverId,
      finalPrice: (booking.finalPrice || booking.estimatedPrice).toString(),
    },
    "trip_completed"
  );

  // Notify driver
  await sendNotification(
    booking.driverId,
    "Trip Completed",
    `Trip completed. Earnings will be calculated shortly.`,
    {
      bookingId,
      type: "trip_completed",
      finalPrice: (booking.finalPrice || booking.estimatedPrice).toString(),
    },
    "trip_completed"
  );

  // Process payment
  await processBookingPayment(bookingId, booking);

  // Calculate driver earnings
  await calculateAndRecordEarnings(bookingId, booking);

  // Update driver availability
  await db
    .collection("driver_locations")
    .doc(booking.driverId)
    .update({
      available: true,
      currentBookingId: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

  // Update driver stats
  await db
    .collection("drivers")
    .doc(booking.driverId)
    .update({
      totalTrips: FieldValue.increment(1),
      totalEarnings: FieldValue.increment(
        booking.finalPrice || booking.estimatedPrice
      ),
      updatedAt: FieldValue.serverTimestamp(),
    });

  // Update operator stats
  if (booking.operatorId) {
    await db
      .collection("operators")
      .doc(booking.operatorId)
      .update({
        totalBookings: FieldValue.increment(1),
        totalRevenue: FieldValue.increment(
          booking.finalPrice || booking.estimatedPrice
        ),
        updatedAt: FieldValue.serverTimestamp(),
      });
  }

  // Update booking
  await db.collection("bookings").doc(bookingId).update({
    bookingStatus: "completed",
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function handleBookingCancelled(
  bookingId: string,
  afterData: BookingData,
  beforeData: BookingData
): Promise<void> {
  // Determine who cancelled
  const cancelledBy = afterData.driverId || afterData.passengerId;

  // Notify relevant parties
  if (afterData.driverId && cancelledBy !== afterData.driverId) {
    await sendNotification(
      afterData.driverId,
      "Booking Cancelled",
      `The booking you were assigned has been cancelled.`,
      {
        bookingId,
        type: "booking_cancelled",
      },
      "booking_cancelled"
    );
  }

  if (cancelledBy !== afterData.passengerId) {
    await sendNotification(
      afterData.passengerId,
      "Booking Cancelled",
      `Your booking has been cancelled.`,
      {
        bookingId,
        type: "booking_cancelled",
      },
      "booking_cancelled"
    );
  }

  // Process refund if payment was made
  if (afterData.paymentId) {
    await processRefund(afterData.paymentId, afterData);
  }

  // Update driver availability if driver was assigned
  if (afterData.driverId) {
    await db
      .collection("driver_locations")
      .doc(afterData.driverId)
      .update({
        available: true,
        currentBookingId: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
  }

  // Update booking
  await db.collection("bookings").doc(bookingId).update({
    bookingStatus: "cancelled",
    cancelledAt: FieldValue.serverTimestamp(),
    cancelledBy,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function handleNoShow(
  bookingId: string,
  booking: BookingData
): Promise<void> {
  // Notify passenger
  await sendNotification(
    booking.passengerId,
    "No Show",
    `The driver marked your booking as a no-show. If you believe this is an error, please contact support.`,
    {
      bookingId,
      type: "no_show",
      driverId: booking.driverId || "",
    },
    "no_show"
  );

  // Update booking
  await db.collection("bookings").doc(bookingId).update({
    bookingStatus: "cancelled",
    cancelledAt: FieldValue.serverTimestamp(),
    cancelledBy: booking.driverId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Update driver availability
  if (booking.driverId) {
    await db
      .collection("driver_locations")
      .doc(booking.driverId)
      .update({
        available: true,
        currentBookingId: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
  }
}

// ============================================================
// PROCESS BOOKING PAYMENT
// ============================================================

async function processBookingPayment(
  bookingId: string,
  booking: BookingData
): Promise<void> {
  const finalAmount = booking.finalPrice || booking.estimatedPrice;

  try {
    // Create payment record
    const paymentRef = await db.collection("payments").add({
      bookingId,
      userId: booking.passengerId,
      amount: finalAmount,
      currency: "GBP",
      paymentMethod: "card",
      status: "processing",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      stripePaymentIntentId: "",
      refundAmount: 0,
    });

    // In production, create Stripe PaymentIntent here
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(finalAmount * 100),
    //   currency: 'gbp',
    //   metadata: { bookingId, paymentId: paymentRef.id },
    // });

    // Update payment with Stripe ID
    await paymentRef.update({
      stripePaymentIntentId: `pi_demo_${bookingId}`,
      status: "completed",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update booking with payment ID
    await db.collection("bookings").doc(bookingId).update({
      paymentId: paymentRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(
      `Payment processed for booking ${bookingId}: £${finalAmount.toFixed(2)}`
    );
  } catch (error) {
    logger.error(`Payment processing failed for booking ${bookingId}:`, error);
    throw error;
  }
}

// ============================================================
// PROCESS REFUND
// ============================================================

async function processRefund(
  paymentId: string,
  booking: BookingData
): Promise<void> {
  try {
    const paymentDoc = await db.collection("payments").doc(paymentId).get();
    if (!paymentDoc.exists) {
      logger.error(`Payment ${paymentId} not found for refund`);
      return;
    }

    const paymentData = paymentDoc.data() as PaymentData;
    const refundAmount = paymentData.amount;

    // In production, process Stripe refund here
    // await stripe.refunds.create({
    //   payment_intent: paymentData.stripePaymentIntentId,
    //   amount: Math.round(refundAmount * 100),
    // });

    // Update payment record
    await db.collection("payments").doc(paymentId).update({
      status: "refunded",
      refundAmount,
      updatedAt: FieldValue.serverTimestamp(),
      refundedAt: FieldValue.serverTimestamp(),
    });

    logger.info(
      `Refund processed for payment ${paymentId}: £${refundAmount.toFixed(2)}`
    );
  } catch (error) {
    logger.error(`Refund processing failed for payment ${paymentId}:`, error);
    throw error;
  }
}

// ============================================================
// CALCULATE AND RECORD EARNINGS
// ============================================================

async function calculateAndRecordEarnings(
  bookingId: string,
  booking: BookingData
): Promise<void> {
  if (!booking.driverId) return;

  try {
    const finalAmount = booking.finalPrice || booking.estimatedPrice;

    // Get operator commission rate
    let commissionRate = 0.2; // Default 20%
    if (booking.operatorId) {
      const operatorDoc = await db
        .collection("operators")
        .doc(booking.operatorId)
        .get();
      if (operatorDoc.exists) {
        const operatorData = operatorDoc.data() as OperatorData;
        commissionRate = operatorData.commissionRate || 0.2;
      }
    }

    const commission = finalAmount * commissionRate;
    const netEarnings = finalAmount - commission;

    // Record driver earnings
    await db.collection("driver_earnings").add({
      driverId: booking.driverId,
      bookingId,
      operatorId: booking.operatorId,
      earnings: finalAmount,
      commission,
      netEarnings,
      createdAt: FieldValue.serverTimestamp(),
      paidOut: false,
    });

    // Record operator earnings
    if (booking.operatorId) {
      await db.collection("operator_earnings").add({
        operatorId: booking.operatorId,
        bookingId,
        earnings: commission,
        driverPayment: netEarnings,
        commission,
        netEarnings: commission,
        createdAt: FieldValue.serverTimestamp(),
        paidOut: false,
      });
    }

    logger.info(
      `Earnings calculated for booking ${bookingId}: Driver £${netEarnings.toFixed(2)}, Commission £${commission.toFixed(2)}`
    );
  } catch (error) {
    logger.error(
      `Error calculating earnings for booking ${bookingId}:`,
      error
    );
    throw error;
  }
}

// ============================================================
// GENERATE QUOTES (Callable Function)
// ============================================================

export const generateQuotes = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const {
    pickupLatitude,
    pickupLongitude,
    dropoffLatitude,
    dropoffLongitude,
    vehicleType,
    passengerCount,
    pickupTime,
  } = request.data;

  // Validate input
  if (
    !pickupLatitude ||
    !pickupLongitude ||
    !dropoffLatitude ||
    !dropoffLongitude ||
    !vehicleType
  ) {
    throw new https.HttpsError(
      "invalid-argument",
      "Missing required parameters"
    );
  }

  try {
    // Calculate distance and duration
    const distance = calculateDistance(
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude
    );
    const duration = calculateEstimatedDuration(distance);

    // Get available operators
    const operatorsSnapshot = await db
      .collection("operators")
      .where("approvalStatus", "==", "approved")
      .where("active", "==", true)
      .get();

    const quotes: QuoteData[] = [];

    for (const operatorDoc of operatorsSnapshot.docs) {
      const operator = operatorDoc.data() as OperatorData;

      // Get pricing rule for this operator
      const pricingSnapshot = await db
        .collection("pricing_rules")
        .where("operatorId", "==", operatorDoc.id)
        .where("vehicleType", "==", vehicleType)
        .where("active", "==", true)
        .limit(1)
        .get();

      if (pricingSnapshot.empty) continue;

      const pricing = pricingSnapshot.docs[0].data();
      let price =
        pricing.basePrice +
        distance * pricing.perMile +
        duration * pricing.perMinute;

      // Apply surge if applicable
      if (pricing.surgeMultiplier > 1) {
        price *= pricing.surgeMultiplier;
      }

      price = Math.max(price, pricing.minimumPrice);

      // Create quote
      const quoteRef = await db.collection("quotes").add({
        bookingId: null, // Will be linked when booking is created
        operatorId: operatorDoc.id,
        driverId: null,
        price,
        currency: "GBP",
        estimatedDuration: duration,
        estimatedDistance: distance,
        vehicleType,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        status: "pending",
      });

      quotes.push({
        bookingId: "",
        operatorId: operatorDoc.id,
        price,
        currency: "GBP",
        estimatedDuration: duration,
        estimatedDistance: distance,
        vehicleType,
        createdAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
        expiresAt: new Date(
          Date.now() + 15 * 60 * 1000
        ) as unknown as FirebaseFirestore.Timestamp,
        status: "pending",
      });
    }

    // Sort by price
    quotes.sort((a, b) => a.price - b.price);

    return {
      success: true,
      quotes: quotes.slice(0, 5), // Return top 5 cheapest quotes
      distance,
      duration,
    };
  } catch (error) {
    logger.error("Error generating quotes:", error);
    throw new https.HttpsError("internal", "Failed to generate quotes");
  }
});

// ============================================================
// ASSIGN DRIVER (Callable Function)
// ============================================================

export const assignDriver = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { bookingId, driverId } = request.data;

  if (!bookingId || !driverId) {
    throw new https.HttpsError(
      "invalid-argument",
      "Missing bookingId or driverId"
    );
  }

  try {
    // Get booking
    const bookingDoc = await db.collection("bookings").doc(bookingId).get();
    if (!bookingDoc.exists) {
      throw new https.HttpsError("not-found", "Booking not found");
    }

    const booking = bookingDoc.data() as BookingData;

    // Check if user is authorized
    const userDoc = await db
      .collection("users")
      .doc(request.auth.uid)
      .get();
    const userData = userDoc.data() as UserData;

    if (
      userData.role !== "admin" &&
      userData.role !== "super_admin" &&
      userData.role !== "operator"
    ) {
      throw new https.HttpsError(
        "permission-denied",
        "Not authorized to assign drivers"
      );
    }

    // Check if driver exists and is approved
    const driverDoc = await db.collection("drivers").doc(driverId).get();
    if (!driverDoc.exists) {
      throw new https.HttpsError("not-found", "Driver not found");
    }

    const driver = driverDoc.data() as DriverData;
    if (driver.approvalStatus !== "approved") {
      throw new https.HttpsError(
        "failed-precondition",
        "Driver is not approved"
      );
    }

    // Check driver availability
    const driverLocationDoc = await db
      .collection("driver_locations")
      .doc(driverId)
      .get();

    if (driverLocationDoc.exists) {
      const driverLocation = driverLocationDoc.data() as DriverLocationData;
      if (!driverLocation.available) {
        throw new https.HttpsError(
          "failed-precondition",
          "Driver is not available"
        );
      }
    }

    // Update booking
    await db.collection("bookings").doc(bookingId).update({
      driverId,
      status: "driver_assigned",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Notify driver
    await sendNotification(
      driverId,
      "New Booking Assignment",
      `You have been assigned a new booking.`,
      {
        bookingId,
        type: "driver_assigned",
        pickupAddress: booking.pickupLocation.address,
      },
      "driver_assigned"
    );

    // Create audit log
    await createAuditLog(
      request.auth.uid,
      "driver_assigned",
      "booking",
      bookingId,
      undefined,
      { driverId }
    );

    return { success: true, message: "Driver assigned successfully" };
  } catch (error) {
    if (error instanceof https.HttpsError) throw error;
    logger.error("Error assigning driver:", error);
    throw new https.HttpsError("internal", "Failed to assign driver");
  }
});

// ============================================================
// PROCESS PAYMENT (Callable Function)
// ============================================================

export const processPayment = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { bookingId, paymentMethodId, savePaymentMethod } = request.data;

  if (!bookingId || !paymentMethodId) {
    throw new https.HttpsError(
      "invalid-argument",
      "Missing bookingId or paymentMethodId"
    );
  }

  try {
    // Get booking
    const bookingDoc = await db.collection("bookings").doc(bookingId).get();
    if (!bookingDoc.exists) {
      throw new https.HttpsError("not-found", "Booking not found");
    }

    const booking = bookingDoc.data() as BookingData;

    // Verify user owns the booking
    if (booking.passengerId !== request.auth.uid) {
      throw new https.HttpsError(
        "permission-denied",
        "Not authorized to pay for this booking"
      );
    }

    const finalAmount = booking.finalPrice || booking.estimatedPrice;

    // In production, create Stripe PaymentIntent
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(finalAmount * 100),
    //   currency: 'gbp',
    //   customer: stripeCustomerId,
    //   payment_method: paymentMethodId,
    //   confirm: true,
    //   metadata: { bookingId },
    // });

    // Create payment record
    const paymentRef = await db.collection("payments").add({
      bookingId,
      userId: request.auth.uid,
      amount: finalAmount,
      currency: "GBP",
      paymentMethod: "card",
      status: "completed",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      stripePaymentIntentId: `pi_demo_${bookingId}`,
      stripePaymentMethodId: paymentMethodId,
      refundAmount: 0,
    });

    // Update booking
    await db.collection("bookings").doc(bookingId).update({
      paymentId: paymentRef.id,
      status: "confirmed",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Send confirmation
    await sendNotification(
      request.auth.uid,
      "Payment Successful",
      `Payment of £${finalAmount.toFixed(2)} has been processed.`,
      {
        bookingId,
        paymentId: paymentRef.id,
        type: "payment_successful",
      },
      "payment_successful"
    );

    return {
      success: true,
      paymentId: paymentRef.id,
      amount: finalAmount,
    };
  } catch (error) {
    if (error instanceof https.HttpsError) throw error;
    logger.error("Error processing payment:", error);
    throw new https.HttpsError("internal", "Payment processing failed");
  }
});

// ============================================================
// SEND BOOKING CONFIRMATION
// ============================================================

export const onBookingConfirmed = onDocumentUpdated(
  "bookings/{bookingId}",
  async (event) => {
    const beforeData = event.data?.before.data() as BookingData;
    const afterData = event.data?.after.data() as BookingData;

    if (!beforeData || !afterData) return;

    // Only trigger when status changes to confirmed
    if (beforeData.status === "confirmed" || afterData.status !== "confirmed") {
      return;
    }

    const bookingId = event.params.bookingId;

    try {
      // Send confirmation email
      const passengerDoc = await db
        .collection("users")
        .doc(afterData.passengerId)
        .get();
      const passengerData = passengerDoc.data() as UserData;

      if (passengerData) {
        await sendEmail(
          passengerData.email,
          "Booking Confirmed - Blue Star Airport Transfers LTD",
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a73e8;">Booking Confirmed</h1>
              <p>Dear ${passengerData.displayName},</p>
              <p>Your booking has been confirmed. Here are the details:</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Pickup:</strong> ${afterData.pickupLocation.address}</p>
                <p><strong>Drop-off:</strong> ${afterData.dropoffLocation.address}</p>
                <p><strong>Date & Time:</strong> ${afterData.pickupTime.toDate().toLocaleString("en-GB")}</p>
                <p><strong>Vehicle Type:</strong> ${afterData.vehicleType.charAt(0).toUpperCase() + afterData.vehicleType.slice(1)}</p>
                <p><strong>Passengers:</strong> ${afterData.passengerCount}</p>
                <p><strong>Luggage:</strong> ${afterData.luggage}</p>
                ${afterData.specialRequirements ? `<p><strong>Special Requirements:</strong> ${afterData.specialRequirements}</p>` : ""}
                <p style="font-size: 24px; color: #1a73e8; margin-top: 15px;"><strong>Total: £${(afterData.finalPrice || afterData.estimatedPrice).toFixed(2)}</strong></p>
              </div>
              
              <p>A driver will be assigned shortly. You can track your booking in the app.</p>
              
              <p>Thank you for choosing Blue Star Airport Transfers LTD!</p>
              
              <p style="color: #666; font-size: 12px;">If you have any questions, please contact support.</p>
            </div>
          `
        );
      }

      // Send push notification
      await sendNotification(
        afterData.passengerId,
        "Booking Confirmed",
        `Your booking from ${afterData.pickupLocation.address} to ${afterData.dropoffLocation.address} has been confirmed.`,
        {
          bookingId,
          type: "booking_confirmed",
        },
        "booking_confirmed"
      );

      logger.info(`Booking confirmation sent for ${bookingId}`);
    } catch (error) {
      logger.error(
        `Error sending booking confirmation for ${bookingId}:`,
        error
      );
    }
  }
);

// ============================================================
// ON DRIVER LOCATION UPDATED
// ============================================================

export const onDriverLocationUpdated = onDocumentUpdated(
  "driver_locations/{driverId}",
  async (event) => {
    const beforeData = event.data?.before.data() as DriverLocationData;
    const afterData = event.data?.after.data() as DriverLocationData;
    const driverId = event.params.driverId;

    if (!afterData) return;

    // Only process if location actually changed
    if (
      beforeData?.location?.latitude === afterData.location?.latitude &&
      beforeData?.location?.longitude === afterData.location?.longitude
    ) {
      return;
    }

    try {
      // Store location history for analytics
      await db.collection("driver_location_history").add({
        driverId,
        location: afterData.location,
        heading: afterData.heading,
        speed: afterData.speed,
        available: afterData.available,
        currentBookingId: afterData.currentBookingId,
        timestamp: FieldValue.serverTimestamp(),
      });

      // If driver has an active booking, notify passenger of location update
      if (afterData.currentBookingId) {
        const bookingDoc = await db
          .collection("bookings")
          .doc(afterData.currentBookingId)
          .get();

        if (bookingDoc.exists) {
          const booking = bookingDoc.data() as BookingData;

          // Calculate ETA
          const distance = calculateDistance(
            afterData.location.latitude,
            afterData.location.longitude,
            booking.pickupLocation.latitude,
            booking.pickupLocation.longitude
          );

          const etaMinutes = calculateEstimatedDuration(distance);

          // Store real-time location for passenger to query
          await db
            .collection("bookings")
            .doc(afterData.currentBookingId)
            .update({
              driverLocation: {
                latitude: afterData.location.latitude,
                longitude: afterData.location.longitude,
                heading: afterData.heading,
                speed: afterData.speed,
              },
              driverEta: etaMinutes,
              lastLocationUpdate: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
        }
      }

      // Check for nearby bookings (for auto-assignment)
      if (afterData.available) {
        await checkForNearbyBookings(driverId, afterData);
      }
    } catch (error) {
      logger.error(
        `Error processing location update for driver ${driverId}:`,
        error
      );
    }
  }
);

async function checkForNearbyBookings(
  driverId: string,
  driverLocation: DriverLocationData
): Promise<void> {
  try {
    // Find pending bookings within 5 miles
    const pendingBookings = await db
      .collection("bookings")
      .where("status", "==", "pending")
      .where("bookingStatus", "==", "active")
      .get();

    for (const bookingDoc of pendingBookings.docs) {
      const booking = bookingDoc.data() as BookingData;

      const distance = calculateDistance(
        driverLocation.location.latitude,
        driverLocation.location.longitude,
        booking.pickupLocation.latitude,
        booking.pickupLocation.longitude
      );

      // If within 5 miles, notify operator
      if (distance <= 5) {
        const operatorId = booking.operatorId;
        if (operatorId) {
          await sendNotification(
            operatorId,
            "Nearby Driver Available",
            `Driver ${driverId} is ${distance.toFixed(1)} miles from a pending booking.`,
            {
              bookingId: bookingDoc.id,
              driverId,
              distance: distance.toString(),
              type: "nearby_driver",
            },
            "nearby_driver"
          );
        }
      }
    }
  } catch (error) {
    logger.error("Error checking for nearby bookings:", error);
  }
}

// ============================================================
// CALCULATE DRIVER EARNINGS
// ============================================================

export const calculateDriverEarnings = onDocumentUpdated(
  "bookings/{bookingId}",
  async (event) => {
    const beforeData = event.data?.before.data() as BookingData;
    const afterData = event.data?.after.data() as BookingData;

    if (!beforeData || !afterData) return;

    // Only trigger when trip is completed
    if (
      beforeData.status === "completed" ||
      afterData.status !== "completed"
    ) {
      return;
    }

    const bookingId = event.params.bookingId;

    // Skip if already processed
    if (afterData.driverId !== beforeData.driverId && !afterData.driverId) {
      return;
    }

    try {
      await calculateAndRecordEarnings(bookingId, afterData);
      logger.info(`Earnings calculated for completed booking ${bookingId}`);
    } catch (error) {
      logger.error(
        `Error calculating earnings for booking ${bookingId}:`,
        error
      );
    }
  }
);

// ============================================================
// SEND REVIEW REMINDER (Scheduled)
// ============================================================

export const sendReviewReminder = schedule("every 1 hours", async (event) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Find completed bookings without reviews from the last 24-48 hours
    const completedBookings = await db
      .collection("bookings")
      .where("status", "==", "completed")
      .where("bookingStatus", "==", "completed")
      .where("completedAt", ">=", twoDaysAgo)
      .where("completedAt", "<=", oneDayAgo)
      .get();

    let remindersSent = 0;

    for (const bookingDoc of completedBookings.docs) {
      const booking = bookingDoc.data() as BookingData;

      // Check if review already exists
      const existingReview = await db
        .collection("reviews")
        .where("bookingId", "==", bookingDoc.id)
        .where("reviewerId", "==", booking.passengerId)
        .limit(1)
        .get();

      if (!existingReview.empty) continue;

      // Check if reminder already sent
      const existingReminder = await db
        .collection("notifications")
        .where("userId", "==", booking.passengerId)
        .where("type", "==", "review_reminder")
        .where("data.bookingId", "==", bookingDoc.id)
        .limit(1)
        .get();

      if (!existingReminder.empty) continue;

      // Send reminder
      await sendNotification(
        booking.passengerId,
        "Rate Your Trip",
        `How was your trip from ${booking.pickupLocation.address}? Share your feedback!`,
        {
          bookingId: bookingDoc.id,
          type: "review_reminder",
          pickupAddress: booking.pickupLocation.address,
        },
        "review_reminder"
      );

      remindersSent++;
    }

    logger.info(`Review reminders sent: ${remindersSent}`);
  } catch (error) {
    logger.error("Error sending review reminders:", error);
  }
});

// ============================================================
// CHECK DOCUMENT EXPIRY (Scheduled Daily)
// ============================================================

export const checkDocumentExpiry = schedule("every 24 hours", async (event) => {
  try {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const today = new Date();

    // Find documents expiring within 30 days
    const expiringDocs = await db
      .collection("documents")
      .where("status", "==", "verified")
      .where("expiryDate", "<=", thirtyDaysFromNow)
      .where("expiryDate", ">=", today)
      .get();

    let warningsSent = 0;

    for (const doc of expiringDocs.docs) {
      const docData = doc.data();
      const expiryDate = docData.expiryDate.toDate();
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if warning already sent
      const existingWarning = await db
        .collection("notifications")
        .where("userId", "==", docData.driverId)
        .where("type", "==", "document_expiry_warning")
        .where("data.documentId", "==", doc.id)
        .limit(1)
        .get();

      if (!existingWarning.empty) continue;

      // Send warning
      await sendNotification(
        docData.driverId,
        "Document Expiring Soon",
        `Your ${docData.documentType.replace(/_/g, " ")} expires in ${daysUntilExpiry} days. Please renew it to avoid service disruption.`,
        {
          documentId: doc.id,
          documentType: docData.documentType,
          expiryDate: expiryDate.toISOString(),
          daysUntilExpiry: daysUntilExpiry.toString(),
          type: "document_expiry_warning",
        },
        "document_expiry_warning"
      );

      warningsSent++;
    }

    // Find already expired documents
    const expiredDocs = await db
      .collection("documents")
      .where("status", "==", "verified")
      .where("expiryDate", "<", today)
      .get();

    let suspensionsIssued = 0;

    for (const doc of expiredDocs.docs) {
      const docData = doc.data();

      // Check if already suspended
      const driverDoc = await db
        .collection("drivers")
        .doc(docData.driverId)
        .get();

      if (!driverDoc.exists) continue;

      const driverData = driverDoc.data() as DriverData;
      if (driverData.approvalStatus === "suspended") continue;

      // Update document status
      await db.collection("documents").doc(doc.id).update({
        status: "expired",
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Check if driver has other valid documents of this type
      const otherDocs = await db
        .collection("documents")
        .where("driverId", "==", docData.driverId)
        .where("documentType", "==", docData.documentType)
        .where("status", "==", "verified")
        .where("expiryDate", ">", today)
        .limit(1)
        .get();

      if (otherDocs.empty) {
        // No valid document found, suspend driver
        await db
          .collection("drivers")
          .doc(docData.driverId)
          .update({
            approvalStatus: "suspended",
            updatedAt: FieldValue.serverTimestamp(),
            suspensionReason: `Document ${docData.documentType.replace(/_/g, " ")} expired`,
          });

        // Notify driver
        await sendNotification(
          docData.driverId,
          "Account Suspended",
          `Your account has been suspended because your ${docData.documentType.replace(/_/g, " ")} has expired. Please upload a valid document to reactivate your account.`,
          {
            documentId: doc.id,
            documentType: docData.documentType,
            type: "account_suspended",
          },
          "account_suspended"
        );

        // Notify admin
        const admins = await db
          .collection("users")
          .where("role", "in", ["admin", "super_admin"])
          .get();

        for (const admin of admins.docs) {
          await sendNotification(
            admin.id,
            "Driver Suspended - Document Expired",
            `Driver ${docData.driverId} has been suspended due to expired document: ${docData.documentType.replace(/_/g, " ")}`,
            {
              driverId: docData.driverId,
              documentId: doc.id,
              documentType: docData.documentType,
              type: "driver_suspended",
            },
            "driver_suspended"
          );
        }

        suspensionsIssued++;
      }
    }

    logger.info(
      `Document expiry check complete. Warnings sent: ${warningsSent}, Suspensions issued: ${suspensionsIssued}`
    );
  } catch (error) {
    logger.error("Error checking document expiry:", error);
  }
});

// ============================================================
// ON USER CREATED
// ============================================================

export const onUserCreated = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const userData = event.data?.data() as UserData;
    const userId = event.params.userId;

    if (!userData) {
      logger.error("No user data found for", userId);
      return;
    }

    logger.info(`New user created: ${userId}`, userData);

    try {
      // Create role-specific profile
      switch (userData.role) {
        case "passenger":
          await db.collection("passengers").doc(userId).set({
            userId,
            displayName: userData.displayName,
            email: userData.email,
            phone: userData.phone || "",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            active: true,
            totalBookings: 0,
            totalSpent: 0,
            averageRating: 0,
          });
          break;

        case "driver":
          await db.collection("drivers").doc(userId).set({
            userId,
            displayName: userData.displayName,
            email: userData.email,
            phone: userData.phone || "",
            approvalStatus: "pending",
            active: true,
            averageRating: 0,
            totalTrips: 0,
            totalEarnings: 0,
            vehicleId: "",
            operatorId: "",
            licensed: false,
            insured: false,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Initialize driver location
          await db.collection("driver_locations").doc(userId).set({
            location: new FirebaseFirestore.GeoPoint(51.5074, -0.1278), // Default London
            heading: 0,
            speed: 0,
            updatedAt: FieldValue.serverTimestamp(),
            available: false,
            currentBookingId: null,
          });
          break;

        case "operator":
          await db.collection("operators").doc(userId).set({
            userId,
            companyName: userData.displayName,
            email: userData.email,
            phone: userData.phone || "",
            approvalStatus: "pending",
            active: true,
            averageRating: 0,
            totalBookings: 0,
            totalRevenue: 0,
            commissionRate: 0.2,
            driverCount: 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          break;
      }

      // Send welcome notification
      await sendNotification(
        userId,
        "Welcome to Blue Star Airport Transfers LTD!",
        `Thank you for joining Blue Star Airport Transfers LTD. Start by ${userData.role === "passenger" ? "booking a ride" : userData.role === "driver" ? "uploading your documents" : "setting up your company profile"}.`,
        {
          type: "welcome",
          role: userData.role,
        },
        "welcome"
      );

      // Create audit log
      await createAuditLog(
        userId,
        "user_created",
        "user",
        userId,
        undefined,
        userData
      );

      logger.info(`User profile created for ${userId} (${userData.role})`);
    } catch (error) {
      logger.error(`Error creating user profile for ${userId}:`, error);
      throw error;
    }
  }
);

// ============================================================
// GENERATE PAYOUTS (Scheduled Weekly)
// ============================================================

export const generatePayouts = schedule(
  "every monday 09:00",
  async (event) => {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      logger.info(
        `Generating payouts for period ${oneWeekAgo.toISOString()} to ${now.toISOString()}`
      );

      // Generate driver payouts
      await generateDriverPayouts(oneWeekAgo, now);

      // Generate operator payouts
      await generateOperatorPayouts(oneWeekAgo, now);

      logger.info("Payout generation complete");
    } catch (error) {
      logger.error("Error generating payouts:", error);
    }
  }
);

async function generateDriverPayouts(
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  // Get all unpaid driver earnings
  const unpaidEarnings = await db
    .collection("driver_earnings")
    .where("paidOut", "==", false)
    .where("createdAt", ">=", periodStart)
    .where("createdAt", "<=", periodEnd)
    .get();

  if (unpaidEarnings.empty) {
    logger.info("No unpaid driver earnings found");
    return;
  }

  // Group earnings by driver
  const earningsByDriver: Record<
    string,
    {
      earnings: number;
      commission: number;
      netEarnings: number;
      bookingIds: string[];
    }
  > = {};

  for (const earning of unpaidEarnings.docs) {
    const data = earning.data();
    const driverId = data.driverId;

    if (!earningsByDriver[driverId]) {
      earningsByDriver[driverId] = {
        earnings: 0,
        commission: 0,
        netEarnings: 0,
        bookingIds: [],
      };
    }

    earningsByDriver[driverId].earnings += data.earnings;
    earningsByDriver[driverId].commission += data.commission;
    earningsByDriver[driverId].netEarnings += data.netEarnings;
    earningsByDriver[driverId].bookingIds.push(data.bookingId);
  }

  // Create payout records
  for (const [driverId, totals] of Object.entries(earningsByDriver)) {
    if (totals.netEarnings <= 0) continue;

    const payoutRef = await db.collection("payouts").add({
      userId: driverId,
      userType: "driver",
      amount: totals.netEarnings,
      currency: "GBP",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      periodStart,
      periodEnd,
      bookingIds: totals.bookingIds,
      totalEarnings: totals.earnings,
      commission: totals.commission,
      netAmount: totals.netEarnings,
      paymentMethod: "bank_transfer",
      transactionId: null,
    });

    // Mark earnings as paid out
    for (const bookingId of totals.bookingIds) {
      const earningSnapshot = await db
        .collection("driver_earnings")
        .where("driverId", "==", driverId)
        .where("bookingId", "==", bookingId)
        .where("paidOut", "==", false)
        .limit(1)
        .get();

      for (const earning of earningSnapshot.docs) {
        await db.collection("driver_earnings").doc(earning.id).update({
          paidOut: true,
          payoutId: payoutRef.id,
          paidAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // Notify driver
    await sendNotification(
      driverId,
      "Weekly Payout Generated",
      `Your weekly payout of £${totals.netEarnings.toFixed(2)} has been processed.`,
      {
        payoutId: payoutRef.id,
        amount: totals.netEarnings.toString(),
        type: "payout_generated",
      },
      "payout_generated"
    );

    logger.info(
      `Driver payout created: ${driverId} - £${totals.netEarnings.toFixed(2)}`
    );
  }
}

async function generateOperatorPayouts(
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  // Get all unpaid operator earnings
  const unpaidEarnings = await db
    .collection("operator_earnings")
    .where("paidOut", "==", false)
    .where("createdAt", ">=", periodStart)
    .where("createdAt", "<=", periodEnd)
    .get();

  if (unpaidEarnings.empty) {
    logger.info("No unpaid operator earnings found");
    return;
  }

  // Group earnings by operator
  const earningsByOperator: Record<
    string,
    {
      earnings: number;
      driverPayment: number;
      commission: number;
      bookingIds: string[];
    }
  > = {};

  for (const earning of unpaidEarnings.docs) {
    const data = earning.data();
    const operatorId = data.operatorId;

    if (!earningsByOperator[operatorId]) {
      earningsByOperator[operatorId] = {
        earnings: 0,
        driverPayment: 0,
        commission: 0,
        bookingIds: [],
      };
    }

    earningsByOperator[operatorId].earnings += data.earnings;
    earningsByOperator[operatorId].driverPayment += data.driverPayment;
    earningsByOperator[operatorId].commission += data.commission;
    earningsByOperator[operatorId].bookingIds.push(data.bookingId);
  }

  // Create payout records
  for (const [operatorId, totals] of Object.entries(earningsByOperator)) {
    if (totals.earnings <= 0) continue;

    const payoutRef = await db.collection("payouts").add({
      userId: operatorId,
      userType: "operator",
      amount: totals.earnings,
      currency: "GBP",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      periodStart,
      periodEnd,
      bookingIds: totals.bookingIds,
      totalEarnings: totals.earnings,
      commission: totals.commission,
      netAmount: totals.earnings,
      paymentMethod: "bank_transfer",
      transactionId: null,
    });

    // Mark earnings as paid out
    for (const bookingId of totals.bookingIds) {
      const earningSnapshot = await db
        .collection("operator_earnings")
        .where("operatorId", "==", operatorId)
        .where("bookingId", "==", bookingId)
        .where("paidOut", "==", false)
        .limit(1)
        .get();

      for (const earning of earningSnapshot.docs) {
        await db.collection("operator_earnings").doc(earning.id).update({
          paidOut: true,
          payoutId: payoutRef.id,
          paidAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // Notify operator
    await sendNotification(
      operatorId,
      "Weekly Payout Generated",
      `Your weekly payout of £${totals.earnings.toFixed(2)} has been processed.`,
      {
        payoutId: payoutRef.id,
        amount: totals.earnings.toString(),
        type: "payout_generated",
      },
      "payout_generated"
    );

    logger.info(
      `Operator payout created: ${operatorId} - £${totals.earnings.toFixed(2)}`
    );
  }
}

// ============================================================
// HANDLE PROMO CODE (Callable Function)
// ============================================================

export const handlePromoCode = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { promoCode, bookingAmount } = request.data;

  if (!promoCode || !bookingAmount) {
    throw new https.HttpsError(
      "invalid-argument",
      "Missing promoCode or bookingAmount"
    );
  }

  try {
    // Find promo code
    const promoSnapshot = await db
      .collection("promo_codes")
      .where("code", "==", promoCode.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (promoSnapshot.empty) {
      throw new https.HttpsError("not-found", "Invalid promo code");
    }

    const promoDoc = promoSnapshot.docs[0];
    const promoData = promoDoc.data() as PromoCodeData;

    // Check validity
    const now = new Date();

    if (promoData.validFrom.toDate() > now) {
      throw new https.HttpsError(
        "failed-precondition",
        "Promo code is not yet valid"
      );
    }

    if (promoData.validUntil.toDate() < now) {
      throw new https.HttpsError("failed-precondition", "Promo code has expired");
    }

    if (
      promoData.usageLimit > 0 &&
      promoData.usedCount >= promoData.usageLimit
    ) {
      throw new https.HttpsError(
        "failed-precondition",
        "Promo code usage limit reached"
      );
    }

    if (
      promoData.minBookingValue &&
      bookingAmount < promoData.minBookingValue
    ) {
      throw new https.HttpsError(
        "failed-precondition",
        `Minimum booking value is £${promoData.minBookingValue.toFixed(2)}`
      );
    }

    // Check if user has already used this promo code
    const userUsage = await db
      .collection("promo_code_usage")
      .where("userId", "==", request.auth.uid)
      .where("promoCodeId", "==", promoDoc.id)
      .limit(1)
      .get();

    if (!userUsage.empty) {
      throw new https.HttpsError(
        "failed-precondition",
        "You have already used this promo code"
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoData.discountType === "percentage") {
      discountAmount = (bookingAmount * promoData.discountValue) / 100;
      if (promoData.maxDiscount) {
        discountAmount = Math.min(discountAmount, promoData.maxDiscount);
      }
    } else {
      discountAmount = Math.min(promoData.discountValue, bookingAmount);
    }

    const finalAmount = Math.max(0, bookingAmount - discountAmount);

    // Record usage
    await db.collection("promo_code_usage").add({
      userId: request.auth.uid,
      promoCodeId: promoDoc.id,
      code: promoData.code,
      bookingAmount,
      discountAmount,
      finalAmount,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Increment usage count
    await db.collection("promo_codes").doc(promoDoc.id).update({
      usedCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      valid: true,
      code: promoData.code,
      description: promoData.description,
      discountType: promoData.discountType,
      discountValue: promoData.discountValue,
      discountAmount,
      bookingAmount,
      finalAmount,
      message: `Discount of £${discountAmount.toFixed(2)} applied!`,
    };
  } catch (error) {
    if (error instanceof https.HttpsError) throw error;
    logger.error("Error validating promo code:", error);
    throw new https.HttpsError("internal", "Failed to validate promo code");
  }
});

// ============================================================
// ON SUPPORT TICKET CREATED
// ============================================================

export const onSupportTicketCreated = onDocumentCreated(
  "support_tickets/{ticketId}",
  async (event) => {
    const ticketData = event.data?.data() as SupportTicketData;
    const ticketId = event.params.ticketId;

    if (!ticketData) return;

    try {
      // Notify admins about new ticket
      const admins = await db
        .collection("users")
        .where("role", "in", ["admin", "super_admin"])
        .get();

      for (const admin of admins.docs) {
        await sendNotification(
          admin.id,
          "New Support Ticket",
          `New ${ticketData.priority} priority support ticket: ${ticketData.subject}`,
          {
            ticketId,
            type: "new_support_ticket",
            priority: ticketData.priority,
            subject: ticketData.subject,
          },
          "new_support_ticket"
        );
      }

      // Notify user
      await sendNotification(
        ticketData.userId,
        "Support Ticket Created",
        `Your support ticket has been created. We'll get back to you shortly.`,
        {
          ticketId,
          type: "support_ticket_created",
          subject: ticketData.subject,
        },
        "support_ticket_created"
      );

      logger.info(`Support ticket created: ${ticketId}`);
    } catch (error) {
      logger.error(`Error processing support ticket ${ticketId}:`, error);
    }
  }
);

// ============================================================
// ON REVIEW CREATED
// ============================================================

export const onReviewCreated = onDocumentCreated(
  "reviews/{reviewId}",
  async (event) => {
    const reviewData = event.data?.data();
    const reviewId = event.params.reviewId;

    if (!reviewData) return;

    try {
      // Update reviewee's average rating
      const revieweeId = reviewData.revieweeId;
      const revieweeType = reviewData.revieweeType;

      // Get all reviews for this reviewee
      const reviewsSnapshot = await db
        .collection("reviews")
        .where("revieweeId", "==", revieweeId)
        .get();

      let totalRating = 0;
      let reviewCount = 0;

      for (const review of reviewsSnapshot.docs) {
        totalRating += review.data().rating;
        reviewCount++;
      }

      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

      // Update the appropriate collection
      if (revieweeType === "driver") {
        await db
          .collection("drivers")
          .doc(revieweeId)
          .update({
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviewCount,
            updatedAt: FieldValue.serverTimestamp(),
          });
      } else if (revieweeType === "operator") {
        await db
          .collection("operators")
          .doc(revieweeId)
          .update({
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviewCount,
            updatedAt: FieldValue.serverTimestamp(),
          });
      }

      // Notify reviewee
      await sendNotification(
        revieweeId,
        "New Review Received",
        `You received a ${reviewData.rating}-star review.`,
        {
          reviewId,
          type: "new_review",
          rating: reviewData.rating.toString(),
        },
        "new_review"
      );

      logger.info(
        `Review created: ${reviewId}. Updated average rating for ${revieweeType} ${revieweeId}: ${averageRating.toFixed(1)}`
      );
    } catch (error) {
      logger.error(`Error processing review ${reviewId}:`, error);
    }
  }
);

// ============================================================
// ON QUOTE ACCEPTED
// ============================================================

export const onQuoteAccepted = onDocumentUpdated(
  "quotes/{quoteId}",
  async (event) => {
    const beforeData = event.data?.before.data() as QuoteData;
    const afterData = event.data?.after.data() as QuoteData;

    if (!beforeData || !afterData) return;

    // Only trigger when quote is accepted
    if (beforeData.status === "accepted" || afterData.status !== "accepted") {
      return;
    }

    const quoteId = event.params.quoteId;

    try {
      // Create booking from accepted quote
      const bookingRef = await db.collection("bookings").add({
        passengerId: afterData.driverId, // Will be updated with actual passenger
        driverId: afterData.driverId,
        operatorId: afterData.operatorId,
        pickupLocation: { address: "", latitude: 0, longitude: 0 },
        dropoffLocation: { address: "", latitude: 0, longitude: 0 },
        pickupTime: FieldValue.serverTimestamp(),
        vehicleType: afterData.vehicleType,
        status: "confirmed",
        bookingStatus: "active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        passengerCount: 1,
        luggage: 0,
        specialRequirements: "",
        estimatedDistance: afterData.estimatedDistance,
        estimatedDuration: afterData.estimatedDuration,
        estimatedPrice: afterData.price,
        finalPrice: afterData.price,
      });

      // Update quote with booking ID
      await db.collection("quotes").doc(quoteId).update({
        bookingId: bookingRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(
        `Quote ${quoteId} accepted, booking ${bookingRef.id} created`
      );
    } catch (error) {
      logger.error(`Error processing accepted quote ${quoteId}:`, error);
    }
  }
);

// ============================================================
// ON PAYMENT UPDATED
// ============================================================

export const onPaymentUpdated = onDocumentUpdated(
  "payments/{paymentId}",
  async (event) => {
    const beforeData = event.data?.before.data() as PaymentData;
    const afterData = event.data?.after.data() as PaymentData;

    if (!beforeData || !afterData) return;

    // Only trigger on status change
    if (beforeData.status === afterData.status) return;

    const paymentId = event.params.paymentId;

    try {
      // Handle different payment statuses
      switch (afterData.status) {
        case "completed":
          await sendNotification(
            afterData.userId,
            "Payment Successful",
            `Payment of £${afterData.amount.toFixed(2)} has been processed.`,
            {
              paymentId,
              bookingId: afterData.bookingId,
              type: "payment_successful",
            },
            "payment_successful"
          );
          break;

        case "failed":
          await sendNotification(
            afterData.userId,
            "Payment Failed",
            `Payment of £${afterData.amount.toFixed(2)} has failed. Please try again.`,
            {
              paymentId,
              bookingId: afterData.bookingId,
              type: "payment_failed",
            },
            "payment_failed"
          );
          break;

        case "refunded":
          await sendNotification(
            afterData.userId,
            "Payment Refunded",
            `Refund of £${afterData.refundAmount.toFixed(2)} has been processed.`,
            {
              paymentId,
              bookingId: afterData.bookingId,
              refundAmount: afterData.refundAmount.toString(),
              type: "payment_refunded",
            },
            "payment_refunded"
          );
          break;
      }

      logger.info(
        `Payment ${paymentId} status changed: ${beforeData.status} → ${afterData.status}`
      );
    } catch (error) {
      logger.error(`Error processing payment update ${paymentId}:`, error);
    }
  }
);

// ============================================================
// ON BOOKING CANCELLED (for cleanup)
// ============================================================

export const onBookingCancelled = onDocumentUpdated(
  "bookings/{bookingId}",
  async (event) => {
    const beforeData = event.data?.before.data() as BookingData;
    const afterData = event.data?.after.data() as BookingData;

    if (!beforeData || !afterData) return;

    // Only trigger when status changes to cancelled
    if (
      beforeData.status === "cancelled" ||
      afterData.status !== "cancelled"
    ) {
      return;
    }

    const bookingId = event.params.bookingId;

    try {
      // Clean up driver location if driver was assigned
      if (afterData.driverId) {
        await db
          .collection("driver_locations")
          .doc(afterData.driverId)
          .update({
            available: true,
            currentBookingId: null,
            updatedAt: FieldValue.serverTimestamp(),
          });
      }

      // Cancel any pending quotes for this booking
      const pendingQuotes = await db
        .collection("quotes")
        .where("bookingId", "==", bookingId)
        .where("status", "==", "pending")
        .get();

      for (const quote of pendingQuotes.docs) {
        await db.collection("quotes").doc(quote.id).update({
          status: "cancelled",
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      logger.info(`Booking ${bookingId} cancelled and cleaned up`);
    } catch (error) {
      logger.error(
        `Error cleaning up cancelled booking ${bookingId}:`,
        error
      );
    }
  }
);
