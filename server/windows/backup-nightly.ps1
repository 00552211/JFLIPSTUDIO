# CONNECTSTUDIO SERVER - nightly backup of the active work area (Task Scheduler, 02:00).
#   1. D:\...\Work  -> E:\...\Backup\Work   (robocopy, copy-only: deletions on D: are NOT propagated)
#   2. D:\...\Work  -> Dropbox:/Recording    (rclone copy, copy-only: never deletes in Dropbox)
#   3. Writes D:\CONNECTSTUDIO\_system\server-status.txt (disk space, stale projects) for the Mac to read.

. "$PSScriptRoot\config.ps1"
$log = 'backup'
$ok = $true
Write-JFLog $log '==== nightly backup start'

# 1. second disk
robocopy $JF.Work $JF.WorkBackup /E /COPY:DAT /DCOPY:T /R:2 /W:5 /MT:8 /XF '.*' /NP /NDL /NFL `
    /LOG+:"$(Join-Path $JF.Logs 'backup-robocopy.log')" | Out-Null
$rc = $LASTEXITCODE
if ($rc -ge 8) { $ok = $false; Write-JFLog $log "robocopy FAILED exit=$rc" } else { Write-JFLog $log "robocopy ok exit=$rc" }

# 2. cloud
$rc = Invoke-JFRclone $log @('copy', $JF.Work, $JF.RemoteRec,
    '--transfers', '4', '--tpslimit', '12', '--exclude', '.*', '--exclude', '.DS_Store')
if ($rc -ne 0) { $ok = $false; Write-JFLog $log "rclone FAILED exit=$rc" } else { Write-JFLog $log 'rclone ok' }

# 3. status for humans
$lines = @("$($JF.StudioName) SERVER status  $(Get-Date -Format 'yyyy-MM-dd HH:mm')", '')
$lines += 'Last nightly backup: ' + $(if ($ok) { 'OK' } else { 'FAILED - check C:\CONNECTSTUDIO\logs\backup.log' })
$lines += ''
foreach ($d in 'C', 'D', 'E', 'F') {
    $v = Get-Volume -DriveLetter $d -ErrorAction SilentlyContinue
    if (-not $v -or -not $v.Size) { continue }
    $pct = [math]::Round(100 * $v.SizeRemaining / $v.Size)
    $warn = if ($pct -lt $JF.WarnFreePct) { '   <-- LOW SPACE' } else { '' }
    $lines += '{0}: {1,-12} free {2,6:N0} GB / {3,6:N0} GB ({4}%){5}' -f $d, $v.FileSystemLabel, ($v.SizeRemaining / 1GB), ($v.Size / 1GB), $pct, $warn
    if ($warn) { Write-JFLog $log "LOW SPACE on ${d}: ${pct}% free" }
}
$lines += '', "Projects untouched for $($JF.StaleDays)+ days without $($JF.DoneMarker) (finish them or mark done):"
$cut = (Get-Date).AddDays(-$JF.StaleDays)
foreach ($p in Get-JFProjects $JF.Work) {
    if (Test-Path -LiteralPath (Join-Path $p.FullName $JF.DoneMarker)) { continue }
    $newest = Get-JFFiles $p.FullName | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($newest -and $newest.LastWriteTime -lt $cut) { $lines += "  $($p.Rel)   (last change $($newest.LastWriteTime.ToString('yyyy-MM-dd')))" }
}
[System.IO.File]::WriteAllText((Join-Path $JF.System 'server-status.txt'), ($lines -join "`n") + "`n", $Utf8NoBom)

Write-JFLog $log ('==== nightly backup end: ' + $(if ($ok) { 'OK' } else { 'WITH ERRORS' }))
if (-not $ok) { exit 1 }
