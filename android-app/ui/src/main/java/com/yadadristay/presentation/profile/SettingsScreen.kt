package com.yadadristay.presentation.profile

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
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
import com.yadadristay.presentation.components.DividerItem
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.presentation.profile.SettingsViewModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Help
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material.icons.filled.Tune

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigate: (NavigationRoute) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

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
                        text = str(LocalContext.current, Str.settings),
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

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .padding(bottom = 100.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Account Section
                SettingsSection(
                    title = str(LocalContext.current, Str.account),
                    items = listOf(
                        SettingsItem(
                            icon = Icons.Filled.Person,
                            title = str(LocalContext.current, Str.edit_profile),
                            subtitle = str(LocalContext.current, Str.update_personal_info),
                            onClick = { onNavigate(NavigationRoute.EditProfile) }
                        ),
                        SettingsItem(
                            icon = Icons.Filled.Lock,
                            title = str(LocalContext.current, Str.change_password),
                            subtitle = str(LocalContext.current, Str.update_password),
                            onClick = { onNavigate(NavigationRoute.ChangePassword) }
                        ),
                        SettingsItem(
                            icon = Icons.Filled.Language,
                            title = str(LocalContext.current, Str.language),
                            subtitle = uiState.language.displayName,
                            onClick = { onNavigate(NavigationRoute.LanguageSettings) }
                        ),
                        SettingsItem(
                            icon = Icons.Filled.Delete,
                            title = str(LocalContext.current, Str.delete_account),
                            subtitle = str(LocalContext.current, Str.permanently_delete),
                            onClick = { /* Show delete confirmation */ },
                            isDestructive = true
                        )
                    )
                )

                // Notifications Section
                SettingsSection(
                    title = str(LocalContext.current, Str.notifications),
                    items = listOf(
                        SettingsItem(
                            icon = Icons.Filled.Notifications,
                            title = str(LocalContext.current, Str.push_notifications),
                            subtitle = str(LocalContext.current, Str.receive_booking_updates),
                            trailing = { Switch(
                                checked = uiState.pushNotifications,
                                onCheckedChange = { viewModel.setPushNotifications(it) },
                                colors = androidx.compose.material3.SwitchDefaults.colors(
                                    checkedThumbColor = MaterialTheme.colorScheme.primary,
                                    checkedTrackColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            ) },
                            onClick = {}
                        ),
                        SettingsItem(
                            icon = Icons.Filled.Email,
                            title = str(LocalContext.current, Str.email_notifications),
                            subtitle = str(LocalContext.current, Str.receive_email_updates),
                            trailing = { Switch(
                                checked = uiState.emailNotifications,
                                onCheckedChange = { viewModel.setEmailNotifications(it) },
                                colors = androidx.compose.material3.SwitchDefaults.colors(
                                    checkedThumbColor = MaterialTheme.colorScheme.primary,
                                    checkedTrackColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            ) },
                            onClick = {}
                        ),
                        SettingsItem(
                            icon = Icons.Filled.Sms,
                            title = str(LocalContext.current, Str.sms_notifications),
                            subtitle = str(LocalContext.current, Str.receive_sms_updates),
                            trailing = { Switch(
                                checked = uiState.smsNotifications,
                                onCheckedChange = { viewModel.setSmsNotifications(it) },
                                colors = androidx.compose.material3.SwitchDefaults.colors(
                                    checkedThumbColor = MaterialTheme.colorScheme.primary,
                                    checkedTrackColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            ) },
                            onClick = {}
                        ),
                        SettingsItem(
                            icon = Icons.Filled.Tune,
                            title = str(LocalContext.current, Str.notification_preferences),
                            subtitle = str(LocalContext.current, Str.customize_notifications),
                            onClick = { onNavigate(NavigationRoute.NotificationSettings) }
                        )
                    )
                )

                // Appearance Section
                SettingsSection(
                    title = str(LocalContext.current, Str.appearance),
                    items = listOf(
                        SettingsItem(
                            icon = Icons.Filled.DarkMode,
                            title = str(LocalContext.current, Str.dark_mode),
                            subtitle = str(LocalContext.current, Str.system_default),
                            trailing = { Switch(
                                checked = uiState.darkMode,
                                onCheckedChange = { viewModel.setDarkMode(it) },
                                colors = androidx.compose.material3.SwitchDefaults.colors(
                                    checkedThumbColor = MaterialTheme.colorScheme.primary,
                                    checkedTrackColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            ) },
                            onClick = {}
                        ),
                        SettingsItem(
                            icon = Icons.Filled.TextFields,
                            title = str(LocalContext.current, Str.font_size),
                            subtitle = uiState.fontSize.displayName,
                            onClick = { /* Show font size picker */ }
                        )
                    )
                )

                // Data & Privacy Section
                SettingsSection(
                    title = str(LocalContext.current, Str.data_privacy),
                    items = listOf(
                        SettingsItem(
                            icon = Icons.Filled.Download,
                            title = str(LocalContext.current, Str.download_data),
                            subtitle = str(LocalContext.current, Str.request_data_copy),
                            onClick = { /* Request data download */ }
                        ),
                        SettingsItem(
                            icon = Icons.Filled.PrivacyTip,
                            title = str(LocalContext.current, Str.privacy_policy),
                            subtitle = str(LocalContext.current, Str.read_privacy_policy),
                            onClick = { /* Open privacy policy */ }
                        ),
                        SettingsItem(
                            icon = Icons.Filled.Gavel,
                            title = str(LocalContext.current, Str.terms_of_service),
                            subtitle = str(LocalContext.current, Str.read_terms),
                            onClick = { onNavigate(NavigationRoute.TermsPrivacy) }
                        )
                    )
                )

                // About Section
                SettingsSection(
                    title = str(LocalContext.current, Str.about),
                    items = listOf(
                        SettingsItem(
                            icon = Icons.Filled.Info,
                            title = str(LocalContext.current, Str.app_version),
                            subtitle = "1.0.0",
                            onClick = {}
                        ),
                        SettingsItem(
                            icon = Icons.Filled.Star,
                            title = str(LocalContext.current, Str.rate_app),
                            subtitle = str(LocalContext.current, Str.rate_on_play_store),
                            onClick = { /* Open Play Store */ }
                        ),
                        SettingsItem(
                            icon = Icons.Filled.Share,
                            title = str(LocalContext.current, Str.share_app),
                            subtitle = str(LocalContext.current, Str.invite_friends),
                            onClick = { /* Share app */ }
                        ),
                        SettingsItem(
                            icon = Icons.Filled.Help,
                            title = str(LocalContext.current, Str.help_feedback),
                            subtitle = str(LocalContext.current, Str.send_feedback),
                            onClick = { onNavigate(NavigationRoute.HelpSupport) }
                        )
                    )
                )
            }
        }
    }
}

data class SettingsItem(
    val icon: ImageVector,
    val title: String,
    val subtitle: String,
    val onClick: () -> Unit,
    val trailing: (@Composable () -> Unit)? = null,
    val isDestructive: Boolean = false
)

@Composable
fun SettingsSection(
    title: String,
    items: List<SettingsItem>,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = title,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 8.dp)
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(0.dp)
            ) {
                items.forEachIndexed { index, item ->
                    SettingsItemRow(
                        item = item,
                        isFirst = index == 0,
                        isLast = index == items.size - 1
                    )
                    if (index < items.size - 1) {
                        DividerItem()
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsItemRow(
    item: SettingsItem,
    isFirst: Boolean,
    isLast: Boolean,
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    val shape = when {
        isFirst && isLast -> RoundedCornerShape(16.dp)
        isFirst -> RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 0.dp, bottomEnd = 0.dp)
        isLast -> RoundedCornerShape(topStart = 0.dp, topEnd = 0.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
        else -> RoundedCornerShape(0.dp)
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, shape)
            .clickable(onClick = item.onClick),
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = item.icon,
                    contentDescription = null,
                    tint = if (item.isDestructive) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp).padding(end = 16.dp)
                )
                Column(
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(
                        text = item.title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = if (item.isDestructive) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = item.subtitle,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            item.trailing?.invoke()

            if (item.trailing == null) {
                Icon(
                    imageVector = Icons.Filled.ChevronRight,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}