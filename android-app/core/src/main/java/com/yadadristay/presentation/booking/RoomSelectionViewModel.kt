package com.yadadristay.presentation.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.model.RoomCategoryDetail
import com.yadadristay.domain.model.AvailableRoom
import com.yadadristay.domain.usecase.lodge.GetRoomCategoryDetailUseCase
import com.yadadristay.domain.usecase.lodge.GetAvailableRoomsUseCase
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RoomSelectionViewModel @Inject constructor(
    private val getRoomCategoryDetailUseCase: GetRoomCategoryDetailUseCase,
    private val getAvailableRoomsUseCase: GetAvailableRoomsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(RoomSelectionUiState())
    val uiState: StateFlow<RoomSelectionUiState> = _uiState

    fun loadRoomCategory(lodgeId: String, roomCategoryId: String) {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val categoryResult = getRoomCategoryDetailUseCase(lodgeId, roomCategoryId)

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (categoryResult) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(roomCategory = toRoomCategoryUiModel(categoryResult.data))
                    loadAvailableRooms(lodgeId, roomCategoryId)
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = categoryResult.exception.message)
                }
            }
        }
    }

    private fun loadAvailableRooms(lodgeId: String, roomCategoryId: String) {
        val state = _uiState.value
        if (state.checkInDate == null || state.checkOutDate == null) return

        viewModelScope.launch {
            val result = getAvailableRoomsUseCase(
                lodgeId = lodgeId,
                roomCategoryId = roomCategoryId,
                checkIn = state.checkInDate!!,
                checkOut = state.checkOutDate!!
            )

            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        availableRooms = result.data.map { toRoomUiModel(it) }
                    )
                }
                is Result.Error -> {
                    // Handle error
                }
            }
        }
    }

    fun updateDates(checkIn: String, checkOut: String) {
        _uiState.value = _uiState.value.copy(checkInDate = checkIn, checkOutDate = checkOut)
        val state = _uiState.value
        if (state.roomCategory != null) {
            loadAvailableRooms("", state.roomCategory!!.id)
        }
    }

    fun toggleRoomSelection(room: RoomUiModel) {
        _uiState.value = _uiState.value.copy(
            selectedRooms = if (_uiState.value.selectedRooms.contains(room)) {
                _uiState.value.selectedRooms - room
            } else {
                _uiState.value.selectedRooms + room
            }
        )
    }

    private fun toRoomCategoryUiModel(category: RoomCategoryDetail): RoomCategoryUiModel = RoomCategoryUiModel(
        id = category.id,
        name = category.name,
        description = category.description ?: "",
        pricePerNight = category.basePrice.toInt(),
        originalPrice = null,
        discountPercent = 0,
        capacity = category.maxOccupancy,
        bedType = category.bedType,
        hasWifi = true,
        amenities = category.amenities,
        availableCount = category.availableRooms,
        images = category.images
    )

    private fun toRoomUiModel(room: AvailableRoom): RoomUiModel = RoomUiModel(
        id = room.id,
        number = room.number,
        floorDescription = room.floorDescription,
        isAvailable = room.isAvailable,
        features = room.features
    )
}

data class RoomSelectionUiState(
    val roomCategory: RoomCategoryUiModel? = null,
    val availableRooms: List<RoomUiModel> = emptyList(),
    val selectedRooms: List<RoomUiModel> = emptyList(),
    val checkInDate: String? = null,
    val checkOutDate: String? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

data class RoomCategoryUiModel(
    val id: String,
    val name: String,
    val description: String,
    val pricePerNight: Int,
    val originalPrice: Int? = null,
    val discountPercent: Int = 0,
    val capacity: Int,
    val bedType: String,
    val hasWifi: Boolean = true,
    val amenities: List<String> = emptyList(),
    val availableCount: Int,
    val images: List<String>
)

data class RoomUiModel(
    val id: String,
    val number: String,
    val floorDescription: String,
    val isAvailable: Boolean = true,
    val features: List<String> = emptyList()
)