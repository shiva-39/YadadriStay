package com.yadadristay.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.UserProfile
import com.yadadristay.domain.model.ProfileStats
import com.yadadristay.domain.usecase.auth.LogoutUseCase
import com.yadadristay.domain.usecase.user.GetProfileUseCase
import com.yadadristay.domain.usecase.user.GetProfileStatsUseCase
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val getProfileUseCase: GetProfileUseCase,
    private val getProfileStatsUseCase: GetProfileStatsUseCase,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState

    init {
        loadProfile()
    }

    fun loadProfile() {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val profileResult = getProfileUseCase()
            val statsResult = getProfileStatsUseCase()

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (profileResult) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(profile = toProfileUiModel(profileResult.data))
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = profileResult.exception.message)
                }
            }

            when (statsResult) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(stats = toProfileStatsUiModel(statsResult.data))
                }
                is Result.Error -> {
                    // Handle error silently
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            val result = logoutUseCase()
            when (result) {
                is Result.Success -> {
                    // Navigation handled by caller
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    private fun toProfileUiModel(profile: UserProfile): ProfileUiModel = ProfileUiModel(
        id = profile.id,
        name = profile.fullName,
        email = profile.email ?: "",
        phone = profile.phone,
        avatarUrl = profile.avatar ?: "",
        memberSince = "2024" // TODO: Get from profile
    )

    private fun toProfileStatsUiModel(stats: ProfileStats): ProfileStatsUiModel = ProfileStatsUiModel(
        totalStays = stats.totalStays,
        totalFavorites = stats.totalFavorites,
        totalReviews = stats.totalReviews,
        averageRating = stats.averageRating
    )
}

data class ProfileUiState(
    val profile: ProfileUiModel? = null,
    val stats: ProfileStatsUiModel = ProfileStatsUiModel(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

data class ProfileUiModel(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val avatarUrl: String,
    val memberSince: String
)

data class ProfileStatsUiModel(
    val totalStays: Int = 0,
    val totalFavorites: Int = 0,
    val totalReviews: Int = 0,
    val averageRating: Float = 0f
)