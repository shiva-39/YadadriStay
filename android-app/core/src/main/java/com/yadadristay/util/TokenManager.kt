package com.yadadristay.util

import android.content.Context
import android.content.SharedPreferences
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import com.yadadristay.data.model.User
import javax.inject.Inject
import javax.inject.Singleton
import dagger.hilt.android.qualifiers.ApplicationContext

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val moshi: Moshi
) {
    private val prefs: SharedPreferences = context.getSharedPreferences("yadadri_stay_auth", Context.MODE_PRIVATE)
    private val jsonAdapter = moshi.adapter(User::class.java)

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER = "user_data"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
    }

    fun saveAuthData(token: String, refreshToken: String, user: User) {
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, token)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .putString(KEY_USER, jsonAdapter.toJson(user))
            .putBoolean(KEY_IS_LOGGED_IN, true)
            .apply()
    }

    fun getAccessToken(): String? = prefs.getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)

    fun getUser(): User? {
        val json = prefs.getString(KEY_USER, null)
        return if (json != null) jsonAdapter.fromJson(json) else null
    }

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false)

    fun clearAuthData() {
        prefs.edit()
            .remove(KEY_ACCESS_TOKEN)
            .remove(KEY_REFRESH_TOKEN)
            .remove(KEY_USER)
            .putBoolean(KEY_IS_LOGGED_IN, false)
            .apply()
    }

    fun updateAccessToken(token: String) {
        prefs.edit().putString(KEY_ACCESS_TOKEN, token).apply()
    }

    fun updateUser(user: User) {
        prefs.edit().putString(KEY_USER, jsonAdapter.toJson(user)).apply()
    }
}