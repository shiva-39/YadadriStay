import re

path = r"E:\YadadriStay\android-app\app\src\main\res\values\strings.xml"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Build replacement explicitly to avoid any encoding issues
replacement = '&' + 'amp;'
pattern = r'&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)'

new_content = re.sub(pattern, replacement, content)

print(f"Changes made: {new_content != content}")

if new_content != content:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("File written successfully")
else:
    print("No changes needed")

# Verify
with open(path, 'r', encoding='utf-8') as f:
    verify = f.read()

matches = list(re.finditer(pattern, verify))
print(f"Remaining raw & after fix: {len(matches)}")