package com.yadadristay.presentation.transport

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.TransportRequestUiModel
import com.yadadristay.domain.model.TransportStatus
import com.yadadristay.domain.usecase.transport.GetTransportRequestsUseCase
import com.yadadristay.domain.usecase.transport.CancelTransportRequestUseCase
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TransportViewModel @Inject constructor(
    private val getTransportRequestsUseCase: GetTransportRequestsUseCase,
    private val cancelTransportRequestUseCase: CancelTransportRequestUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(TransportUiState())
    val uiState: StateFlow<TransportUiState> = _uiState

    init {
        loadRequests()
    }

    fun loadRequests() {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = getTransportRequestsUseCase()

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(requests = result.data)
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun setFilter(filter: TransportFilter) {
        _uiState.value = _uiState.value.copy(selectedFilter = filter)
    }

    val filteredRequests: List<TransportRequestUiModel>
        get() = when (_uiState.value.selectedFilter) {
            TransportFilter.ALL -> _uiState.value.requests
            TransportFilter.UPCOMING -> _uiState.value.requests.filter { it.status == TransportStatus.PENDING || it.status == TransportStatus.CONFIRMED || it.status == TransportStatus.IN_PROGRESS }
            TransportFilter.COMPLETED -> _uiState.value.requests.filter { it.status == TransportStatus.COMPLETED }
            TransportFilter.CANCELLED -> _uiState.value.requests.filter { it.status == TransportStatus.CANCELLED }
        }

    fun cancelRequest(requestId: String) {
        viewModelScope.launch {
            val result = cancelTransportRequestUseCase(requestId)

            when (result) {
                is Result.Success -> {
                    loadRequests()
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }
}

data class TransportUiState(
    val requests: List<TransportRequestUiModel> = emptyList(),
    val selectedFilter: TransportFilter = TransportFilter.ALL,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

enum class TransportFilter(val displayName: String) {
    ALL("All"),
    UPCOMING("Upcoming"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled")
}