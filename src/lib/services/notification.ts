import type { NotificationType } from '@/types'

interface NotificationData {
  bookingNumber?: string
  driverName?: string
  amount?: number
  rating?: number
  [key: string]: unknown
}

interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  data?: NotificationData
}

function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData
): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    data,
  }
}

function sendBookingConfirmed(booking: { bookingNumber: string; passengerId: string }): Notification {
  return createNotification(
    booking.passengerId,
    'booking_confirmed' as NotificationType,
    'Booking Confirmed',
    `Your booking ${booking.bookingNumber} has been confirmed. We're finding a driver for you.`,
    { bookingNumber: booking.bookingNumber }
  )
}

function sendDriverAssigned(
  booking: { bookingNumber: string; passengerId: string },
  driver: { firstName: string; lastName: string; rating: number }
): Notification {
  return createNotification(
    booking.passengerId,
    'driver_assigned' as NotificationType,
    'Driver Assigned',
    `${driver.firstName} ${driver.lastName} (${driver.rating.toFixed(1)}★) has been assigned to your booking ${booking.bookingNumber}.`,
    { bookingNumber: booking.bookingNumber, driverName: `${driver.firstName} ${driver.lastName}`, rating: driver.rating }
  )
}

function sendTripCompleted(booking: { bookingNumber: string; passengerId: string; total: number }): Notification {
  return createNotification(
    booking.passengerId,
    'trip_completed' as NotificationType,
    'Trip Completed',
    `Your journey ${booking.bookingNumber} is complete. Total: £${booking.total.toFixed(2)}. Please leave a review!`,
    { bookingNumber: booking.bookingNumber, amount: booking.total }
  )
}

function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.read).length
}

function markAsRead(notificationId: string, notifications: Notification[]): Notification[] {
  return notifications.map(n => n.id === notificationId ? { ...n, read: true } : n)
}

function markAllAsRead(userId: string, notifications: Notification[]): Notification[] {
  return notifications.map(n => n.userId === userId ? { ...n, read: true } : n)
}

export {
  createNotification,
  sendBookingConfirmed,
  sendDriverAssigned,
  sendTripCompleted,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
}

export type { Notification, NotificationData }
