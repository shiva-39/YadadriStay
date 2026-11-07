import re

content = "& Contact</string>"
pattern = r'&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)'

# Build replacement explicitly
replacement = '&' + 'amp;'
print(f"Replacement: '{replacement}'")
print(f"Replacement bytes: {[hex(ord(c)) for c in replacement]}")

result = re.sub(pattern, replacement, content)

print(f"Original bytes: {[hex(ord(c)) for c in content]}")
print(f"Result bytes:   {[hex(ord(c)) for c in result]}")
print(f"Equal: {result == content}")