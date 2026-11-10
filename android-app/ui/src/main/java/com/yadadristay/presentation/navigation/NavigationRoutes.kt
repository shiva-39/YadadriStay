package com.yadadristay.presentation.navigation

/**
 * Navigation routes for the Yadadri Stay app.
 * Uses a sealed class for type-safe navigation.
 */
sealed class NavigationRoute(val route: String) {
    // Auth flow
    object Splash : NavigationRoute("splash")
    object Onboarding : NavigationRoute("onboarding")
    object Auth : NavigationRoute("auth")
    object AuthVerify : NavigationRoute("auth/verify")

    // Main flow
    object Home : NavigationRoute("home")
    object Search : NavigationRoute("search")
    data class LodgeDetail(val lodgeId: String) : NavigationRoute("lodge-detail/$lodgeId")
    data class RoomSelection(val lodgeId: String, val roomCategoryId: String) : NavigationRoute("room-selection/$lodgeId/$roomCategoryId")
    data class Booking(
        val lodgeId: String,
        val roomCategoryId: String,
        val checkIn: String,
        val checkOut: String,
        val guests: Int,
        val rooms: Int
    ) : NavigationRoute("booking/$lodgeId/$roomCategoryId/$checkIn/$checkOut/$guests/$rooms")
    data class Payment(val bookingId: String) : NavigationRoute("payment/$bookingId")
    data class BookingConfirmation(val bookingId: String) : NavigationRoute("booking-confirmation/$bookingId")

    // My Bookings
    object MyBookings : NavigationRoute("my-bookings")
    data class BookingDetail(val bookingId: String) : NavigationRoute("booking-detail/$bookingId")

    // Profile & Settings
    object Profile : NavigationRoute("profile")
    object Settings : NavigationRoute("settings")
    object EditProfile : NavigationRoute("edit-profile")
    object ChangePassword : NavigationRoute("change-password")
    object LanguageSettings : NavigationRoute("language-settings")
    object NotificationSettings : NavigationRoute("notification-settings")

    // Transport
    object Transport : NavigationRoute("transport")
    data class TransportDetail(val requestId: String) : NavigationRoute("transport-detail/$requestId")

    // Reviews
    data class Reviews(val lodgeId: String) : NavigationRoute("reviews/$lodgeId")
    data class WriteReview(val bookingId: String) : NavigationRoute("write-review/$bookingId")

    // Favorites
    object Favorites : NavigationRoute("favorites")
    object Notifications : NavigationRoute("notifications")

    // Support
    object HelpSupport : NavigationRoute("help-support")
    object TermsPrivacy : NavigationRoute("terms-privacy")

    companion object {
        fun getRoute(route: NavigationRoute): String = route.route
    }
}