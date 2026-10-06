# JFLIPSTUDIO SERVER - copy finished mixes to the Dropbox delivery folder (Task Scheduler, every 10 min).
#   Work\Recording\<Client>\<Project>\Mixdown\*.wav  ->  D:\Dropbox\Complete\<Client>\*.wav
# Copy only. A re-exported mix (same name, new size/time) overwrites the old one;
# Dropbox keeps the previous version in its version history.

. "$PSScriptRoot\config.ps1"
$log = 'mixdown'
$stateFile = Join-Path $JF.Logs 'mixdown-state.txt'

$seen = @{}
if (Test-Path -LiteralPath $stateFile) {
    foreach ($l in [System.IO.File]::ReadAllLines($stateFile, $Utf8NoBom)) { $seen[$l] = $true }
}

$cutoff = (Get-Date).AddMinutes(-$JF.SettleMin)
foreach ($p in Get-JFProjects $JF.Work) {
    $mix = Join-Path $p.FullName 'Mixdown'
    if (-not [System.IO.Directory]::Exists($mix)) { continue }
    foreach ($f in (New-Object System.IO.DirectoryInfo($mix)).GetFiles()) {
        if ($f.Name.StartsWith('.')) { continue }                       # rsync temp files, ._ files
        if ($JF.MixdownExt -notcontains $f.Extension.ToLower()) { continue }
        if ($f.Length -eq 0 -or $f.LastWriteTime -gt $cutoff) { continue }

        $key = '{0}|{1}|{2}' -f $f.FullName, $f.Length, $f.LastWriteTimeUtc.Ticks
        if ($seen.ContainsKey($key)) { continue }

        $destDir = Join-Path $JF.CompleteDir $p.Client
        $dest = Join-Path $destDir $f.Name
        try {
            [System.IO.Directory]::CreateDirectory($destDir) | Out-Null
            $existed = [System.IO.File]::Exists($dest)
            [System.IO.File]::Copy($f.FullName, $dest, $true)
            Add-JFLine $stateFile $key
            $seen[$key] = $true
            Write-JFLog $log ('{0}  {1}/{2}  ->  Complete/{1}/' -f $(if ($existed) { 'UPDATED' } else { 'NEW    ' }), $p.Client, $f.Name)
        } catch {
            Write-JFLog $log "FAILED $($f.FullName): $($_.Exception.Message)"
        }
    }
}
