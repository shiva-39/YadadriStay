package com.yadadristay.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.yadadristay.presentation.auth.AuthScreen
import com.yadadristay.presentation.auth.AuthViewModel
import com.yadadristay.presentation.auth.OnboardingScreen
import com.yadadristay.presentation.auth.RegisterScreen
import com.yadadristay.presentation.auth.SplashScreen
import com.yadadristay.presentation.booking.BookingConfirmationScreen
import com.yadadristay.presentation.booking.BookingConfirmationViewModel
import com.yadadristay.presentation.booking.BookingScreen
import com.yadadristay.presentation.booking.BookingViewModel
import com.yadadristay.presentation.booking.PaymentScreen
import com.yadadristay.presentation.booking.PaymentViewModel
import com.yadadristay.presentation.booking.RoomSelectionScreen
import com.yadadristay.presentation.booking.RoomSelectionViewModel
import com.yadadristay.presentation.home.HomeScreen
import com.yadadristay.presentation.home.HomeViewModel
import com.yadadristay.presentation.lodgedetail.LodgeDetailScreen
import com.yadadristay.presentation.lodgedetail.LodgeDetailViewModel
import com.yadadristay.presentation.mybookings.MyBookingsScreen
import com.yadadristay.presentation.mybookings.MyBookingsViewModel
import com.yadadristay.presentation.navigation.NavigationRoute
import com.yadadristay.presentation.profile.ProfileScreen
import com.yadadristay.presentation.profile.ProfileViewModel
import com.yadadristay.presentation.profile.SettingsScreen
import com.yadadristay.presentation.profile.SettingsViewModel
import com.yadadristay.presentation.reviews.ReviewsScreen
import com.yadadristay.presentation.reviews.ReviewsViewModel
import com.yadadristay.presentation.reviews.WriteReviewScreen
import com.yadadristay.presentation.reviews.WriteReviewViewModel
import com.yadadristay.presentation.search.SearchScreen
import com.yadadristay.presentation.search.SearchViewModel
import com.yadadristay.presentation.transport.TransportScreen
import com.yadadristay.presentation.transport.TransportViewModel
import android.util.Log

@Composable
fun AppNavHost() {
    val navController = rememberNavController()
    val startDestination = NavigationRoute.Splash.route

    NavHost(navController, startDestination) {
        appNavHostGraph(navController)
    }
}

fun NavGraphBuilder.appNavHostGraph(navController: NavController) {
    // Auth Flow
    composable(NavigationRoute.Splash.route) {
        SplashScreen(
            onNavigateToOnboarding = {
                navController.navigate(NavigationRoute.Onboarding.route) {
                    popUpTo(NavigationRoute.Splash.route) { inclusive = true }
                }
            },
            onNavigateToHome = {
                navController.navigate(NavigationRoute.Home.route) {
                    popUpTo(NavigationRoute.Splash.route) { inclusive = true }
                }
            }
        )
    }

    composable(NavigationRoute.Onboarding.route) {
        OnboardingScreen(
            onFinish = {
                navController.navigate(NavigationRoute.Auth.route) {
                    popUpTo(NavigationRoute.Onboarding.route) { inclusive = true }
                }
            },
            onSkip = {
                navController.navigate(NavigationRoute.Auth.route) {
                    popUpTo(NavigationRoute.Onboarding.route) { inclusive = true }
                }
            }
        )
    }

    composable(NavigationRoute.Auth.route) {
        AuthScreen(
            viewModel = hiltViewModel<AuthViewModel>(),
            onLoginSuccess = {
                navController.navigate(NavigationRoute.Home.route) {
                    popUpTo(NavigationRoute.Auth.route) { inclusive = true }
                }
            },
            onNavigateToRegister = {
                navController.navigate(NavigationRoute.AuthVerify.route)
            }
        )
    }

    composable(NavigationRoute.AuthVerify.route) {
        RegisterScreen(
            viewModel = hiltViewModel<AuthViewModel>(),
            onRegisterSuccess = {
                navController.navigate(NavigationRoute.Home.route) {
                    popUpTo(NavigationRoute.Auth.route) { inclusive = true }
                }
            },
            onNavigateToLogin = {
                navController.popBackStack()
            }
        )
    }

    // Main Flow
    composable(NavigationRoute.Home.route) {
        HomeScreen(
            viewModel = hiltViewModel<HomeViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.Search.route) {
        SearchScreen(
            viewModel = hiltViewModel<SearchViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(
        route = "lodge-detail/{lodgeId}"
    ) { backStackEntry ->
        val lodgeId = backStackEntry.arguments?.getString("lodgeId")
        if (lodgeId.isNullOrBlank()) {
            Log.w("YadadriStay", "Invalid lodgeId in route, popping back")
            LaunchedEffect(Unit) { navController.popBackStack() }
            return@composable
        }
        LodgeDetailScreen(
            lodgeId = lodgeId,
            viewModel = hiltViewModel<LodgeDetailViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(
        route = "room-selection/{lodgeId}/{roomCategoryId}"
    ) { backStackEntry ->
        val lodgeId = backStackEntry.arguments?.getString("lodgeId")
        val roomCategoryId = backStackEntry.arguments?.getString("roomCategoryId")
        if (lodgeId.isNullOrBlank() || roomCategoryId.isNullOrBlank()) {
            Log.w("YadadriStay", "Invalid route args for room-selection, popping back")
            LaunchedEffect(Unit) { navController.popBackStack() }
            return@composable
        }
        RoomSelectionScreen(
            lodgeId = lodgeId,
            roomCategoryId = roomCategoryId,
            viewModel = hiltViewModel<RoomSelectionViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(
        route = "booking/{lodgeId}/{roomCategoryId}/{checkIn}/{checkOut}/{guests}/{rooms}"
    ) { backStackEntry ->
        val args = backStackEntry.arguments
        val lodgeId = args?.getString("lodgeId")
        val roomCategoryId = args?.getString("roomCategoryId")
        val checkIn = args?.getString("checkIn")
        val checkOut = args?.getString("checkOut")
        val guests = args?.getInt("guests") ?: 1
        val rooms = args?.getInt("rooms") ?: 1

        if (lodgeId.isNullOrBlank() || roomCategoryId.isNullOrBlank() || checkIn.isNullOrBlank() || checkOut.isNullOrBlank()) {
            Log.w("YadadriStay", "Invalid route args for booking, popping back")
            LaunchedEffect(Unit) { navController.popBackStack() }
            return@composable
        }
        BookingScreen(
            lodgeId = lodgeId,
            roomCategoryId = roomCategoryId,
            checkIn = checkIn,
            checkOut = checkOut,
            guests = guests,
            rooms = rooms,
            viewModel = hiltViewModel<BookingViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(
        route = "payment/{bookingId}"
    ) { backStackEntry ->
        val bookingId = backStackEntry.arguments?.getString("bookingId")
        if (bookingId.isNullOrBlank()) {
            Log.w("YadadriStay", "Invalid bookingId in route, popping back")
            LaunchedEffect(Unit) { navController.popBackStack() }
            return@composable
        }
        PaymentScreen(
            bookingId = bookingId,
            viewModel = hiltViewModel<PaymentViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(
        route = "booking-confirmation/{bookingId}"
    ) { backStackEntry ->
        val bookingId = backStackEntry.arguments?.getString("bookingId")
        if (bookingId.isNullOrBlank()) {
            Log.w("YadadriStay", "Invalid bookingId in route, popping back")
            LaunchedEffect(Unit) { navController.popBackStack() }
            return@composable
        }
        BookingConfirmationScreen(
            bookingId = bookingId,
            viewModel = hiltViewModel<BookingConfirmationViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.MyBookings.route) {
        MyBookingsScreen(
            viewModel = hiltViewModel<MyBookingsViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(
        route = "booking-detail/{bookingId}"
    ) { backStackEntry ->
        val bookingId = backStackEntry.arguments?.getString("bookingId")
        if (bookingId.isNullOrBlank()) {
            Log.w("YadadriStay", "Invalid bookingId in route, popping back")
            LaunchedEffect(Unit) { navController.popBackStack() }
            return@composable
        }
        MyBookingsScreen(
            viewModel = hiltViewModel<MyBookingsViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.Profile.route) {
        ProfileScreen(
            viewModel = hiltViewModel<ProfileViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.Settings.route) {
        SettingsScreen(
            viewModel = hiltViewModel<SettingsViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.EditProfile.route) {
        ProfileScreen(
            viewModel = hiltViewModel<ProfileViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.ChangePassword.route) {
        SettingsScreen(
            viewModel = hiltViewModel<SettingsViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.LanguageSettings.route) {
        SettingsScreen(
            viewModel = hiltViewModel<SettingsViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.NotificationSettings.route) {
        SettingsScreen(
            viewModel = hiltViewModel<SettingsViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.Favorites.route) {
        MyBookingsScreen(
            viewModel = hiltViewModel<MyBookingsViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.Transport.route) {
        TransportScreen(
            viewModel = hiltViewModel<TransportViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(
        route = "transport-detail/{requestId}"
    ) { backStackEntry ->
        val requestId = backStackEntry.arguments?.getString("requestId")
        if (requestId.isNullOrBlank()) {
            Log.w("YadadriStay", "Invalid requestId in route, popping back")
            LaunchedEffect(Unit) { navController.popBackStack() }
            return@composable
        }
        TransportScreen(
            viewModel = hiltViewModel<TransportViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(
        route = "reviews/{lodgeId}"
    ) { backStackEntry ->
        val lodgeId = backStackEntry.arguments?.getString("lodgeId")
        if (lodgeId.isNullOrBlank()) {
            Log.w("YadadriStay", "Invalid lodgeId in route, popping back")
            LaunchedEffect(Unit) { navController.popBackStack() }
            return@composable
        }
        ReviewsScreen(
            lodgeId = lodgeId,
            viewModel = hiltViewModel<ReviewsViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(
        route = "write-review/{bookingId}"
    ) { backStackEntry ->
        val bookingId = backStackEntry.arguments?.getString("bookingId")
        if (bookingId.isNullOrBlank()) {
            Log.w("YadadriStay", "Invalid bookingId in route, popping back")
            LaunchedEffect(Unit) { navController.popBackStack() }
            return@composable
        }
        WriteReviewScreen(
            bookingId = bookingId,
            viewModel = hiltViewModel<WriteReviewViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.HelpSupport.route) {
        SettingsScreen(
            viewModel = hiltViewModel<SettingsViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }

    composable(NavigationRoute.TermsPrivacy.route) {
        SettingsScreen(
            viewModel = hiltViewModel<SettingsViewModel>(),
            onNavigate = { route ->
                navigateToRoute(navController, route)
            }
        )
    }
}

private fun navigateToRoute(navController: NavController, route: NavigationRoute) {
    when (route) {
        is NavigationRoute.Splash -> navController.navigate(route.route)
        is NavigationRoute.Onboarding -> navController.navigate(route.route)
        is NavigationRoute.Auth -> navController.navigate(route.route)
        is NavigationRoute.AuthVerify -> navController.navigate(route.route)
        is NavigationRoute.Home -> navController.navigate(route.route) { popUpTo(NavigationRoute.Home.route) { inclusive = true } }
        is NavigationRoute.Search -> navController.navigate(route.route)
        is NavigationRoute.LodgeDetail -> navController.navigate(route.route)
        is NavigationRoute.RoomSelection -> navController.navigate(route.route)
        is NavigationRoute.Booking -> navController.navigate(route.route)
        is NavigationRoute.Payment -> navController.navigate(route.route)
        is NavigationRoute.BookingConfirmation -> navController.navigate(route.route)
        is NavigationRoute.MyBookings -> navController.navigate(route.route)
        is NavigationRoute.BookingDetail -> navController.navigate(route.route)
        is NavigationRoute.Profile -> navController.navigate(route.route)
        is NavigationRoute.Settings -> navController.navigate(route.route)
        is NavigationRoute.EditProfile -> navController.navigate(route.route)
        is NavigationRoute.ChangePassword -> navController.navigate(route.route)
        is NavigationRoute.LanguageSettings -> navController.navigate(route.route)
        is NavigationRoute.NotificationSettings -> navController.navigate(route.route)
        is NavigationRoute.Favorites -> navController.navigate(route.route)
        is NavigationRoute.Notifications -> navController.navigate(route.route)
        is NavigationRoute.Transport -> navController.navigate(route.route)
        is NavigationRoute.TransportDetail -> navController.navigate(route.route)
        is NavigationRoute.Reviews -> navController.navigate(route.route)
        is NavigationRoute.WriteReview -> navController.navigate(route.route)
        is NavigationRoute.HelpSupport -> navController.navigate(route.route)
        is NavigationRoute.TermsPrivacy -> navController.navigate(route.route)
    }
}