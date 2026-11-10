package com.yadadristay.data.model

import com.squareup.moshi.Json

// Base response wrapper
data class ApiResponse<T>(
    @Json(name = "success") val success: Boolean,
    @Json(name = "message") val message: String?,
    @Json(name = "data") val data: T?,
    @Json(name = "errors") val errors: List<ApiError>? = null
)

data class ApiError(
    @Json(name = "field") val field: String,
    @Json(name = "message") val message: String
)

// Paginated response
data class PaginatedResponse<T>(
    @Json(name = "data") val items: List<T>,
    @Json(name = "total") val total: Int,
    @Json(name = "page") val page: Int,
    @Json(name = "limit") val limit: Int,
    @Json(name = "totalPages") val totalPages: Int
)

// Auth Models
data class LoginRequest(
    @Json(name = "phone") val phone: String,
    @Json(name = "password") val password: String
)

data class RegisterRequest(
    @Json(name = "fullName") val fullName: String,
    @Json(name = "phone") val phone: String,
    @Json(name = "email") val email: String?,
    @Json(name = "password") val password: String,
    @Json(name = "role") val role: String = "customer"
)

data class AuthResponse(
    @Json(name = "user") val user: User,
    @Json(name = "accessToken") val accessToken: String,
    @Json(name = "refreshToken") val refreshToken: String
) {
    // Backward compatibility
    val token: String get() = accessToken
}

data class RefreshTokenRequest(
    @Json(name = "refreshToken") val refreshToken: String
)

data class RefreshTokenResponse(
    @Json(name = "accessToken") val accessToken: String,
    @Json(name = "refreshToken") val refreshToken: String
)

// User Models
data class User(
    @Json(name = "id") val id: String,
    @Json(name = "_id") val mongoId: String = "",
    @Json(name = "fullName") val fullName: String,
    @Json(name = "phone") val phone: String,
    @Json(name = "email") val email: String?,
    @Json(name = "role") val role: String,
    @Json(name = "avatar") val avatar: String?,
    @Json(name = "isVerified") val isVerified: Boolean = false,
    @Json(name = "isEmailVerified") val isEmailVerified: Boolean = false,
    @Json(name = "isPhoneVerified") val isPhoneVerified: Boolean = false,
    @Json(name = "createdAt") val createdAt: String = "",
    @Json(name = "lastLogin") val lastLogin: String? = null,
    @Json(name = "language") val language: String = "en",
    // Lodge Owner specific
    @Json(name = "businessName") val businessName: String?,
    @Json(name = "gstNumber") val gstNumber: String?,
    @Json(name = "panNumber") val panNumber: String?,
    @Json(name = "upiId") val upiId: String?,
    @Json(name = "bankName") val bankName: String?,
    @Json(name = "accountNumber") val accountNumber: String?,
    @Json(name = "ifscCode") val ifscCode: String?,
    @Json(name = "commissionRate") val commissionRate: Int = 10,
    // Stats
    @Json(name = "lodgeCount") val lodgeCount: Int = 0,
    @Json(name = "totalBookings") val totalBookings: Int = 0,
    @Json(name = "totalSpent") val totalSpent: Double = 0.0,
    @Json(name = "completedBookings") val completedBookings: Int = 0,
    @Json(name = "cancelledBookings") val cancelledBookings: Int = 0,
    @Json(name = "reviewsCount") val reviewsCount: Int = 0,
    @Json(name = "favoriteLodges") val favoriteLodges: List<String> = emptyList()
) {
    val isLodgeOwner: Boolean get() = role == "lodge_owner"
    val isCustomer: Boolean get() = role == "customer"
    val isAdmin: Boolean get() = role == "super_admin"
}

// Lodge Models
data class Lodge(
    @Json(name = "_id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "shortDescription") val shortDescription: String?,
    @Json(name = "description") val description: String?,
    @Json(name = "address") val address: Address,
    @Json(name = "contact") val contact: Contact,
    @Json(name = "images") val images: List<LodgeImage> = emptyList(),
    @Json(name = "facilities") val facilities: Facilities,
    @Json(name = "policies") val policies: Policies,
    @Json(name = "pricing") val pricing: Pricing,
    @Json(name = "roomCategories") val roomCategories: List<RoomCategory> = emptyList(),
    @Json(name = "status") val status: String,
    @Json(name = "ownerId") val ownerId: String,
    @Json(name = "ownerName") val ownerName: String?,
    @Json(name = "ownerPhone") val ownerPhone: String?,
    @Json(name = "ownerEmail") val ownerEmail: String?,
    @Json(name = "bookingCount") val bookingCount: Int = 0,
    @Json(name = "totalRooms") val totalRooms: Int = 0,
    @Json(name = "averageRating") val averageRating: Double = 0.0,
    @Json(name = "reviewCount") val reviewCount: Int = 0,
    @Json(name = "createdAt") val createdAt: String,
    @Json(name = "updatedAt") val updatedAt: String
) {
    val primaryImageUrl: String?
        get() = images.firstOrNull()?.url

    val distanceFromTempleKm: Double?
        get() = address.distanceFromTemple
}

data class Address(
    @Json(name = "street") val street: String,
    @Json(name = "city") val city: String,
    @Json(name = "state") val state: String,
    @Json(name = "pincode") val pincode: String,
    @Json(name = "landmark") val landmark: String?,
    @Json(name = "coordinates") val coordinates: List<Double> = emptyList(),
    @Json(name = "distanceFromTemple") val distanceFromTemple: Double? = null
) {
    val fullAddress: String
        get() = "$street, $city, $state - $pincode"

    val latLng: Pair<Double, Double>?
        get() = if (coordinates.size >= 2) coordinates[1] to coordinates[0] else null
}

data class Contact(
    @Json(name = "phone") val phone: String,
    @Json(name = "alternatePhone") val alternatePhone: String?,
    @Json(name = "email") val email: String?,
    @Json(name = "whatsappNumber") val whatsappNumber: String?
)

data class LodgeImage(
    @Json(name = "url") val url: String,
    @Json(name = "caption") val caption: String?,
    @Json(name = "isPrimary") val isPrimary: Boolean = false
)

data class Facilities(
    @Json(name = "wifi") val wifi: Boolean = false,
    @Json(name = "parking") val parking: Boolean = false,
    @Json(name = "ac") val ac: Boolean = false,
    @Json(name = "hotWater") val hotWater: Boolean = false,
    @Json(name = "roomService") val roomService: Boolean = false,
    @Json(name = "laundry") val laundry: Boolean = false,
    @Json(name = "cctv") val cctv: Boolean = false,
    @Json(name = "security") val security: Boolean = false,
    @Json(name = "restaurant") val restaurant: Boolean = false,
    @Json(name = "templeView") val templeView: Boolean = false
) {
    val availableFacilities: List<String>
        get() = buildList {
            if (wifi) add("WiFi")
            if (parking) add("Parking")
            if (ac) add("AC")
            if (hotWater) add("Hot Water")
            if (roomService) add("Room Service")
            if (laundry) add("Laundry")
            if (cctv) add("CCTV")
            if (security) add("Security")
            if (restaurant) add("Restaurant")
            if (templeView) add("Temple View")
        }
}

data class Policies(
    @Json(name = "checkInTime") val checkInTime: String = "12:00",
    @Json(name = "checkOutTime") val checkOutTime: String = "11:00",
    @Json(name = "cancellationPolicy") val cancellationPolicy: String = "moderate",
    @Json(name = "advancePaymentPercentage") val advancePaymentPercentage: Int = 20,
    @Json(name = "allowPets") val allowPets: Boolean = false,
    @Json(name = "allowSmoking") val allowSmoking: Boolean = false
)

data class Pricing(
    @Json(name = "basePrice") val basePrice: Double = 0.0,
    @Json(name = "taxPercentage") val taxPercentage: Double = 18.0,
    @Json(name = "serviceChargePercentage") val serviceChargePercentage: Double = 0.0
)

// Room Category Models
data class RoomCategory(
    @Json(name = "_id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "description") val description: String?,
    // Backend has nested pricing object
    @Json(name = "pricing") val pricing: RoomCategoryPricing?,
    // Flat fields for backward compatibility / direct access
    @Json(name = "basePrice") val basePrice: Double = 0.0,
    @Json(name = "weekendPrice") val weekendPrice: Double = 0.0,
    @Json(name = "holidayPrice") val holidayPrice: Double = 0.0,
    // Backend has nested capacity object
    @Json(name = "capacity") val capacity: RoomCategoryCapacity?,
    @Json(name = "maxOccupancy") val maxOccupancy: Int = 0,
    @Json(name = "totalRooms") val totalRooms: Int,
    @Json(name = "type") val type: String = "double",
    @Json(name = "acType") val acType: String = "ac",
    @Json(name = "amenities") val amenities: RoomCategoryAmenities?,
    @Json(name = "amenitiesList") val amenitiesList: List<String> = emptyList(),
    @Json(name = "images") val images: List<RoomCategoryImage> = emptyList(),
    @Json(name = "bedType") val bedType: String = "double",
    @Json(name = "roomSize") val roomSize: Int? = null,
    @Json(name = "isActive") val isActive: Boolean = true,
    @Json(name = "displayOrder") val displayOrder: Int = 0
) {
    // Unified getters for backward compatibility
    val effectiveBasePrice: Double
        get() = pricing?.basePrice ?: basePrice

    val effectiveWeekendPrice: Double
        get() = pricing?.weekendPrice ?: weekendPrice

    val effectiveHolidayPrice: Double
        get() = pricing?.holidayPrice ?: holidayPrice

    val effectiveMaxOccupancy: Int
        get() = capacity?.maxOccupancy ?: maxOccupancy

    val effectiveAmenities: List<String>
        get() = amenitiesList.ifEmpty { amenities?.toAmenitiesList() ?: emptyList() }
}

fun RoomCategoryAmenities.toAmenitiesList(): List<String> {
    return buildList {
        if (wifi) add("WiFi")
        if (ac) add("AC")
        if (hotWater) add("Hot Water")
        if (tv) add("TV")
        if (fan) add("Fan")
        if (attachedBathroom) add("Attached Bathroom")
        if (wardrobe) add("Wardrobe")
        if (dressingTable) add("Dressing Table")
        if (balcony) add("Balcony")
        if (window) add("Window")
        if (intercom) add("Intercom")
        if (safe) add("Safe")
        if (miniFridge) add("Mini Fridge")
        if (teaCoffeeMaker) add("Tea/Coffee Maker")
        addAll(other)
    }
}

data class RoomCategoryPricing(
    @Json(name = "basePrice") val basePrice: Double,
    @Json(name = "weekendPrice") val weekendPrice: Double = 0.0,
    @Json(name = "holidayPrice") val holidayPrice: Double = 0.0,
    @Json(name = "currency") val currency: String = "INR",
    @Json(name = "taxInclusive") val taxInclusive: Boolean = true
)

data class RoomCategoryCapacity(
    @Json(name = "adults") val adults: Int,
    @Json(name = "children") val children: Int = 0,
    @Json(name = "maxOccupancy") val maxOccupancy: Int
)

data class RoomCategoryAmenities(
    @Json(name = "bedType") val bedType: String = "double",
    @Json(name = "bedCount") val bedCount: Int = 1,
    @Json(name = "attachedBathroom") val attachedBathroom: Boolean = true,
    @Json(name = "hotWater") val hotWater: Boolean = true,
    @Json(name = "tv") val tv: Boolean = false,
    @Json(name = "wifi") val wifi: Boolean = false,
    @Json(name = "ac") val ac: Boolean = false,
    @Json(name = "fan") val fan: Boolean = true,
    @Json(name = "wardrobe") val wardrobe: Boolean = true,
    @Json(name = "dressingTable") val dressingTable: Boolean = false,
    @Json(name = "balcony") val balcony: Boolean = false,
    @Json(name = "window") val window: Boolean = true,
    @Json(name = "intercom") val intercom: Boolean = false,
    @Json(name = "safe") val safe: Boolean = false,
    @Json(name = "miniFridge") val miniFridge: Boolean = false,
    @Json(name = "teaCoffeeMaker") val teaCoffeeMaker: Boolean = false,
    @Json(name = "other") val other: List<String> = emptyList()
)

data class RoomCategoryImage(
    @Json(name = "url") val url: String,
    @Json(name = "caption") val caption: String?,
    @Json(name = "isPrimary") val isPrimary: Boolean = false,
    @Json(name = "order") val order: Int = 0
)

// Room Inventory (Date-wise)
data class RoomInventory(
    @Json(name = "_id") val id: String,
    @Json(name = "lodgeId") val lodgeId: String,
    @Json(name = "roomCategoryId") val roomCategoryId: String,
    @Json(name = "date") val date: String,
    @Json(name = "totalRooms") val totalRooms: Int,
    @Json(name = "availableRooms") val availableRooms: Int,
    @Json(name = "blockedRooms") val blockedRooms: Int = 0,
    @Json(name = "isClosed") val isClosed: Boolean = false,
    @Json(name = "priceSnapshot") val priceSnapshot: PriceSnapshot?
)

data class PriceSnapshot(
    @Json(name = "basePrice") val basePrice: Double,
    @Json(name = "taxPercentage") val taxPercentage: Double,
    @Json(name = "serviceChargePercentage") val serviceChargePercentage: Double
)

// Booking Models
data class Booking(
    @Json(name = "_id") val id: String,
    // Backend uses bookingId, Android expects bookingNumber - support both
    @Json(name = "bookingId") val bookingId: String?,
    @Json(name = "bookingNumber") val bookingNumberRaw: String?,
    @Json(name = "lodgeId") val lodgeId: String,
    @Json(name = "lodgeName") val lodgeName: String?,
    @Json(name = "lodgeAddress") val lodgeAddress: String?,
    @Json(name = "roomCategoryId") val roomCategoryId: String,
    @Json(name = "roomCategoryName") val roomCategoryName: String?,
    @Json(name = "customerId") val customerId: String,
    @Json(name = "customerName") val customerName: String?,
    @Json(name = "customerPhone") val customerPhone: String?,
    @Json(name = "customerEmail") val customerEmail: String?,
    // Backend uses checkInDate/checkOutDate, Android uses checkIn/checkOut
    @Json(name = "checkInDate") val checkInDate: String?,
    @Json(name = "checkOutDate") val checkOutDate: String?,
    @Json(name = "checkIn") val checkInRaw: String?,
    @Json(name = "checkOut") val checkOutRaw: String?,
    @Json(name = "nights") val nights: Int,
    @Json(name = "guests") val guests: Int,
    @Json(name = "rooms") val rooms: Int = 1,
    @Json(name = "roomsBooked") val roomsBookedRaw: Int = 1,
    @Json(name = "status") val status: String,
    @Json(name = "bookingSource") val bookingSource: String = "online",
    @Json(name = "pricing") val pricing: BookingPricing,
    @Json(name = "payment") val payment: PaymentInfo?,
    @Json(name = "specialRequests") val specialRequests: String?,
    @Json(name = "createdAt") val createdAt: String,
    @Json(name = "updatedAt") val updatedAt: String,
    @Json(name = "confirmedAt") val confirmedAt: String?,
    @Json(name = "cancelledAt") val cancelledAt: String?,
    @Json(name = "cancellationReason") val cancellationReason: String?,
    @Json(name = "expiresAt") val expiresAt: String?
) {
    // Unified getters for backward compatibility
    val bookingNumber: String
        get() = bookingId ?: bookingNumberRaw ?: id

    val checkIn: String
        get() = checkInDate ?: checkInRaw ?: ""

    val checkOut: String
        get() = checkOutDate ?: checkOutRaw ?: ""

    val roomsBooked: Int
        get() = rooms

    val isUpcoming: Boolean
        get() = status == "confirmed" || status == "pending_payment" || status == "pending_verification" || status == "pending"

    val isPast: Boolean
        get() = status == "completed" || status == "cancelled" || status == "refunded" || status == "no_show" || status == "expired"

    val canCancel: Boolean
        get() = status == "confirmed" || status == "pending_payment" || status == "pending_verification" || status == "pending"
}

data class BookingPricing(
    @Json(name = "basePrice") val basePrice: Double,
    @Json(name = "taxAmount") val taxAmount: Double,
    @Json(name = "serviceChargeAmount") val serviceChargeAmount: Double,
    @Json(name = "platformFeeAmount") val platformFeeAmount: Double,
    @Json(name = "advancePaid") val advancePaid: Double,
    @Json(name = "totalAmount") val totalAmount: Double,
    @Json(name = "balanceAmount") val balanceAmount: Double
)

data class PaymentInfo(
    @Json(name = "paymentId") val paymentId: String?,
    @Json(name = "amount") val amount: Double,
    @Json(name = "paymentMethod") val paymentMethod: String,
    @Json(name = "status") val status: String,
    // Backend uses upi.transactionRef
    @Json(name = "transactionId") val transactionId: String?,
    @Json(name = "upiTransactionRef") val upiTransactionRef: String?,
    @Json(name = "upiId") val upiId: String?,
    @Json(name = "screenshot") val screenshot: String?,
    @Json(name = "paidAt") val paidAt: String?,
    @Json(name = "verifiedAt") val verifiedAt: String?
) {
    // Unified getter for transaction reference
    val effectiveTransactionId: String?
        get() = transactionId ?: upiTransactionRef
}

// Payment Models
data class PaymentRequest(
    @Json(name = "bookingId") val bookingId: String,
    @Json(name = "amount") val amount: Double,
    @Json(name = "paymentMethod") val paymentMethod: String,
    @Json(name = "upiId") val upiId: String?,
    @Json(name = "transactionId") val transactionId: String?,
    @Json(name = "screenshot") val screenshot: String?
)

data class PaymentResponse(
    @Json(name = "paymentId") val paymentId: String,
    @Json(name = "status") val status: String,
    @Json(name = "message") val message: String
)

// Search/Filters
data class LodgeSearchRequest(
    @Json(name = "checkIn") val checkIn: String,
    @Json(name = "checkOut") val checkOut: String,
    @Json(name = "guests") val guests: Int = 1,
    @Json(name = "rooms") val rooms: Int = 1,
    @Json(name = "query") val query: String? = null,
    @Json(name = "city") val city: String? = null,
    @Json(name = "minPrice") val minPrice: Double? = null,
    @Json(name = "maxPrice") val maxPrice: Double? = null,
    @Json(name = "minRating") val minRating: Double? = null,
    @Json(name = "amenities") val amenities: List<String> = emptyList(),
    @Json(name = "roomType") val roomType: String? = null,
    @Json(name = "sortBy") val sortBy: String = "relevance",
    @Json(name = "page") val page: Int = 1,
    @Json(name = "limit") val limit: Int = 20
)

data class LodgeSearchResponse(
    @Json(name = "lodges") val lodges: List<Lodge>,
    @Json(name = "total") val total: Int,
    @Json(name = "page") val page: Int,
    @Json(name = "totalPages") val totalPages: Int
)

// Booking Request
data class GuestInfo(
    @Json(name = "adults") val adults: Int,
    @Json(name = "children") val children: Int = 0
)

data class CreateBookingRequest(
    @Json(name = "lodgeId") val lodgeId: String,
    @Json(name = "roomCategoryId") val roomCategoryId: String,
    @Json(name = "checkInDate") val checkInDate: String,
    @Json(name = "checkOutDate") val checkOutDate: String,
    @Json(name = "guests") val guests: GuestInfo,
    @Json(name = "rooms") val rooms: Int = 1,
    @Json(name = "customerName") val customerName: String,
    @Json(name = "customerPhone") val customerPhone: String,
    @Json(name = "customerEmail") val customerEmail: String?,
    @Json(name = "specialRequests") val specialRequests: String?,
    @Json(name = "paymentMethod") val paymentMethod: String = "upi"
)

// Cancel Booking
data class CancelBookingRequest(
    @Json(name = "reason") val reason: String
)

// Verify Payment
data class VerifyPaymentRequest(
    @Json(name = "screenshot") val screenshot: String?,
    @Json(name = "transactionId") val transactionId: String?
)

// Update Profile
data class UpdateProfileRequest(
    @Json(name = "fullName") val fullName: String?,
    @Json(name = "email") val email: String?,
    @Json(name = "avatar") val avatar: String?
)

// Create Review
data class CreateReviewRequest(
    @Json(name = "bookingId") val bookingId: String,
    @Json(name = "rating") val rating: Int,
    @Json(name = "comment") val comment: String,
    @Json(name = "images") val images: List<String> = emptyList()
)

// Review
data class Review(
    @Json(name = "_id") val id: String,
    @Json(name = "bookingId") val bookingId: String,
    @Json(name = "customerId") val customerId: String,
    @Json(name = "customerName") val customerName: String,
    @Json(name = "rating") val rating: Int,
    @Json(name = "comment") val comment: String,
    @Json(name = "images") val images: List<String> = emptyList(),
    @Json(name = "createdAt") val createdAt: String
)

// Settings
data class AppSettings(
    @Json(name = "platformName") val platformName: String,
    @Json(name = "platformTagline") val platformTagline: String,
    @Json(name = "supportEmail") val supportEmail: String,
    @Json(name = "supportPhone") val supportPhone: String,
    @Json(name = "defaultCommissionRate") val defaultCommissionRate: Int,
    @Json(name = "taxPercentage") val taxPercentage: Double,
    @Json(name = "platformFeePercentage") val platformFeePercentage: Double,
    @Json(name = "supportedLanguages") val supportedLanguages: List<String>,
    @Json(name = "defaultLanguage") val defaultLanguage: String,
    @Json(name = "defaultCurrency") val defaultCurrency: String
)

// Transport Models
data class CreateTransportRequest(
    @Json(name = "vehicleType") val vehicleType: String,
    @Json(name = "passengers") val passengers: Int,
    @Json(name = "pickupLocation") val pickupLocation: String,
    @Json(name = "destination") val destination: String,
    @Json(name = "travelTime") val travelTime: String,
    @Json(name = "contactPhone") val contactPhone: String,
    @Json(name = "specialInstructions") val specialInstructions: String?
)

data class TransportRequestResponseData(
    @Json(name = "requestId") val requestId: String,
    @Json(name = "status") val status: String,
    @Json(name = "message") val message: String,
    @Json(name = "estimatedCallbackTime") val estimatedCallbackTime: String
)

data class TransportRequestResponse(
    @Json(name = "success") val success: Boolean,
    @Json(name = "message") val message: String?,
    @Json(name = "data") val data: TransportRequestResponseData?
)

// Notification
data class Notification(
    @Json(name = "_id") val id: String,
    @Json(name = "title") val title: String,
    @Json(name = "message") val message: String,
    @Json(name = "type") val type: String,
    @Json(name = "isRead") val isRead: Boolean,
    @Json(name = "data") val data: Map<String, String> = emptyMap(),
    @Json(name = "createdAt") val createdAt: String
)