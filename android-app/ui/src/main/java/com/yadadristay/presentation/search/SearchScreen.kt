package com.yadadristay.presentation.search

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.*
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.presentation.search.SearchFiltersUiState
import com.yadadristay.presentation.search.SearchViewModel
import com.yadadristay.presentation.common.LodgeUiModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.SearchOff
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.foundation.layout.wrapContentSize
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun SearchScreen(
    viewModel: SearchViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LoadingOverlay(isLoading = uiState.isLoading && uiState.lodges.isEmpty()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(0.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
        ) {
            item {
                TopAppBar(
                    modifier = Modifier.fillMaxWidth(),
                    title = {
                        Text(
                            text = str(LocalContext.current, Str.search_lodges),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { /* Navigate back */ }) {
                            Icon(
                                imageVector = Icons.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface
                    )
                )
            }

            // Search Filters
            item {
                SearchFilters(
                    filters = uiState.filters,
                    onFilterChange = { viewModel.updateFilters(it) },
                    onClearFilters = { viewModel.clearFilters() },
                    onApplyFilters = { viewModel.applyFilters() }
                )
            }

            // Results
            item {
                SectionHeader(
                    title = str(LocalContext.current, Str.no_reviews_yet), // results_found
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            if (uiState.lodges.isEmpty() && !uiState.isLoading) {
                item {
                    EmptyState(
                        icon = Icons.Filled.SearchOff,
                        title = str(LocalContext.current, Str.no_results),
                        message = str(LocalContext.current, Str.try_adjusting_filters),
                        actionText = str(LocalContext.current, Str.credit_debit_card), // clear_filters
                        onActionClick = { viewModel.clearFilters() },
                        modifier = Modifier.padding(top = 100.dp)
                    )
                }
            } else {
                item {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 100.dp)
                    ) {
                        items(uiState.lodges) { lodge ->
                            LodgeCard(
                                lodge = lodge,
                                onClick = { onNavigate(NavigationRoute.LodgeDetail(lodgeId = lodge.id)) },
                                onFavoriteClick = { viewModel.toggleFavorite(lodge) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SearchFilters(
    filters: SearchFiltersUiState,
    onFilterChange: (SearchFiltersUiState) -> Unit,
    onClearFilters: () -> Unit,
    onApplyFilters: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    var expanded by remember { mutableStateOf(true) }

    Column(modifier = modifier) {
        // Filter header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = str(LocalContext.current, Str.filters),
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            if (filters.hasActiveFilters) {
                TextButton(onClick = onClearFilters) {
                    Text(
                        text = str(LocalContext.current, Str.customize_notifications), // clear_all
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        // Expandable filter sections
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
        ) {
            FilterSection(
                title = str(LocalContext.current, Str.price_range),
                expanded = expanded,
                onToggle = { expanded = !expanded },
                content = {
                    PriceRangeSlider(
                        minPrice = filters.minPrice,
                        maxPrice = filters.maxPrice,
                        onMinChange = { onFilterChange(filters.copy(minPrice = it)) },
                        onMaxChange = { onFilterChange(filters.copy(maxPrice = it)) }
                    )
                }
            )

            FilterSection(
                title = str(LocalContext.current, Str.rating),
                expanded = expanded,
                onToggle = { expanded = !expanded },
                content = {
                    RatingFilter(
                        selectedRating = filters.minRating,
                        onRatingChange = { onFilterChange(filters.copy(minRating = it)) }
                    )
                }
            )

            FilterSection(
                title = str(LocalContext.current, Str.amenities),
                expanded = expanded,
                onToggle = { expanded = !expanded },
                content = {
                    AmenitiesFilter(
                        selectedAmenities = filters.selectedAmenities,
                        availableAmenities = filters.availableAmenities,
                        onAmenityToggle = { amenity ->
                            val newAmenities = if (filters.selectedAmenities.contains(amenity)) {
                                filters.selectedAmenities - amenity
                            } else {
                                filters.selectedAmenities + amenity
                            }
                            onFilterChange(filters.copy(selectedAmenities = newAmenities))
                        }
                    )
                }
            )

            FilterSection(
                title = str(LocalContext.current, Str.property_type),
                expanded = expanded,
                onToggle = { expanded = !expanded },
                content = {
                    PropertyTypeFilter(
                        selectedTypes = filters.selectedPropertyTypes,
                        availableTypes = filters.availablePropertyTypes,
                        onTypeToggle = { type ->
                            val newTypes = if (filters.selectedPropertyTypes.contains(type)) {
                                filters.selectedPropertyTypes - type
                            } else {
                                filters.selectedPropertyTypes + type
                            }
                            onFilterChange(filters.copy(selectedPropertyTypes = newTypes))
                        }
                    )
                }
            )
        }

        // Apply button
        if (filters.hasActiveFilters || true) {
            YadadriButton(
                text = str(LocalContext.current, Str.apply_filters),
                onClick = onApplyFilters,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 16.dp)
            )
        }
    }
}

@Composable
fun FilterSection(
    title: String,
    expanded: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth(),
    content: @Composable () -> Unit
) {
    var sectionExpanded by remember { mutableStateOf(expanded) }

    Column(modifier = modifier) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )
            IconButton(onClick = { sectionExpanded = !sectionExpanded; onToggle() }) {
                Icon(
                    imageVector = if (sectionExpanded)
                        Icons.Filled.ExpandLess
                    else
                        Icons.Filled.ExpandMore,
                    contentDescription = "Toggle",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        if (sectionExpanded) {
            content()
            DividerItem()
        }
    }
}

@Composable
fun PriceRangeSlider(
    minPrice: Int,
    maxPrice: Int,
    onMinChange: (Int) -> Unit,
    onMaxChange: (Int) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
) {
    Column(modifier = modifier) {
        Row(
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "₹$minPrice", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
            Text(text = "₹$maxPrice", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
        }
        // Simplified - using single slider for demo
        Slider(
            value = maxPrice.toFloat(),
            onValueChange = { onMaxChange(it.roundToInt()) },
            valueRange = 0f..10000f,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
fun RatingFilter(
    selectedRating: Float,
    onRatingChange: (Float) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
) {
    Column(modifier = modifier) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            (1..5).forEach { rating ->
                val isSelected = selectedRating >= rating
                IconButton(
                    onClick = { onRatingChange(rating.toFloat()) },
                    modifier = Modifier.wrapContentSize()
                ) {
                    Icon(
                        imageVector = if (isSelected)
                            Icons.Filled.Star
                        else
                            Icons.Filled.StarBorder,
                        contentDescription = "$rating stars",
                        tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
            Text(
                text = "${selectedRating.toInt()}+ ${str(LocalContext.current, Str.and_above)}",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun AmenitiesFilter(
    selectedAmenities: Set<String>,
    availableAmenities: List<String>,
    onAmenityToggle: (String) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(availableAmenities) { amenity ->
                val selected = selectedAmenities.contains(amenity)
                FilterChip(
                    label = {
                        Text(text = amenity, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    },
                    selected = selected,
                    onClick = { onAmenityToggle(amenity) }
                )
            }
        }
    }
}

@Composable
fun PropertyTypeFilter(
    selectedTypes: Set<String>,
    availableTypes: List<String>,
    onTypeToggle: (String) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
) {
    Column(modifier = modifier) {
        availableTypes.forEach { type ->
            val selected = selectedTypes.contains(type)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp)
                    .clickable { onTypeToggle(type) },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = type,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Checkbox(
                    checked = selected,
                    onCheckedChange = { _ -> onTypeToggle(type) },
                    colors = androidx.compose.material3.CheckboxDefaults.colors(
                        checkedColor = MaterialTheme.colorScheme.primary,
                        uncheckedColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
            }
        }
    }
}