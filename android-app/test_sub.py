import re

# Test the sub directly
content = "& Contact</string>"
pattern = r'&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)'

print(f"Original: '{content}'")
print(f"Pattern: {pattern}")

result = re.sub(pattern, '&', content)
print(f"Result: '{result}'")
print(f"Equal: {result == content}")

# Check character by character
for i, (c1, c2) in enumerate(zip(content, result)):
    if c1 != c2:
        print(f"Diff at {i}: '{c1}' (0x{ord(c1):X}) vs '{c2}' (0x{ord(c2):X})")