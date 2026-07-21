$content = Get-Content -Path "c:\Users\ASUS\Desktop\trulicareProject1\frontend\src\components\InventoryManager.jsx" -Raw

$markerStart = "{/* 2. GLASSMORPHIC ADD/EDIT MEDICATION MODAL DIALOG */}"
$markerEnd = "{/* 3. URGENT DYNAMIC REFILL ALERTS */}"

$startIndex = $content.IndexOf($markerStart)
$endIndex = $content.IndexOf($markerEnd)

if ($startIndex -ne -1 -and $endIndex -ne -1) {
    $before = $content.Substring(0, $startIndex)
    $modal = $content.Substring($startIndex, $endIndex - $startIndex)
    $after = $content.Substring($endIndex)

    $modal = $modal -replace "bg-slate-950/80", "bg-slate-900/30"
    $modal = $modal -replace "bg-slate-900", "bg-white"
    $modal = $modal -replace "border-slate-800/80", "border-slate-100"
    $modal = $modal -replace "bg-slate-700", "bg-slate-200"
    $modal = $modal -replace "border-slate-800/60", "border-slate-100"
    $modal = $modal -replace "text-white", "text-[#1A4F5A]"
    $modal = $modal -replace "hover:bg-slate-850", "hover:bg-slate-100"
    $modal = $modal -replace "text-teal-400", "text-[#3ebcb5]"
    $modal = $modal -replace "bg-slate-950", "bg-slate-50"
    $modal = $modal -replace "border-slate-805", "border-slate-200"
    $modal = $modal -replace "text-slate-100", "text-slate-700"
    $modal = $modal -replace "bg-slate-955", "bg-slate-50"
    $modal = $modal -replace "border-slate-850", "border-slate-200"
    $modal = $modal -replace "border-slate-855", "border-slate-200"
    $modal = $modal -replace "border-slate-800", "border-slate-200"
    $modal = $modal -replace "text-slate-105", "text-slate-700"
    $modal = $modal -replace "text-slate-350", "text-[#1A4F5A]"
    $modal = $modal -replace "text-slate-300", "text-[#1A4F5A]"
    $modal = $modal -replace "text-slate-400", "text-slate-500"

    $newContent = $before + $modal + $after
    Set-Content -Path "c:\Users\ASUS\Desktop\trulicareProject1\frontend\src\components\InventoryManager.jsx" -Value $newContent -NoNewline
    Write-Host "Modal updated successfully."
} else {
    Write-Host "Markers not found."
}
