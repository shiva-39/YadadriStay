package com.yadadristay.presentation.profile

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
import com.yadadristay.presentation.profile.ProfileUiModel
import com.yadadristay.presentation.profile.ProfileStatsUiModel
import com.yadadristay.presentation.profile.ProfileViewModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Article
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Help
import androidx.compose.material.icons.filled.Hotel
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.RateReview
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LoadingOverlay(isLoading = uiState.isLoading && uiState.profile == null) {
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
                            text = str(LocalContext.current, Str.profile),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface
                    ),
                    actions = {
                        IconButton(onClick = { onNavigate(NavigationRoute.EditProfile) }) {
                            Icon(
                                imageVector = Icons.Filled.Edit,
                                contentDescription = "Edit Profile",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                )
            }

            if (uiState.profile != null) {
                item {
                    ProfileContent(
                        profile = uiState.profile!!,
                        stats = uiState.stats,
                        onSettingsClick = { onNavigate(NavigationRoute.Settings) },
                        onMyBookingsClick = { onNavigate(NavigationRoute.MyBookings) },
                        onFavoritesClick = { onNavigate(NavigationRoute.Favorites) },
                        onReviewsClick = { onNavigate(NavigationRoute.Reviews(lodgeId = "")) },
                        onTransportClick = { onNavigate(NavigationRoute.Transport) },
                        onHelpClick = { onNavigate(NavigationRoute.HelpSupport) },
                        onLogoutClick = { viewModel.logout() }
                    )
                }
            } else if (!uiState.isLoading) {
                item {
                    ErrorState(
                        message = uiState.errorMessage ?: str(LocalContext.current, Str.failed_to_load_profile),
                        onRetry = { viewModel.loadProfile() },
                        modifier = Modifier.fillMaxSize().padding(top = 100.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun ProfileContent(
    profile: ProfileUiModel,
    stats: ProfileStatsUiModel,
    onSettingsClick: () -> Unit,
    onMyBookingsClick: () -> Unit,
    onFavoritesClick: () -> Unit,
    onReviewsClick: () -> Unit,
    onTransportClick: () -> Unit,
    onHelpClick: () -> Unit,
    onLogoutClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 100.dp)
    ) {
        // Profile Header
        ProfileHeader(profile = profile)

        // Stats Row
        ProfileStatsRow(stats = stats)

        // Menu Items
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ProfileMenuItem(
                icon = Icons.Filled.Bookmark,
                title = str(LocalContext.current, Str.my_bookings),
                subtitle = str(LocalContext.current, Str.view_manage_bookings),
                onClick = onMyBookingsClick
            )
            ProfileMenuItem(
                icon = Icons.Filled.Favorite,
                title = str(LocalContext.current, Str.my_favorites),
                subtitle = str(LocalContext.current, Str.saved_lodges),
                onClick = onFavoritesClick
            )
            ProfileMenuItem(
                icon = Icons.Filled.RateReview,
                title = str(LocalContext.current, Str.profile_reviews),
                subtitle = str(LocalContext.current, Str.reviews_you_wrote),
                onClick = onReviewsClick
            )
            ProfileMenuItem(
                icon = Icons.Filled.DirectionsBus,
                title = str(LocalContext.current, Str.profile_transport),
                subtitle = str(LocalContext.current, Str.profile_book_transport),
                onClick = onTransportClick
            )

            DividerItem()

            ProfileMenuItem(
                icon = Icons.Filled.Settings,
                title = str(LocalContext.current, Str.settings),
                subtitle = str(LocalContext.current, Str.app_preferences),
                onClick = onSettingsClick
            )
            ProfileMenuItem(
                icon = Icons.Filled.Help,
                title = str(LocalContext.current, Str.help_support),
                subtitle = str(LocalContext.current, Str.contact_us),
                onClick = onHelpClick
            )
            ProfileMenuItem(
                icon = Icons.Filled.Article,
                title = str(LocalContext.current, Str.terms_privacy),
                subtitle = str(LocalContext.current, Str.read_terms_privacy),
                onClick = { /* Navigate to terms */ }
            )

            DividerItem()

            // Logout
            YadadriOutlinedButton(
                text = str(LocalContext.current, Str.logout),
                onClick = onLogoutClick,
                icon = Icons.Filled.Logout,
                modifier = Modifier.fillMaxWidth(),
                colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer,
                    contentColor = MaterialTheme.colorScheme.error
                )
            )
        }
    }
}

@Composable
fun ProfileHeader(
    profile: ProfileUiModel,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(40.dp)),
                contentAlignment = Alignment.Center
            ) {
                if (profile.avatarUrl.isNotBlank()) {
                    // Load image with Coil
                    Text(text = "👤", fontSize = 40.sp, color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Text(
                        text = profile.name.first().uppercase(),
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                }
            }

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = profile.name,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = profile.email,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                )
                Text(
                    text = profile.phone,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                )
            }

            // Member since
            Text(
                text = str(LocalContext.current, Str.highest_rating), // member_since
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.6f)
            )
        }
    }
}

@Composable
fun ProfileStatsRow(
    stats: ProfileStatsUiModel,
    modifier: Modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        StatItem(
            icon = Icons.Filled.Hotel,
            label = str(LocalContext.current, Str.stays),
            value = "${stats.totalStays}",
            modifier = Modifier.fillMaxWidth(0.25f)
        )
        StatItem(
            icon = Icons.Filled.Favorite,
            label = str(LocalContext.current, Str.favorites),
            value = "${stats.totalFavorites}",
            modifier = Modifier.fillMaxWidth(0.25f)
        )
        StatItem(
            icon = Icons.Filled.RateReview,
            label = str(LocalContext.current, Str.profile_reviews),
            value = "${stats.totalReviews}",
            modifier = Modifier.fillMaxWidth(0.25f)
        )
        StatItem(
            icon = Icons.Filled.Star,
            label = str(LocalContext.current, Str.avg_rating),
            value = String.format("%.1f", stats.averageRating),
            modifier = Modifier.fillMaxWidth(0.25f)
        )
    }
}

@Composable
fun StatItem(
    icon: ImageVector,
    label: String,
    value: String,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Column(
        modifier = modifier
            .padding(16.dp)
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(16.dp)),
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
            text = value,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = label,
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun ProfileMenuItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp).padding(end = 16.dp)
            )
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
            Icon(
                imageVector = Icons.Filled.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}