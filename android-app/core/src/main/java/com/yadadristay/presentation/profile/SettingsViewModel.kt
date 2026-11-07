package com.yadadristay.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.usecase.user.FontSize
import com.yadadristay.domain.usecase.user.Language
import com.yadadristay.domain.usecase.user.UpdateNotificationSettingsUseCase
import com.yadadristay.domain.usecase.user.UpdateAppearanceSettingsUseCase
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val updateNotificationSettingsUseCase: UpdateNotificationSettingsUseCase,
    private val updateAppearanceSettingsUseCase: UpdateAppearanceSettingsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState

    init {
        loadSettings()
    }

    private fun loadSettings() {
        // Load saved settings from preferences/repository
        _uiState.value = _uiState.value.copy(
            pushNotifications = true,
            emailNotifications = true,
            smsNotifications = false,
            darkMode = false,
            fontSize = FontSize.MEDIUM,
            language = Language.ENGLISH
        )
    }

    fun setPushNotifications(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(pushNotifications = enabled)
        viewModelScope.launch {
            updateNotificationSettingsUseCase(push = enabled)
        }
    }

    fun setEmailNotifications(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(emailNotifications = enabled)
        viewModelScope.launch {
            updateNotificationSettingsUseCase(email = enabled)
        }
    }

    fun setSmsNotifications(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(smsNotifications = enabled)
        viewModelScope.launch {
            updateNotificationSettingsUseCase(sms = enabled)
        }
    }

    fun setDarkMode(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(darkMode = enabled)
        viewModelScope.launch {
            updateAppearanceSettingsUseCase(darkMode = enabled)
        }
    }

    fun setFontSize(size: FontSize) {
        _uiState.value = _uiState.value.copy(fontSize = size)
        viewModelScope.launch {
            updateAppearanceSettingsUseCase(fontSize = size)
        }
    }

    fun setLanguage(language: Language) {
        _uiState.value = _uiState.value.copy(language = language)
        viewModelScope.launch {
            updateAppearanceSettingsUseCase(language = language)
        }
    }
}

data class SettingsUiState(
    val pushNotifications: Boolean = true,
    val emailNotifications: Boolean = true,
    val smsNotifications: Boolean = false,
    val darkMode: Boolean = false,
    val fontSize: FontSize = FontSize.MEDIUM,
    val language: Language = Language.ENGLISH
)