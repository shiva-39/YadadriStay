package com.yadadristay.domain.model

import com.yadadristay.data.model.Lodge
import com.yadadristay.data.model.RoomCategory
import com.yadadristay.data.model.Booking
import com.yadadristay.data.model.User
import com.yadadristay.data.model.Review as DataReview
import com.yadadristay.data.model.AppSettings

data class LodgeSummary(
    val id: String,
    val name: String,
    val shortDescription: String?,
    val primaryImageUrl: String?,
    val city: String,
    val state: String,
    val distanceFromTempleKm: Double?,
    val minPrice: Double,
    val maxPrice: Double,
    val averageRating: Double,
    val reviewCount: Int,
    val totalRooms: Int,
    val availableRooms: Int,
    val facilities: List<String>,
    val status: String
) {
    companion object {
        fun fromApi(lodge: Lodge): LodgeSummary {
            val activeCategories = lodge.roomCategories.filter { it.isActive }
            val minPrice = activeCategories.minByOrNull { it.basePrice }?.basePrice ?: lodge.pricing.basePrice
            val maxPrice = activeCategories.maxByOrNull { it.basePrice }?.basePrice ?: lodge.pricing.basePrice
            val availableRooms = lodge.roomCategories.sumOf { it.totalRooms }
            return LodgeSummary(
                id = lodge.id, name = lodge.name, shortDescription = lodge.shortDescription,
                primaryImageUrl = lodge.primaryImageUrl, city = lodge.address.city, state = lodge.address.state,
                distanceFromTempleKm = lodge.distanceFromTempleKm, minPrice = minPrice, maxPrice = maxPrice,
                averageRating = lodge.averageRating, reviewCount = lodge.reviewCount, totalRooms = lodge.totalRooms,
                availableRooms = availableRooms, facilities = lodge.facilities.availableFacilities, status = lodge.status
            )
        }
    }
}

data class LodgeDetail(
    val id: String, val name: String, val description: String?, val address: Address, val contact: Contact,
    val images: List<String>, val facilities: List<String>, val policies: Policies, val pricing: Pricing,
    val roomCategories: List<RoomCategory>, val averageRating: Double, val reviewCount: Int,
    val reviews: List<Review>, val status: String
) {
    companion object {
        fun fromApi(lodge: Lodge): LodgeDetail = LodgeDetail(
            id = lodge.id, name = lodge.name, description = lodge.description,
            address = Address.fromApi(lodge.address), contact = Contact.fromApi(lodge.contact),
            images = lodge.images.map { it.url }, facilities = lodge.facilities.availableFacilities,
            policies = Policies.fromApi(lodge.policies), pricing = Pricing.fromApi(lodge.pricing),
            roomCategories = lodge.roomCategories.filter { it.isActive },
            averageRating = lodge.averageRating, reviewCount = lodge.reviewCount, reviews = emptyList(), status = lodge.status
        )
    }
}

data class Address(val street: String, val city: String, val state: String, val pincode: String,
    val landmark: String?, val coordinates: Pair<Double, Double>?, val distanceFromTempleKm: Double?,
    val fullAddress: String) {
    companion object { fun fromApi(a: com.yadadristay.data.model.Address): Address = Address(a.street, a.city, a.state, a.pincode, a.landmark, a.latLng, a.distanceFromTemple, a.fullAddress) }
}

data class Contact(val phone: String, val alternatePhone: String?, val email: String?, val whatsappNumber: String?) {
    companion object { fun fromApi(c: com.yadadristay.data.model.Contact): Contact = Contact(c.phone, c.alternatePhone, c.email, c.whatsappNumber) }
}

data class Policies(val checkInTime: String, val checkOutTime: String, val cancellationPolicy: String,
    val advancePaymentPercentage: Int, val allowPets: Boolean, val allowSmoking: Boolean) {
    companion object { fun fromApi(p: com.yadadristay.data.model.Policies): Policies = Policies(p.checkInTime, p.checkOutTime, p.cancellationPolicy, p.advancePaymentPercentage, p.allowPets, p.allowSmoking) }
}

data class Pricing(val basePrice: Double, val taxPercentage: Double, val serviceChargePercentage: Double) {
    companion object { fun fromApi(p: com.yadadristay.data.model.Pricing): Pricing = Pricing(p.basePrice, p.taxPercentage, p.serviceChargePercentage) }
}

data class RoomCategoryDetail(
    val id: String, val name: String, val description: String?, val basePrice: Double, val maxOccupancy: Int,
    val totalRooms: Int, val availableRooms: Int, val amenities: List<String>, val images: List<String>,
    val bedType: String, val roomSize: Int?
) {
    companion object { fun fromApi(r: RoomCategory, available: Int = 0): RoomCategoryDetail = RoomCategoryDetail(r.id, r.name, r.description, r.basePrice, r.maxOccupancy, r.totalRooms, available, r.amenities, r.images, r.bedType, r.roomSize) }
}

data class BookingDetail(
    val id: String, val bookingNumber: String, val lodgeId: String, val lodgeName: String, val lodgeAddress: String,
    val roomCategoryId: String, val roomCategoryName: String, val checkIn: String, val checkOut: String,
    val nights: Int, val guests: Int, val roomsBooked: Int, val status: BookingStatus,
    val pricing: BookingPricingDetail, val payment: PaymentInfo?, val specialRequests: String?,
    val createdAt: String, val confirmedAt: String?, val cancelledAt: String?, val cancellationReason: String?
) {
    companion object {
        fun fromApi(b: Booking): BookingDetail = BookingDetail(
            id = b.id, bookingNumber = b.bookingNumber, lodgeId = b.lodgeId, lodgeName = b.lodgeName ?: "",
            lodgeAddress = b.lodgeAddress ?: "", roomCategoryId = b.roomCategoryId, roomCategoryName = b.roomCategoryName ?: "",
            checkIn = b.checkIn, checkOut = b.checkOut, nights = b.nights, guests = b.guests, roomsBooked = b.roomsBooked,
            status = BookingStatus.fromString(b.status), pricing = BookingPricingDetail.fromApi(b.pricing),
            payment = b.payment?.let { PaymentInfo.fromApi(it) }, specialRequests = b.specialRequests,
            createdAt = b.createdAt, confirmedAt = b.confirmedAt, cancelledAt = b.cancelledAt, cancellationReason = b.cancellationReason
        )
    }
}

enum class BookingStatus(val value: String) {
    PENDING("pending"),
    CONFIRMED("confirmed"),
    COMPLETED("completed"),
    CANCELLED("cancelled"),
    NO_SHOW("no_show");

    companion object {
        fun fromString(s: String): BookingStatus = values().firstOrNull { it.value == s } ?: PENDING
    }
}

data class BookingPricingDetail(val basePrice: Double, val taxAmount: Double, val serviceChargeAmount: Double,
    val platformFeeAmount: Double, val advancePaid: Double, val totalAmount: Double, val balanceAmount: Double) {
    companion object { fun fromApi(p: com.yadadristay.data.model.BookingPricing): BookingPricingDetail = BookingPricingDetail(p.basePrice, p.taxAmount, p.serviceChargeAmount, p.platformFeeAmount, p.advancePaid, p.totalAmount, p.balanceAmount) }
}

data class PaymentInfo(val paymentId: String?, val amount: Double, val paymentMethod: String, val status: String,
    val transactionId: String?, val upiId: String?, val screenshot: String?, val paidAt: String?, val verifiedAt: String?) {
    companion object { fun fromApi(p: com.yadadristay.data.model.PaymentInfo): PaymentInfo = PaymentInfo(p.paymentId, p.amount, p.paymentMethod, p.status, p.transactionId, p.upiId, p.screenshot, p.paidAt, p.verifiedAt) }
}

data class UserProfile(
    val id: String, val fullName: String, val phone: String, val email: String?, val avatar: String?,
    val role: String, val isEmailVerified: Boolean, val isPhoneVerified: Boolean,
    val businessName: String?, val gstNumber: String?, val panNumber: String?, val upiId: String?,
    val bankName: String?, val accountNumber: String?, val ifscCode: String?, val commissionRate: Int,
    val lodgeCount: Int, val totalBookings: Int, val totalSpent: Double, val completedBookings: Int,
    val cancelledBookings: Int, val reviewsCount: Int, val favoriteLodges: List<String>
) {
    companion object { fun fromApi(u: User): UserProfile = UserProfile(u.id, u.fullName, u.phone, u.email, u.avatar, u.role, u.isEmailVerified, u.isPhoneVerified, u.businessName, u.gstNumber, u.panNumber, u.upiId, u.bankName, u.accountNumber, u.ifscCode, u.commissionRate, u.lodgeCount, u.totalBookings, u.totalSpent, u.completedBookings, u.cancelledBookings, u.reviewsCount, u.favoriteLodges) }
}

data class AppConfig(
    val platformName: String, val platformTagline: String, val supportEmail: String, val supportPhone: String,
    val defaultCommissionRate: Int, val taxPercentage: Double, val platformFeePercentage: Double,
    val supportedLanguages: List<String>, val defaultLanguage: String, val defaultCurrency: String
) {
    companion object { fun fromApi(s: AppSettings): AppConfig = AppConfig(s.platformName, s.platformTagline, s.supportEmail, s.supportPhone, s.defaultCommissionRate, s.taxPercentage, s.platformFeePercentage, s.supportedLanguages, s.defaultLanguage, s.defaultCurrency) }
}

data class SearchFilters(
    val checkIn: String, val checkOut: String, val guests: Int = 1, val rooms: Int = 1,
    val query: String? = null, val city: String? = null, val minPrice: Double? = null,
    val maxPrice: Double? = null, val minRating: Double? = null, val amenities: List<String> = emptyList(),
    val roomType: String? = null, val sortBy: SortOption = SortOption.RELEVANCE
)

enum class SortOption(val value: String, val label: String) {
    RELEVANCE("relevance", "Relevance"), PRICE_LOW_HIGH("price_asc", "Price: Low to High"),
    PRICE_HIGH_LOW("price_desc", "Price: High to Low"), RATING("rating", "Highest Rated"),
    DISTANCE("distance", "Nearest to Temple")
}

enum class TransportType {
    AUTO, CAR
}

data class TransportRequest(
    val vehicleType: String,
    val passengers: Int,
    val pickupLocation: String,
    val destination: String,
    val travelTime: String,
    val contactPhone: String,
    val specialInstructions: String?
)

data class TransportRequestUiModel(
    val id: String,
    val vehicleType: VehicleType,
    val route: String,
    val pickupLocation: String,
    val dropoffLocation: String,
    val pickupTime: String,
    val dropoffTime: String,
    val duration: String,
    val distance: String,
    val fare: Int,
    val status: TransportStatus,
    val driverName: String?,
    val driverPhone: String?,
    val vehicleNumber: String?
)

data class TransportRequestResponse(
    val requestId: String,
    val status: String,
    val message: String,
    val estimatedCallbackTime: String
)

enum class TransportFilter(val displayName: String) {
    ALL("All"),
    UPCOMING("Upcoming"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled")
}

enum class TransportStatus(val displayName: String) {
    PENDING("Pending"),
    CONFIRMED("Confirmed"),
    IN_PROGRESS("In Progress"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled")
}

enum class VehicleType(val displayName: String, val icon: String) {
    CAB("Cab", "🚗"),
    BUS("Bus", "🚌"),
    AUTO("Auto", "🛺"),
    BIKE("Bike", "🏍️")
}

data class AvailableRoom(
    val id: String,
    val number: String,
    val floorDescription: String,
    val isAvailable: Boolean = true,
    val features: List<String> = emptyList()
)

data class Review(
    val id: String,
    val bookingId: String,
    val customerId: String,
    val customerName: String,
    val rating: Int,
    val comment: String,
    val images: List<String>,
    val createdAt: String
)

data class ReviewSummary(
    val overallRating: Float,
    val totalReviews: Int,
    val ratingBreakdown: Map<Int, Float>,
    val categoryRatings: Map<String, Float>
)

data class BookingForReview(
    val id: String,
    val lodgeName: String,
    val roomType: String,
    val checkInDate: String,
    val checkOutDate: String,
    val bookingReference: String
)

data class BookingSummary(
    val bookingId: String,
    val lodgeName: String,
    val lodgeLocation: String,
    val roomCategoryName: String,
    val checkInDate: String,
    val checkOutDate: String,
    val numberOfNights: Int,
    val numberOfRooms: Int,
    val numberOfGuests: Int,
    val capacityPerRoom: Int,
    val roomCharges: Int,
    val taxesAndFees: Int,
    val discount: Int,
    val totalAmount: Int
)

data class ProfileStats(
    val totalStays: Int = 0,
    val totalFavorites: Int = 0,
    val totalReviews: Int = 0,
    val averageRating: Float = 0f
)

// Extension functions for UI model conversion
fun BookingSummary.toUiModel(): com.yadadristay.presentation.booking.BookingSummaryUiModel = com.yadadristay.presentation.booking.BookingSummaryUiModel(
    bookingId = bookingId,
    lodgeName = lodgeName,
    lodgeLocation = lodgeLocation,
    roomCategoryName = roomCategoryName,
    checkInDate = checkInDate,
    checkOutDate = checkOutDate,
    numberOfNights = numberOfNights,
    numberOfRooms = numberOfRooms,
    numberOfGuests = numberOfGuests,
    capacityPerRoom = capacityPerRoom,
    roomCharges = roomCharges,
    taxesAndFees = taxesAndFees,
    discount = discount,
    totalAmount = totalAmount
)

fun ProfileStats.toUiModel(): com.yadadristay.presentation.profile.ProfileStatsUiModel = com.yadadristay.presentation.profile.ProfileStatsUiModel(
    totalStays = totalStays,
    totalFavorites = totalFavorites,
    totalReviews = totalReviews,
    averageRating = averageRating
)

fun ReviewSummary.toUiModel(): com.yadadristay.presentation.reviews.ReviewSummaryUiModel = com.yadadristay.presentation.reviews.ReviewSummaryUiModel(
    overallRating = overallRating,
    totalReviews = totalReviews,
    ratingBreakdown = ratingBreakdown,
    categoryRatings = categoryRatings
)

fun BookingForReview.toUiModel(): com.yadadristay.presentation.reviews.BookingForReviewUiModel = com.yadadristay.presentation.reviews.BookingForReviewUiModel(
    id = id,
    lodgeName = lodgeName,
    roomType = roomType,
    checkInDate = checkInDate,
    checkOutDate = checkOutDate,
    bookingReference = bookingReference
)

// Helper data classes for use cases
data class GuestDetail(
    val fullName: String = "",
    val email: String = "",
    val phone: String = "",
    val idProof: String = ""
)

data class UpiApp(
    val name: String,
    val icon: String
)

data class PaymentOptions(
    val totalAmount: Int,
    val upiApps: List<UpiApp> = emptyList()
)

data class PaymentResponse(
    val paymentId: String,
    val status: String,
    val message: String
)

enum class PaymentMethod {
    UPI,
    CARD,
    NET_BANKING,
    WALLET
}

enum class Language(val displayName: String) {
    ENGLISH("English"),
    HINDI("हिंदी"),
    TELUGU("తెలుగు"),
    TAMIL("தமிழ்")
}

enum class FontSize(val displayName: String) {
    SMALL("Small"),
    MEDIUM("Medium"),
    LARGE("Large"),
    EXTRA_LARGE("Extra Large")
}