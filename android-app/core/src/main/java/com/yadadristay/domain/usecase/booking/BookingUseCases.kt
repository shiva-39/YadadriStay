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
    private val bookingRepository: BookingRepository,
    private val lodgeRepository: com.yadadristay.domain.repository.LodgeRepository
) {
    operator suspend fun invoke(
        lodgeId: String,
        roomCategoryId: String,
        checkIn: String,
        checkOut: String,
        guests: Int,
        rooms: Int
    ): Result<BookingSummary> {
        return try {
            // Fetch lodge and room category details to build summary
            val lodgeResult = lodgeRepository.getLodgeDetail(lodgeId, checkIn, checkOut)
            val roomCategoriesResult = lodgeRepository.getRoomCategories(lodgeId)

            when {
                lodgeResult is Result.Error -> Result.error(lodgeResult.exception)
                roomCategoriesResult is Result.Error -> Result.error(roomCategoriesResult.exception)
                else -> {
                    val lodge = (lodgeResult as Result.Success).data
                    val roomCategories = (roomCategoriesResult as Result.Success).data
                    val roomCategory = roomCategories.find { it.id == roomCategoryId }

                    if (roomCategory == null) {
                        Result.error(Exception("Room category not found"))
                    } else {
                        // Calculate pricing
                        val nights = calculateNights(checkIn, checkOut)
                        val basePrice = roomCategory.basePrice
                        val roomCharges = (basePrice * nights * rooms).toInt()
                        val taxesAndFees = (roomCharges * 0.18).toInt() // 18% tax
                        val totalAmount = roomCharges + taxesAndFees

                        Result.success(BookingSummary(
                            bookingId = "", // Not created yet
                            lodgeName = lodge.name,
                            lodgeLocation = "${lodge.address.city}, ${lodge.address.state}",
                            roomCategoryName = roomCategory.name,
                            checkInDate = checkIn,
                            checkOutDate = checkOut,
                            numberOfNights = nights,
                            numberOfRooms = rooms,
                            numberOfGuests = guests,
                            capacityPerRoom = roomCategory.maxOccupancy,
                            roomCharges = roomCharges,
                            taxesAndFees = taxesAndFees,
                            discount = 0,
                            totalAmount = totalAmount
                        ))
                    }
                }
            }
        } catch (e: Exception) {
            Result.error(e)
        }
    }

    private fun calculateNights(checkIn: String, checkOut: String): Int {
        return try {
            val formatter = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
            val inDate = formatter.parse(checkIn)
            val outDate = formatter.parse(checkOut)
            if (inDate != null && outDate != null) {
                val diff = outDate.time - inDate.time
                (diff / (1000 * 60 * 60 * 24)).toInt()
            } else {
                1
            }
        } catch (e: Exception) {
            1
        }
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