export type UserRole = 'passenger' | 'driver' | 'operator' | 'admin' | 'super_admin';

export enum BookingStatus {
  PendingPayment = 'pending_payment',
  CashPendingApproval = 'cash_pending_approval',
  PaymentFailed = 'payment_failed',
  Confirmed = 'confirmed',
  OperatorPending = 'operator_pending',
  DriverSearching = 'driver_searching',
  DriverAssigned = 'driver_assigned',
  DriverAccepted = 'driver_accepted',
  DriverEnRoute = 'driver_en_route',
  DriverArrived = 'driver_arrived',
  PassengerOnboard = 'passenger_onboard',
  TripStarted = 'trip_started',
  TripCompleted = 'trip_completed',
  CancelledByPassenger = 'cancelled_by_passenger',
  CancelledByDriver = 'cancelled_by_driver',
  CancelledByOperator = 'cancelled_by_operator',
  CancelledByAdmin = 'cancelled_by_admin',
  NoShow = 'no_show',
}

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partial_refund';

export type TripType = 'one_way' | 'return';

export type VehicleType = 'saloon' | 'executive' | 'estate' | 'mpv' | 'minibus' | 'electric' | 'wheelchair_accessible';

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type SupportStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export type DriverStatus = 'online' | 'offline' | 'busy';

export type DiscountType = 'percentage' | 'fixed';

export type SortingType = 'recommended' | 'lowest_price' | 'highest_rated' | 'fastest' | 'electric_first';

export interface Location {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId: string;
  postcode: string;
  city: string;
  country: string;
}

export interface ViaStop {
  location: Location;
  label?: string;
}

export interface SavedLocation {
  id: string;
  userId: string;
  label: string;
  location: Location;
  icon?: string;
}

export interface SpecialRequirements {
  childSeat: boolean;
  wheelchairAccessible: boolean;
  meetAndGreet: boolean;
  flightNumber?: string;
  flightTracking?: string;
  terminal?: string;
  notes?: string;
}

export interface User {
  uid: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photoURL?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface Passenger extends User {
  role: 'passenger';
  defaultPickup?: Location;
  defaultDestination?: Location;
  savedLocations: SavedLocation[];
  preferences: PassengerPreferences;
}

export interface PassengerPreferences {
  defaultVehicleType?: VehicleType;
  notifications: boolean;
  emailUpdates: boolean;
  defaultLuggage: number;
  defaultPassengers: number;
}

export interface DriverDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  fileURL: string;
  status: DocumentStatus;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DriverAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
}

export interface Driver extends User {
  role: 'driver';
  operatorId: string;
  vehicleId: string;
  status: DriverStatus;
  rating: number;
  totalReviews: number;
  licenceNumber: string;
  documents: DriverDocument[];
  lastLocation: DriverLocation;
  isVerified: boolean;
  availability: DriverAvailability;
}

export interface OperatorCommission {
  percent: number;
  flatFee: number;
}

export interface Operator extends User {
  role: 'operator';
  companyName: string;
  companyLogo?: string;
  description: string;
  rating: number;
  totalReviews: number;
  fleetSize: number;
  isVerified: boolean;
  commission: OperatorCommission;
}

export interface Admin extends User {
  role: 'admin' | 'super_admin';
  permissions: string[];
}

export interface Vehicle {
  id: string;
  operatorId: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  colour: string;
  vehicleType: VehicleType;
  passengerCapacity: number;
  luggageCapacity: number;
  wheelchairAccessible: boolean;
  isElectric: boolean;
  isHybrid: boolean;
  photoURL?: string;
  isApproved: boolean;
}

export interface Booking {
  bookingNumber: string;
  passengerId: string;
  operatorId: string;
  driverId: string;
  vehicleId: string;
  tripType: TripType;
  pickup: Location;
  destination: Location;
  viaStops: ViaStop[];
  date: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  luggage: number;
  specialRequirements?: SpecialRequirements;
  vehicleType: VehicleType;
  distanceMiles: number;
  estimatedDuration: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'card' | 'cash';
  bookingStatus: BookingStatus;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
}

export interface Quote {
  id: string;
  bookingId: string;
  operatorId: string;
  operatorName: string;
  operatorLogo?: string;
  vehicleType: VehicleType;
  vehicleDescription: string;
  vehicleImage?: string;
  passengerCapacity: number;
  luggageCapacity: number;
  rating: number;
  totalReviews: number;
  estimatedJourneyTime: number;
  isElectric: boolean;
  isHybrid: boolean;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  paymentTypes: string[];
  features: string[];
  isLowestPrice: boolean;
}

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  passengerId: string;
  driverId: string;
  operatorId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  isApproved: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface Document {
  id: string;
  driverId: string;
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  fileURL: string;
  status: DocumentStatus;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userRole: UserRole;
  category: string;
  subject: string;
  message: string;
  attachments: string[];
  priority: string;
  status: SupportStatus;
  assignedAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumBookingValue: number;
  maximumDiscount?: number;
  startDate: string;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  perUserLimit: number;
  applicableVehicleTypes?: VehicleType[];
  applicableAreas?: string[];
  isActive: boolean;
}

export interface PricingRule {
  id: string;
  operatorId: string;
  vehicleType: VehicleType;
  baseFare: number;
  perMile: number;
  perMinute: number;
  minimumFare: number;
  bookingFee: number;
  airportFee: number;
  nightSurchargePercent: number;
  weekendSurchargePercent: number;
  peakTimeSurchargePercent: number;
  congestionCharge: number;
}

export interface Payout {
  id: string;
  operatorId: string;
  driverId: string;
  amount: number;
  commission: number;
  netAmount: number;
  period: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  role: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface BookingSearch {
  pickup?: Location;
  destination?: Location;
  date?: string;
  time?: string;
  passengers?: number;
  luggage?: number;
  tripType?: TripType;
  vehicleType?: VehicleType;
  specialRequirements?: SpecialRequirements;
}

export interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  activeTrips: number;
  availableDrivers: number;
  onlineDrivers: number;
  totalPassengers: number;
  totalOperators: number;
  pendingApprovals: number;
  pendingDocuments: number;
  cancelledTrips: number;
}

export interface MapMarker {
  position: { lat: number; lng: number };
  title: string;
  type: 'pickup' | 'destination' | 'driver' | 'via';
}

export enum CancellationReason {
  ChangedMind = 'changed_mind',
  FoundAlternative = 'found_alternative',
  TooExpensive = 'too_expensive',
  NoShow = 'no_show',
  VehicleIssue = 'vehicle_issue',
  DriverIssue = 'driver_issue',
  Weather = 'weather',
  PersonalEmergency = 'personal_emergency',
  DuplicateBooking = 'duplicate_booking',
  WrongDetails = 'wrong_details',
  Other = 'other',
}

export enum NotificationType {
  BookingConfirmed = 'booking_confirmed',
  BookingCancelled = 'booking_cancelled',
  DriverAssigned = 'driver_assigned',
  DriverArrived = 'driver_arrived',
  TripStarted = 'trip_started',
  TripCompleted = 'trip_completed',
  PaymentReceived = 'payment_received',
  PaymentFailed = 'payment_failed',
  ReviewReceived = 'review_received',
  DocumentApproved = 'document_approved',
  DocumentRejected = 'document_rejected',
  PromoCodeApplied = 'promo_code_applied',
  SystemAlert = 'system_alert',
  SupportUpdate = 'support_update',
}
