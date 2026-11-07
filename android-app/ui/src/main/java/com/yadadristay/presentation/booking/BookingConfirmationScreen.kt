package com.yadadristay.presentation.booking

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.PaddingValues
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.*
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.presentation.booking.BookingConfirmationViewModel
import com.yadadristay.presentation.booking.BookingConfirmationUiModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.ui.text.style.TextAlign

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun BookingConfirmationScreen(
    bookingId: String,
    viewModel: BookingConfirmationViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LoadingOverlay(isLoading = uiState.isLoading && uiState.booking == null) {
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
                            text = str(LocalContext.current, Str.booking_confirmed_title),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface
                    )
                )
            }

            if (uiState.booking != null) {
                item {
                    BookingConfirmationContent(
                        booking = uiState.booking!!,
                        onViewDetailsClick = { onNavigate(NavigationRoute.BookingDetail(bookingId = bookingId)) },
                        onGoHomeClick = { onNavigate(NavigationRoute.Home) }
                    )
                }
            } else if (!uiState.isLoading) {
                item {
                    val errorMsg = uiState.errorMessage ?: str(LocalContext.current, Str.failed_to_load_booking_confirmation)
                    ErrorState(
                        message = errorMsg,
                        onRetry = { viewModel.loadBooking(bookingId) },
                        modifier = Modifier.fillMaxSize().padding(top = 100.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun BookingConfirmationContent(
    booking: BookingConfirmationUiModel,
    onViewDetailsClick: () -> Unit,
    onGoHomeClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    LazyColumn(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp)
            .padding(bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Success Animation/Icon
        item {
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Success icon with animation
                    Box(
                        modifier = Modifier
                            .size(120.dp)
                            .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(60.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Check,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.size(60.dp)
                        )
                    }

                    Text(
                        text = str(LocalContext.current, Str.booking_confirmed_title),
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        textAlign = TextAlign.Center
                    )

                    Text(
                        text = str(LocalContext.current, Str.booking_confirmed_message),
                        fontSize = 16.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }

        // Booking Reference
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = str(LocalContext.current, Str.booking_reference),
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                    )
                    Text(
                        text = booking.bookingReference,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = str(LocalContext.current, Str.save_this_reference),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                    )
                }
            }
        }

        // Booking Details
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = str(LocalContext.current, Str.booking_details),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    DetailRow(
                        icon = Icons.Filled.LocationOn,
                        label = str(LocalContext.current, 0x7F0F00A6), // lodge
                        value = booking.lodgeName
                    )
                    DetailRow(
                        icon = Icons.Filled.Home,
                        label = str(LocalContext.current, Str.select_room), // room_type
                        value = booking.roomType
                    )
                    DetailRow(
                        icon = Icons.Filled.CalendarMonth,
                        label = str(LocalContext.current, 0x7F0F0058),
                        value = "${booking.checkInDate} · ${booking.checkInTime}"
                    )
                    DetailRow(
                        icon = Icons.Filled.CalendarMonth,
                        label = str(LocalContext.current, 0x7F0F0059),
                        value = "${booking.checkOutDate} · ${booking.checkOutTime}"
                    )
                    DetailRow(
                        icon = Icons.Filled.Person,
                        label = str(LocalContext.current, Str.guests),
                        value = "${booking.numberOfGuests} ${str(LocalContext.current, Str.guests)} · ${booking.numberOfRooms} ${str(LocalContext.current, Str.rooms)}"
                    )
                    DetailRow(
                        icon = Icons.Filled.Email,
                        label = str(LocalContext.current, 0x7F0F01D2), // amount_paid
                        value = "₹${booking.amountPaid}",
                        valueColor = MaterialTheme.colorScheme.primary
                    )
                    DetailRow(
                        icon = Icons.Filled.Email,
                        label = str(LocalContext.current, Str.share_experience), // confirmation_sent_to
                        value = booking.confirmationEmail
                    )
                }
            }
        }

        // Next Steps
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = str(LocalContext.current, Str.next_steps),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    NextStepItem(
                        step = 1,
                        title = str(LocalContext.current, Str.receive_confirmation),
                        description = str(LocalContext.current, Str.confirmation_email_sms)
                    )
                    NextStepItem(
                        step = 2,
                        title = str(LocalContext.current, 0x7F0F0058),
                        description = str(LocalContext.current, Str.show_booking_reference)
                    )
                    NextStepItem(
                        step = 3,
                        title = str(LocalContext.current, Str.enjoy_stay),
                        description = str(LocalContext.current, Str.contact_host_if_needed)
                    )
                }
            }
        }

        // Action Buttons
        item {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                YadadriButton(
                    text = str(LocalContext.current, Str.view_booking_details),
                    onClick = onViewDetailsClick,
                    icon = Icons.Filled.Visibility,
                    modifier = Modifier.fillMaxWidth()
                )
                YadadriOutlinedButton(
                    text = str(LocalContext.current, Str.go_to_home),
                    onClick = onGoHomeClick,
                    icon = Icons.Filled.Home,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
fun DetailRow(
    icon: ImageVector,
    label: String,
    value: String,
    valueColor: Color = MaterialTheme.colorScheme.onSurface,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp).padding(end = 12.dp)
            )
            Text(
                text = label,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = valueColor
        )
    }
}

@Composable
fun NextStepItem(
    step: Int,
    title: String,
    description: String,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(14.dp)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "$step",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimary
            )
        }
        androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(12.dp))
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = description,
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}