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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.*
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.presentation.booking.BookingViewModel
import com.yadadristay.presentation.booking.BookingSummaryUiModel
import com.yadadristay.presentation.booking.GuestDetailUiModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Note
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Star
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.unit.Dp

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun BookingScreen(
    lodgeId: String,
    roomCategoryId: String,
    checkIn: String,
    checkOut: String,
    guests: Int,
    rooms: Int,
    viewModel: BookingViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    // Initialize ViewModel with booking parameters
    androidx.compose.runtime.LaunchedEffect(lodgeId, roomCategoryId, checkIn, checkOut, guests, rooms) {
        viewModel.setBookingParams(lodgeId, roomCategoryId, checkIn, checkOut, guests, rooms)
        viewModel.loadBookingSummary()
    }
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LoadingOverlay(isLoading = uiState.isLoading && uiState.bookingSummary == null) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(0.dp),
            contentPadding = PaddingValues(0.dp)
        ) {
            item {
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
                        Text(
                            text = str(LocalContext.current, Str.booking_details),
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

            if (uiState.bookingSummary != null) {
                item {
                    BookingContent(
                        summary = uiState.bookingSummary!!,
                        guestDetails = uiState.guestDetails,
                        specialRequests = uiState.specialRequests,
                        termsAccepted = uiState.termsAccepted,
                        onGuestDetailsChange = { viewModel.updateGuestDetails(it) },
                        onSpecialRequestsChange = { viewModel.updateSpecialRequests(it) },
                        onAddGuest = { viewModel.addGuest() },
                        onRemoveGuest = { viewModel.removeGuest(it) },
                        onTermsChange = { viewModel.setTermsAccepted(it) },
                        onContinueClick = { onNavigate(NavigationRoute.Payment(bookingId = uiState.bookingId!!)) }
                    )
                }
            } else if (!uiState.isLoading) {
                item {
                    val errorMsg = uiState.errorMessage ?: str(LocalContext.current, Str.failed_to_load_booking_details)
                    ErrorState(
                        message = errorMsg,
                        onRetry = { viewModel.loadBookingSummary() },
                        modifier = Modifier.fillMaxSize().padding(top = 100.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun BookingContent(
    summary: BookingSummaryUiModel,
    guestDetails: List<GuestDetailUiModel>,
    specialRequests: String,
    termsAccepted: Boolean,
    onGuestDetailsChange: (List<GuestDetailUiModel>) -> Unit,
    onSpecialRequestsChange: (String) -> Unit,
    onAddGuest: () -> Unit,
    onRemoveGuest: (Int) -> Unit,
    onTermsChange: (Boolean) -> Unit,
    onContinueClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    var specialRequestsText by remember { mutableStateOf(specialRequests) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 100.dp)
    ) {
        LazyColumn(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Booking Summary Card
            item {
                BookingSummaryCard(summary = summary)
            }

            item {
                DividerItem()
            }

            // Guest Details
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = str(LocalContext.current, Str.guest_details),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (guestDetails.size < summary.numberOfRooms * summary.capacityPerRoom) {
                        TextButton(onClick = onAddGuest) {
                            Text(
                                text = str(LocalContext.current, Str.add_guest),
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }

            items(guestDetails) { guest ->
                GuestDetailCard(
                    guest = guest,
                    index = guestDetails.indexOf(guest),
                    onChange = { updatedGuest ->
                        val newList = guestDetails.toMutableList()
                        newList[guestDetails.indexOf(guest)] = updatedGuest
                        onGuestDetailsChange(newList)
                    },
                    onRemove = { onRemoveGuest(guestDetails.indexOf(guest)) },
                    isPrimary = guestDetails.indexOf(guest) == 0,
                    canRemove = guestDetails.size > 1
                )
            }

            item {
                DividerItem()
            }

            // Special Requests
            item {
                Text(
                    text = str(LocalContext.current, Str.special_requests),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            item {
                YadadriTextField(
                    label = str(LocalContext.current, Str.special_requests),
                    value = specialRequestsText,
                    onValueChange = { specialRequestsText = it; onSpecialRequestsChange(it) },
                    placeholder = str(LocalContext.current, Str.special_requests_hint),
                    leadingIcon = Icons.Filled.Note,
                    singleLine = false,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            item {
                DividerItem()
            }

            // Terms & Conditions
            item {
                TermsCheckbox(
                    isChecked = termsAccepted,
                    onCheckedChange = onTermsChange
                )
            }
        }

        // Bottom Confirm Bar
        BottomConfirmBar(
            totalAmount = summary.totalAmount,
            onClick = onContinueClick,
            enabled = termsAccepted && guestDetails.all { it.isValid }
        )
    }
}

@Composable
fun BookingSummaryCard(
    summary: BookingSummaryUiModel,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
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
                        text = summary.lodgeName,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = summary.roomCategoryName,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.LocationOn,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(14.dp).padding(end = 4.dp)
                        )
                        Text(
                            text = summary.lodgeLocation,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                // Room image placeholder
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "🛏️", fontSize = 32.sp)
                }
            }

            DividerItem()

            // Dates and Guests
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SummaryItem(
                    icon = Icons.Filled.CalendarMonth,
                    label = str(LocalContext.current, 0x7F0F0058),
                    value = summary.checkInDate,
                    modifier = Modifier.fillMaxWidth(0.25f)
                )
                SummaryItem(
                    icon = Icons.Filled.CalendarMonth,
                    label = str(LocalContext.current, 0x7F0F0059),
                    value = summary.checkOutDate,
                    modifier = Modifier.fillMaxWidth(0.25f)
                )
                SummaryItem(
                    icon = Icons.Filled.Person,
                    label = str(LocalContext.current, Str.guests),
                    value = "${summary.numberOfGuests} ${str(LocalContext.current, Str.guests)}",
                    modifier = Modifier.fillMaxWidth(0.25f)
                )
                SummaryItem(
                    icon = Icons.Filled.Home,
                    label = str(LocalContext.current, Str.rooms),
                    value = "${summary.numberOfRooms} ${str(LocalContext.current, Str.rooms)}",
                    modifier = Modifier.fillMaxWidth(0.25f)
                )
            }

            DividerItem()

            // Price Breakdown
            Text(
                text = str(LocalContext.current, Str.price_breakdown),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            PriceRow(
                label = str(LocalContext.current, Str.starting_from), // room_charges
                value = "₹${summary.roomCharges}",
                isTotal = false
            )
            PriceRow(
                label = str(LocalContext.current, Str.taxes_fees),
                value = "₹${summary.taxesAndFees}",
                isTotal = false
            )
            if (summary.discount > 0) {
                PriceRow(
                    label = str(LocalContext.current, Str.discount),
                    value = "-₹${summary.discount}",
                    isTotal = false,
                    valueColor = MaterialTheme.colorScheme.error
                )
            }
            DividerItem()
            PriceRow(
                label = str(LocalContext.current, Str.total_amount),
                value = "₹${summary.totalAmount}",
                isTotal = true
            )
        }
    }
}

@Composable
fun SummaryItem(
    icon: ImageVector,
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .padding(8.dp)
            .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(8.dp)),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp)
        )
        Text(
            text = label,
            fontSize = 11.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
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
fun PriceRow(
    label: String,
    value: String,
    isTotal: Boolean = false,
    valueColor: Color = MaterialTheme.colorScheme.onSurface,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = if (isTotal) 16.sp else 14.sp,
            fontWeight = if (isTotal) FontWeight.Bold else FontWeight.Normal,
            color = if (isTotal) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            fontSize = if (isTotal) 18.sp else 14.sp,
            fontWeight = if (isTotal) FontWeight.Bold else FontWeight.Medium,
            color = if (isTotal) MaterialTheme.colorScheme.primary else valueColor
        )
    }
}

@Composable
fun GuestDetailCard(
    guest: GuestDetailUiModel,
    index: Int,
    onChange: (GuestDetailUiModel) -> Unit,
    onRemove: () -> Unit,
    isPrimary: Boolean,
    canRemove: Boolean,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (isPrimary) {
                        Box(
                            modifier = Modifier.padding(end = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = str(LocalContext.current, Str.primary_guest),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                    Text(
                        text = str(LocalContext.current, Str.guests_count), // guest_number
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                if (canRemove) {
                    IconButton(onClick = onRemove) {
                        Icon(
                            imageVector = Icons.Filled.Close,
                            contentDescription = "Remove guest",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                YadadriTextField(
                    label = str(LocalContext.current, Str.full_name),
                    value = guest.fullName,
                    onValueChange = { onChange(guest.copy(fullName = it)) },
                    placeholder = str(LocalContext.current, Str.enter_full_name),
                    leadingIcon = Icons.Filled.Person,
                    isError = guest.fullNameError != null,
                    errorText = guest.fullNameError
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    YadadriTextField(
                        label = str(LocalContext.current, Str.email),
                        value = guest.email,
                        onValueChange = { onChange(guest.copy(email = it)) },
                        placeholder = str(LocalContext.current, Str.enter_email),
                        leadingIcon = Icons.Filled.Email,
                        keyboardOptions = KeyboardOptions.Default.copy(
                            keyboardType = KeyboardType.Email
                        ),
                        isError = guest.emailError != null,
                        errorText = guest.emailError,
                        modifier = Modifier.fillMaxWidth(0.5f)
                    )
                    YadadriTextField(
                        label = str(LocalContext.current, Str.phone_or_email), // phone
                        value = guest.phone,
                        onValueChange = { onChange(guest.copy(phone = it)) },
                        placeholder = str(LocalContext.current, Str.enter_phone),
                        leadingIcon = Icons.Filled.Phone,
                        keyboardOptions = KeyboardOptions.Default.copy(
                            keyboardType = KeyboardType.Phone
                        ),
                        isError = guest.phoneError != null,
                        errorText = guest.phoneError,
                        modifier = Modifier.fillMaxWidth(0.5f)
                    )
                }

                YadadriTextField(
                    label = str(LocalContext.current, Str.enter_id_proof), // id_proof
                    value = guest.idProof,
                    onValueChange = { onChange(guest.copy(idProof = it)) },
                    placeholder = str(LocalContext.current, Str.enter_id_proof),
                    leadingIcon = Icons.Filled.Person,
                    isError = guest.idProofError != null,
                    errorText = guest.idProofError
                )
            }
        }
    }
}

@Composable
fun TermsCheckbox(
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Checkbox(
            checked = isChecked,
            onCheckedChange = onCheckedChange,
            colors = androidx.compose.material3.CheckboxDefaults.colors(
                checkedColor = MaterialTheme.colorScheme.primary,
                uncheckedColor = MaterialTheme.colorScheme.onSurfaceVariant
            )
        )
        androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = str(LocalContext.current, Str.terms_agreement),
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
fun BottomConfirmBar(
    totalAmount: Int,
    onClick: () -> Unit,
    enabled: Boolean,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
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
                Text(
                    text = str(LocalContext.current, Str.pay_now),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "₹$totalAmount",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            YadadriButton(
                text = str(LocalContext.current, Str.proceed_to_payment),
                onClick = onClick,
                enabled = enabled,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}