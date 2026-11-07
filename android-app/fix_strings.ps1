$path = "E:\YadadriStay\android-app\app\src\main\res\values\strings.xml"
$content = Get-Content $path -Raw

# Replace all raw & with & using simple string replace
# First, protect already escaped entities by replacing them with placeholders
$content = $content.Replace("&", "___AMP___")
$content = $content.Replace("<", "___LT___")
$content = $content.Replace(">", "___GT___")
$content = $content.Replace(""", "___QUOT___")

# Now replace all remaining & with &
$content = $content.Replace("&", "&")

# Restore the placeholders
$content = $content.Replace("___AMP___", "&")
$content = $content.Replace("___LT___", "<")
$content = $content.Replace("___GT___", ">")
$content = $content.Replace("___QUOT___", """)

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "File fixed successfully"