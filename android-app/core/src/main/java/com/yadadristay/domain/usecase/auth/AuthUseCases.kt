package com.yadadristay.domain.usecase.auth

import com.yadadristay.domain.model.UserProfile
import com.yadadristay.domain.repository.AuthRepository
import com.yadadristay.domain.repository.RegisterRequest
import com.yadadristay.domain.util.Result
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator suspend fun invoke(phoneOrEmail: String, password: String): Result<UserProfile> {
        val phone = if (phoneOrEmail.contains("@")) "" else phoneOrEmail
        return authRepository.login(phone, password)
    }
}

class RegisterUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator suspend fun invoke(
        fullName: String,
        phoneOrEmail: String,
        password: String
    ): Result<UserProfile> {
        val phone = if (phoneOrEmail.contains("@")) "" else phoneOrEmail
        val email = if (phoneOrEmail.contains("@")) phoneOrEmail else ""
        val request = RegisterRequest(
            fullName = fullName,
            phone = phone,
            email = if (email.isNotBlank()) email else null,
            password = password
        )
        return authRepository.register(request)
    }
}

class SendOtpUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator suspend fun invoke(phoneOrEmail: String): Result<Unit> {
        return Result.success(Unit)
    }
}

class VerifyOtpUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator suspend fun invoke(phoneOrEmail: String, otp: String): Result<com.yadadristay.domain.model.UserProfile> {
        return Result.error(Exception("OTP verification not implemented"))
    }
}

class GoogleSignInUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator suspend fun invoke(): Result<com.yadadristay.domain.model.UserProfile> {
        return Result.error(Exception("Google Sign-In not implemented"))
    }
}

class LogoutUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator suspend fun invoke(): Result<Unit> {
        authRepository.logout()
        return Result.success(Unit)
    }
}