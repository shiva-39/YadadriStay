$path = "E:\YadadriStay\android-app\app\src\main\res\values\strings.xml"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$lines = $content.Split("`n")
$line = $lines[73]
Write-Host "Line 74: $line"
Write-Host "Length: $($line.Length)"
for ($i = 0; $i -lt $line.Length; $i++) {
    $c = $line[$i]
    $code = [int]$c
    $hex = $code.ToString("X")
    Write-Host ("Pos {0}: char='{1}' code=0x{2}" -f $i, $c, $hex)
}