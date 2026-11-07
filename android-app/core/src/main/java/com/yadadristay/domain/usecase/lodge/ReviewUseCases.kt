package com.yadadristay.domain.usecase.lodge

import com.yadadristay.domain.model.Review
import com.yadadristay.domain.repository.ReviewRepository
import com.yadadristay.domain.repository.CreateReviewRequest
import com.yadadristay.domain.util.Result
import javax.inject.Inject

class SubmitReviewUseCase @Inject constructor(
    private val reviewRepository: ReviewRepository
) {
    operator suspend fun invoke(
        bookingId: String,
        overallRating: Int,
        categoryRatings: Map<String, Int>,
        comment: String,
        images: List<String>
    ): Result<Review> {
        val request = CreateReviewRequest(
            bookingId = bookingId,
            rating = overallRating,
            comment = comment,
            images = images
        )
        return reviewRepository.createReview(request)
    }
}