package com.yadadristay.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.LodgeSummary
import com.yadadristay.domain.usecase.lodge.GetLodgesUseCase
import com.yadadristay.domain.usecase.lodge.GetCategoriesUseCase
import com.yadadristay.domain.usecase.lodge.SearchLodgesUseCase
import com.yadadristay.domain.usecase.lodge.ToggleFavoriteUseCase
import com.yadadristay.domain.util.Result
import com.yadadristay.presentation.common.CategoryUiModel
import com.yadadristay.presentation.common.LodgeUiModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getLodgesUseCase: GetLodgesUseCase,
    private val getCategoriesUseCase: GetCategoriesUseCase,
    private val searchLodgesUseCase: SearchLodgesUseCase,
    private val toggleFavoriteUseCase: ToggleFavoriteUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState

    init {
        loadInitialData()
    }

    private fun loadInitialData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            val lodgesResult = getLodgesUseCase()
            val categoriesResult = getCategoriesUseCase()

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                lodges = when (lodgesResult) {
                    is Result.Success -> lodgesResult.data.map { toLodgeUiModel(it) }
                    else -> emptyList()
                },
                categories = when (categoriesResult) {
                    is Result.Success -> categoriesResult.data.map { toCategoryUiModel(it) }
                    else -> emptyList()
                }
            )
        }
    }

    fun search() {
        val state = _uiState.value
        if (state.checkInDate == null || state.checkOutDate == null) return

        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = searchLodgesUseCase(
                checkIn = state.checkInDate!!,
                checkOut = state.checkOutDate!!,
                guests = state.guests,
                category = state.selectedCategory
            )
            _uiState.value = _uiState.value.copy(isLoading = false)
            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        lodges = result.data.map { toLodgeUiModel(it) }
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun selectCategory(categoryId: String?) {
        _uiState.value = _uiState.value.copy(selectedCategory = categoryId)
    }

    fun showDatePicker(isCheckIn: Boolean) {
        // TODO: Show date picker dialog
    }

    fun showGuestPicker() {
        // TODO: Show guest picker dialog
    }

    fun setCheckInDate(date: String) {
        _uiState.value = _uiState.value.copy(checkInDate = date)
    }

    fun setCheckOutDate(date: String) {
        _uiState.value = _uiState.value.copy(checkOutDate = date)
    }

    fun setGuests(count: Int) {
        _uiState.value = _uiState.value.copy(guests = count)
    }

    fun toggleFavorite(lodge: LodgeUiModel) {
        viewModelScope.launch {
            val result = toggleFavoriteUseCase(lodge.id)
            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        lodges = _uiState.value.lodges.map { l ->
                            if (l.id == lodge.id) l.copy(isFavorite = !l.isFavorite) else l
                        }
                    )
                }
                is Result.Error -> {
                    // Show error
                }
            }
        }
    }

    private fun toLodgeUiModel(summary: LodgeSummary): LodgeUiModel = LodgeUiModel(
        id = summary.id,
        name = summary.name,
        location = "${summary.city}, ${summary.state}",
        pricePerNight = summary.minPrice.toInt(),
        rating = summary.averageRating.toFloat(),
        amenities = summary.facilities,
        imageUrl = summary.primaryImageUrl ?: "",
        isFavorite = false
    )

    private fun toCategoryUiModel(category: String): CategoryUiModel = CategoryUiModel(
        id = category.lowercase().replace(" ", "-"),
        name = category,
        icon = "🏨"
    )
}

data class HomeUiState(
    val lodges: List<LodgeUiModel> = emptyList(),
    val categories: List<CategoryUiModel> = emptyList(),
    val selectedCategory: String? = null,
    val checkInDate: String? = null,
    val checkOutDate: String? = null,
    val guests: Int = 1,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)