package com.yadadristay.presentation.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yadadristay.domain.usecase.booking.GetPaymentOptionsUseCase
import com.yadadristay.domain.usecase.booking.InitiatePaymentUseCase
import com.yadadristay.domain.usecase.booking.PaymentOptions
import com.yadadristay.domain.usecase.booking.PaymentMethod
import com.yadadristay.domain.usecase.booking.UpiApp
import com.yadadristay.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PaymentViewModel @Inject constructor(
    private val getPaymentOptionsUseCase: GetPaymentOptionsUseCase,
    private val initiatePaymentUseCase: InitiatePaymentUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(PaymentUiState())
    val uiState: StateFlow<PaymentUiState> = _uiState

    fun loadPaymentOptions(bookingId: String) {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = getPaymentOptionsUseCase(bookingId)

            _uiState.value = _uiState.value.copy(isLoading = false)

            when (result) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        paymentOptions = toPaymentOptionsUiModel(result.data),
                        upiQRCode = null // Would come from API
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    fun selectPaymentMethod(method: com.yadadristay.presentation.booking.PaymentMethod) {
        _uiState.value = _uiState.value.copy(selectedPaymentMethod = method)
    }

    fun initiatePayment() {
        val state = _uiState.value
        _uiState.value = _uiState.value.copy(isProcessing = true)

        viewModelScope.launch {
            val domainMethod = toDomainPaymentMethod(state.selectedPaymentMethod)
            val result = initiatePaymentUseCase(
                bookingId = state.bookingId!!,
                paymentMethod = domainMethod
            )

            _uiState.value = _uiState.value.copy(isProcessing = false)

            when (result) {
                is Result.Success -> {
                    // Navigate to confirmation handled by caller
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = result.exception.message)
                }
            }
        }
    }

    private fun toDomainPaymentMethod(ui: com.yadadristay.presentation.booking.PaymentMethod): PaymentMethod = when (ui) {
        com.yadadristay.presentation.booking.PaymentMethod.UPI -> PaymentMethod.UPI
        com.yadadristay.presentation.booking.PaymentMethod.CARD -> PaymentMethod.CARD
        com.yadadristay.presentation.booking.PaymentMethod.NET_BANKING -> PaymentMethod.NET_BANKING
        com.yadadristay.presentation.booking.PaymentMethod.WALLET -> PaymentMethod.WALLET
    }

    private fun toPaymentOptionsUiModel(options: PaymentOptions): PaymentOptionsUiModel = PaymentOptionsUiModel(
        totalAmount = options.totalAmount,
        upiApps = options.upiApps.map { UpiAppUiModel(it.name, it.icon) }
    )
}

data class PaymentUiState(
    val paymentOptions: PaymentOptionsUiModel? = null,
    val selectedPaymentMethod: com.yadadristay.presentation.booking.PaymentMethod = com.yadadristay.presentation.booking.PaymentMethod.UPI,
    val upiQRCode: String? = null,
    val isLoading: Boolean = false,
    val isProcessing: Boolean = false,
    val errorMessage: String? = null,
    val bookingId: String? = null
)

data class PaymentOptionsUiModel(
    val totalAmount: Int,
    val upiApps: List<UpiAppUiModel> = listOf(
        UpiAppUiModel("GPay", "🇮🇳"),
        UpiAppUiModel("PhonePe", "📱"),
        UpiAppUiModel("Paytm", "💰"),
        UpiAppUiModel("BHIM", "🏺")
    )
)

data class UpiAppUiModel(
    val name: String,
    val icon: String
)

enum class PaymentMethod {
    UPI,
    CARD,
    NET_BANKING,
    WALLET;

    val displayName: String
        get() = when (this) {
            UPI -> "UPI"
            CARD -> "Card"
            NET_BANKING -> "Net Banking"
            WALLET -> "Wallet"
        }
}