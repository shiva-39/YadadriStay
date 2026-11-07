import re

path = r"E:\YadadriStay\android-app\app\src\main\res\values\strings.xml"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all raw & with &
pattern = r'&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)'
new_content = re.sub(pattern, '&', content)

if new_content != content:
    print("Changes made!")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("File written successfully")
else:
    print("No changes made!")

# Verify
with open(path, 'r', encoding='utf-8') as f:
    verify = f.read()

matches = list(re.finditer(pattern, verify))
print(f"Remaining raw & after fix: {len(matches)}")