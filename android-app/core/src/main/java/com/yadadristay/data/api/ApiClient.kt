package com.yadadristay.data.api

import com.yadadristay.data.model.ApiResponse
import com.yadadristay.util.TokenManager
import retrofit2.Retrofit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApiClient @Inject constructor(
    private val retrofit: Retrofit,
    private val tokenManager: TokenManager
) {
    val apiService: ApiService = retrofit.create(ApiService::class.java)
}