import re

path = r"E:\YadadriStay\android-app\app\src\main\res\values\strings.xml"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)'

# Find all matches
matches = list(re.finditer(pattern, content))
print(f"Total matches: {len(matches)}")
for m in matches:
    print(f"  Pos {m.start()}: '{content[m.start():m.start()+15]}'")

# Do the sub on full content
new_content = re.sub(pattern, '&', content)

# Compare
if new_content == content:
    print("ERROR: new_content == content (no changes!)")
else:
    print("SUCCESS: new_content != content")
    # Find differences
    for i, (c1, c2) in enumerate(zip(content, new_content)):
        if c1 != c2:
            print(f"  Diff at {i}: '{c1}' (0x{ord(c1):X}) vs '{c2}' (0x{ord(c2):X})")
            break

# Write and verify
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

with open(path, 'r', encoding='utf-8') as f:
    verify = f.read()

matches2 = list(re.finditer(pattern, verify))
print(f"Remaining raw & after write: {len(matches2)}")