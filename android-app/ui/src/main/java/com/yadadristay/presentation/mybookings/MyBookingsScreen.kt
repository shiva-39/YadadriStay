package com.yadadristay.presentation.mybookings

import com.yadadristay.presentation.components.Str

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
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.*
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.presentation.mybookings.BookingFilter
import com.yadadristay.presentation.mybookings.BookingUiModel
import com.yadadristay.presentation.mybookings.MyBookingsViewModel
import com.yadadristay.domain.model.BookingStatus
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.KingBed
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.RateReview
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.foundation.layout.PaddingValues

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun MyBookingsScreen(
    viewModel: MyBookingsViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LoadingOverlay(isLoading = uiState.isLoading && uiState.bookings.isEmpty()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(0.dp),
            contentPadding = PaddingValues(0.dp)
        ) {
            item {
                TopAppBar(
                    modifier = Modifier.fillMaxWidth(),
                    title = {
                        Text(
                            text = str(LocalContext.current, Str.my_bookings),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface
                    ),
                    actions = {
                        IconButton(onClick = { onNavigate(NavigationRoute.Profile) }) {
                            Icon(
                                imageVector = Icons.Filled.Person,
                                contentDescription = "Profile",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                )
            }

            // Filter Chips
            item {
                BookingFilterChips(
                    selectedFilter = uiState.selectedFilter,
                    onFilterClick = { viewModel.setFilter(it) }
                )
            }

            // Bookings List
            if (viewModel.filteredBookings.isEmpty() && !uiState.isLoading) {
                item {
                    EmptyState(
                        icon = Icons.Filled.BookmarkBorder,
                        title = str(LocalContext.current, Str.no_rooms_available),
                        message = str(LocalContext.current, Str.try_different_dates),
                        actionText = str(LocalContext.current, Str.search_lodges),
                        onActionClick = { onNavigate(NavigationRoute.Home) },
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
                        contentPadding = PaddingValues(bottom = 100.dp)
                    ) {
                        items(viewModel.filteredBookings) { booking ->
                            BookingCard(
                                booking = booking,
                                onClick = { onNavigate(NavigationRoute.BookingDetail(bookingId = booking.id)) },
                                onCancelClick = { viewModel.cancelBooking(booking.id) },
                                onReorderClick = { /* Rebook */ },
                                onReviewClick = { onNavigate(NavigationRoute.WriteReview(bookingId = booking.id)) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BookingFilterChips(
    selectedFilter: BookingFilter,
    onFilterClick: (BookingFilter) -> Unit,
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
            items(BookingFilter.values()) { filter ->
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
                    selected = (selectedFilter == filter)
                )
            }
        }
    }
}

@Composable
fun BookingCard(
    booking: BookingUiModel,
    onClick: () -> Unit,
    onCancelClick: (String) -> Unit,
    onReorderClick: () -> Unit,
    onReviewClick: () -> Unit,
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
            // Header with status
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
                        Text(
                            text = booking.lodgeName,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = booking.location,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    BookingStatusChip(status = booking.status)
                }
            }

            // Image placeholder
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier.fillMaxSize()
                        .background(MaterialTheme.colorScheme.surfaceContainerHighest)
                ) {
                    Text(text = "🏨", fontSize = 48.sp)
                }
            }

            // Details
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Dates
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    DateInfo(
                        label = str(LocalContext.current, 0x7F0F0058),
                        date = booking.checkInDate,
                        icon = Icons.Filled.CalendarMonth
                    )
                    DateInfo(
                        label = str(LocalContext.current, 0x7F0F0059),
                        date = booking.checkOutDate,
                        icon = Icons.Filled.CalendarMonth
                    )
                }

                // Room info
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    InfoItem(
                        icon = Icons.Filled.KingBed,
                        value = "${booking.rooms} ${str(LocalContext.current, Str.rooms)}",
                        modifier = Modifier.fillMaxWidth(0.33f)
                    )
                    InfoItem(
                        icon = Icons.Filled.Person,
                        value = "${booking.guests} ${str(LocalContext.current, Str.guests)}",
                        modifier = Modifier.fillMaxWidth(0.33f)
                    )
                    InfoItem(
                        icon = Icons.Filled.AttachMoney,
                        value = "₹${booking.totalAmount}",
                        modifier = Modifier.fillMaxWidth(0.34f)
                    )
                }

                DividerItem()

                // Actions based on status
                when (booking.status) {
                    BookingStatus.PENDING, BookingStatus.CONFIRMED -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            YadadriButton(
                                text = str(LocalContext.current, Str.view_booking_details),
                                onClick = onClick,
                                icon = Icons.Filled.Visibility,
                                modifier = Modifier.fillMaxWidth(0.5f)
                            )
                            YadadriOutlinedButton(
                                text = str(LocalContext.current, Str.delete_account),
                                onClick = { onCancelClick(booking.id) },
                                icon = Icons.Filled.Cancel,
                                modifier = Modifier.fillMaxWidth(0.5f),
                                colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                                    containerColor = MaterialTheme.colorScheme.errorContainer,
                                    contentColor = MaterialTheme.colorScheme.error
                                )
                            )
                        }
                    }
                    BookingStatus.COMPLETED -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            YadadriButton(
                                text = str(LocalContext.current, Str.view_booking_details),
                                onClick = onClick,
                                icon = Icons.Filled.Visibility,
                                modifier = Modifier.fillMaxWidth(0.33f)
                            )
                            YadadriOutlinedButton(
                                text = str(LocalContext.current, 0x7F0F003C),
                                onClick = onReorderClick,
                                icon = Icons.Filled.Replay,
                                modifier = Modifier.fillMaxWidth(0.33f)
                            )
                            YadadriOutlinedButton(
                                text = str(LocalContext.current, Str.sort_price_low_high),
                                onClick = onReviewClick,
                                icon = Icons.Filled.RateReview,
                                modifier = Modifier.fillMaxWidth(0.34f)
                            )
                        }
                    }
                    BookingStatus.CANCELLED -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            YadadriButton(
                                text = str(LocalContext.current, Str.view_booking_details),
                                onClick = onClick,
                                icon = Icons.Filled.Visibility,
                                modifier = Modifier.fillMaxWidth(0.5f)
                            )
                            YadadriOutlinedButton(
                                text = str(LocalContext.current, 0x7F0F003C),
                                onClick = onReorderClick,
                                icon = Icons.Filled.Replay,
                                modifier = Modifier.fillMaxWidth(0.5f)
                            )
                        }
                    }
                    BookingStatus.NO_SHOW -> {
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
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BookingStatusChip(status: BookingStatus) {
    val (bgColor, textColor) = when (status) {
        BookingStatus.PENDING -> MaterialTheme.colorScheme.primaryContainer to MaterialTheme.colorScheme.onPrimaryContainer
        BookingStatus.CONFIRMED -> MaterialTheme.colorScheme.tertiaryContainer to MaterialTheme.colorScheme.onTertiaryContainer
        BookingStatus.COMPLETED -> MaterialTheme.colorScheme.secondaryContainer to MaterialTheme.colorScheme.onSecondaryContainer
        BookingStatus.CANCELLED -> MaterialTheme.colorScheme.errorContainer to MaterialTheme.colorScheme.onErrorContainer
        BookingStatus.NO_SHOW -> MaterialTheme.colorScheme.errorContainer to MaterialTheme.colorScheme.onErrorContainer
    }

    Box(
        modifier = Modifier
            .padding(horizontal = 8.dp, vertical = 4.dp)
            .background(bgColor, RoundedCornerShape(20.dp))
            .padding(horizontal = 12.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = status.value.replace("_", " ").replace("no show", "No Show").capitalize(),
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = textColor
        )
    }
}

@Composable
fun DateInfo(
    label: String,
    date: String,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(16.dp).padding(end = 4.dp)
        )
        Column {
            Text(
                text = label,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = date,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}