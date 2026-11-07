import re

# Read the current R.txt to get correct IDs
r_txt_path = r"E:\YadadriStay\android-app\app\build\intermediates\runtime_symbol_list\debug\processDebugResources\R.txt"
string_ids_path = r"E:\YadadriStay\android-app\app\string_ids.txt"

# Parse R.txt for string entries
r_entries = {}
with open(r_txt_path, 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith('int string '):
            parts = line.split()
            if len(parts) >= 4:
                name = parts[2]
                value = parts[3]
                r_entries[name] = value

# Read string_ids.txt
with open(string_ids_path, 'r') as f:
    lines = f.readlines()

# Update the onboarding entries and add missing ones
onboarding_corrections = {
    'onboarding_desc_1': '0x7f0f023d',
    'onboarding_desc_2': '0x7f0f023e',
    'onboarding_desc_3': '0x7f0f023f',
    'onboarding_get_started': '0x7f0f0240',
    'onboarding_next': '0x7f0f0241',
    'onboarding_skip': '0x7f0f0242',
    'onboarding_title_1': '0x7f0f0243',
    'onboarding_title_2': '0x7f0f0244',
    'onboarding_title_3': '0x7f0f0245',
}

# Process lines and update
new_lines = []
onboarding_found = set()

for line in lines:
    line = line.rstrip('\n')
    parts = line.split()
    if len(parts) >= 2 and parts[0] in onboarding_corrections:
        # Update this line
        new_lines.append(f"{parts[0]} {onboarding_corrections[parts[0]]}")
        onboarding_found.add(parts[0])
    else:
        new_lines.append(line)

# Add any missing onboarding entries
for name, value in onboarding_corrections.items():
    if name not in onboarding_found:
        new_lines.append(f"{name} {value}")

# Write back
with open(string_ids_path, 'w') as f:
    f.write('\n'.join(new_lines) + '\n')

print("Updated string_ids.txt with correct onboarding IDs")
print("Added/updated entries:")
for name, value in onboarding_corrections.items():
    print(f"  {name} = {value}")