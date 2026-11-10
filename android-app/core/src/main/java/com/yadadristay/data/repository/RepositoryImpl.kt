package com.yadadristay.data.repository

import com.yadadristay.data.api.ApiClient
import com.yadadristay.data.api.ApiService
import com.yadadristay.data.model.*
import com.yadadristay.domain.model.*
import com.yadadristay.domain.model.BookingStatus
import com.yadadristay.domain.model.PaymentInfo
import com.yadadristay.domain.model.Review
import com.yadadristay.domain.model.TransportRequest
import com.yadadristay.domain.util.Result
import com.yadadristay.domain.model.TransportRequestResponse
import com.yadadristay.domain.repository.AuthRepository
import com.yadadristay.domain.repository.AuthState
import com.yadadristay.domain.repository.AvailabilityInfo
import com.yadadristay.domain.repository.BookingRepository
import com.yadadristay.domain.repository.CalendarDayInfo
import com.yadadristay.domain.repository.CreateBookingRequest
import com.yadadristay.domain.repository.CreateReviewRequest
import com.yadadristay.domain.repository.LodgeRepository
import com.yadadristay.domain.repository.NotificationRepository
import com.yadadristay.domain.repository.Notification as DomainNotification
import com.yadadristay.domain.repository.PaginatedResult
import com.yadadristay.domain.repository.PaymentRepository
import com.yadadristay.domain.repository.PaymentRequest
import com.yadadristay.domain.repository.PaymentResponse
import com.yadadristay.domain.repository.ProfileRepository
import com.yadadristay.domain.repository.RegisterRequest
import com.yadadristay.domain.repository.ReviewRepository
import com.yadadristay.domain.repository.SettingsRepository
import com.yadadristay.domain.repository.TransportRepository
import com.yadadristay.domain.repository.UpdateProfileRequest
import com.yadadristay.domain.model.SearchFilters
import com.yadadristay.domain.model.SortOption
import com.yadadristay.util.Constants
import com.yadadristay.util.DateUtils
import com.yadadristay.util.TokenManager
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.filterNotNull
import javax.inject.Inject
import javax.inject.Singleton
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Response
import java.io.File

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenManager: TokenManager
) : AuthRepository {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    override fun observeAuthState(): Flow<AuthState> = _authState.asStateFlow()

    override suspend fun login(phone: String, password: String): Result<UserProfile> {
        return try {
            val response = apiClient.apiService.login(LoginRequest(phone, password))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                tokenManager.saveAuthData(data.accessToken, data.refreshToken, data.user)
                _authState.value = AuthState.Authenticated(UserProfile.fromApi(data.user))
                Result.success(UserProfile.fromApi(data.user))
            } else {
                val error = response.body()?.message ?: "Login failed"
                Result.error(Exception(error))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun register(request: RegisterRequest): Result<UserProfile> {
        return try {
            val apiRequest = LoginRequest(request.phone, request.password) // Note: API uses LoginRequest for register too? Check ApiService
            val response = apiClient.apiService.register(
                com.yadadristay.data.model.RegisterRequest(
                    request.fullName, request.phone, request.email, request.password, request.role
                )
            )
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                tokenManager.saveAuthData(data.accessToken, data.refreshToken, data.user)
                _authState.value = AuthState.Authenticated(UserProfile.fromApi(data.user))
                Result.success(UserProfile.fromApi(data.user))
            } else {
                val error = response.body()?.message ?: "Registration failed"
                Result.error(Exception(error))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun logout() {
        try {
            apiClient.apiService.logout()
        } catch (e: Exception) {
            // Ignore
        }
        tokenManager.clearAuthData()
        _authState.value = AuthState.Unauthenticated()
    }

    override suspend fun refreshToken(): Result<String> {
        return try {
            val refreshToken = tokenManager.getRefreshToken() ?: return Result.error(Exception("No refresh token"))
            val response = apiClient.apiService.refreshToken(RefreshTokenRequest(refreshToken))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                tokenManager.updateAccessToken(data.accessToken)
                Result.success(data.accessToken)
            } else {
                tokenManager.clearAuthData()
                _authState.value = AuthState.Unauthenticated("Session expired")
                Result.error(Exception("Token refresh failed"))
            }
        } catch (e: Exception) {
            tokenManager.clearAuthData()
            _authState.value = AuthState.Unauthenticated("Session expired")
            Result.error(e)
        }
    }

    override fun getCurrentUser(): UserProfile? = tokenManager.getUser()?.let { UserProfile.fromApi(it) }

    override fun getAccessToken(): String? = tokenManager.getAccessToken()

    override fun isLoggedIn(): Boolean = tokenManager.isLoggedIn()

    init {
        if (tokenManager.isLoggedIn()) {
            val user = tokenManager.getUser()
            if (user != null) {
                _authState.value = AuthState.Authenticated(UserProfile.fromApi(user))
            } else {
                _authState.value = AuthState.Unauthenticated()
            }
        } else {
            _authState.value = AuthState.Unauthenticated()
        }
    }
}

@Singleton
class LodgeRepositoryImpl @Inject constructor(
    private val apiClient: ApiClient
) : LodgeRepository {

    override suspend fun searchLodges(filters: SearchFilters): Result<PaginatedResult<LodgeSummary>> {
        return try {
            val response = apiClient.apiService.searchLodges(
                checkInDate = filters.checkIn, checkOutDate = filters.checkOut, adults = filters.guests,
                children = 0, rooms = filters.rooms, query = filters.query, city = filters.city,
                minPrice = filters.minPrice, maxPrice = filters.maxPrice,
                minRating = filters.minRating, amenities = filters.amenities,
                roomType = filters.roomType, sortBy = filters.sortBy.value,
                page = 1, limit = 20
            )
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                val items = data.lodges.map { LodgeSummary.fromApi(it) }
                Result.success(PaginatedResult(items, data.total, data.page, data.totalPages, data.page < data.totalPages))
            } else {
                val error = response.body()?.message ?: "Search failed"
                Result.error(Exception(error))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun getLodgeDetail(lodgeId: String, checkIn: String?, checkOut: String?): Result<LodgeDetail> {
        return try {
            val response = apiClient.apiService.getLodgeDetail(lodgeId, checkIn, checkOut)
            if (response.isSuccessful && response.body()?.success == true) {
                val lodge = response.body()!!.data!!
                Result.success(LodgeDetail.fromApi(lodge))
            } else {
                val error = response.body()?.message ?: "Failed to load lodge details"
                Result.error(Exception(error))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun getFeaturedLodges(limit: Int): Result<List<LodgeSummary>> {
        return try {
            val response = apiClient.apiService.getFeaturedLodges(limit)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!.map { LodgeSummary.fromApi(it) })
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load featured lodges"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun getNearbyLodges(lat: Double, lng: Double, radiusKm: Int): Result<List<LodgeSummary>> {
        return try {
            val response = apiClient.apiService.getNearbyLodges(lat, lng, radiusKm, 10)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!.map { LodgeSummary.fromApi(it) })
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load nearby lodges"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun getRoomCategories(lodgeId: String): Result<List<RoomCategoryDetail>> {
        return try {
            val response = apiClient.apiService.getRoomCategories(lodgeId)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!.map { RoomCategoryDetail.fromApi(it) })
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load room categories"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun checkAvailability(lodgeId: String, roomCategoryId: String, checkIn: String, checkOut: String, rooms: Int): Result<AvailabilityInfo> {
        return try {
            val response = apiClient.apiService.checkAvailability(lodgeId, roomCategoryId, checkIn, checkOut, rooms)
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                Result.success(AvailabilityInfo(data.available, data.availableRooms, data.totalRooms, data.pricePerNight, data.totalPrice))
            } else {
                Result.error(Exception(response.body()?.message ?: "Availability check failed"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun getCalendarInventory(lodgeId: String, roomCategoryId: String, startDate: String, endDate: String): Result<List<CalendarDayInfo>> {
        return try {
            val response = apiClient.apiService.getCalendarInventory(lodgeId, roomCategoryId, startDate, endDate)
            if (response.isSuccessful && response.body()?.success == true) {
                val items = response.body()!!.data!!.map { inv ->
                    CalendarDayInfo(inv.date, inv.totalRooms, inv.availableRooms, inv.blockedRooms, inv.isClosed, inv.priceSnapshot?.basePrice)
                }
                Result.success(items)
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load calendar"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }
}

@Singleton
class BookingRepositoryImpl @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenManager: TokenManager
) : BookingRepository {

    private val _bookings = MutableStateFlow<PaginatedResult<BookingDetail>?>(null)

    private val authHeader: String
        get() = "Bearer ${tokenManager.getAccessToken() ?: ""}"

    override suspend fun createBooking(request: CreateBookingRequest): Result<BookingDetail> {
        return try {
            val apiRequest = com.yadadristay.data.model.CreateBookingRequest(
                request.lodgeId, request.roomCategoryId, request.checkIn, request.checkOut,
                com.yadadristay.data.model.GuestInfo(request.guests, 0), request.rooms, request.customerName, request.customerPhone,
                request.customerEmail, request.specialRequests, request.paymentMethod
            )
            val response = apiClient.apiService.createBooking(authHeader, apiRequest)
            if (response.isSuccessful && response.body()?.success == true) {
                val booking = BookingDetail.fromApi(response.body()!!.data!!)
                Result.success(booking)
            } else {
                val error = response.body()?.message ?: "Booking failed"
                Result.error(Exception(error))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun getMyBookings(status: BookingStatus?, page: Int): Result<PaginatedResult<BookingDetail>> {
        return try {
            val response = apiClient.apiService.getMyBookings(authHeader, status?.value, page, 20)
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                val items = data.items.map { BookingDetail.fromApi(it) }
                val result = PaginatedResult(items, data.total, data.page, data.totalPages, data.page < data.totalPages)
                if (page == 1) _bookings.value = result
                Result.success(result)
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load bookings"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun getBookingDetail(bookingId: String): Result<BookingDetail> {
        return try {
            val response = apiClient.apiService.getBookingDetail(authHeader, bookingId)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(BookingDetail.fromApi(response.body()!!.data!!))
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load booking details"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun cancelBooking(bookingId: String, reason: String): Result<BookingDetail> {
        return try {
            val response = apiClient.apiService.cancelBooking(authHeader, bookingId, CancelBookingRequest(reason))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(BookingDetail.fromApi(response.body()!!.data!!))
            } else {
                Result.error(Exception(response.body()?.message ?: "Cancellation failed"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun rebookBooking(bookingId: String): Result<BookingDetail> {
        return try {
            val response = apiClient.apiService.rebookBooking(authHeader, bookingId)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(BookingDetail.fromApi(response.body()!!.data!!))
            } else {
                Result.error(Exception(response.body()?.message ?: "Rebooking failed"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override fun observeBookings(): Flow<PaginatedResult<BookingDetail>> = _bookings.filterNotNull()
}

@Singleton
class PaymentRepositoryImpl @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenManager: TokenManager
) : PaymentRepository {

    private val authHeader: String
        get() = "Bearer ${tokenManager.getAccessToken() ?: ""}"

    override suspend fun createPayment(request: PaymentRequest): Result<PaymentResponse> {
        return try {
            val apiRequest = com.yadadristay.data.model.PaymentRequest(
                request.bookingId, request.amount, request.paymentMethod,
                request.upiId, request.transactionId, request.screenshot
            )
            val response = apiClient.apiService.createPayment(authHeader, apiRequest)
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                Result.success(PaymentResponse(data.paymentId, data.status, data.message))
            } else {
                Result.error(Exception(response.body()?.message ?: "Payment initiation failed"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun verifyPayment(paymentId: String, screenshot: String?, transactionId: String?): Result<PaymentInfo> {
        return try {
            val response = apiClient.apiService.verifyPayment(authHeader, paymentId, VerifyPaymentRequest(screenshot, transactionId))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(PaymentInfo.fromApi(response.body()!!.data!!))
            } else {
                Result.error(Exception(response.body()?.message ?: "Verification failed"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun getPaymentDetail(paymentId: String): Result<PaymentInfo> {
        return try {
            val response = apiClient.apiService.getPaymentDetail(authHeader, paymentId)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(PaymentInfo.fromApi(response.body()!!.data!!))
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load payment"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun uploadPaymentScreenshot(paymentId: String, imagePath: String): Result<String> {
        return try {
            val file = File(imagePath)
            val mediaType = "image/*".toMediaTypeOrNull()!!
            val requestFile = file.asRequestBody(mediaType)
            val part = MultipartBody.Part.createFormData("image", file.name, requestFile)
            val typeMediaType = "text/plain".toMediaTypeOrNull()!!
            val typePart = "payment_screenshot".toRequestBody(typeMediaType)

            val response = apiClient.apiService.uploadImage(authHeader, part, typePart)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!.url)
            } else {
                Result.error(Exception(response.body()?.message ?: "Upload failed"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }
}

@Singleton
class ProfileRepositoryImpl @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenManager: TokenManager
) : ProfileRepository {

    private val _profile = MutableStateFlow<UserProfile?>(null)

    private val authHeader: String
        get() = "Bearer ${tokenManager.getAccessToken() ?: ""}"

    override suspend fun updateProfile(request: UpdateProfileRequest): Result<UserProfile> {
        return try {
            val apiRequest = com.yadadristay.data.model.UpdateProfileRequest(request.fullName, request.email, request.avatar)
            val response = apiClient.apiService.updateProfile(authHeader, apiRequest)
            if (response.isSuccessful && response.body()?.success == true) {
                val user = UserProfile.fromApi(response.body()!!.data!!)
                _profile.value = user
                tokenManager.updateUser(response.body()!!.data!!)
                Result.success(user)
            } else {
                Result.error(Exception(response.body()?.message ?: "Profile update failed"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun getFavorites(): Result<List<LodgeSummary>> {
        return try {
            val response = apiClient.apiService.getFavorites(authHeader)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!.map { LodgeSummary.fromApi(it) })
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load favorites"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun toggleFavorite(lodgeId: String): Result<Boolean> {
        return try {
            val response = apiClient.apiService.toggleFavorite(authHeader, lodgeId)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(true)
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to toggle favorite"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override fun observeProfile(): Flow<UserProfile?> = _profile.asStateFlow()
}

@Singleton
class SettingsRepositoryImpl @Inject constructor(
    private val apiClient: ApiClient,
    @dagger.hilt.android.qualifiers.ApplicationContext private val context: android.content.Context
) : SettingsRepository {

    private val prefs = context.getSharedPreferences(Constants.PREFS_NAME, android.content.Context.MODE_PRIVATE)

    override suspend fun getPublicSettings(): Result<AppConfig> {
        return try {
            val response = apiClient.apiService.getPublicSettings()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(AppConfig.fromApi(response.body()!!.data!!))
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load settings"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override fun getLanguage(): String = prefs.getString(Constants.KEY_LANGUAGE, Constants.DEFAULT_LANGUAGE) ?: Constants.DEFAULT_LANGUAGE
    override fun setLanguage(language: String) = prefs.edit().putString(Constants.KEY_LANGUAGE, language).apply()
    override fun getCurrency(): String = prefs.getString(Constants.KEY_CURRENCY, Constants.DEFAULT_CURRENCY) ?: Constants.DEFAULT_CURRENCY
    override fun setCurrency(currency: String) = prefs.edit().putString(Constants.KEY_CURRENCY, currency).apply()
    override fun isNotificationsEnabled(): Boolean = prefs.getBoolean(Constants.KEY_NOTIFICATIONS_ENABLED, Constants.DEFAULT_NOTIFICATIONS_ENABLED)
    override fun setNotificationsEnabled(enabled: Boolean) = prefs.edit().putBoolean(Constants.KEY_NOTIFICATIONS_ENABLED, enabled).apply()
    override fun isDarkMode(): Boolean = prefs.getBoolean(Constants.KEY_DARK_MODE, false)
    override fun setDarkMode(enabled: Boolean) = prefs.edit().putBoolean(Constants.KEY_DARK_MODE, enabled).apply()
    override fun isFirstLaunch(): Boolean = prefs.getBoolean(Constants.KEY_FIRST_LAUNCH, true)
    override fun setFirstLaunchComplete() = prefs.edit().putBoolean(Constants.KEY_FIRST_LAUNCH, false).apply()
    override fun isOnboardingComplete(): Boolean = prefs.getBoolean(Constants.KEY_ONBOARDING_COMPLETE, false)
    override fun setOnboardingComplete() = prefs.edit().putBoolean(Constants.KEY_ONBOARDING_COMPLETE, true).apply()
}

@Singleton
class ReviewRepositoryImpl @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenManager: TokenManager
) : ReviewRepository {

    private val authHeader: String
        get() = "Bearer ${tokenManager.getAccessToken() ?: ""}"

    override suspend fun getLodgeReviews(lodgeId: String, page: Int): Result<PaginatedResult<Review>> {
        return try {
            val response = apiClient.apiService.getLodgeReviews(lodgeId, page, 10)
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                val items = data.items.map { toDomainReview(it) }
                Result.success(PaginatedResult(items, data.total, data.page, data.totalPages, data.page < data.totalPages))
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load reviews"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun createReview(request: CreateReviewRequest): Result<Review> {
        return try {
            val apiRequest = com.yadadristay.data.model.CreateReviewRequest(request.bookingId, request.rating, request.comment, request.images)
            val response = apiClient.apiService.createReview(authHeader, apiRequest)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(toDomainReview(response.body()!!.data!!))
            } else {
                Result.error(Exception(response.body()?.message ?: "Review submission failed"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    private fun toDomainReview(r: com.yadadristay.data.model.Review): Review {
        return Review(
            id = r.id,
            bookingId = r.bookingId,
            customerId = r.customerId,
            customerName = r.customerName,
            rating = r.rating,
            comment = r.comment,
            images = r.images,
            createdAt = r.createdAt
        )
    }
}

@Singleton
class NotificationRepositoryImpl @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenManager: TokenManager
) : NotificationRepository {

    private val _unreadCount = MutableStateFlow(0)

    private val authHeader: String
        get() = "Bearer ${tokenManager.getAccessToken() ?: ""}"

    override suspend fun getNotifications(unreadOnly: Boolean, page: Int): Result<PaginatedResult<DomainNotification>> {
        return try {
            val response = apiClient.apiService.getNotifications(authHeader, unreadOnly, page, 20)
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                val items = data.items.map { toDomainNotification(it) }
                if (page == 1 && unreadOnly) _unreadCount.value = items.count { !it.isRead }
                Result.success(PaginatedResult(items, data.total, data.page, data.totalPages, data.page < data.totalPages))
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to load notifications"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun markAsRead(notificationId: String): Result<Unit> {
        return try {
            val response = apiClient.apiService.markNotificationRead(authHeader, notificationId)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to mark as read"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override suspend fun markAllAsRead(): Result<Unit> {
        return try {
            val response = apiClient.apiService.markAllNotificationsRead(authHeader)
            if (response.isSuccessful && response.body()?.success == true) {
                _unreadCount.value = 0
                Result.success(Unit)
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to mark all as read"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    override fun observeUnreadCount(): Flow<Int> = _unreadCount.asStateFlow()

    private fun toDomainNotification(n: com.yadadristay.data.model.Notification): DomainNotification {
        return DomainNotification(
            id = n.id,
            title = n.title,
            message = n.message,
            type = n.type,
            isRead = n.isRead,
            data = n.data,
            createdAt = n.createdAt
        )
    }
}

@Singleton
class TransportRepositoryImpl @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenManager: TokenManager
) : TransportRepository {

    private val authHeader: String
        get() = "Bearer ${tokenManager.getAccessToken() ?: ""}"

    override suspend fun createTransportRequest(request: TransportRequest): Result<TransportRequestResponse> {
        return try {
            val apiRequest = com.yadadristay.data.model.CreateTransportRequest(
                request.vehicleType,
                request.passengers,
                request.pickupLocation,
                request.destination,
                request.travelTime,
                request.contactPhone,
                request.specialInstructions
            )
            val response = apiClient.apiService.createTransportRequest(authHeader, apiRequest)
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                Result.success(TransportRequestResponse(data.requestId, data.status, data.message, data.estimatedCallbackTime))
            } else {
                Result.error(Exception(response.body()?.message ?: "Failed to submit transport request"))
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }
}