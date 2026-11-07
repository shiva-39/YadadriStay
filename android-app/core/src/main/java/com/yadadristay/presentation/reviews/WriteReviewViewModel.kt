package com.yadadristay.presentation.reviews

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.BookingForReview
import com.yadadristay.domain.usecase.booking.GetBookingForReviewUseCase
import com.yadadristay.domain.usecase.lodge.SubmitReviewUseCase
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class WriteReviewViewModel @Inject constructor(
    private val getBookingForReviewUseCase: GetBookingForReviewUseCase,
    private val submitReviewUseCase: SubmitReviewUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(WriteReviewUiState())
    val uiState: StateFlow<WriteReviewUiState> = _uiState

    fun loadBooking(bookingId: String) {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = getBookingForReviewUseCase(bookingId)

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(booking = toBookingForReviewUiModel(result.data))
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun setOverallRating(rating: Int) {
        _uiState.value = _uiState.value.copy(overallRating = rating)
    }

    fun setCategoryRating(category: String, rating: Int) {
        _uiState.value = _uiState.value.copy(
            categoryRatings = _uiState.value.categoryRatings + (category to rating)
        )
    }

    fun setReviewText(text: String) {
        _uiState.value = _uiState.value.copy(reviewText = text)
    }

    fun addImage() {
        _uiState.value = _uiState.value.copy(
            images = _uiState.value.images + "placeholder_${_uiState.value.images.size + 1}"
        )
    }

    fun removeImage(imageUrl: String) {
        _uiState.value = _uiState.value.copy(
            images = _uiState.value.images.filter { it != imageUrl }
        )
    }

    fun submitReview() {
        val state = _uiState.value
        if (state.overallRating == 0 || state.reviewText.isBlank() || state.booking == null) return

        _uiState.value = _uiState.value.copy(isSubmitting = true)

        viewModelScope.launch {
            val result = submitReviewUseCase(
                bookingId = state.booking!!.id,
                overallRating = state.overallRating,
                categoryRatings = state.categoryRatings,
                comment = state.reviewText,
                images = state.images
            )

            _uiState.value = _uiState.value.copy(isSubmitting = false)

            when (result) {
                is Result.Success -> {
                    // Navigate back handled by caller
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    private fun toBookingForReviewUiModel(booking: BookingForReview): BookingForReviewUiModel = BookingForReviewUiModel(
        id = booking.id,
        lodgeName = booking.lodgeName,
        roomType = booking.roomType,
        checkInDate = booking.checkInDate,
        checkOutDate = booking.checkOutDate,
        bookingReference = booking.bookingReference
    )
}

data class WriteReviewUiState(
    val booking: BookingForReviewUiModel? = null,
    val overallRating: Int = 0,
    val categoryRatings: Map<String, Int> = emptyMap(),
    val reviewText: String = "",
    val images: List<String> = emptyList(),
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null
)

data class BookingForReviewUiModel(
    val id: String,
    val lodgeName: String,
    val roomType: String,
    val checkInDate: String,
    val checkOutDate: String,
    val bookingReference: String
)