package com.yadadristay.presentation.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.BookingDetail
import com.yadadristay.domain.usecase.booking.GetBookingDetailUseCase
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BookingConfirmationViewModel @Inject constructor(
    private val getBookingDetailUseCase: GetBookingDetailUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(BookingConfirmationUiState())
    val uiState: StateFlow<BookingConfirmationUiState> = _uiState

    fun loadBooking(bookingId: String) {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = getBookingDetailUseCase(bookingId)

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(booking = toConfirmationUiModel(result.data))
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    private fun toConfirmationUiModel(detail: BookingDetail): BookingConfirmationUiModel = BookingConfirmationUiModel(
        bookingReference = detail.bookingNumber,
        lodgeName = detail.lodgeName,
        roomType = detail.roomCategoryName,
        checkInDate = detail.checkIn,
        checkInTime = "2:00 PM",
        checkOutDate = detail.checkOut,
        checkOutTime = "11:00 AM",
        numberOfGuests = detail.guests,
        numberOfRooms = detail.roomsBooked,
        amountPaid = detail.pricing.totalAmount.toInt(),
        confirmationEmail = "user@example.com"
    )
}

data class BookingConfirmationUiState(
    val booking: BookingConfirmationUiModel? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

data class BookingConfirmationUiModel(
    val bookingReference: String,
    val lodgeName: String,
    val roomType: String,
    val checkInDate: String,
    val checkInTime: String,
    val checkOutDate: String,
    val checkOutTime: String,
    val numberOfGuests: Int,
    val numberOfRooms: Int,
    val amountPaid: Int,
    val confirmationEmail: String
)