package com.yadadristay.presentation.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.AppConfig
import com.yadadristay.domain.repository.AuthRepository
import com.yadadristay.domain.repository.SettingsRepository
import com.yadadristay.domain.util.Result
import com.yadadristay.domain.util.onSuccess
import com.yadadristay.domain.util.onFailure
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class MainViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _appConfig = MutableStateFlow<AppConfig?>(null)
    val appConfig = _appConfig.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    init {
        loadAppConfig()
    }

    private fun loadAppConfig() {
        _isLoading.value = true
        viewModelScope.launch {
            val result = settingsRepository.getPublicSettings()
            _isLoading.value = false
            result.onSuccess { _appConfig.value = it }
                .onFailure { /* Use defaults */ }
        }
    }

    fun getLanguage(): String = settingsRepository.getLanguage()
    fun setLanguage(language: String) = settingsRepository.setLanguage(language)

    fun getCurrency(): String = settingsRepository.getCurrency()
    fun setCurrency(currency: String) = settingsRepository.setCurrency(currency)

    fun isNotificationsEnabled(): Boolean = settingsRepository.isNotificationsEnabled()
    fun setNotificationsEnabled(enabled: Boolean) = settingsRepository.setNotificationsEnabled(enabled)

    fun isDarkMode(): Boolean = settingsRepository.isDarkMode()
    fun setDarkMode(enabled: Boolean) = settingsRepository.setDarkMode(enabled)

    fun isLoggedIn(): Boolean = authRepository.isLoggedIn()
    fun getCurrentUser() = authRepository.getCurrentUser()

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}