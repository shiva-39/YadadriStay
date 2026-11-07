import re

path = r"E:\YadadriStay\android-app\app\src\main\res\values\strings.xml"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all raw & with & (but not already escaped ones)
# This regex matches & that are NOT followed by a valid entity name
content = re.sub(r'&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)', '&', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("File fixed successfully")