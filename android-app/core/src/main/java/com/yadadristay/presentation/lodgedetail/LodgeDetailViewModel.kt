package com.yadadristay.presentation.lodgedetail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.LodgeDetail
import com.yadadristay.domain.model.RoomCategoryDetail
import com.yadadristay.domain.model.Review
import com.yadadristay.domain.usecase.lodge.GetLodgeDetailUseCase
import com.yadadristay.domain.usecase.lodge.GetRoomCategoriesUseCase
import com.yadadristay.domain.usecase.lodge.GetLodgeReviewsUseCase
import com.yadadristay.domain.usecase.lodge.ToggleFavoriteUseCase
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LodgeDetailViewModel @Inject constructor(
    private val getLodgeDetailUseCase: GetLodgeDetailUseCase,
    private val getRoomCategoriesUseCase: GetRoomCategoriesUseCase,
    private val getLodgeReviewsUseCase: GetLodgeReviewsUseCase,
    private val toggleFavoriteUseCase: ToggleFavoriteUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(LodgeDetailUiState())
    val uiState: StateFlow<LodgeDetailUiState> = _uiState

    fun loadLodge(lodgeId: String) {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val lodgeResult = getLodgeDetailUseCase(lodgeId)
            val categoriesResult = getRoomCategoriesUseCase(lodgeId)
            val reviewsResult = getLodgeReviewsUseCase(lodgeId, limit = 3)

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (lodgeResult) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(lodge = toLodgeDetailUiModel(lodgeResult.data))
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = lodgeResult.exception.message)
                }
            }

            when (categoriesResult) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        roomCategories = categoriesResult.data.map { toRoomCategoryUiModel(it) }
                    )
                }
                is Result.Error -> {
                    // Handle error
                }
            }

            when (reviewsResult) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        lodge = _uiState.value.lodge?.copy(recentReviews = reviewsResult.data.map { toReviewUiModel(it) })
                    )
                }
                is Result.Error -> {
                    // Handle error
                }
            }
        }
    }

    fun toggleFavorite() {
        val lodge = _uiState.value.lodge ?: return
        viewModelScope.launch {
            val result = toggleFavoriteUseCase(lodge.id)
            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        lodge = _uiState.value.lodge?.copy(isFavorite = !lodge.isFavorite)
                    )
                }
                is Result.Error -> {
                    // Handle error
                }
            }
        }
    }

    private fun toLodgeDetailUiModel(detail: LodgeDetail): LodgeDetailUiModel = LodgeDetailUiModel(
        id = detail.id,
        name = detail.name,
        location = "${detail.address.city}, ${detail.address.state}",
        address = detail.address.fullAddress,
        pricePerNight = detail.pricing.basePrice.toInt(),
        rating = detail.averageRating.toFloat(),
        reviewCount = detail.reviewCount,
        description = detail.description ?: "",
        amenities = detail.facilities,
        images = detail.images,
        phone = detail.contact.phone,
        email = detail.contact.email ?: "",
        website = detail.contact.alternatePhone ?: "",
        isFavorite = false,
        recentReviews = emptyList()
    )

    private fun toRoomCategoryUiModel(category: RoomCategoryDetail): RoomCategoryUiModel = RoomCategoryUiModel(
        id = category.id,
        name = category.name,
        description = category.description ?: "",
        pricePerNight = category.basePrice.toInt(),
        originalPrice = null,
        discountPercent = 0,
        capacity = category.maxOccupancy,
        amenities = category.amenities,
        availableCount = category.availableRooms,
        images = category.images
    )

    private fun toReviewUiModel(review: Review): ReviewUiModel = ReviewUiModel(
        id = review.id,
        userName = review.customerName,
        rating = review.rating,
        comment = review.comment,
        date = review.createdAt
    )
}

data class LodgeDetailUiState(
    val lodge: LodgeDetailUiModel? = null,
    val roomCategories: List<RoomCategoryUiModel> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

data class LodgeDetailUiModel(
    val id: String,
    val name: String,
    val location: String,
    val address: String,
    val pricePerNight: Int,
    val rating: Float,
    val reviewCount: Int,
    val description: String,
    val amenities: List<String>,
    val images: List<String>,
    val phone: String,
    val email: String,
    val website: String,
    val isFavorite: Boolean = false,
    val recentReviews: List<ReviewUiModel> = emptyList()
)

data class RoomCategoryUiModel(
    val id: String,
    val name: String,
    val description: String,
    val pricePerNight: Int,
    val originalPrice: Int? = null,
    val discountPercent: Int = 0,
    val capacity: Int,
    val amenities: List<String>,
    val availableCount: Int,
    val images: List<String>
)

data class ReviewUiModel(
    val id: String,
    val userName: String,
    val rating: Int,
    val comment: String,
    val date: String
)