import re

path = r"E:\YadadriStay\android-app\app\src\main\res\values\strings.xml"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the location_contact line
idx = content.find('location_contact')
if idx >= 0:
    snippet = content[idx:idx+100]
    print(f"Found at index {idx}:")
    for i, ch in enumerate(snippet):
        print(f"  {i}: '{ch}' (0x{ord(ch):X})")

# Test the regex
pattern = r'&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)'
matches = list(re.finditer(pattern, content))
print(f"\nRegex matches found: {len(matches)}")
for m in matches[:10]:
    print(f"  Position {m.start()}: '{content[m.start():m.start()+10]}'")

# Also check for any & in the file
all_amps = [i for i, ch in enumerate(content) if ch == '&']
print(f"\nAll & positions: {all_amps[:20]}")