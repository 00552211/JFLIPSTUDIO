# CONNECTSTUDIO SERVER - move finished projects from the SSD to the HDD archive (Task Scheduler, 04:00).
#
# A project is archived only when ALL of these are true:
#   - it contains the marker file _DONE (made on the Mac, arrives with the normal sync)
#   - nothing in it changed for QuietMinutes
#   - the HDD copy matches the SSD copy file by file (size + SHA256)
#   - Dropbox:/Recording/<Client>/<Project> matches the SSD copy (rclone check)
# Only then is it removed from D: (and from the E:\Backup\Work copy, which is now redundant)
# and listed in _system\archived.txt so the Mac stops re-sending it.
#
#   -DryRun   show what would happen, change nothing

param([switch]$DryRun)
. "$PSScriptRoot\config.ps1"
$log = 'archive'
$archivedList = Join-Path $JF.System 'archived.txt'
$quietCut = (Get-Date).AddMinutes(-$JF.QuietMinutes)

function Test-SameTree([string]$Src, [string]$Dst) {
    foreach ($f in Get-JFFiles $Src) {
        if ($f.Name.StartsWith('.')) { continue }   # robocopy /XF '.*' skips these on purpose
        $rel = $f.FullName.Substring($Src.Length).TrimStart('\')
        $d = Join-Path $Dst $rel
        if (-not [System.IO.File]::Exists($d)) { Write-JFLog $log "  missing on archive: $rel"; return $false }
        if ((New-Object System.IO.FileInfo($d)).Length -ne $f.Length) { Write-JFLog $log "  size differs: $rel"; return $false }
        $h1 = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash
        $h2 = (Get-FileHash -LiteralPath $d -Algorithm SHA256).Hash
        if ($h1 -ne $h2) { Write-JFLog $log "  hash differs: $rel"; return $false }
    }
    return $true
}

foreach ($p in Get-JFProjects $JF.Work) {
    if (-not [System.IO.File]::Exists((Join-Path $p.FullName $JF.DoneMarker))) { continue }

    $files = Get-JFFiles $p.FullName
    $newest = $files | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $newest) { continue }
    if ($newest.LastWriteTime -gt $quietCut) { Write-JFLog $log "WAIT  $($p.Rel) (changed $($newest.LastWriteTime))"; continue }

    $sizeGB = [math]::Round((($files | Measure-Object Length -Sum).Sum) / 1GB, 2)
    $dst = Join-Path (Join-Path $JF.Archive $p.Client) $p.Project
    $remote = "$($JF.RemoteRec)/$($p.Client)/$($p.Project)"
    Write-JFLog $log "START $($p.Rel)  $sizeGB GB  -> $dst"
    if ($DryRun) { Write-JFLog $log '  (dry run - nothing changed)'; continue }

    # 0. same client/song name from another store already in the archive? never merge them
    $o1 = Join-Path $p.FullName '_ORIGIN.txt'; $o2 = Join-Path $dst '_ORIGIN.txt'
    if ([System.IO.File]::Exists($o1) -and [System.IO.File]::Exists($o2) -and
        ([System.IO.File]::ReadAllText($o1).Trim() -ne [System.IO.File]::ReadAllText($o2).Trim())) {
        Write-JFLog $log "FAIL  archive already has a project with this name from another store - kept on D: (rename one of them)"
        continue
    }

    # 1. SSD -> HDD
    robocopy $p.FullName $dst /E /COPY:DAT /DCOPY:T /R:2 /W:5 /XF '.*' /NP /NDL /NFL `
        /LOG+:"$(Join-Path $JF.Logs 'archive-robocopy.log')" | Out-Null
    if ($LASTEXITCODE -ge 8) { Write-JFLog $log "FAIL  robocopy exit=$LASTEXITCODE - kept on D:"; continue }

    # 2. verify HDD copy
    if (-not (Test-SameTree $p.FullName $dst)) { Write-JFLog $log 'FAIL  archive verify - kept on D:'; continue }

    # 3. make sure Dropbox has it too, then verify
    $rc = Invoke-JFRclone $log @('copy', $p.FullName, $remote, '--exclude', '.*')
    if ($rc -ne 0) { Write-JFLog $log "FAIL  rclone copy exit=$rc - kept on D:"; continue }
    $rc = Invoke-JFRclone $log @('check', $p.FullName, $remote, '--one-way', '--exclude', '.*')
    if ($rc -ne 0) { Write-JFLog $log "FAIL  rclone check exit=$rc - kept on D:"; continue }

    # 4. record + remove from the work area
    Add-JFLine $archivedList ("{0}`t{1}" -f $p.Rel, (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'))
    $bak = Join-Path (Join-Path $JF.WorkBackup $p.Client) $p.Project
    if ([System.IO.Directory]::Exists($bak)) { [System.IO.Directory]::Delete($bak, $true) }
    [System.IO.Directory]::Delete($p.FullName, $true)
    $clientDir = Join-Path $JF.Work $p.Client
    if ([System.IO.Directory]::GetFileSystemEntries($clientDir).Count -eq 0) { [System.IO.Directory]::Delete($clientDir) }
    Write-JFLog $log "DONE  $($p.Rel)  (HDD + Dropbox verified, removed from D:)"
}
