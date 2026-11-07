package com.yadadristay.presentation.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.LodgeSummary
import com.yadadristay.domain.usecase.lodge.SearchLodgesUseCase
import com.yadadristay.domain.usecase.lodge.ToggleFavoriteUseCase
import com.yadadristay.domain.util.Result
import com.yadadristay.presentation.common.LodgeUiModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchLodgesUseCase: SearchLodgesUseCase,
    private val toggleFavoriteUseCase: ToggleFavoriteUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState

    init {
        search()
    }

    fun search() {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val filters = _uiState.value.filters
            // Use default dates if not set
            val checkIn = filters.checkInDate ?: "2025-01-01"
            val checkOut = filters.checkOutDate ?: "2025-01-02"
            val result = searchLodgesUseCase(
                checkIn = checkIn,
                checkOut = checkOut,
                guests = filters.guests,
                minPrice = if (filters.minPrice > 0) filters.minPrice.toDouble() else 0.0,
                maxPrice = if (filters.maxPrice < 10000) filters.maxPrice.toDouble() else 10000.0,
                minRating = if (filters.minRating > 0) filters.minRating.toDouble() else 0.0,
                amenities = filters.selectedAmenities.toList(),
                propertyTypes = filters.selectedPropertyTypes.toList()
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

    fun updateFilters(filters: SearchFiltersUiState) {
        _uiState.value = _uiState.value.copy(filters = filters)
    }

    fun clearFilters() {
        _uiState.value = _uiState.value.copy(
            filters = SearchFiltersUiState(
                checkInDate = _uiState.value.filters.checkInDate,
                checkOutDate = _uiState.value.filters.checkOutDate,
                guests = _uiState.value.filters.guests
            )
        )
    }

    fun applyFilters() {
        search()
    }

    fun setCheckInDate(date: String) {
        _uiState.value = _uiState.value.copy(
            filters = _uiState.value.filters.copy(checkInDate = date)
        )
    }

    fun setCheckOutDate(date: String) {
        _uiState.value = _uiState.value.copy(
            filters = _uiState.value.filters.copy(checkOutDate = date)
        )
    }

    fun setGuests(count: Int) {
        _uiState.value = _uiState.value.copy(
            filters = _uiState.value.filters.copy(guests = count)
        )
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
                    // Handle error
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
}

data class SearchUiState(
    val lodges: List<LodgeUiModel> = emptyList(),
    val filters: SearchFiltersUiState = SearchFiltersUiState(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

data class SearchFiltersUiState(
    val checkInDate: String? = null,
    val checkOutDate: String? = null,
    val guests: Int = 1,
    val minPrice: Int = 0,
    val maxPrice: Int = 10000,
    val minRating: Float = 0f,
    val selectedAmenities: Set<String> = emptySet(),
    val selectedPropertyTypes: Set<String> = emptySet(),
    val availableAmenities: List<String> = listOf("WiFi", "Parking", "Pool", "AC", "Restaurant", "Spa", "Gym", "Breakfast"),
    val availablePropertyTypes: List<String> = listOf("Hotel", "Resort", "Homestay", "Guest House", "Dharamshala")
) {
    val hasActiveFilters: Boolean
        get() = minPrice > 0 || maxPrice < 10000 || minRating > 0 ||
                selectedAmenities.isNotEmpty() || selectedPropertyTypes.isNotEmpty()
}