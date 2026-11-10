package com.yadadristay.di

import android.content.Context
import com.yadadristay.data.api.ApiClient
import com.yadadristay.data.api.ApiService
import com.yadadristay.data.model.RefreshTokenRequest
import com.yadadristay.data.repository.*
import com.yadadristay.domain.repository.*
import com.yadadristay.util.TokenManager
import com.yadadristay.util.Constants
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import java.io.IOException

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    @Provides
    @Singleton
    fun provideOkHttpClient(tokenManager: TokenManager, @ApplicationContext context: Context): OkHttpClient {
        val loggingInterceptor = okhttp3.logging.HttpLoggingInterceptor().apply {
            // Use a constant or build type check instead of BuildConfig
            level = okhttp3.logging.HttpLoggingInterceptor.Level.BODY
        }

        // Auth Interceptor: Adds Bearer token to requests
        val authInterceptor = okhttp3.Interceptor { chain ->
            val originalRequest = chain.request()
            val accessToken = tokenManager.getAccessToken()

            val requestBuilder = originalRequest.newBuilder()
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")

            if (accessToken != null) {
                requestBuilder.header("Authorization", "Bearer $accessToken")
            }

            val newRequest = requestBuilder.build()
            chain.proceed(newRequest)
        }

        // Token Refresh Interceptor: Handles 401 responses by refreshing token and retrying
        val tokenRefreshInterceptor = okhttp3.Interceptor { chain ->
            val originalRequest = chain.request()
            var response = chain.proceed(originalRequest)

            // If unauthorized and we have a refresh token, try to refresh
            if (response.code == 401 && tokenManager.getRefreshToken() != null) {
                response.close()

                // Attempt token refresh
                val refreshed = refreshAccessToken(tokenManager)

                if (refreshed) {
                    // Retry original request with new token
                    val newAccessToken = tokenManager.getAccessToken()
                    val newRequest = originalRequest.newBuilder()
                        .header("Authorization", "Bearer $newAccessToken")
                        .build()
                    response = chain.proceed(newRequest)
                } else {
                    // Refresh failed - clear auth and let app handle logout
                    tokenManager.clearAuthData()
                }
            }

            response
        }

        val connectivityInterceptor = okhttp3.Interceptor { chain ->
            val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager

            // Use modern API (API 29+) with fallback for older versions
            var isConnected = false
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                val activeNetwork = connectivityManager.activeNetwork ?: return@Interceptor chain.proceed(chain.request())
                val networkCapabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return@Interceptor chain.proceed(chain.request())
                isConnected = networkCapabilities.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) ||
                              networkCapabilities.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR) ||
                              networkCapabilities.hasTransport(android.net.NetworkCapabilities.TRANSPORT_ETHERNET)
            } else {
                @Suppress("DEPRECATION")
                val networkInfo = connectivityManager.activeNetworkInfo
                isConnected = networkInfo != null && networkInfo.isConnected
            }

            if (!isConnected) {
                throw IOException("No internet connection")
            }

            chain.proceed(chain.request())
        }

        return OkHttpClient.Builder()
            .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
            .addInterceptor(loggingInterceptor)
            .addInterceptor(authInterceptor)
            .addInterceptor(tokenRefreshInterceptor)
            .addNetworkInterceptor(connectivityInterceptor)
            .retryOnConnectionFailure(true)
            .build()
    }

    /**
     * Synchronously refresh the access token using the refresh token.
     * Returns true if refresh succeeded, false otherwise.
     */
    private fun refreshAccessToken(tokenManager: TokenManager): Boolean {
        val refreshToken = tokenManager.getRefreshToken() ?: return false

        try {
            // Create a temporary OkHttpClient without interceptors to avoid infinite loop
            val client = OkHttpClient.Builder()
                .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                .build()

            val retrofit = Retrofit.Builder()
                .baseUrl(Constants.BASE_URL)
                .addConverterFactory(MoshiConverterFactory.create(Moshi.Builder().add(KotlinJsonAdapterFactory()).build()))
                .client(client)
                .build()

            val apiService = retrofit.create(ApiService::class.java)
            val response = apiService.refreshTokenSync(
                RefreshTokenRequest(refreshToken)
            ).execute()

            if (response.isSuccessful) {
                val apiResponse = response.body()
                if (apiResponse?.success == true && apiResponse.data != null) {
                    val newAccessToken = apiResponse.data.accessToken
                    val newRefreshToken = apiResponse.data.refreshToken
                    tokenManager.updateAccessToken(newAccessToken)
                    tokenManager.updateRefreshToken(newRefreshToken)
                    return true
                }
            }
        } catch (e: Exception) {
            // Log error in production
            e.printStackTrace()
        }

        return false
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, moshi: Moshi): Retrofit = Retrofit.Builder()
        .baseUrl(Constants.BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService = retrofit.create(ApiService::class.java)

    @Provides
    @Singleton
    fun provideApiClient(retrofit: Retrofit, tokenManager: TokenManager): ApiClient = ApiClient(retrofit, tokenManager)

    // Repository bindings
    @Provides
    @Singleton
    fun provideAuthRepository(authRepositoryImpl: AuthRepositoryImpl): AuthRepository = authRepositoryImpl

    @Provides
    @Singleton
    fun provideLodgeRepository(lodgeRepositoryImpl: LodgeRepositoryImpl): LodgeRepository = lodgeRepositoryImpl

    @Provides
    @Singleton
    fun provideBookingRepository(bookingRepositoryImpl: BookingRepositoryImpl): BookingRepository = bookingRepositoryImpl

    @Provides
    @Singleton
    fun providePaymentRepository(paymentRepositoryImpl: PaymentRepositoryImpl): PaymentRepository = paymentRepositoryImpl

    @Provides
    @Singleton
    fun provideProfileRepository(profileRepositoryImpl: ProfileRepositoryImpl): ProfileRepository = profileRepositoryImpl

    @Provides
    @Singleton
    fun provideSettingsRepository(settingsRepositoryImpl: SettingsRepositoryImpl): SettingsRepository = settingsRepositoryImpl

    @Provides
    @Singleton
    fun provideReviewRepository(reviewRepositoryImpl: ReviewRepositoryImpl): ReviewRepository = reviewRepositoryImpl

    @Provides
    @Singleton
    fun provideNotificationRepository(notificationRepositoryImpl: NotificationRepositoryImpl): NotificationRepository = notificationRepositoryImpl

    @Provides
    @Singleton
    fun provideTransportRepository(transportRepositoryImpl: TransportRepositoryImpl): TransportRepository = transportRepositoryImpl
}