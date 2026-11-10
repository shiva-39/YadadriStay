package com.yadadristay.presentation.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.BookingDetail
import com.yadadristay.domain.model.BookingSummary
import com.yadadristay.domain.usecase.booking.CreateBookingUseCase
import com.yadadristay.domain.usecase.booking.GetBookingSummaryUseCase
import com.yadadristay.domain.usecase.booking.GuestDetail
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BookingViewModel @Inject constructor(
    private val getBookingSummaryUseCase: GetBookingSummaryUseCase,
    private val createBookingUseCase: CreateBookingUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(BookingUiState())
    val uiState: StateFlow<BookingUiState> = _uiState

    private var _lodgeId: String = ""
    private var _roomCategoryId: String = ""
    private var _checkIn: String = ""
    private var _checkOut: String = ""
    private var _guests: Int = 1
    private var _rooms: Int = 1

    fun loadBookingSummary() {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = getBookingSummaryUseCase(
                lodgeId = _lodgeId,
                roomCategoryId = _roomCategoryId,
                checkIn = _checkIn,
                checkOut = _checkOut,
                guests = _guests,
                rooms = _rooms
            )

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        bookingSummary = toBookingSummaryUiModel(result.data),
                        bookingId = result.data.bookingId
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun updateGuestDetails(guests: List<GuestDetailUiModel>) {
        _uiState.value = _uiState.value.copy(guestDetails = guests)
    }

    fun addGuest() {
        _uiState.value = _uiState.value.copy(
            guestDetails = _uiState.value.guestDetails + GuestDetailUiModel()
        )
    }

    fun removeGuest(index: Int) {
        _uiState.value = _uiState.value.copy(
            guestDetails = if (_uiState.value.guestDetails.size > 1) {
                _uiState.value.guestDetails.filterIndexed { i, _ -> i != index }
            } else {
                _uiState.value.guestDetails
            }
        )
    }

    fun updateSpecialRequests(requests: String) {
        _uiState.value = _uiState.value.copy(specialRequests = requests)
    }

    fun setTermsAccepted(accepted: Boolean) {
        _uiState.value = _uiState.value.copy(termsAccepted = accepted)
    }

    fun confirmBooking() {
        val state = _uiState.value
        if (!state.termsAccepted || state.guestDetails.any { !it.isValid }) return

        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val domainGuestDetails = state.guestDetails.map { toDomainGuestDetail(it) }
            val result = createBookingUseCase(
                lodgeId = _lodgeId,
                roomCategoryId = _roomCategoryId,
                checkIn = _checkIn,
                checkOut = _checkOut,
                guests = _guests,
                rooms = _rooms,
                guestDetails = domainGuestDetails,
                specialRequests = state.specialRequests
            )

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(bookingId = result.data.id)
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun setBookingParams(lodgeId: String, roomCategoryId: String, checkIn: String, checkOut: String, guests: Int, rooms: Int) {
        _lodgeId = lodgeId
        _roomCategoryId = roomCategoryId
        _checkIn = checkIn
        _checkOut = checkOut
        _guests = guests
        _rooms = rooms
    }

    private fun toDomainGuestDetail(ui: GuestDetailUiModel): GuestDetail = GuestDetail(
        fullName = ui.fullName,
        email = ui.email,
        phone = ui.phone,
        idProof = ui.idProof
    )

    private fun toBookingSummaryUiModel(summary: BookingSummary): BookingSummaryUiModel = BookingSummaryUiModel(
        bookingId = summary.bookingId,
        lodgeName = summary.lodgeName,
        lodgeLocation = summary.lodgeLocation,
        roomCategoryName = summary.roomCategoryName,
        checkInDate = summary.checkInDate,
        checkOutDate = summary.checkOutDate,
        numberOfNights = summary.numberOfNights,
        numberOfRooms = summary.numberOfRooms,
        numberOfGuests = summary.numberOfGuests,
        capacityPerRoom = summary.capacityPerRoom,
        roomCharges = summary.roomCharges,
        taxesAndFees = summary.taxesAndFees,
        discount = summary.discount,
        totalAmount = summary.totalAmount
    )
}

data class BookingUiState(
    val bookingSummary: BookingSummaryUiModel? = null,
    val guestDetails: List<GuestDetailUiModel> = emptyList(),
    val specialRequests: String = "",
    val termsAccepted: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val bookingId: String? = null
)

data class BookingSummaryUiModel(
    val bookingId: String,
    val lodgeName: String,
    val lodgeLocation: String,
    val roomCategoryName: String,
    val checkInDate: String,
    val checkOutDate: String,
    val numberOfNights: Int,
    val numberOfRooms: Int,
    val numberOfGuests: Int,
    val capacityPerRoom: Int,
    val roomCharges: Int,
    val taxesAndFees: Int,
    val discount: Int,
    val totalAmount: Int
)

data class GuestDetailUiModel(
    val fullName: String = "",
    val fullNameError: String? = null,
    val email: String = "",
    val emailError: String? = null,
    val phone: String = "",
    val phoneError: String? = null,
    val idProof: String = "",
    val idProofError: String? = null
) {
    val isValid: Boolean
        get() = fullName.isNotBlank() && email.isNotBlank() && phone.isNotBlank() && idProof.isNotBlank()
}