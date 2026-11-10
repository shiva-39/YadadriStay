package com.yadadristay.presentation.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.ExperimentalFoundationApi
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
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ProgressIndicatorDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yadadristay.presentation.components.str
import com.yadadristay.presentation.components.Str
import com.yadadristay.domain.repository.AuthState
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun SplashScreen(
    onNavigateToOnboarding: () -> Unit,
    onNavigateToHome: () -> Unit
) {
    val authViewModel: AuthViewModel = viewModel()
    val authState by authViewModel.authState.collectAsStateWithLifecycle(AuthState.Loading)
    val coroutineScope = rememberCoroutineScope()
    var hasNavigated by remember { mutableStateOf(false) }

    // Observe auth state and navigate accordingly after minimum splash duration
    androidx.compose.runtime.LaunchedEffect(authState) {
        if (!hasNavigated) {
            // Minimum splash duration
            delay(1500)
            hasNavigated = true
            when (authState) {
                is AuthState.Authenticated -> {
                    android.util.Log.d("YadadriStay", "SplashScreen: User authenticated, navigating to home")
                    onNavigateToHome()
                }
                is AuthState.Unauthenticated, AuthState.Loading -> {
                    android.util.Log.d("YadadriStay", "SplashScreen: User unauthenticated/loading, navigating to onboarding")
                    onNavigateToOnboarding()
                }
            }
        }
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Logo placeholder - using text for now
            Text(
                text = "🕉️",
                fontSize = 80.sp
            )
            Text(
                text = str(LocalContext.current, Str.app_name),
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = str(LocalContext.current, Str.app_tagline),
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            CircularProgressIndicator(
                modifier = Modifier.size(32.dp),
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(
    onFinish: () -> Unit,
    onSkip: () -> Unit
) {
    val context = LocalContext.current
    val title1 = str(context, Str.onboarding_title_1)
    val desc1 = str(context, Str.onboarding_desc_1)
    val title2 = str(context, Str.onboarding_title_2)
    val desc2 = str(context, Str.onboarding_desc_2)
    val title3 = str(context, Str.onboarding_title_3)
    val desc3 = str(context, Str.onboarding_desc_3)

    val pages = remember {
        listOf(
            OnboardingPage(
                image = "🏨",
                title = title1,
                description = desc1
            ),
            OnboardingPage(
                image = "🔍",
                title = title2,
                description = desc2
            ),
            OnboardingPage(
                image = "💳",
                title = title3,
                description = desc3
            )
        )
    }

    var currentPage by remember { mutableStateOf(0) }
    val pagerState = rememberPagerState(pageCount = { pages.size })
    val coroutineScope = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
        ) { page ->
            val pageData = pages[page]
            Column(
                modifier = Modifier.fillMaxSize().padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = pageData.image,
                    fontSize = 100.sp
                )
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.height(32.dp))
                Text(
                    text = pageData.title,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    textAlign = TextAlign.Center
                )
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = pageData.description,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 24.dp)
                )
            }
        }

        // Page indicators
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            pages.forEachIndexed { index, _ ->
                Box(
                    modifier = Modifier
                        .size(if (index == currentPage) 24.dp else 8.dp, 8.dp)
                        .padding(horizontal = 4.dp)
                        .background(
                            color = if (index == currentPage) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f),
                            shape = RoundedCornerShape(4.dp)
                        )
                )
            }
        }

        // Bottom buttons
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 24.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            if (currentPage < pages.size - 1) {
                TextButton(onClick = onSkip) {
                    Text(
                        text = str(LocalContext.current, Str.onboarding_skip),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(60.dp))
            }

            if (currentPage < pages.size - 1) {
                Button(
                    onClick = { coroutineScope.launch { pagerState.animateScrollToPage(currentPage + 1) } },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text(
                        text = str(LocalContext.current, Str.onboarding_next),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                }
            } else {
                Button(
                    onClick = onFinish,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text(
                        text = str(LocalContext.current, Str.onboarding_get_started),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                }
            }
        }
    }
}

data class OnboardingPage(
    val image: String,
    val title: String,
    val description: String
)