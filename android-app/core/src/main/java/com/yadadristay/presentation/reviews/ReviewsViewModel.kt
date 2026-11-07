package com.yadadristay.presentation.reviews

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.Review
import com.yadadristay.domain.model.ReviewSummary
import com.yadadristay.domain.usecase.lodge.GetLodgeReviewsUseCase
import com.yadadristay.domain.usecase.lodge.GetReviewSummaryUseCase
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReviewsViewModel @Inject constructor(
    private val getLodgeReviewsUseCase: GetLodgeReviewsUseCase,
    private val getReviewSummaryUseCase: GetReviewSummaryUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReviewsUiState())
    val uiState: StateFlow<ReviewsUiState> = _uiState

    private var _lodgeId: String = ""
    private var _page = 0

    fun loadReviews(lodgeId: String) {
        _lodgeId = lodgeId
        _page = 0
        _uiState.value = _uiState.value.copy(isLoading = true, reviews = emptyList())

        viewModelScope.launch {
            val summaryResult = getReviewSummaryUseCase(lodgeId)
            val reviewsResult = getLodgeReviewsUseCase(lodgeId, page = 0, limit = 10)

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (summaryResult) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(lodgeSummary = toReviewSummaryUiModel(summaryResult.data))
                }
                is Result.Error -> {
                    // Handle error
                }
            }

            when (reviewsResult) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        reviews = reviewsResult.data.map { toReviewUiModel(it) },
                        hasMore = reviewsResult.data.size >= 10
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = reviewsResult.exception.message)
                }
            }
        }
    }

    fun loadMore() {
        if (_uiState.value.isLoadingMore || !_uiState.value.hasMore) return

        _uiState.value = _uiState.value.copy(isLoadingMore = true)
        _page++

        viewModelScope.launch {
            val result = getLodgeReviewsUseCase(_lodgeId, page = _page, limit = 10)

            _uiState.value = _uiState.value.copy(isLoadingMore = false)

            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        reviews = _uiState.value.reviews + result.data.map { toReviewUiModel(it) },
                        hasMore = result.data.size >= 10
                    )
                }
                is Result.Error -> {
                    _page--
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun setSortBy(sortBy: ReviewSortBy) {
        _uiState.value = _uiState.value.copy(sortBy = sortBy)
        loadReviews(_lodgeId)
    }

    fun setBookingIdForReview(bookingId: String) {
        _uiState.value = _uiState.value.copy(bookingIdForReview = bookingId)
    }

    private fun toReviewUiModel(review: Review): ReviewUiModel = ReviewUiModel(
        id = review.id,
        userName = review.customerName,
        userAvatar = "",
        overallRating = review.rating,
        categoryRatings = emptyMap(),
        comment = review.comment,
        images = review.images,
        date = review.createdAt,
        stayType = "",
        helpfulCount = 0,
        lodgeResponse = null
    )

    private fun toReviewSummaryUiModel(summary: ReviewSummary): ReviewSummaryUiModel = ReviewSummaryUiModel(
        overallRating = summary.overallRating,
        totalReviews = summary.totalReviews,
        ratingBreakdown = summary.ratingBreakdown,
        categoryRatings = summary.categoryRatings
    )
}

data class ReviewsUiState(
    val lodgeSummary: ReviewSummaryUiModel? = null,
    val reviews: List<ReviewUiModel> = emptyList(),
    val sortBy: ReviewSortBy = ReviewSortBy.NEWEST,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val hasMore: Boolean = false,
    val errorMessage: String? = null,
    val bookingIdForReview: String? = null
) {
    val canWriteReview: Boolean
        get() = bookingIdForReview != null
}

data class ReviewSummaryUiModel(
    val overallRating: Float,
    val totalReviews: Int,
    val ratingBreakdown: Map<Int, Float>,
    val categoryRatings: Map<String, Float>
)

data class ReviewUiModel(
    val id: String,
    val userName: String,
    val userAvatar: String,
    val overallRating: Int,
    val categoryRatings: Map<String, Float>,
    val comment: String,
    val images: List<String>,
    val date: String,
    val stayType: String,
    val helpfulCount: Int,
    val lodgeResponse: LodgeResponseUiModel?
)

data class LodgeResponseUiModel(
    val message: String,
    val date: String
)

enum class ReviewSortBy(val displayName: String) {
    NEWEST("Newest"),
    OLDEST("Oldest"),
    HIGHEST_RATING("Highest Rating"),
    LOWEST_RATING("Lowest Rating"),
    MOST_HELPFUL("Most Helpful")
}