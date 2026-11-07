package com.yadadristay.domain.util

sealed interface Result<out T> {
    data class Success<out T>(val data: T) : Result<T>
    data class Error(val exception: Throwable) : Result<Nothing>

    companion object {
        fun <T> success(data: T): Result<T> = Success(data)
        fun <T> error(exception: Throwable): Result<T> = Error(exception)
    }
}

inline fun <T, R> Result<T>.mapResult(transform: (T) -> R): Result<R> = when (this) {
    is Result.Success -> Result.success(transform(data))
    is Result.Error -> this
}

inline fun <T> Result<T>.onSuccess(action: (T) -> Unit): Result<T> = when (this) {
    is Result.Success -> {
        action(data)
        this
    }
    is Result.Error -> this
}

inline fun <T> Result<T>.onFailure(action: (Throwable) -> Unit): Result<T> = when (this) {
    is Result.Success -> this
    is Result.Error -> {
        action(exception)
        this
    }
}

fun <T> kotlin.Result<T>.toDomainResult(): Result<T> = when {
    isSuccess -> Result.success(getOrThrow())
    isFailure -> Result.error(exceptionOrNull()!!)
    else -> throw IllegalStateException("Unexpected kotlin.Result state")
}