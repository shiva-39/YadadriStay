package com.yadadristay.presentation.reviews

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.layout.width
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.*
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.presentation.reviews.BookingForReviewUiModel
import com.yadadristay.presentation.reviews.WriteReviewViewModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Note
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun WriteReviewScreen(
    bookingId: String,
    viewModel: WriteReviewViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LoadingOverlay(isLoading = uiState.isLoading && uiState.booking == null) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(0.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
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
                            text = str(LocalContext.current, Str.write_review),
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
                    WriteReviewContent(
                        booking = uiState.booking!!,
                        overallRating = uiState.overallRating,
                        categoryRatings = uiState.categoryRatings,
                        reviewText = uiState.reviewText,
                        images = uiState.images,
                        onOverallRatingChange = { viewModel.setOverallRating(it) },
                        onCategoryRatingChange = { category, rating -> viewModel.setCategoryRating(category, rating) },
                        onReviewTextChange = { viewModel.setReviewText(it) },
                        onAddImageClick = { viewModel.addImage() },
                        onRemoveImageClick = { viewModel.removeImage(it) },
                        onSubmitClick = { viewModel.submitReview() },
                        isSubmitting = uiState.isSubmitting
                    )
                }
            } else if (!uiState.isLoading) {
                item {
                    ErrorState(
                        message = uiState.errorMessage ?: str(LocalContext.current, Str.failed_to_load_booking_for_review),
                        onRetry = { viewModel.loadBooking(bookingId) },
                        modifier = Modifier.fillMaxSize().padding(top = 100.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun WriteReviewContent(
    booking: BookingForReviewUiModel,
    overallRating: Int,
    categoryRatings: Map<String, Int>,
    reviewText: String,
    images: List<String>,
    onOverallRatingChange: (Int) -> Unit,
    onCategoryRatingChange: (String, Int) -> Unit,
    onReviewTextChange: (String) -> Unit,
    onAddImageClick: () -> Unit,
    onRemoveImageClick: (String) -> Unit,
    onSubmitClick: () -> Unit,
    isSubmitting: Boolean,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    var reviewTextInput by remember { mutableStateOf(reviewText) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 100.dp)
    ) {
        // Booking Info Header
        BookingInfoCard(booking = booking)

        // Overall Rating
        Column(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = str(LocalContext.current, Str.how_was_your_stay),
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            LargeRatingBar(
                rating = overallRating,
                onRatingChange = onOverallRatingChange
            )

            // Category Ratings
            Text(
                text = str(LocalContext.current, Str.rate_categories),
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )

            CategoryRatingsInput(
                ratings = categoryRatings,
                onRatingChange = onCategoryRatingChange
            )

            // Review Text
            Text(
                text = str(LocalContext.current, Str.write_your_review),
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )

            YadadriTextField(
                label = str(LocalContext.current, Str.share_app), // your_review
                value = reviewTextInput,
                onValueChange = { reviewTextInput = it; onReviewTextChange(it) },
                placeholder = str(LocalContext.current, Str.share_experience),
                leadingIcon = Icons.Filled.Note,
                singleLine = false,
                modifier = Modifier.fillMaxWidth()
            )

            // Photos
            Text(
                text = str(LocalContext.current, Str.add_photos),
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )

            PhotoPicker(
                images = images,
                onAddClick = onAddImageClick,
                onRemoveClick = onRemoveImageClick
            )

            // Submit Button
            YadadriButton(
                text = str(LocalContext.current, Str.submit_review),
                onClick = onSubmitClick,
                isLoading = isSubmitting,
                enabled = overallRating > 0 && reviewTextInput.isNotBlank(),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(top = 24.dp)
                    .padding(bottom = 16.dp)
            )
        }
    }
}

@Composable
fun BookingInfoCard(
    booking: BookingForReviewUiModel,
    modifier: Modifier = Modifier.fillMaxWidth().padding(16.dp)
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "🏨", fontSize = 24.sp)
            }

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(12.dp))

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = booking.lodgeName,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "${booking.checkInDate} - ${booking.checkOutDate} · ${booking.roomType}",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = booking.bookingReference,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun LargeRatingBar(
    rating: Int,
    onRatingChange: (Int) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        (1..5).forEach { star ->
            IconButton(onClick = { onRatingChange(star) }) {
                Icon(
                    imageVector = if (star <= rating)
                        Icons.Filled.Star
                    else
                        Icons.Filled.StarBorder,
                    contentDescription = "$star stars",
                    tint = if (star <= rating) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(40.dp)
                )
            }
        }
    }
}

@Composable
fun CategoryRatingsInput(
    ratings: Map<String, Int>,
    onRatingChange: (String, Int) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    val categories = listOf("Cleanliness", "Service", "Location", "Value", "Amenities")

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        categories.forEach { category ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = category,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    (1..5).forEach { star ->
                        IconButton(onClick = { onRatingChange(category, star) }) {
                            Icon(
                                imageVector = if (star <= (ratings[category] ?: 0))
                                    Icons.Filled.Star
                                else
                                    Icons.Filled.StarBorder,
                                contentDescription = null,
                                tint = if (star <= (ratings[category] ?: 0)) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PhotoPicker(
    images: List<String>,
    onAddClick: () -> Unit,
    onRemoveClick: (String) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            images.forEach { image ->
                ImagePreview(
                    imageUrl = image,
                    onRemove = { onRemoveClick(image) }
                )
            }

            // Add photo button
            if (images.size < 5) {
                androidx.compose.material3.Button(
                    onClick = onAddClick,
                    modifier = Modifier.size(80.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.surfaceContainerHighest
                    )
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.AddAPhoto,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                        Text(
                            text = str(LocalContext.current, Str.add_photo),
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }

        if (images.isEmpty()) {
            Text(
                text = str(LocalContext.current, Str.no_photos_added),
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun ImagePreview(
    imageUrl: String,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier.size(80.dp)
) {
    Box(
        modifier = modifier
            .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.TopEnd
    ) {
        // Image placeholder
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Gray.copy(alpha = 0.3f), RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Text(text = "📷", fontSize = 24.sp)
        }

        // Remove button
        IconButton(onClick = onRemove) {
            Icon(
                imageVector = Icons.Filled.Close,
                contentDescription = "Remove",
                tint = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier
                    .size(20.dp)
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f), RoundedCornerShape(10.dp))
                    .padding(4.dp)
            )
        }
    }
}