package com.yadadristay.presentation.booking

import com.yadadristay.presentation.components.Str

import androidx.compose.foundation.background
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.border
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
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.PaddingValues
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.*
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.presentation.booking.PaymentViewModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Security
import com.yadadristay.presentation.booking.PaymentMethod
import com.yadadristay.presentation.booking.PaymentOptionsUiModel
import com.yadadristay.presentation.booking.UpiAppUiModel

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun PaymentScreen(
    bookingId: String,
    viewModel: PaymentViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LoadingOverlay(isLoading = uiState.isLoading && uiState.paymentOptions == null) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(16.dp)
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
                            text = str(LocalContext.current, Str.payment),
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

            if (uiState.paymentOptions != null) {
                item {
                    PaymentContent(
                        paymentOptions = uiState.paymentOptions!!,
                        selectedMethod = uiState.selectedPaymentMethod,
                        upiQRCode = uiState.upiQRCode,
                        isProcessing = uiState.isProcessing,
                        onMethodSelect = { viewModel.selectPaymentMethod(it) },
                        onPayClick = { viewModel.initiatePayment() },
                        onPaymentComplete = { onNavigate(NavigationRoute.BookingConfirmation(bookingId = bookingId)) }
                    )
                }
            } else if (!uiState.isLoading) {
                item {
                    ErrorState(
                        message = uiState.errorMessage ?: str(LocalContext.current, Str.failed_to_load_payment),
                        onRetry = { viewModel.loadPaymentOptions(bookingId) },
                        modifier = Modifier.fillMaxSize().padding(top = 100.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun PaymentContent(
    paymentOptions: PaymentOptionsUiModel,
    selectedMethod: PaymentMethod,
    upiQRCode: String?,
    isProcessing: Boolean,
    onMethodSelect: (PaymentMethod) -> Unit,
    onPayClick: () -> Unit,
    onPaymentComplete: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Amount Summary
        AmountSummaryCard(amount = paymentOptions.totalAmount)

        DividerItem()

        // Payment Methods
        Text(
            text = str(LocalContext.current, Str.select_payment_method),
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            PaymentMethodOption(
                method = PaymentMethod.UPI,
                title = str(LocalContext.current, Str.upi_payment),
                subtitle = str(LocalContext.current, Str.pay_via_upi_apps),
                icon = "📱",
                isSelected = selectedMethod == PaymentMethod.UPI,
                onClick = { onMethodSelect(PaymentMethod.UPI) }
            )

            PaymentMethodOption(
                method = PaymentMethod.CARD,
                title = str(LocalContext.current, Str.card_payment),
                subtitle = str(LocalContext.current, Str.credit_debit_card),
                icon = "💳",
                isSelected = selectedMethod == PaymentMethod.CARD,
                onClick = { onMethodSelect(PaymentMethod.CARD) }
            )

            PaymentMethodOption(
                method = PaymentMethod.NET_BANKING,
                title = str(LocalContext.current, Str.net_banking),
                subtitle = str(LocalContext.current, Str.direct_bank_transfer),
                icon = "🏦",
                isSelected = selectedMethod == PaymentMethod.NET_BANKING,
                onClick = { onMethodSelect(PaymentMethod.NET_BANKING) }
            )

            PaymentMethodOption(
                method = PaymentMethod.WALLET,
                title = str(LocalContext.current, Str.wallet),
                subtitle = str(LocalContext.current, Str.paytm_phonepe_gpay),
                icon = "👛",
                isSelected = selectedMethod == PaymentMethod.WALLET,
                onClick = { onMethodSelect(PaymentMethod.WALLET) }
            )
        }

        DividerItem()

        // UPI QR Code Section (shown when UPI is selected)
        if (selectedMethod == PaymentMethod.UPI && upiQRCode != null) {
            UpiQRSection(
                qrCodeData = upiQRCode,
                amount = paymentOptions.totalAmount,
                upiApps = paymentOptions.upiApps
            )

            DividerItem()
        }

        // Card Details (shown when Card is selected)
        if (selectedMethod == PaymentMethod.CARD) {
            CardDetailsForm(
                onPayClick = onPayClick
            )

            DividerItem()
        }

        // Security Notice
        SecurityNotice()

        // Bottom Pay Button
        BottomPayBar(
            amount = paymentOptions.totalAmount,
            selectedMethod = selectedMethod,
            onClick = onPayClick,
            isProcessing = isProcessing
        )
    }
}

@Composable
fun AmountSummaryCard(
    amount: Int,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier,
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
                text = str(LocalContext.current, Str.amount_to_pay),
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Text(
                text = "₹$amount",
                fontSize = 36.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Text(
                text = str(LocalContext.current, Str.inclusive_of_taxes),
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
fun PaymentMethodOption(
    method: PaymentMethod,
    title: String,
    subtitle: String,
    icon: String,
    isSelected: Boolean,
    onClick: () -> Unit,
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
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Radio button
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .border(
                        width = 2.dp,
                        color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                        shape = RoundedCornerShape(12.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isSelected) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(6.dp))
                    )
                }
            }

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(16.dp))

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = subtitle,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Icon
            Text(text = icon, fontSize = 28.sp)

            // Checkmark when selected
            if (isSelected) {
                Icon(
                    imageVector = Icons.Filled.CheckCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp).padding(start = 8.dp)
                )
            }
        }
    }
}

@Composable
fun UpiQRSection(
    qrCodeData: String,
    amount: Int,
    upiApps: List<UpiAppUiModel>,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainerLow
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = str(LocalContext.current, Str.scan_to_pay),
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            // QR Code Placeholder
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // QR Code visual placeholder
                    Box(
                        modifier = Modifier
                            .size(180.dp)
                            .background(Color.White, RoundedCornerShape(8.dp))
                            .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        // In real app, use a QR code generation library
                        Canvas(modifier = Modifier.size(160.dp)) {
                            val canvasSize = 160.dp.toPx()
                            val blockSize = canvasSize / 25f
                            this.drawRect(
                                color = Color.Black,
                                size = Size(canvasSize, canvasSize)
                            )
                            // Draw a pattern to simulate QR code
                            for (i in 0..24) {
                                for (j in 0..24) {
                                    if ((i + j + (i * j)) % 3 == 0) {
                                        this.drawRect(
                                            color = Color.White,
                                            topLeft = Offset(i * blockSize, j * blockSize),
                                            size = Size(blockSize, blockSize)
                                        )
                                    }
                                }
                            }
                            // Quiet zones (white border)
                            this.drawRect(
                                color = Color.White,
                                topLeft = Offset(0f, 0f),
                                size = Size(4f * blockSize, canvasSize)
                            )
                            this.drawRect(
                                color = Color.White,
                                topLeft = Offset(0f, 0f),
                                size = Size(canvasSize, 4f * blockSize)
                            )
                            this.drawRect(
                                color = Color.White,
                                topLeft = Offset(canvasSize - 4f * blockSize, 0f),
                                size = Size(4f * blockSize, canvasSize)
                            )
                            this.drawRect(
                                color = Color.White,
                                topLeft = Offset(0f, canvasSize - (4f * blockSize)),
                                size = Size(canvasSize, 4f * blockSize)
                            )
                            // Finder patterns
                            drawFinderPattern(0, 0, blockSize)
                            drawFinderPattern(21, 0, blockSize)
                            drawFinderPattern(0, 21, blockSize)
                        }
                    }

                    Text(
                        text = str(LocalContext.current, Str.scan_with_upi_app),
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // UPI Apps
            Text(
                text = str(LocalContext.current, Str.or_pay_with),
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                upiApps.forEach { app ->
                    UpiAppButton(
                        app = app,
                        onClick = { /* Open UPI app */ }
                    )
                }
            }

            // Manual UPI ID
            TextButton(onClick = { /* Copy UPI ID */ }) {
                Text(
                    text = str(LocalContext.current, Str.copy_upi_id),
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

// Helper function for QR code finder patterns inside Canvas - DrawScope extension
fun DrawScope.drawFinderPattern(x: Int, y: Int, blockSize: Float) {
    val size = 7 * blockSize
    drawRect(
        color = Color.Black,
        topLeft = Offset(x * blockSize, y * blockSize),
        size = Size(size, size)
    )
    drawRect(
        color = Color.White,
        topLeft = Offset((x + 1) * blockSize, (y + 1) * blockSize),
        size = Size(5 * blockSize, 5 * blockSize)
    )
    drawRect(
        color = Color.Black,
        topLeft = Offset((x + 2) * blockSize, (y + 2) * blockSize),
        size = Size(3 * blockSize, 3 * blockSize)
    )
}

@Composable
fun UpiAppButton(
    app: UpiAppUiModel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    androidx.compose.material3.Button(
        onClick = onClick,
        modifier = modifier
            .width(120.dp)
            .height(100.dp),
        shape = RoundedCornerShape(12.dp),
        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.onSurface
        )
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(text = app.icon, fontSize = 32.sp)
            Text(
                text = app.name,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
fun CardDetailsForm(
    onPayClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    var cardNumber by remember { mutableStateOf("") }
    var expiryDate by remember { mutableStateOf("") }
    var cvv by remember { mutableStateOf("") }
    var cardHolderName by remember { mutableStateOf("") }
    var saveCard by remember { mutableStateOf(false) }

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = str(LocalContext.current, Str.card_details),
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        YadadriTextField(
            label = str(LocalContext.current, Str.card_number),
            value = cardNumber,
            onValueChange = { cardNumber = it },
            placeholder = "XXXX XXXX XXXX XXXX",
            leadingIcon = Icons.Filled.CreditCard,
            keyboardOptions = KeyboardOptions.Default.copy(
                keyboardType = KeyboardType.Number
            ),
            visualTransformation = VisualTransformation.None
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            YadadriTextField(
                label = str(LocalContext.current, Str.expiry_date),
                value = expiryDate,
                onValueChange = { expiryDate = it },
                placeholder = "MM/YY",
                leadingIcon = Icons.Filled.CalendarMonth,
                keyboardOptions = KeyboardOptions.Default.copy(
                    keyboardType = KeyboardType.Number
                ),
                modifier = Modifier.fillMaxWidth(0.5f)
            )
            YadadriTextField(
                label = str(LocalContext.current, Str.cvv),
                value = cvv,
                onValueChange = { cvv = it },
                placeholder = "CVV",
                leadingIcon = Icons.Filled.Lock,
                keyboardOptions = KeyboardOptions.Default.copy(
                    keyboardType = KeyboardType.Number
                ),
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.width(100.dp)
            )
        }

        YadadriTextField(
            label = str(LocalContext.current, Str.card_holder_name),
            value = cardHolderName,
            onValueChange = { cardHolderName = it },
            placeholder = str(LocalContext.current, Str.enter_card_holder_name),
            leadingIcon = Icons.Filled.Person
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = saveCard,
                    onCheckedChange = { saveCard = it },
                    colors = androidx.compose.material3.CheckboxDefaults.colors(
                        checkedColor = MaterialTheme.colorScheme.primary
                    )
                )
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = str(LocalContext.current, Str.save_card),
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

@Composable
fun SecurityNotice(
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.Security,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp).padding(end = 12.dp)
            )
            Column(
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = str(LocalContext.current, Str.secure_payment),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = str(LocalContext.current, Str.payment_security_details),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun BottomPayBar(
    amount: Int,
    selectedMethod: PaymentMethod,
    onClick: () -> Unit,
    isProcessing: Boolean,
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
                Column {
                    Text(
                        text = str(LocalContext.current, Str.total_amount),
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "₹$amount",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                Text(
                    text = selectedMethod.displayName,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            YadadriButton(
                text = if (isProcessing) str(LocalContext.current, Str.processing) else str(LocalContext.current, Str.pay_now),
                onClick = onClick,
                isLoading = isProcessing,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}