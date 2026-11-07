import re

path = r"E:\YadadriStay\android-app\app\src\main\res\values\strings.xml"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix single quotes - escape them as \'
# We need to be careful to only escape ' inside string content, not in XML attributes
# Pattern: find <string name="...">content</string> and escape ' in content
def escape_single_quotes(match):
    full_match = match.group(0)
    tag_start = match.group(1)
    string_content = match.group(2)
    tag_end = match.group(3)
    # Escape single quotes in the content
    escaped_content = string_content.replace("'", "\\'")
    return f'{tag_start}{escaped_content}{tag_end}'

# This regex finds string elements and captures the content
pattern = r'(<string name="[^"]*">)([^<]*)(</string>)'
content = re.sub(pattern, escape_single_quotes, content)

# Fix format specifiers - %1 -> %1$d or %1$s
# For strings that are clearly numbers (nights, rooms, guests, reviews, count)
# For member_since, it's a string (%1$s)
content = content.replace('%1 guests', '%1$d guests')
content = content.replace('%1 rooms', '%1$d rooms')
content = content.replace('%1 Available Rooms', '%1$d Available Rooms')
content = content.replace('%1 rooms selected', '%1$d rooms selected')
content = content.replace('Room %1', 'Room %1$d')
content = content.replace('Room Charges (%1 nights)', 'Room Charges (%1$d nights)')
content = content.replace('Guest %1', 'Guest %1$d')
content = content.replace('Based on %1 reviews', 'Based on %1$d reviews')
content = content.replace('Helpful (%1)', 'Helpful (%1$d)')
content = content.replace('Member since %1', 'Member since %1$s')
content = content.replace('%1 results found', '%1$d results found')

# Write back
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("File fixed successfully")

# Verify
with open(path, 'r', encoding='utf-8') as f:
    verify = f.read()

# Check for raw single quotes in string content
import re
strings = re.findall(r'<string name="[^"]*">([^<]*)</string>', verify)
for i, s in enumerate(strings):
    if "'" in s and "\\'" not in s:
        print(f"WARNING: String {i} has unescaped single quote: {s[:50]}")

# Check format specifiers
format_specs = re.findall(r'%1[^$]', verify)
if format_specs:
    print(f"WARNING: Found format specifiers without $: {format_specs}")
else:
    print("All format specifiers look good")