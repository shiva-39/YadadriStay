package com.yadadristay.presentation.mybookings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.BookingDetail
import com.yadadristay.domain.model.BookingStatus
import com.yadadristay.domain.usecase.booking.GetUserBookingsUseCase
import com.yadadristay.domain.usecase.booking.CancelBookingUseCase
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MyBookingsViewModel @Inject constructor(
    private val getUserBookingsUseCase: GetUserBookingsUseCase,
    private val cancelBookingUseCase: CancelBookingUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(MyBookingsUiState())
    val uiState: StateFlow<MyBookingsUiState> = _uiState

    init {
        loadBookings()
    }

    fun loadBookings() {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = getUserBookingsUseCase()

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(bookings = result.data.map { toBookingUiModel(it) })
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun setFilter(filter: BookingFilter) {
        _uiState.value = _uiState.value.copy(selectedFilter = filter)
    }

    val filteredBookings: List<BookingUiModel>
        get() = when (_uiState.value.selectedFilter) {
            BookingFilter.ALL -> _uiState.value.bookings
            BookingFilter.UPCOMING -> _uiState.value.bookings.filter { it.status == BookingStatus.PENDING || it.status == BookingStatus.CONFIRMED }
            BookingFilter.COMPLETED -> _uiState.value.bookings.filter { it.status == BookingStatus.COMPLETED }
            BookingFilter.CANCELLED -> _uiState.value.bookings.filter { it.status == BookingStatus.CANCELLED }
        }

    fun cancelBooking(bookingId: String) {
        viewModelScope.launch {
            val result = cancelBookingUseCase(bookingId)

            when (result) {
                is Result.Success -> {
                    loadBookings()
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    private fun toBookingUiModel(detail: BookingDetail): BookingUiModel = BookingUiModel(
        id = detail.id,
        lodgeName = detail.lodgeName,
        location = detail.lodgeAddress,
        checkInDate = detail.checkIn,
        checkOutDate = detail.checkOut,
        rooms = detail.roomsBooked,
        guests = detail.guests,
        totalAmount = detail.pricing.totalAmount.toInt(),
        status = detail.status,
        roomType = detail.roomCategoryName,
        bookingReference = detail.bookingNumber
    )
}

data class MyBookingsUiState(
    val bookings: List<BookingUiModel> = emptyList(),
    val selectedFilter: BookingFilter = BookingFilter.ALL,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

data class BookingUiModel(
    val id: String,
    val lodgeName: String,
    val location: String,
    val checkInDate: String,
    val checkOutDate: String,
    val rooms: Int,
    val guests: Int,
    val totalAmount: Int,
    val status: BookingStatus,
    val roomType: String,
    val bookingReference: String
)

enum class BookingFilter(val displayName: String) {
    ALL("All"),
    UPCOMING("Upcoming"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled")
}