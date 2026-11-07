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

    # Replace str(0xHEX) with str(LocalContext.current, 0xHEX)
    # But only for str calls with just one arg (or with varargs)
    # Pattern: str(0xHEX) or str(0xHEX, arg1, arg2, ...)
    def replace_str_call(match):
        full = match.group(0)
        args = match.group(1)
        if args.strip():
            return f'str(LocalContext.current, {args})'
        return full

    # Match str(0xHEX) or str(0xHEX, ...)
    content = re.sub(r'str\((0x[0-9A-Fa-f]+[^)]*)\)', replace_str_call, content)

    # Add LocalContext import if not present
    if 'import androidx.compose.ui.platform.LocalContext' not in content:
        # Add after package declaration
        content = content.replace(
            'package com.yadadristay.presentation',
            'package com.yadadristay.presentation\n\nimport androidx.compose.ui.platform.LocalContext'
        )

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {file_path}")
    else:
        print(f"No changes needed: {file_path}")

print("Done!")