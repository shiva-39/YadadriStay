package com.yadadristay.domain.usecase.transport

import com.yadadristay.domain.model.TransportRequest
import com.yadadristay.domain.model.TransportRequestResponse
import com.yadadristay.domain.model.TransportRequestUiModel
import com.yadadristay.domain.model.TransportStatus
import com.yadadristay.domain.model.VehicleType
import com.yadadristay.domain.repository.TransportRepository
import com.yadadristay.domain.util.Result
import javax.inject.Inject

class GetTransportRequestsUseCase @Inject constructor(
    private val transportRepository: TransportRepository
) {
    operator suspend fun invoke(): Result<List<TransportRequestUiModel>> {
        // The repository only has createTransportRequest, not getTransportRequests
        // Would need API endpoint to fetch user's transport requests
        // For now, return empty list
        return Result.success(emptyList())
    }
}

class CancelTransportRequestUseCase @Inject constructor(
    private val transportRepository: TransportRepository
) {
    operator suspend fun invoke(requestId: String): Result<Unit> {
        // Would need API endpoint to cancel transport request
        return Result.error(Exception("Cancel transport request not implemented"))
    }
}