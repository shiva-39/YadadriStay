package com.yadadristay.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.repository.AuthRepository
import com.yadadristay.domain.repository.AuthState
import com.yadadristay.domain.usecase.auth.LoginUseCase
import com.yadadristay.domain.usecase.auth.RegisterUseCase
import com.yadadristay.domain.usecase.auth.SendOtpUseCase
import com.yadadristay.domain.usecase.auth.VerifyOtpUseCase
import com.yadadristay.domain.usecase.auth.GoogleSignInUseCase
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private val registerUseCase: RegisterUseCase,
    private val sendOtpUseCase: SendOtpUseCase,
    private val verifyOtpUseCase: VerifyOtpUseCase,
    private val googleSignInUseCase: GoogleSignInUseCase,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState

    // Expose auth state from repository for UI to observe login/logout
    val authState = authRepository.observeAuthState()
        .distinctUntilChanged()

    fun onPhoneOrEmailChange(value: String) {
        _uiState.value = _uiState.value.copy(
            phoneOrEmail = value,
            phoneOrEmailError = validatePhoneOrEmail(value)
        )
    }

    fun onPasswordChange(value: String) {
        _uiState.value = _uiState.value.copy(
            password = value,
            passwordError = validatePassword(value)
        )
    }

    fun onConfirmPasswordChange(value: String) {
        _uiState.value = _uiState.value.copy(
            confirmPassword = value,
            confirmPasswordError = validateConfirmPassword(value, _uiState.value.password)
        )
    }

    fun onFullNameChange(value: String) {
        _uiState.value = _uiState.value.copy(
            fullName = value,
            fullNameError = validateFullName(value)
        )
    }

    fun login() {
        val state = _uiState.value
        if (!state.isFormValid) return

        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = loginUseCase(state.phoneOrEmail, state.password)
            _uiState.value = _uiState.value.copy(isLoading = false)
            when (result) {
                is Result.Success -> {
                    // Navigate to home handled by caller
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun register() {
        val state = _uiState.value
        if (!state.isRegisterFormValid) return

        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = registerUseCase(
                fullName = state.fullName,
                phoneOrEmail = state.phoneOrEmail,
                password = state.password
            )
            _uiState.value = _uiState.value.copy(isLoading = false)
            when (result) {
                is Result.Success -> {
                    // Navigate to OTP verification or home handled by caller
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun signInWithGoogle() {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = googleSignInUseCase()
            _uiState.value = _uiState.value.copy(isLoading = false)
            when (result) {
                is Result.Success -> {
                    // Navigate to home handled by caller
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun sendOtp(phoneOrEmail: String) {
        _uiState.value = _uiState.value.copy(isLoading = true)
        viewModelScope.launch {
            val result = sendOtpUseCase(phoneOrEmail)
            _uiState.value = _uiState.value.copy(isLoading = false)
            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(otpSent = true)
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun verifyOtp(otp: String) {
        _uiState.value = _uiState.value.copy(isLoading = true)
        viewModelScope.launch {
            val result = verifyOtpUseCase(_uiState.value.phoneOrEmail, otp)
            _uiState.value = _uiState.value.copy(isLoading = false)
            when (result) {
                is Result.Success -> {
                    // Navigate to home handled by caller
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    private fun validatePhoneOrEmail(value: String): String? {
        return if (value.isBlank()) {
            "Phone or email is required"
        } else if (!value.contains("@") && !value.matches("^[0-9]{10}$".toRegex())) {
            "Enter a valid phone number or email"
        } else null
    }

    private fun validatePassword(value: String): String? {
        return if (value.isBlank()) {
            "Password is required"
        } else if (value.length < 6) {
            "Password must be at least 6 characters"
        } else null
    }

    private fun validateConfirmPassword(value: String, password: String): String? {
        return if (value.isBlank()) {
            "Confirm password is required"
        } else if (value != password) {
            "Passwords do not match"
        } else null
    }

    private fun validateFullName(value: String): String? {
        return if (value.isBlank()) {
            "Full name is required"
        } else if (value.length < 2) {
            "Name must be at least 2 characters"
        } else null
    }
}

data class AuthUiState(
    var phoneOrEmail: String = "",
    var phoneOrEmailError: String? = null,
    var password: String = "",
    var passwordError: String? = null,
    var confirmPassword: String = "",
    var confirmPasswordError: String? = null,
    var fullName: String = "",
    var fullNameError: String? = null,
    var isLoading: Boolean = false,
    var errorMessage: String? = null,
    var otpSent: Boolean = false
) {
    val isFormValid: Boolean
        get() = phoneOrEmailError == null && passwordError == null &&
                phoneOrEmail.isNotBlank() && password.isNotBlank()

    val isRegisterFormValid: Boolean
        get() = fullNameError == null && phoneOrEmailError == null &&
                passwordError == null && confirmPasswordError == null &&
                fullName.isNotBlank() && phoneOrEmail.isNotBlank() &&
                password.isNotBlank() && confirmPassword.isNotBlank()
}