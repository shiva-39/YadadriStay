package com.yadadristay.data.api

import com.yadadristay.data.model.*
import retrofit2.Response
import retrofit2.http.*
import com.squareup.moshi.Json
import okhttp3.MultipartBody
import okhttp3.RequestBody

interface ApiService {

    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<AuthResponse>>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<ApiResponse<AuthResponse>>

    @POST("auth/logout")
    suspend fun logout(): Response<ApiResponse<Unit>>

    @GET("auth/me")
    suspend fun getCurrentUser(@Header("Authorization") authHeader: String): Response<ApiResponse<User>>

    // Lodges
    @GET("lodges")
    suspend fun searchLodges(
        @Query("checkIn") checkIn: String,
        @Query("checkOut") checkOut: String,
        @Query("guests") guests: Int = 1,
        @Query("rooms") rooms: Int = 1,
        @Query("query") query: String? = null,
        @Query("city") city: String? = null,
        @Query("minPrice") minPrice: Double? = null,
        @Query("maxPrice") maxPrice: Double? = null,
        @Query("minRating") minRating: Double? = null,
        @Query("amenities") amenities: List<String> = emptyList(),
        @Query("roomType") roomType: String? = null,
        @Query("sortBy") sortBy: String = "relevance",
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<LodgeSearchResponse>>

    @GET("lodges/{id}")
    suspend fun getLodgeDetail(
        @Path("id") id: String,
        @Query("checkIn") checkIn: String? = null,
        @Query("checkOut") checkOut: String? = null
    ): Response<ApiResponse<Lodge>>

    @GET("lodges/featured")
    suspend fun getFeaturedLodges(
        @Query("limit") limit: Int = 10
    ): Response<ApiResponse<List<Lodge>>>

    @GET("lodges/nearby")
    suspend fun getNearbyLodges(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("radius") radius: Int = 10,
        @Query("limit") limit: Int = 10
    ): Response<ApiResponse<List<Lodge>>>

    // Room Categories
    @GET("lodges/{lodgeId}/rooms")
    suspend fun getRoomCategories(@Path("lodgeId") lodgeId: String): Response<ApiResponse<List<RoomCategory>>>

    @GET("lodges/{lodgeId}/rooms/{roomId}")
    suspend fun getRoomCategoryDetail(
        @Path("lodgeId") lodgeId: String,
        @Path("roomId") roomId: String
    ): Response<ApiResponse<RoomCategory>>

    // Inventory
    @GET("inventory/availability")
    suspend fun checkAvailability(
        @Query("lodgeId") lodgeId: String,
        @Query("roomCategoryId") roomCategoryId: String,
        @Query("checkIn") checkIn: String,
        @Query("checkOut") checkOut: String,
        @Query("rooms") rooms: Int = 1
    ): Response<ApiResponse<AvailabilityResponse>>

    @GET("inventory/calendar")
    suspend fun getCalendarInventory(
        @Query("lodgeId") lodgeId: String,
        @Query("roomCategoryId") roomCategoryId: String,
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String
    ): Response<ApiResponse<List<RoomInventory>>>

    // Bookings
    @POST("bookings")
    suspend fun createBooking(
        @Header("Authorization") authHeader: String,
        @Body request: CreateBookingRequest
    ): Response<ApiResponse<Booking>>

    @GET("bookings")
    suspend fun getMyBookings(
        @Header("Authorization") authHeader: String,
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<PaginatedResponse<Booking>>>

    @GET("bookings/{id}")
    suspend fun getBookingDetail(
        @Header("Authorization") authHeader: String,
        @Path("id") id: String
    ): Response<ApiResponse<Booking>>

    @PATCH("bookings/{id}/cancel")
    suspend fun cancelBooking(
        @Header("Authorization") authHeader: String,
        @Path("id") id: String,
        @Body request: CancelBookingRequest
    ): Response<ApiResponse<Booking>>

    @POST("bookings/{id}/rebook")
    suspend fun rebookBooking(
        @Header("Authorization") authHeader: String,
        @Path("id") id: String
    ): Response<ApiResponse<Booking>>

    // Payments
    @POST("payments")
    suspend fun createPayment(
        @Header("Authorization") authHeader: String,
        @Body request: PaymentRequest
    ): Response<ApiResponse<PaymentResponse>>

    @POST("payments/{paymentId}/verify")
    suspend fun verifyPayment(
        @Header("Authorization") authHeader: String,
        @Path("paymentId") paymentId: String,
        @Body request: VerifyPaymentRequest
    ): Response<ApiResponse<PaymentInfo>>

    @GET("payments/{paymentId}")
    suspend fun getPaymentDetail(
        @Header("Authorization") authHeader: String,
        @Path("paymentId") paymentId: String
    ): Response<ApiResponse<PaymentInfo>>

    // Upload
    @Multipart
    @POST("upload/image")
    suspend fun uploadImage(
        @Header("Authorization") authHeader: String,
        @Part("image") image: okhttp3.MultipartBody.Part,
        @Part("type") type: okhttp3.RequestBody
    ): Response<ApiResponse<UploadResponse>>

    // Reviews
    @GET("lodges/{lodgeId}/reviews")
    suspend fun getLodgeReviews(
        @Path("lodgeId") lodgeId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10
    ): Response<ApiResponse<PaginatedResponse<Review>>>

    @POST("reviews")
    suspend fun createReview(
        @Header("Authorization") authHeader: String,
        @Body request: CreateReviewRequest
    ): Response<ApiResponse<Review>>

    // Profile
    @PATCH("users/profile")
    suspend fun updateProfile(
        @Header("Authorization") authHeader: String,
        @Body request: UpdateProfileRequest
    ): Response<ApiResponse<User>>

    @GET("users/favorites")
    suspend fun getFavorites(
        @Header("Authorization") authHeader: String
    ): Response<ApiResponse<List<Lodge>>>

    @POST("users/favorites/{lodgeId}")
    suspend fun toggleFavorite(
        @Header("Authorization") authHeader: String,
        @Path("lodgeId") lodgeId: String
    ): Response<ApiResponse<Unit>>

    // Settings
    @GET("settings/public")
    suspend fun getPublicSettings(): Response<ApiResponse<AppSettings>>

    // Transport
    @POST("transport/request")
    suspend fun createTransportRequest(
        @Header("Authorization") authHeader: String,
        @Body request: CreateTransportRequest
    ): Response<TransportRequestResponse>

    // Notifications
    @GET("notifications")
    suspend fun getNotifications(
        @Header("Authorization") authHeader: String,
        @Query("unreadOnly") unreadOnly: Boolean = false,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<PaginatedResponse<Notification>>>

    @PATCH("notifications/{id}/read")
    suspend fun markNotificationRead(
        @Header("Authorization") authHeader: String,
        @Path("id") id: String
    ): Response<ApiResponse<Unit>>

    @PATCH("notifications/read-all")
    suspend fun markAllNotificationsRead(
        @Header("Authorization") authHeader: String
    ): Response<ApiResponse<Unit>>

}

// Additional request/response models
data class AvailabilityResponse(
    @Json(name = "available") val available: Boolean,
    @Json(name = "availableRooms") val availableRooms: Int,
    @Json(name = "totalRooms") val totalRooms: Int,
    @Json(name = "pricePerNight") val pricePerNight: Double,
    @Json(name = "totalPrice") val totalPrice: Double
)

data class UploadResponse(
    @Json(name = "url") val url: String,
    @Json(name = "fileName") val fileName: String
)