package com.yadadristay.domain.usecase.booking

import com.yadadristay.domain.model.BookingDetail
import com.yadadristay.domain.model.BookingForReview
import com.yadadristay.domain.model.BookingSummary
import com.yadadristay.domain.repository.BookingRepository
import com.yadadristay.domain.repository.CreateBookingRequest
import com.yadadristay.domain.repository.PaginatedResult
import com.yadadristay.domain.repository.PaymentRepository
import com.yadadristay.domain.repository.PaymentRequest
import com.yadadristay.domain.repository.PaymentResponse
import com.yadadristay.domain.util.Result
import com.yadadristay.domain.util.mapResult
import javax.inject.Inject

class CreateBookingUseCase @Inject constructor(
    private val bookingRepository: BookingRepository
) {
    operator suspend fun invoke(
        lodgeId: String,
        roomCategoryId: String,
        checkIn: String,
        checkOut: String,
        guests: Int,
        rooms: Int,
        guestDetails: List<GuestDetail>,
        specialRequests: String
    ): Result<BookingDetail> {
        val customerName = guestDetails.firstOrNull()?.fullName ?: ""
        val customerPhone = guestDetails.firstOrNull()?.phone ?: ""
        val customerEmail = guestDetails.firstOrNull()?.email

        val request = CreateBookingRequest(
            lodgeId = lodgeId,
            roomCategoryId = roomCategoryId,
            checkIn = checkIn,
            checkOut = checkOut,
            guests = guests,
            rooms = rooms,
            customerName = customerName,
            customerPhone = customerPhone,
            customerEmail = customerEmail,
            specialRequests = specialRequests
        )
        return bookingRepository.createBooking(request)
    }
}

class GetBookingSummaryUseCase @Inject constructor(
    private val bookingRepository: BookingRepository
) {
    operator suspend fun invoke(): Result<BookingSummary> {
        return Result.error(Exception("Get booking summary not implemented"))
    }
}

class GetPaymentOptionsUseCase @Inject constructor(
    private val paymentRepository: PaymentRepository
) {
    operator suspend fun invoke(bookingId: String): Result<PaymentOptions> {
        return Result.success(PaymentOptions(
            totalAmount = 0,
            upiApps = listOf(
                UpiApp("GPay", "🇮🇳"),
                UpiApp("PhonePe", "📱"),
                UpiApp("Paytm", "💰"),
                UpiApp("BHIM", "🏛️")
            )
        ))
    }
}

class InitiatePaymentUseCase @Inject constructor(
    private val paymentRepository: PaymentRepository
) {
    operator suspend fun invoke(
        bookingId: String,
        paymentMethod: PaymentMethod
    ): Result<PaymentResponse> {
        val request = PaymentRequest(
            bookingId = bookingId,
            amount = 0.0,
            paymentMethod = paymentMethod.name,
            upiId = null,
            transactionId = null,
            screenshot = null
        )
        return paymentRepository.createPayment(request)
    }
}

class GetBookingDetailUseCase @Inject constructor(
    private val bookingRepository: BookingRepository
) {
    operator suspend fun invoke(bookingId: String): Result<BookingDetail> {
        return bookingRepository.getBookingDetail(bookingId)
    }
}

class GetUserBookingsUseCase @Inject constructor(
    private val bookingRepository: BookingRepository
) {
    operator suspend fun invoke(): Result<List<BookingDetail>> {
        return bookingRepository.getMyBookings(null, 1).mapResult { it.items }
    }
}

class CancelBookingUseCase @Inject constructor(
    private val bookingRepository: BookingRepository
) {
    operator suspend fun invoke(bookingId: String): Result<BookingDetail> {
        return bookingRepository.cancelBooking(bookingId, "User cancelled")
    }
}

class GetBookingForReviewUseCase @Inject constructor(
    private val bookingRepository: BookingRepository
) {
    operator suspend fun invoke(bookingId: String): Result<BookingForReview> {
        return bookingRepository.getBookingDetail(bookingId).mapResult { booking ->
            BookingForReview(
                id = booking.id,
                lodgeName = booking.lodgeName,
                roomType = booking.roomCategoryName,
                checkInDate = booking.checkIn,
                checkOutDate = booking.checkOut,
                bookingReference = booking.bookingNumber
            )
        }
    }
}

// Helper data classes for the UseCases
data class GuestDetail(
    val fullName: String = "",
    val email: String = "",
    val phone: String = "",
    val idProof: String = ""
)

data class UpiApp(
    val name: String,
    val icon: String
)

data class PaymentOptions(
    val totalAmount: Int,
    val upiApps: List<UpiApp> = emptyList()
)

enum class PaymentMethod {
    UPI,
    CARD,
    NET_BANKING,
    WALLET
}