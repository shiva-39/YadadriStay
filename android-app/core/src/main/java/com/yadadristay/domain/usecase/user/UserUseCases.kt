package com.yadadristay.domain.usecase.user

import com.yadadristay.domain.model.UserProfile
import com.yadadristay.domain.model.ProfileStats
import com.yadadristay.domain.repository.AuthRepository
import com.yadadristay.domain.repository.ProfileRepository
import com.yadadristay.domain.repository.SettingsRepository
import com.yadadristay.domain.util.Result
import javax.inject.Inject

class GetProfileUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator fun invoke(): Result<UserProfile> {
        return authRepository.getCurrentUser()
            ?.let { Result.success(it) }
            ?: Result.error(Exception("User not logged in"))
    }
}

class GetProfileStatsUseCase @Inject constructor(
    private val profileRepository: ProfileRepository
) {
    operator suspend fun invoke(): Result<ProfileStats> {
        // Get favorites count
        val favoritesResult = profileRepository.getFavorites()
        val favoritesCount = when (favoritesResult) {
            is Result.Success -> favoritesResult.data.size
            is Result.Error -> 0
        }

        // Get profile for other stats
        // For now, return placeholder
        return Result.success(ProfileStats(
            totalStays = 0,
            totalFavorites = favoritesCount,
            totalReviews = 0,
            averageRating = 0f
        ))
    }
}

class UpdateNotificationSettingsUseCase @Inject constructor(
    private val settingsRepository: SettingsRepository
) {
    operator fun invoke(
        push: Boolean? = null,
        email: Boolean? = null,
        sms: Boolean? = null
    ): Result<Unit> {
        push?.let { settingsRepository.setNotificationsEnabled(it) }
        return Result.success(Unit)
    }
}

class UpdateAppearanceSettingsUseCase @Inject constructor(
    private val settingsRepository: SettingsRepository
) {
    operator fun invoke(
        darkMode: Boolean? = null,
        fontSize: FontSize? = null,
        language: Language? = null
    ): Result<Unit> {
        darkMode?.let { settingsRepository.setDarkMode(it) }
        language?.let { settingsRepository.setLanguage(it.name) }
        return Result.success(Unit)
    }
}

enum class FontSize(val displayName: String) {
    SMALL("Small"),
    MEDIUM("Medium"),
    LARGE("Large"),
    EXTRA_LARGE("Extra Large")
}

enum class Language(val displayName: String) {
    ENGLISH("English"),
    HINDI("हिंदी"),
    TELUGU("తెలుగు"),
    TAMIL("தமிழ்")
}