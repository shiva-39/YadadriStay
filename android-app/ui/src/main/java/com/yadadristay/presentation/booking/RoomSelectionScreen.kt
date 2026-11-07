package com.yadadristay.presentation.booking

import com.yadadristay.presentation.components.Str

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.PaddingValues
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.*
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.presentation.booking.RoomSelectionViewModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KingBed
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.Home
import com.yadadristay.presentation.booking.RoomCategoryUiModel
import com.yadadristay.presentation.booking.RoomUiModel

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun RoomSelectionScreen(
    lodgeId: String,
    roomCategoryId: String,
    viewModel: RoomSelectionViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LoadingOverlay(isLoading = uiState.isLoading && uiState.roomCategory == null) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            TopAppBar(
                modifier = Modifier.fillMaxWidth(),
                navigationIcon = {
                    IconButton(onClick = { /* Navigate back */ }) {
                        Icon(
                            imageVector = Icons.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                },
                title = {
                    val titleText = uiState.roomCategory?.name ?: str(LocalContext.current, Str.select_room)
                    Text(
                        text = titleText,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )

            if (uiState.roomCategory != null) {
                RoomSelectionContent(
                    roomCategory = uiState.roomCategory!!,
                    availableRooms = uiState.availableRooms,
                    selectedRooms = uiState.selectedRooms,
                    checkInDate = uiState.checkInDate,
                    checkOutDate = uiState.checkOutDate,
                    onRoomToggle = { viewModel.toggleRoomSelection(it) },
                    onDateChange = { checkIn, checkOut ->
                        viewModel.updateDates(checkIn, checkOut)
                    },
                    onContinueClick = { onNavigate(NavigationRoute.Booking) }
                )
            } else if (!uiState.isLoading) {
                ErrorState(
                    message = uiState.errorMessage ?: str(LocalContext.current, Str.failed_to_load_rooms),
                    onRetry = { viewModel.loadRoomCategory(lodgeId, roomCategoryId) },
                    modifier = Modifier.fillMaxSize().padding(top = 100.dp)
                )
            }
        }
    }
}

@Composable
fun RoomSelectionContent(
    roomCategory: RoomCategoryUiModel,
    availableRooms: List<RoomUiModel>,
    selectedRooms: List<RoomUiModel>,
    checkInDate: String?,
    checkOutDate: String?,
    onRoomToggle: (RoomUiModel) -> Unit,
    onDateChange: (String, String) -> Unit,
    onContinueClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    LazyColumn(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Room Category Info
        item {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Category header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(
                        horizontalAlignment = Alignment.Start,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = roomCategory.name,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = roomCategory.description,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 2,
                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                        )
                    }
                    Column(
                        horizontalAlignment = Alignment.End,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "₹${roomCategory.pricePerNight}/night",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        if (roomCategory.originalPrice != null && roomCategory.originalPrice!! > roomCategory.pricePerNight) {
                            Text(
                                text = "₹${roomCategory.originalPrice}",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textDecoration = TextDecoration.LineThrough
                            )
                            Text(
                                text = "${roomCategory.discountPercent}% OFF",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }

                DividerItem()

                // Dates selector
                DateRangeSelector(
                    checkInDate = checkInDate,
                    checkOutDate = checkOutDate,
                    onCheckInClick = { /* Show date picker */ },
                    onCheckOutClick = { /* Show date picker */ }
                )

                DividerItem()

                // Capacity & Amenities
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    InfoChip(
                        icon = Icons.Filled.Person,
                        label = str(LocalContext.current, Str.capacity),
                        value = "${roomCategory.capacity} ${str(LocalContext.current, Str.guests)}",
                        modifier = Modifier.fillMaxWidth(0.33f)
                    )
                    InfoChip(
                        icon = Icons.Filled.KingBed,
                        label = str(LocalContext.current, Str.bed_type),
                        value = roomCategory.bedType,
                        modifier = Modifier.fillMaxWidth(0.33f)
                    )
                    InfoChip(
                        icon = Icons.Filled.Wifi,
                        label = str(LocalContext.current, Str.write_review), // wifi
                        value = if (roomCategory.hasWifi) str(LocalContext.current, Str.included) else str(LocalContext.current, Str.not_available),
                        modifier = Modifier.fillMaxWidth(0.34f)
                    )
                }

                DividerItem()

                // Available Rooms
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = str(LocalContext.current, Str.no_photos_added), // available_rooms
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                if (availableRooms.isEmpty()) {
                    EmptyState(
                        icon = Icons.Filled.Home,
                        title = str(LocalContext.current, Str.no_rooms_available),
                        message = str(LocalContext.current, Str.try_different_dates),
                        modifier = Modifier.padding(top = 50.dp)
                    )
                } else {
                    availableRooms.forEach { room ->
                        RoomSelectionCard(
                            room = room,
                            isSelected = selectedRooms.contains(room),
                            onToggle = { onRoomToggle(room) }
                        )
                    }
                }
            }
        }

        // Bottom Summary Bar
        item {
            BottomSummaryBar(
                selectedCount = selectedRooms.size,
                pricePerNight = roomCategory.pricePerNight,
                nights = calculateNights(checkInDate, checkOutDate),
                onClick = {
                    if (selectedRooms.isNotEmpty()) onContinueClick()
                },
                enabled = selectedRooms.isNotEmpty()
            )
        }
    }
}

@Composable
fun DateRangeSelector(
    checkInDate: String?,
    checkOutDate: String?,
    onCheckInClick: () -> Unit,
    onCheckOutClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        RoomDateField(
            label = str(LocalContext.current, 0x7F0F0058),
            value = checkInDate ?: str(LocalContext.current, 0x7F0F0058),
            onClick = onCheckInClick,
            icon = Icons.Filled.CalendarMonth,
            modifier = Modifier.fillMaxWidth(0.5f)
        )
        RoomDateField(
            label = str(LocalContext.current, 0x7F0F0059),
            value = checkOutDate ?: str(LocalContext.current, 0x7F0F0059),
            onClick = onCheckOutClick,
            icon = Icons.Filled.CalendarMonth,
            modifier = Modifier.fillMaxWidth(0.5f)
        )
    }
}

@Composable
fun InfoChip(
    icon: ImageVector,
    label: String,
    value: String,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Column(
        modifier = modifier
            .padding(12.dp)
            .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(12.dp)),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp)
        )
        Text(
            text = label,
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun RoomSelectionCard(
    room: RoomUiModel,
    isSelected: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isSelected) 4.dp else 2.dp
        ),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected)
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
            else
                MaterialTheme.colorScheme.surface
        ),
        onClick = onToggle
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Room number
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .background(
                        if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceContainerHighest,
                        RoundedCornerShape(8.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = room.number,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                )
            }

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(16.dp))

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = str(LocalContext.current, Str.rating), // room_number
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (!room.isAvailable) {
                        Text(
                            text = str(LocalContext.current, Str.not_available),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
                Text(
                    text = room.floorDescription,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    room.features.take(3).forEach { feature ->
                        // Use a simple Box instead of Chip
                        Box(
                            modifier = Modifier
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                                .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(16.dp))
                        ) {
                            Text(
                                text = feature,
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }

            // Selection checkbox
            Checkbox(
                checked = isSelected,
                onCheckedChange = { _ -> onToggle() },
                colors = androidx.compose.material3.CheckboxDefaults.colors(
                    checkedColor = MaterialTheme.colorScheme.primary,
                    uncheckedColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            )
        }
    }
}

@Composable
fun BottomSummaryBar(
    selectedCount: Int,
    pricePerNight: Int,
    nights: Int,
    onClick: () -> Unit,
    enabled: Boolean,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    val totalPrice = pricePerNight * nights * selectedCount

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = str(LocalContext.current, Str.receive_booking_updates), // selected_rooms
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${nights} ${str(LocalContext.current, Str.nights)} · $selectedCount ${str(LocalContext.current, Str.rooms)}",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                Column(
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = str(LocalContext.current, Str.total_price),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "₹$totalPrice",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            YadadriButton(
                text = str(LocalContext.current, Str.continue_to_booking),
                onClick = onClick,
                enabled = enabled,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
fun RoomDateField(
    label: String,
    value: String,
    onClick: () -> Unit,
    icon: ImageVector,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Text(
        text = label,
        fontSize = 12.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = modifier.padding(start = 4.dp, bottom = 4.dp)
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp)
            .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp).padding(end = 8.dp)
                )
                Text(
                    text = value,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            Icon(
                imageVector = Icons.Filled.KeyboardArrowDown,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

fun calculateNights(checkIn: String?, checkOut: String?): Int {
    // Simplified - return 1 for now
    return 1
}