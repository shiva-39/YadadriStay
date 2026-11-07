package com.yadadristay.domain.usecase.lodge

import com.yadadristay.domain.model.LodgeSummary
import com.yadadristay.domain.model.LodgeDetail
import com.yadadristay.domain.model.RoomCategoryDetail
import com.yadadristay.domain.model.Review
import com.yadadristay.domain.model.SearchFilters
import com.yadadristay.domain.repository.PaginatedResult
import com.yadadristay.domain.model.AvailableRoom
import com.yadadristay.domain.model.ReviewSummary
import com.yadadristay.domain.repository.LodgeRepository
import com.yadadristay.domain.repository.ProfileRepository
import com.yadadristay.domain.repository.ReviewRepository
import com.yadadristay.domain.util.Result
import com.yadadristay.domain.util.mapResult
import javax.inject.Inject

class GetLodgesUseCase @Inject constructor(
    private val lodgeRepository: LodgeRepository
) {
    operator suspend fun invoke(): Result<List<LodgeSummary>> {
        val filters = SearchFilters(
            checkIn = "",
            checkOut = "",
            guests = 1
        )
        return lodgeRepository.searchLodges(filters).mapResult { it.items }
    }
}

class GetCategoriesUseCase @Inject constructor(
    private val lodgeRepository: LodgeRepository
) {
    operator suspend fun invoke(): Result<List<String>> {
        return Result.success(emptyList())
    }
}

class SearchLodgesUseCase @Inject constructor(
    private val lodgeRepository: LodgeRepository
) {
    operator suspend fun invoke(
        checkIn: String,
        checkOut: String,
        guests: Int,
        category: String? = null,
        minPrice: Double = 0.0,
        maxPrice: Double = 10000.0,
        minRating: Double = 0.0,
        amenities: List<String> = emptyList(),
        propertyTypes: List<String> = emptyList()
    ): Result<List<LodgeSummary>> {
        val filters = SearchFilters(
            checkIn = checkIn,
            checkOut = checkOut,
            guests = guests,
            minPrice = if (minPrice > 0) minPrice else null,
            maxPrice = if (maxPrice < 10000) maxPrice else null,
            minRating = if (minRating > 0) minRating else null,
            amenities = amenities
        )
        return lodgeRepository.searchLodges(filters).mapResult { it.items }
    }
}

class ToggleFavoriteUseCase @Inject constructor(
    private val profileRepository: ProfileRepository
) {
    operator suspend fun invoke(lodgeId: String): Result<Boolean> {
        return profileRepository.toggleFavorite(lodgeId)
    }
}

class GetLodgeDetailUseCase @Inject constructor(
    private val lodgeRepository: LodgeRepository
) {
    operator suspend fun invoke(lodgeId: String): Result<LodgeDetail> {
        return lodgeRepository.getLodgeDetail(lodgeId, null, null)
    }
}

class GetRoomCategoriesUseCase @Inject constructor(
    private val lodgeRepository: LodgeRepository
) {
    operator suspend fun invoke(lodgeId: String): Result<List<RoomCategoryDetail>> {
        return lodgeRepository.getRoomCategories(lodgeId)
    }
}

class GetLodgeReviewsUseCase @Inject constructor(
    private val reviewRepository: ReviewRepository
) {
    operator suspend fun invoke(lodgeId: String, limit: Int = 10, page: Int = 0): Result<List<Review>> {
        return reviewRepository.getLodgeReviews(lodgeId, page).mapResult { it.items }
    }
}

class GetRoomCategoryDetailUseCase @Inject constructor(
    private val lodgeRepository: LodgeRepository
) {
    operator suspend fun invoke(lodgeId: String, roomCategoryId: String): Result<RoomCategoryDetail> {
        return lodgeRepository.getRoomCategories(lodgeId).mapResult { categories ->
            categories.find { it.id == roomCategoryId }
                ?: throw Exception("Room category not found")
        }
    }
}

class GetAvailableRoomsUseCase @Inject constructor(
    private val lodgeRepository: LodgeRepository
) {
    operator suspend fun invoke(
        lodgeId: String,
        roomCategoryId: String,
        checkIn: String,
        checkOut: String
    ): Result<List<AvailableRoom>> {
        return Result.success(emptyList())
    }
}

class GetReviewSummaryUseCase @Inject constructor(
    private val reviewRepository: ReviewRepository
) {
    operator suspend fun invoke(lodgeId: String): Result<ReviewSummary> {
        return Result.success(
            ReviewSummary(
                overallRating = 0f,
                totalReviews = 0,
                ratingBreakdown = emptyMap(),
                categoryRatings = emptyMap()
            )
        )
    }
}