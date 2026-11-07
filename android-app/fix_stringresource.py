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

    # Replace import of stringResource
    content = content.replace(
        'import androidx.compose.ui.res.stringResource',
        'import com.yadadristay.presentation.components.str'
    )

    # Replace stringResource(R.string.xxx) with str(R.string.xxx)
    # Handle both single argument and multiple arguments
    content = re.sub(r'stringResource\((R\.string\.\w+)\)', r'str(\1)', content)
    content = re.sub(r'stringResource\((R\.string\.\w+),\s*([^)]+)\)', r'str(\1, \2)', content)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {file_path}")
    else:
        print(f"No changes needed: {file_path}")

print("Done!")