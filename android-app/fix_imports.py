import re
import os

files_to_fix = [
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\booking\BookingConfirmationScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\booking\BookingScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\booking\PaymentScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\booking\RoomSelectionScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\lodgedetail\LodgeDetailScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\profile\ProfileScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\reviews\WriteReviewScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\reviews\ReviewsScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\transport\TransportScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\profile\SettingsScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\mybookings\MyBookingsScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\search\SearchScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\home\HomeScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\auth\RegisterScreen.kt",
    r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\auth\AuthScreens.kt",
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Fix any corrupted imports
    content = content.replace('import androidx.compose.ui.platform.LocalContext.booking', '')

    # Add import for Str if not present
    if 'import com.yadadristay.presentation.components.Str' not in content:
        # Add after the stringResource import
        if 'import androidx.compose.ui.res.stringResource' in content:
            content = content.replace(
                'import androidx.compose.ui.res.stringResource',
                'import androidx.compose.ui.res.stringResource\nimport com.yadadristay.presentation.components.Str'
            )
        else:
            # Add after package declaration
            content = content.replace(
                'package com.yadadristay.presentation',
                'package com.yadadristay.presentation\n\nimport androidx.compose.ui.res.stringResource\nimport com.yadadristay.presentation.components.Str'
            )

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed imports: {file_path}")
    else:
        print(f"No changes needed: {file_path}")

print("Done!")