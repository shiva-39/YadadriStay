package com.yadadristay.presentation.home

import com.yadadristay.presentation.components.Str

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyHorizontalGrid
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.PaddingValues
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.*
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.presentation.home.HomeViewModel
import com.yadadristay.presentation.common.CategoryUiModel
import com.yadadristay.presentation.common.LodgeUiModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Favorite

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LoadingOverlay(isLoading = uiState.isLoading && uiState.lodges.isEmpty()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(16.dp)
        ) {
            item {
                // Top App Bar
                TopAppBar(
                    modifier = Modifier.fillMaxWidth(),
                    title = {
                        Text(
                            text = str(LocalContext.current, Str.app_name),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface
                    ),
                    actions = {
                        IconButton(onClick = { onNavigate(NavigationRoute.Profile) }) {
                            Icon(
                                imageVector = Icons.Filled.Person,
                                contentDescription = "Profile",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        IconButton(onClick = { onNavigate(NavigationRoute.Favorites) }) {
                            Icon(
                                imageVector = Icons.Filled.FavoriteBorder,
                                contentDescription = "Favorites",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        IconButton(onClick = { onNavigate(NavigationRoute.Notifications) }) {
                            Icon(
                                imageVector = Icons.Filled.Visibility,
                                contentDescription = "Notifications",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                )
            }

            item {
                // Search Bar
                SearchBar(
                    checkInDate = uiState.checkInDate,
                    checkOutDate = uiState.checkOutDate,
                    guests = uiState.guests,
                    onCheckInClick = { viewModel.showDatePicker(true) },
                    onCheckOutClick = { viewModel.showDatePicker(false) },
                    onGuestsClick = { viewModel.showGuestPicker() },
                    onSearchClick = { viewModel.search() },
                    onLocationClick = { onNavigate(NavigationRoute.Search) }
                )
            }

            // Quick Filters
            if (uiState.categories.isNotEmpty()) {
                item {
                    CategoryChips(
                        categories = uiState.categories,
                        selectedCategory = uiState.selectedCategory,
                        onCategoryClick = { viewModel.selectCategory(it) }
                    )
                }
            }

            item {
                // Nearby Lodges
                SectionHeader(
                    title = str(LocalContext.current, Str.nearby_lodges),
                    actionText = str(LocalContext.current, Str.view_all),
                    onActionClick = { onNavigate(NavigationRoute.Search) }
                )
            }

            if (uiState.lodges.isEmpty() && !uiState.isLoading) {
                item {
                    EmptyState(
                        icon = Icons.Filled.Home,
                        title = str(LocalContext.current, Str.no_lodges_found),
                        message = str(LocalContext.current, Str.no_lodges_nearby),
                        actionText = str(LocalContext.current, Str.search_lodges),
                        onActionClick = { onNavigate(NavigationRoute.Search) }
                    )
                }
            } else {
                items(uiState.lodges) { lodge ->
                    LodgeCard(
                        lodge = lodge,
                        onClick = { onNavigate(NavigationRoute.LodgeDetail(lodgeId = lodge.id)) },
                        onFavoriteClick = { viewModel.toggleFavorite(lodge) }
                    )
                }
            }

            // Popular Categories
            if (uiState.categories.isNotEmpty()) {
                item {
                    SectionHeader(title = str(LocalContext.current, Str.popular_categories))
                }
                item {
                    CategoryGrid(categories = uiState.categories)
                }
            }
        }
    }
}

@Composable
fun SearchBar(
    checkInDate: String?,
    checkOutDate: String?,
    guests: Int,
    onCheckInClick: () -> Unit,
    onCheckOutClick: () -> Unit,
    onGuestsClick: () -> Unit,
    onSearchClick: () -> Unit,
    onLocationClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable(onClick = onLocationClick),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Location field
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp).padding(end = 8.dp)
                    )
                    Column {
                        Text(
                            text = str(LocalContext.current, Str.where_to),
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = str(LocalContext.current, Str.yadadri_telangana),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
                Icon(
                    imageVector = Icons.Filled.KeyboardArrowDown,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            DividerItem()

            // Dates and Guests Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                DateField(
                    label = str(LocalContext.current, 0x7F0F0058),
                    value = checkInDate ?: str(LocalContext.current, 0x7F0F0058),
                    onClick = onCheckInClick,
                    icon = Icons.Filled.CalendarMonth,
                    modifier = Modifier.fillMaxWidth(0.4f)
                )
                DateField(
                    label = str(LocalContext.current, 0x7F0F0059),
                    value = checkOutDate ?: str(LocalContext.current, 0x7F0F0059),
                    onClick = onCheckOutClick,
                    icon = Icons.Filled.CalendarMonth,
                    modifier = Modifier.fillMaxWidth(0.4f)
                )
                GuestField(
                    value = guests,
                    onClick = onGuestsClick,
                    icon = Icons.Filled.Person,
                    modifier = Modifier.fillMaxWidth(0.2f)
                )
            }

            // Search Button
            YadadriButton(
                text = str(LocalContext.current, Str.search),
                onClick = onSearchClick,
                icon = Icons.Filled.Search,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
fun DateField(
    label: String,
    value: String,
    onClick: () -> Unit,
    icon: ImageVector,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Text(
        text = label,
        fontSize = 12.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = modifier.padding(start = 4.dp, bottom = 4.dp)
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp)
            .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp).padding(end = 8.dp)
                )
                Text(
                    text = value,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            Icon(
                imageVector = Icons.Filled.KeyboardArrowDown,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun GuestField(
    value: Int,
    onClick: () -> Unit,
    icon: ImageVector,
    modifier: Modifier = Modifier.width(80.dp)
) {
    Text(
        text = str(LocalContext.current, Str.guests),
        fontSize = 12.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = modifier.padding(start = 4.dp, bottom = 4.dp)
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp)
            .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp).padding(end = 8.dp)
                )
                Text(
                    text = "$value ${str(LocalContext.current, Str.guests)}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            Icon(
                imageVector = Icons.Filled.KeyboardArrowDown,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun CategoryChips(
    categories: List<CategoryUiModel>,
    selectedCategory: String?,
    onCategoryClick: (String) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp)
    ) {
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(horizontal = 0.dp)
        ) {
            items(categories) { category ->
                FilterChip(
                    onClick = { onCategoryClick(category.id) },
                    modifier = Modifier.height(40.dp),
                    label = {
                        Text(
                            text = category.name,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    },
                    selected = selectedCategory == category.id
                )
            }
        }
    }
}

@Composable
fun CategoryGrid(
    categories: List<CategoryUiModel>,
    modifier: Modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
) {
    LazyHorizontalGrid(
        rows = GridCells.Fixed(2),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(horizontal = 0.dp),
        modifier = modifier
    ) {
        items(categories.size) { index ->
            CategoryCard(category = categories[index])
        }
    }
}

@Composable
fun CategoryCard(
    category: CategoryUiModel,
    modifier: Modifier = Modifier.fillMaxSize()
) {
    Card(
        modifier = modifier
            .aspectRatio(1f),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        onClick = { /* Navigate to category */ }
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = category.icon,
                    fontSize = 32.sp
                )
                Text(
                    text = category.name,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface,
                    textAlign = TextAlign.Center,
                    maxLines = 2,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun LodgeList(
    lodges: List<LodgeUiModel>,
    onLodgeClick: (LodgeUiModel) -> Unit,
    onFavoriteClick: (LodgeUiModel) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    LazyColumn(
        modifier = modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(bottom = 100.dp)
    ) {
        items(lodges) { lodge ->
            LodgeCard(
                lodge = lodge,
                onClick = { onLodgeClick(lodge) },
                onFavoriteClick = { onFavoriteClick(lodge) }
            )
        }
    }
}

@Composable
fun LodgeCard(
    lodge: LodgeUiModel,
    onClick: () -> Unit,
    onFavoriteClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        onClick = onClick
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            // Image
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                contentAlignment = Alignment.TopEnd
            ) {
                // Placeholder for Coil image loading
                Box(
                    modifier = Modifier.fillMaxSize()
                        .background(MaterialTheme.colorScheme.surfaceContainerHighest)
                ) {
                    Text(
                        text = "🏨",
                        fontSize = 48.sp,
                        modifier = Modifier.padding(16.dp)
                    )
                }

                // Favorite button
                IconButton(
                    onClick = onFavoriteClick
                ) {
                    Icon(
                        imageVector = if (lodge.isFavorite)
                            Icons.Filled.Favorite
                        else
                            Icons.Filled.FavoriteBorder,
                        contentDescription = "Favorite",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(24.dp).padding(12.dp)
                    )
                }

                // Rating badge
                if (lodge.rating > 0) {
                    Box(
                        modifier = Modifier
                            .padding(12.dp)
                            .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Filled.Star,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = String.format("%.1f", lodge.rating),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
            }

            // Details
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = lodge.name,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                    Text(
                        text = "₹${lodge.pricePerNight}/night",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp).padding(end = 4.dp)
                    )
                    Text(
                        text = lodge.location,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                }

                // Amenities
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    lodge.amenities.take(4).forEach { amenity ->
                        // Use a simple Box instead of Chip
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
                    if (lodge.amenities.size > 4) {
                        // Use a simple Box instead of Chip
                        Box(
                            modifier = Modifier
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                                .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(16.dp))
                        ) {
                            Text(
                                text = "+${lodge.amenities.size - 4} more",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}