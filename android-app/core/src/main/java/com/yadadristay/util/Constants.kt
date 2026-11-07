package com.yadadristay.util

object Constants {
    // API
    const val BASE_URL = "http://10.0.2.2:5000/api/" // 10.0.2.2 is localhost for Android emulator
    // For physical device, use: "http://YOUR_PC_IP:5000/api/"

    // Image base URL
    const val IMAGE_BASE_URL = "http://10.0.2.2:5000"

    // Preferences
    const val PREFS_NAME = "yadadri_stay_prefs"
    const val KEY_LANGUAGE = "language"
    const val KEY_CURRENCY = "currency"
    const val KEY_NOTIFICATIONS_ENABLED = "notifications_enabled"
    const val KEY_DARK_MODE = "dark_mode"
    const val KEY_FIRST_LAUNCH = "first_launch"
    const val KEY_ONBOARDING_COMPLETE = "onboarding_complete"

    // Defaults
    const val DEFAULT_LANGUAGE = "en"
    const val DEFAULT_CURRENCY = "INR"
    const val DEFAULT_NOTIFICATIONS_ENABLED = true

    // Pagination
    const val DEFAULT_PAGE_SIZE = 20
    const val MAX_PAGE_SIZE = 50

    // Date formats
    const val API_DATE_FORMAT = "yyyy-MM-dd"
    const val DISPLAY_DATE_FORMAT = "dd MMM yyyy"
    const val DISPLAY_DATETIME_FORMAT = "dd MMM yyyy, hh:mm a"
    const val TIME_FORMAT = "HH:mm"

    // Booking
    const val MIN_GUESTS = 1
    const val MAX_GUESTS = 10
    const val MIN_ROOMS = 1
    const val MAX_ROOMS = 5
    const val MAX_NIGHTS = 30
    const val MIN_ADVANCE_BOOKING_DAYS = 0
    const val MAX_ADVANCE_BOOKING_DAYS = 365

    // Payment
    const val UPI_PAYMENT_TIMEOUT_MINUTES = 15
    const val PAYMENT_VERIFICATION_TIMEOUT_HOURS = 24
    const val ADVANCE_PAYMENT_PERCENTAGE = 20

    // File upload
    const val MAX_IMAGE_SIZE_MB = 5
    val ALLOWED_IMAGE_TYPES = arrayOf("image/jpeg", "image/png", "image/webp")

    // Cache
    const val CACHE_SIZE_MB = 50
    const val CACHE_DURATION_HOURS = 24

    // Notification channels
    const val CHANNEL_BOOKINGS = "bookings_channel"
    const val CHANNEL_PAYMENTS = "payments_channel"
    const val CHANNEL_PROMOTIONS = "promotions_channel"
    const val CHANNEL_SYSTEM = "system_channel"

    // Intents
    const val EXTRA_LODGE_ID = "extra_lodge_id"
    const val EXTRA_ROOM_CATEGORY_ID = "extra_room_category_id"
    const val EXTRA_BOOKING_ID = "extra_booking_id"
    const val EXTRA_CHECK_IN = "extra_check_in"
    const val EXTRA_CHECK_OUT = "extra_check_out"
    const val EXTRA_GUESTS = "extra_guests"
    const val EXTRA_ROOMS = "extra_rooms"

    // Request codes
    const val REQUEST_CAMERA = 1001
    const val REQUEST_GALLERY = 1002
    const val REQUEST_LOCATION_PERMISSION = 1003
    const val REQUEST_CAMERA_PERMISSION = 1004
    const val REQUEST_STORAGE_PERMISSION = 1005

    // Animations
    const val ANIMATION_DURATION_SHORT = 200L
    const val ANIMATION_DURATION_MEDIUM = 300L
    const val ANIMATION_DURATION_LONG = 500L

    // Temple coordinates (Yadadri)
    const val TEMPLE_LATITUDE = 17.5886
    const val TEMPLE_LONGITUDE = 78.9428
}