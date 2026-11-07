import re

content = "& Contact</string>"
pattern = r'&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)'

result = re.sub(pattern, '&', content)

print(f"Original bytes: {[hex(ord(c)) for c in content]}")
print(f"Result bytes:   {[hex(ord(c)) for c in result]}")
print(f"Equal: {result == content}")

# Check if & is in result
if '&' in result:
    print("Result contains &")
else:
    print("Result does NOT contain &")