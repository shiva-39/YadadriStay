package com.yadadristay.domain.repository

import com.yadadristay.domain.model.LodgeSummary
import com.yadadristay.domain.model.LodgeDetail
import com.yadadristay.domain.model.RoomCategoryDetail
import com.yadadristay.domain.model.Review
import com.yadadristay.domain.model.SearchFilters
import com.yadadristay.domain.model.BookingDetail
import com.yadadristay.domain.model.BookingStatus
import com.yadadristay.domain.model.PaymentInfo
import com.yadadristay.domain.model.UserProfile
import com.yadadristay.domain.model.AppConfig
import com.yadadristay.domain.model.TransportRequestResponse
import com.yadadristay.domain.model.TransportRequest
import com.yadadristay.domain.util.Result
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun login(phone: String, password: String): Result<UserProfile>
    suspend fun register(request: RegisterRequest): Result<UserProfile>
    suspend fun logout()
    suspend fun refreshToken(): Result<String>
    fun getCurrentUser(): UserProfile?
    fun getAccessToken(): String?
    fun isLoggedIn(): Boolean
    fun observeAuthState(): Flow<AuthState>
}

sealed interface AuthState {
    data class Authenticated(val user: UserProfile) : AuthState
    data class Unauthenticated(val message: String? = null) : AuthState
    object Loading : AuthState
}

data class RegisterRequest(
    val fullName: String, val phone: String, val email: String?, val password: String, val role: String = "customer"
)

interface LodgeRepository {
    suspend fun searchLodges(filters: SearchFilters): Result<PaginatedResult<LodgeSummary>>
    suspend fun getLodgeDetail(lodgeId: String, checkIn: String?, checkOut: String?): Result<LodgeDetail>
    suspend fun getFeaturedLodges(limit: Int): Result<List<LodgeSummary>>
    suspend fun getNearbyLodges(lat: Double, lng: Double, radiusKm: Int): Result<List<LodgeSummary>>
    suspend fun getRoomCategories(lodgeId: String): Result<List<RoomCategoryDetail>>
    suspend fun checkAvailability(lodgeId: String, roomCategoryId: String, checkIn: String, checkOut: String, rooms: Int): Result<AvailabilityInfo>
    suspend fun getCalendarInventory(lodgeId: String, roomCategoryId: String, startDate: String, endDate: String): Result<List<CalendarDayInfo>>
}

data class PaginatedResult<T>(val items: List<T>, val total: Int, val page: Int, val totalPages: Int, val hasMore: Boolean)

data class AvailabilityInfo(val available: Boolean, val availableRooms: Int, val totalRooms: Int, val pricePerNight: Double, val totalPrice: Double)

data class CalendarDayInfo(val date: String, val totalRooms: Int, val availableRooms: Int, val blockedRooms: Int, val isClosed: Boolean, val price: Double?)

interface BookingRepository {
    suspend fun createBooking(request: CreateBookingRequest): Result<BookingDetail>
    suspend fun getMyBookings(status: BookingStatus?, page: Int): Result<PaginatedResult<BookingDetail>>
    suspend fun getBookingDetail(bookingId: String): Result<BookingDetail>
    suspend fun cancelBooking(bookingId: String, reason: String): Result<BookingDetail>
    suspend fun rebookBooking(bookingId: String): Result<BookingDetail>
    fun observeBookings(): Flow<PaginatedResult<BookingDetail>>
}

data class CreateBookingRequest(
    val lodgeId: String, val roomCategoryId: String, val checkIn: String, val checkOut: String,
    val guests: Int, val rooms: Int, val customerName: String, val customerPhone: String,
    val customerEmail: String?, val specialRequests: String?, val paymentMethod: String = "upi"
)

interface PaymentRepository {
    suspend fun createPayment(request: PaymentRequest): Result<PaymentResponse>
    suspend fun verifyPayment(paymentId: String, screenshot: String?, transactionId: String?): Result<PaymentInfo>
    suspend fun getPaymentDetail(paymentId: String): Result<PaymentInfo>
    suspend fun uploadPaymentScreenshot(paymentId: String, imagePath: String): Result<String>
}

data class PaymentRequest(
    val bookingId: String, val amount: Double, val paymentMethod: String,
    val upiId: String?, val transactionId: String?, val screenshot: String?
)

data class PaymentResponse(val paymentId: String, val status: String, val message: String)

interface ProfileRepository {
    suspend fun updateProfile(request: UpdateProfileRequest): Result<UserProfile>
    suspend fun getFavorites(): Result<List<LodgeSummary>>
    suspend fun toggleFavorite(lodgeId: String): Result<Boolean>
    fun observeProfile(): Flow<UserProfile?>
}

data class UpdateProfileRequest(val fullName: String?, val email: String?, val avatar: String?)

interface SettingsRepository {
    suspend fun getPublicSettings(): Result<AppConfig>
    fun getLanguage(): String
    fun setLanguage(language: String)
    fun getCurrency(): String
    fun setCurrency(currency: String)
    fun isNotificationsEnabled(): Boolean
    fun setNotificationsEnabled(enabled: Boolean)
    fun isDarkMode(): Boolean
    fun setDarkMode(enabled: Boolean)
    fun isFirstLaunch(): Boolean
    fun setFirstLaunchComplete()
    fun isOnboardingComplete(): Boolean
    fun setOnboardingComplete()
}

interface ReviewRepository {
    suspend fun getLodgeReviews(lodgeId: String, page: Int): Result<PaginatedResult<Review>>
    suspend fun createReview(request: CreateReviewRequest): Result<Review>
}

data class CreateReviewRequest(val bookingId: String, val rating: Int, val comment: String, val images: List<String> = emptyList())

interface NotificationRepository {
    suspend fun getNotifications(unreadOnly: Boolean, page: Int): Result<PaginatedResult<Notification>>
    suspend fun markAsRead(notificationId: String): Result<Unit>
    suspend fun markAllAsRead(): Result<Unit>
    fun observeUnreadCount(): Flow<Int>
}

data class Notification(
    val id: String, val title: String, val message: String, val type: String,
    val isRead: Boolean, val data: Map<String, String>, val createdAt: String
)

interface TransportRepository {
    suspend fun createTransportRequest(request: TransportRequest): Result<TransportRequestResponse>
}