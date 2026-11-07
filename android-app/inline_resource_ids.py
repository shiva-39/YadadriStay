import re
import os

# Read the hardcoded values from StringResIds.kt
str_file = r"E:\YadadriStay\android-app\app\src\main\java\com\yadadristay\presentation\components\StringResIds.kt"
with open(str_file, 'r', encoding='utf-8') as f:
    str_content = f.read()

# Extract constants
constants = {}
for line in str_content.split('\n'):
    line = line.strip()
    if line.startswith('const val '):
        parts = line.replace('const val ', '').split(' = ')
        if len(parts) == 2:
            name = parts[0].strip()
            value = parts[1].strip().rstrip(',')
            constants[name] = value

print(f"Loaded {len(constants)} constants")

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

    # Replace str(R.string.xxx) with str(0xHEX)
    def replace_str(match):
        full = match.group(0)
        name = match.group(1)
        if name in constants:
            return f'str({constants[name]})'
        return full

    content = re.sub(r'str\(R\.string\.(\w+)\)', replace_str, content)

    # Remove R import
    content = content.replace('import com.yadadristay.R\n', '')
    content = content.replace('import com.yadadristay.R', '')

    # Remove Str import
    content = content.replace('import com.yadadristay.presentation.components.Str\n', '')
    content = content.replace('import com.yadadristay.presentation.components.Str', '')

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {file_path}")
    else:
        print(f"No changes needed: {file_path}")

print("Done!")