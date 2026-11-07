import re

path = r"E:\YadadriStay\android-app\app\src\main\res\values\strings.xml"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Test the regex
pattern = r'&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)'
test_str = "& Contact"
match = re.search(pattern, test_str)
print(f"Test '& Contact': {match}")

test_str2 = "& Contact"
match2 = re.search(pattern, test_str2)
print(f"Test '& Contact': {match2}")

# Check what's at position 3934
idx = 3934
snippet = content[idx:idx+20]
print(f"Content at 3934: '{snippet}'")

# Try the substitution manually
result = re.sub(pattern, '&', snippet)
print(f"After sub: '{result}'")

# Try without raw string
pattern2 = '&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)'
result2 = re.sub(pattern2, '&', snippet)
print(f"After sub (no raw): '{result2}'")