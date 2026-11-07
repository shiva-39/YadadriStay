import re

# Read the string_ids.txt
with open(r"E:\YadadriStay\android-app\app\string_ids.txt", 'r') as f:
    lines = f.readlines()

# Parse the lines
entries = []
for line in lines:
    line = line.strip()
    if not line:
        continue
    parts = line.split()
    if len(parts) >= 2:
        name = parts[0]
        value = parts[1]
        # Convert hex to int
        try:
            int_val = int(value, 16)
            entries.append((name, int_val))
        except:
            pass

# Filter to only our custom strings (not system strings like abc_, m3c_, mtrl_, material_, etc.)
# Our custom strings are the ones we defined in strings.xml
custom_prefixes = [
    'about', 'account', 'add_guest', 'add_photo', 'add_photos', 'already_have_account',
    'amenities', 'amenities_filter', 'amount_to_pay', 'and_above', 'app_name', 'app_preferences',
    'app_tagline', 'app_version', 'appearance', 'apply_filters', 'auto', 'available_rooms',
    'avg_rating', 'based_on_reviews', 'be_first_to_review', 'bed_type', 'bike', 'book_now',
    'book_transport', 'book_transport_subtitle', 'booking_confirmed_message', 'booking_confirmed_title',
    'booking_details', 'booking_reference', 'browse_lodges', 'bus', 'cab', 'call', 'cancel',
    'cancel_ride', 'capacity', 'card_details', 'card_holder_name', 'card_number', 'card_payment',
    'change_password', 'confirm_password', 'confirmation_email_sms', 'contact_host_if_needed',
    'contact_us', 'continue_to_booking', 'continue_with_google', 'copy_upi_id', 'create_account',
    'credit_debit_card', 'customize_notifications', 'cvv', 'dark_mode', 'data_privacy', 'delete_account',
    'direct_bank_transfer', 'discount', 'done', 'dont_have_account', 'download_data', 'dropoff',
    'edit_profile', 'email', 'email_notifications', 'enjoy_stay', 'enter_card_holder_name',
    'enter_email', 'enter_full_name', 'enter_id_proof', 'enter_password', 'enter_phone',
    'enter_phone_or_email', 'error_network', 'error_server', 'error_unknown', 'expiry_date',
    'failed_to_load_booking_confirmation', 'failed_to_load_booking_details', 'failed_to_load_booking_for_review',
    'failed_to_load_lodge', 'failed_to_load_payment', 'failed_to_load_profile', 'failed_to_load_rooms',
    'favorites', 'filter_button', 'filters', 'font_size', 'forgot_password', 'full_name', 'get_started',
    'go_to_home', 'guest_details', 'guest_number', 'guest_reviews', 'guests', 'guests_count',
    'help_feedback', 'help_support', 'helpful', 'highest_rating', 'how_was_your_stay', 'included',
    'inclusive_of_taxes', 'invite_friends', 'join_yadadri_stay', 'language', 'load_more', 'loading',
    'location_contact', 'login', 'logout', 'lowest_rating', 'member_since', 'most_helpful',
    'my_bookings', 'my_favorites', 'my_requests', 'nearby_lodges', 'net_banking', 'newest', 'next',
    'next_steps', 'nights', 'no_bookings_found', 'no_bookings_message', 'no_internet', 'no_lodges_found',
    'no_lodges_nearby', 'no_photos_added', 'no_results', 'no_reviews_yet', 'no_rooms_available',
    'no_transport_message', 'no_transport_requests', 'not_available', 'notification_preferences',
    'notifications', 'ok', 'oldest', 'onboarding_desc_1', 'onboarding_desc_2', 'onboarding_desc_3',
    'onboarding_get_started', 'onboarding_next', 'onboarding_skip',
    'onboarding_title_1', 'onboarding_title_2', 'onboarding_title_3', 'or', 'or_pay_with', 'password',
    'pay_now', 'pay_via_upi_apps', 'payment', 'payment_security_details', 'paytm_phonepe_gpay',
    'per_night', 'permanently_delete', 'phone_or_email', 'pickup', 'popular_categories', 'price_breakdown',
    'price_range', 'primary_guest', 'privacy_policy', 'proceed_to_payment', 'processing', 'profile',
    'profile_book_transport', 'profile_reviews', 'profile_transport', 'property_type', 'push_notifications',
    'rate_app', 'rate_categories', 'rate_on_play_store', 'rating', 'read_privacy_policy', 'read_terms',
    'read_terms_privacy', 'receive_booking_updates', 'receive_confirmation', 'receive_email_updates',
    'receive_sms_updates', 'register', 'request_data_copy', 'response_from_lodge', 'results_found',
    'retry', 'reviews', 'reviews_you_wrote', 'ride_again', 'room_charges', 'room_number', 'room_type_filter',
    'rooms', 'rooms_count', 'rupee_symbol', 'save_card', 'save_this_reference', 'saved_lodges',
    'scan_to_pay', 'scan_with_upi_app', 'search', 'search_lodges', 'secure_payment', 'select_payment_method',
    'select_room', 'selected_rooms', 'send_feedback', 'settings', 'share_app', 'share_experience',
    'show_booking_reference', 'sign_in', 'sign_in_to_continue', 'sign_up', 'skip', 'sms_notifications',
    'sort_by', 'sort_distance', 'sort_price_high_low', 'sort_price_low_high', 'sort_rating',
    'special_requests', 'special_requests_hint', 'starting_from', 'stays', 'submit_review', 'success',
    'system_default', 'taxes_fees', 'terms_agreement', 'terms_of_service', 'terms_privacy',
    'total_amount', 'total_price', 'track_driver', 'transport', 'try_adjusting_filters', 'try_different_dates',
    'update_password', 'update_personal_info', 'upi_payment', 'view_all', 'view_all_reviews',
    'view_booking_details', 'view_manage_bookings', 'view_on_map', 'view_receipt', 'wallet', 'website',
    'welcome_back', 'welcome_subtitle', 'welcome_title', 'where_to', 'write_review', 'write_your_review',
    'yadadri_telangana', 'default_error_message'
]

custom_set = set(custom_prefixes)

# Filter entries
custom_entries = [(name, val) for name, val in entries if name in custom_set]

# Generate the Kotlin file
output = '''package com.yadadristay.presentation.components

/**
 * String resource ID constants with hardcoded values.
 * This avoids KSP parser issues with R.string.xxx nested class access.
 * Values extracted from build/intermediates/runtime_symbol_list/debug/processDebugResources/R.txt
 */
object Str {
'''

for name, val in sorted(custom_entries):
    output += f'    const val {name} = 0x{val:08X}\n'

output += '}\n'

with open(r"E:\YadadriStay\android-app\ui\src\main\java\com\yadadristay\presentation\components\StringResIds.kt", 'w') as f:
    f.write(output)

print(f"Generated {len(custom_entries)} constants")