package com.yadadristay.presentation.lodgedetail

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyHorizontalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.roundToInt
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.*
import com.yadadristay.presentation.lodgedetail.LodgeDetailUiModel
import com.yadadristay.presentation.lodgedetail.LodgeDetailViewModel
import com.yadadristay.presentation.lodgedetail.RoomCategoryUiModel
import com.yadadristay.presentation.lodgedetail.ReviewUiModel
import com.yadadristay.presentation.navigation.NavigationRoute
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material.icons.filled.Web

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun LodgeDetailScreen(
    lodgeId: String,
    viewModel: LodgeDetailViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LoadingOverlay(isLoading = uiState.isLoading && uiState.lodge == null) {
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
                            text = str(LocalContext.current, Str.location_contact),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface
                    ),
                    actions = {
                        IconButton(onClick = { /* Share */ }) {
                            Icon(
                                imageVector = Icons.Filled.Share,
                                contentDescription = "Share",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        IconButton(onClick = { viewModel.toggleFavorite() }) {
                            Icon(
                                imageVector = if (uiState.lodge?.isFavorite == true)
                                    Icons.Filled.Favorite
                                else
                                    Icons.Filled.FavoriteBorder,
                                contentDescription = "Favorite",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                )
            }

            if (uiState.lodge != null) {
                val lodge = uiState.lodge!!

                item {
                    LodgeHeaderImage(images = lodge.images)
                }

                item {
                    LodgeInfoSection(lodge = lodge)
                }

                item {
                    DividerItem()
                }

                // Amenities
                if (lodge.amenities.isNotEmpty()) {
                    item {
                        SectionHeader(title = str(LocalContext.current, Str.amenities))
                    }
                    item {
                        AmenitiesGrid(amenities = lodge.amenities)
                    }
                    item {
                        DividerItem()
                    }
                }

                // Room Categories
                if (uiState.roomCategories.isNotEmpty()) {
                    item {
                        SectionHeader(
                            title = str(LocalContext.current, Str.next_steps),
                            actionText = str(LocalContext.current, Str.view_all_reviews),
                            onActionClick = { onNavigate(NavigationRoute.RoomSelection(lodgeId = lodge.id, roomCategoryId = uiState.roomCategories.firstOrNull()?.id ?: "")) }
                        )
                    }
                    items(uiState.roomCategories) { category ->
                            RoomCategoryCard(
                                category = category,
                                onClick = { onNavigate(NavigationRoute.RoomSelection(lodgeId = lodge.id, roomCategoryId = category.id)) }
                            )
                        }
                    item {
                        DividerItem()
                    }
                }

                // Reviews Preview
                if (lodge.recentReviews.isNotEmpty()) {
                    item {
                        SectionHeader(
                            title = str(LocalContext.current, Str.reviews),
                            actionText = str(LocalContext.current, Str.view_all),
                            onActionClick = { onNavigate(NavigationRoute.Reviews(lodgeId = lodge.id)) }
                        )
                    }
                    items(lodge.recentReviews) { review ->
                            ReviewPreviewCard(review = review)
                        }
                    item {
                        DividerItem()
                    }
                }

                // Location & Contact
                item {
                    LocationContactSection(
                        lodge = lodge,
                        onMapClick = { /* Open map */ },
                        onContactClick = { /* Call */ }
                    )
                }

                item {
                    DividerItem()
                }

                // Description
                if (lodge.description.isNotBlank()) {
                    item {
                        DescriptionSection(description = lodge.description)
                    }
                    item {
                        DividerItem()
                    }
                }

                // Bottom Book Bar
                item {
                    BottomBookBar(
                        pricePerNight = lodge.pricePerNight,
                        onClick = { onNavigate(NavigationRoute.RoomSelection(lodgeId = lodge.id, roomCategoryId = uiState.roomCategories.firstOrNull()?.id ?: "")) }
                    )
                }
            } else if (!uiState.isLoading) {
                item {
                    ErrorState(
                        message = uiState.errorMessage ?: str(LocalContext.current, Str.failed_to_load_profile),
                        onRetry = { viewModel.loadLodge(lodgeId) },
                        modifier = Modifier.fillMaxSize().padding(top = 100.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun LodgeHeaderImage(
    images: List<String>,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    val imageUrl = images.firstOrNull() ?: ""
    Card(
        modifier = modifier
            .fillMaxWidth()
            .height(240.dp),
        shape = RoundedCornerShape(0.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            if (imageUrl.isNotBlank()) {
                // Load image with Coil
                Text(text = "🏨", fontSize = 80.sp)
            } else {
                Text(text = "🏨", fontSize = 80.sp)
            }
        }
    }
}

@Composable
fun LodgeInfoSection(
    lodge: LodgeDetailUiModel,
    modifier: Modifier = Modifier.fillMaxWidth().padding(16.dp)
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = lodge.name,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Filled.LocationOn,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(16.dp).padding(end = 4.dp)
                )
                Text(
                    text = lodge.location,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                (1..5).forEach { star ->
                    Icon(
                        imageVector = if (star <= lodge.rating.roundToInt())
                            Icons.Filled.Star
                        else
                            Icons.Filled.StarBorder,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(14.dp)
                    )
                }
                Text(
                    text = String.format("%.1f (%d)", lodge.rating, lodge.reviewCount),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

@Composable
fun AmenitiesGrid(
    amenities: List<String>,
    modifier: Modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
) {
    LazyHorizontalGrid(
        rows = GridCells.Fixed(2),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = modifier
    ) {
        items(amenities.size) { index ->
            val amenity = amenities[index]
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(80.dp),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(text = getAmenityIcon(amenity), fontSize = 24.sp)
                        Text(
                            text = amenity,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}

private fun getAmenityIcon(amenity: String): String {
    return when (amenity.lowercase()) {
        "wifi" -> "📶"
        "parking" -> "🅿️"
        "pool" -> "🏊"
        "ac", "air conditioning" -> "❄️"
        "restaurant" -> "🍽️"
        "spa" -> "💆"
        "gym" -> "🏋️"
        "breakfast" -> "🍳"
        else -> "✨"
    }
}

@Composable
fun RoomCategoryCard(
    category: RoomCategoryUiModel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Category icon/image
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "🛏️", fontSize = 32.sp)
            }

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(16.dp))

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = category.name,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = category.description,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val amenitiesToShow = category.amenities.take(3)
                    amenitiesToShow.forEach { amenity ->
                        Box(
                            modifier = Modifier
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                                .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(16.dp))
                        ) {
                            Text(
                                text = amenity,
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }

            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "₹${category.pricePerNight}/night",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                if (category.originalPrice != null && category.originalPrice!! > category.pricePerNight) {
                    Text(
                        text = "₹${category.originalPrice}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textDecoration = TextDecoration.LineThrough
                    )
                    Text(
                        text = "${category.discountPercent}% OFF",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                Text(
                    text = "${category.availableCount} available",
                    fontSize = 12.sp,
                    color = if (category.availableCount > 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                )
            }

            Icon(
                imageVector = Icons.Filled.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun ReviewPreviewCard(
    review: ReviewUiModel,
    modifier: Modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // User avatar placeholder
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(18.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = review.userName.first().uppercase(),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(12.dp))
                    Column(
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            text = review.userName,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            (1..5).forEach { star ->
                                Icon(
                                    imageVector = if (star <= review.rating)
                                        Icons.Filled.Star
                                    else
                                        Icons.Filled.StarBorder,
                                    contentDescription = null,
                                    tint = if (star <= review.rating) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                            Text(
                                text = " · ${review.date}",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
            Text(
                text = review.comment,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 3,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun LocationContactSection(
    lodge: LodgeDetailUiModel,
    onMapClick: () -> Unit,
    onContactClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = str(LocalContext.current, Str.location_contact),
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        // Map placeholder
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp),
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            onClick = onMapClick
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Map,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier.size(48.dp)
                    )
                    Text(
                        text = str(LocalContext.current, Str.view_on_map),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = lodge.address,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 32.dp)
                    )
                }
            }
        }

        // Contact info
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            ContactCard(
                icon = Icons.Filled.Phone,
                title = str(LocalContext.current, Str.call),
                subtitle = lodge.phone,
                onClick = onContactClick
            )
            ContactCard(
                icon = Icons.Filled.Email,
                title = str(LocalContext.current, Str.email),
                subtitle = lodge.email,
                onClick = { /* Open email */ }
            )
            ContactCard(
                icon = Icons.Filled.Web,
                title = str(LocalContext.current, Str.welcome_back),
                subtitle = lodge.website,
                onClick = { /* Open website */ }
            )
        }
    }
}

@Composable
fun ContactCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .height(100.dp),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        onClick = onClick
    ) {
        Box(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                Text(
                    text = title,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = subtitle,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun DescriptionSection(
    description: String,
    modifier: Modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = str(LocalContext.current, 0x7F0F006E),
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = description,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurface,
            lineHeight = 22.sp
        )
    }
}

@Composable
fun BottomBookBar(
    pricePerNight: Int,
    onClick: () -> Unit,
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
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = str(LocalContext.current, Str.starting_from),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "₹$pricePerNight",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                YadadriButton(
                    text = str(LocalContext.current, Str.book_now),
                    onClick = onClick,
                    icon = Icons.Filled.ArrowForward,
                    modifier = Modifier.width(160.dp)
                )
            }
        }
    }
}