package com.yadadristay.di

import android.content.Context
import com.yadadristay.data.api.ApiClient
import com.yadadristay.data.api.ApiService
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

        val connectivityInterceptor = okhttp3.Interceptor { chain ->
            val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
            val networkInfo = connectivityManager.activeNetworkInfo

            if (networkInfo == null || !networkInfo.isConnected) {
                throw java.io.IOException("No internet connection")
            }

            chain.proceed(chain.request())
        }

        return OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .addInterceptor(loggingInterceptor)
            .addInterceptor(authInterceptor)
            .addNetworkInterceptor(connectivityInterceptor)
            .retryOnConnectionFailure(true)
            .build()
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