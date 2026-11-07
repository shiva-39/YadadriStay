package com.yadadristay.presentation.transport

import com.yadadristay.presentation.components.Str
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.LoadingOverlay
import com.yadadristay.presentation.components.SectionHeader
import com.yadadristay.presentation.components.EmptyState
import com.yadadristay.presentation.components.YadadriButton
import com.yadadristay.presentation.components.YadadriOutlinedButton
import com.yadadristay.presentation.components.DividerItem
import com.yadadristay.presentation.components.LocationInfo
import com.yadadristay.presentation.components.InfoItem

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.domain.model.TransportRequestUiModel
import com.yadadristay.domain.model.TransportStatus
import com.yadadristay.domain.model.VehicleType
import com.yadadristay.presentation.transport.TransportFilter
import com.yadadristay.presentation.transport.TransportViewModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Straighten
import androidx.compose.material.icons.filled.AttachMoney
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun TransportScreen(
    viewModel: TransportViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val filteredRequests = viewModel.filteredRequests

    LoadingOverlay(isLoading = uiState.isLoading && uiState.requests.isEmpty()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(0.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
        ) {
            item {
                TopAppBar(
                    modifier = Modifier.fillMaxWidth(),
                    title = {
                        Text(
                            text = str(LocalContext.current, Str.profile_transport),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface
                    ),
                    actions = {
                        IconButton(onClick = { /* Book new transport */ }) {
                            Icon(
                                imageVector = Icons.Filled.Add,
                                contentDescription = "Book Transport",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                )
            }

            // Book New Transport Card
            item {
                BookTransportCard(onClick = { /* Navigate to booking */ })
            }

            // Filter Chips
            item {
                TransportFilterChips(
                    selectedFilter = uiState.selectedFilter,
                    onFilterClick = { viewModel.setFilter(it) }
                )
            }

            // Transport Requests
            item {
                SectionHeader(
                    title = str(LocalContext.current, Str.profile_transport),
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            if (filteredRequests.isEmpty() && !uiState.isLoading) {
                item {
                    EmptyState(
                        icon = Icons.Filled.DirectionsCar,
                        title = str(LocalContext.current, Str.no_rooms_available),
                        message = str(LocalContext.current, Str.try_different_dates),
                        actionText = str(LocalContext.current, Str.profile_book_transport),
                        onActionClick = { /* Navigate to booking */ },
                        modifier = Modifier.padding(top = 100.dp)
                    )
                }
            } else {
                item {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 100.dp)
                    ) {
                        items(filteredRequests) { request ->
                            TransportCard(
                                request = request,
                                onClick = { onNavigate(NavigationRoute.TransportDetail(requestId = request.id)) },
                                onCancelClick = { viewModel.cancelRequest(request.id) },
                                onTrackClick = { /* Track driver */ }
                            )
                        }
                    }
                }
            }
        }
    }
}


@Composable
fun BookTransportCard(
    onClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth().padding(16.dp)
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        ),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = str(LocalContext.current, Str.profile_book_transport),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        text = str(LocalContext.current, Str.profile_reviews),
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                    )
                }
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.DirectionsCar,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier.size(30.dp)
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TransportTypeChip(
                    icon = "🚗",
                    label = str(LocalContext.current, Str.cab),
                    selected = true
                )
                TransportTypeChip(
                    icon = "🚌",
                    label = str(LocalContext.current, Str.bus),
                    selected = false
                )
                TransportTypeChip(
                    icon = "🛺",
                    label = str(LocalContext.current, Str.auto),
                    selected = false
                )
                TransportTypeChip(
                    icon = "🏍️",
                    label = str(LocalContext.current, Str.bike),
                    selected = false
                )
            }
        }
    }
}

@Composable
fun TransportTypeChip(
    icon: String,
    label: String,
    selected: Boolean,
    modifier: Modifier = Modifier
) {
    FilterChip(
        onClick = { },
        modifier = modifier
            .fillMaxWidth()
            .height(40.dp),
        label = {
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = icon, fontSize = 16.sp)
                Text(text = label, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
        },
        selected = selected
    )
}

@Composable
fun TransportFilterChips(
    selectedFilter: TransportFilter,
    onFilterClick: (TransportFilter) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp)
    ) {
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(TransportFilter.values()) { filter ->
                val isSelected = selectedFilter == filter
                FilterChip(
                    onClick = { onFilterClick(filter) },
                    modifier = Modifier.height(40.dp),
                    label = {
                        Text(
                            text = filter.displayName,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    },
                    selected = isSelected
                )
            }
        }
    }
}

@Composable
fun TransportCard(
    request: TransportRequestUiModel,
    onClick: () -> Unit,
    onCancelClick: (String) -> Unit,
    onTrackClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        onClick = onClick
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            // Header with status and vehicle type
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                contentAlignment = Alignment.TopEnd
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = request.vehicleType.icon,
                                fontSize = 20.sp
                            )
                            Text(
                                text = request.vehicleType.displayName,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        Text(
                            text = request.route,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    TransportStatusChip(status = request.status)
                }
            }

            // Details
            Column(
                modifier = Modifier
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Pickup/Dropoff
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    LocationInfo(
                        label = str(LocalContext.current, Str.pickup),
                        location = request.pickupLocation,
                        time = request.pickupTime,
                        icon = Icons.Filled.LocationOn,
                        color = MaterialTheme.colorScheme.primary
                    )
                    LocationInfo(
                        label = str(LocalContext.current, Str.dropoff),
                        location = request.dropoffLocation,
                        time = request.dropoffTime,
                        icon = Icons.Filled.LocationOn,
                        color = MaterialTheme.colorScheme.error
                    )
                }

                DividerItem()

                // Trip info
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    InfoItem(
                        icon = Icons.Filled.Schedule,
                        value = request.duration
                    )
                    InfoItem(
                        icon = Icons.Filled.Straighten,
                        value = request.distance
                    )
                    InfoItem(
                        icon = Icons.Filled.AttachMoney,
                        value = "₹${request.fare}"
                    )
                }

                DividerItem()

                // Actions based on status
                when (request.status) {
                    TransportStatus.PENDING, TransportStatus.CONFIRMED -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            YadadriButton(
                                text = str(LocalContext.current, Str.track_driver),
                                onClick = onTrackClick,
                                icon = Icons.Filled.GpsFixed,
                                modifier = Modifier.fillMaxWidth()
                            )
                            YadadriOutlinedButton(
                                text = str(LocalContext.current, Str.cancel_ride),
                                onClick = { onCancelClick(request.id) },
                                icon = Icons.Filled.Cancel,
                                modifier = Modifier.fillMaxWidth(),
                                colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                                    containerColor = MaterialTheme.colorScheme.errorContainer,
                                    contentColor = MaterialTheme.colorScheme.error
                                )
                            )
                        }
                    }
                    TransportStatus.IN_PROGRESS -> {
                        YadadriButton(
                            text = str(LocalContext.current, Str.track_driver),
                            onClick = onTrackClick,
                            icon = Icons.Filled.GpsFixed,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    TransportStatus.COMPLETED -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            YadadriButton(
                                text = str(LocalContext.current, Str.view_receipt),
                                onClick = onClick,
                                icon = Icons.Filled.Receipt,
                                modifier = Modifier.fillMaxWidth()
                            )
                            YadadriOutlinedButton(
                                text = str(LocalContext.current, Str.view_receipt),
                                onClick = { /* Book same route */ },
                                icon = Icons.Filled.Refresh,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                    TransportStatus.CANCELLED -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            YadadriButton(
                                text = str(LocalContext.current, Str.view_booking_details),
                                onClick = onClick,
                                icon = Icons.Filled.Visibility,
                                modifier = Modifier.fillMaxWidth()
                            )
                            YadadriOutlinedButton(
                                text = str(LocalContext.current, Str.view_receipt),
                                onClick = { /* Book same route */ },
                                icon = Icons.Filled.Refresh,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TransportStatusChip(status: TransportStatus) {
    val (bgColor, textColor) = when (status) {
        TransportStatus.PENDING -> MaterialTheme.colorScheme.tertiaryContainer to MaterialTheme.colorScheme.onTertiaryContainer
        TransportStatus.CONFIRMED -> MaterialTheme.colorScheme.primaryContainer to MaterialTheme.colorScheme.onPrimaryContainer
        TransportStatus.IN_PROGRESS -> MaterialTheme.colorScheme.secondaryContainer to MaterialTheme.colorScheme.onSecondaryContainer
        TransportStatus.COMPLETED -> MaterialTheme.colorScheme.tertiaryContainer to MaterialTheme.colorScheme.onTertiaryContainer
        TransportStatus.CANCELLED -> MaterialTheme.colorScheme.errorContainer to MaterialTheme.colorScheme.onErrorContainer
    }

    Box(
        modifier = Modifier
            .padding(horizontal = 8.dp, vertical = 4.dp)
            .background(bgColor, RoundedCornerShape(20.dp))
            .padding(horizontal = 12.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = status.displayName,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = textColor
        )
    }
}