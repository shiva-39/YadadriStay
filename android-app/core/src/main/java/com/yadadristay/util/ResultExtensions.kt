package com.yadadristay.util

import kotlin.Result

inline fun <T> Result<T>.onSuccess(action: (T) -> Unit): Result<T> {
    if (this.isSuccess) action(this.getOrThrow())
    return this
}

inline fun <T> Result<T>.onFailure(action: (Throwable) -> Unit): Result<T> {
    if (this.isFailure) action(this.exceptionOrNull()!!)
    return this
}