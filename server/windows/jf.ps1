# JFLIPSTUDIO SERVER - single entry point for Claude Code (and humans).
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/jf.ps1 <command> [args]
#
# Read-only (safe to run any time):
#   status                  JSON: drives, disk health, tasks, work projects, pending archive, errors, Mac sync
#   logs <name> [lines]     tail C:\JFLIPSTUDIO\logs\<name>.log  (backup|archive|mixdown|migrate|...)
#   tasks                   scheduled task states
#   setup-check             which setup phases are done (JSON)
#   archive-dryrun          what archive-completed would do now
# Changes something (Claude must ask the user first):
#   run <task>              start a scheduled task now: backup-nightly | archive-completed | mixdown-to-complete
#   mark-done <Client/Project>   create _DONE in a work project (it will be archived at the next archive run)

param([Parameter(Position = 0)][string]$Command = 'status',
      [Parameter(Position = 1)][string]$Arg1,
      [Parameter(Position = 2)][string]$Arg2)

$enc = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $enc
$OutputEncoding = $enc
. "$PSScriptRoot\config.ps1"

$TaskNames = @('mixdown-to-complete', 'backup-nightly', 'archive-completed', 'daily-report')

function Get-TaskInfoList {
    foreach ($n in $TaskNames) {
        $t = Get-ScheduledTask -TaskPath '\JFLIPSTUDIO\' -TaskName $n -ErrorAction SilentlyContinue
        if (-not $t) { [pscustomobject]@{ name = $n; registered = $false }; continue }
        $i = $t | Get-ScheduledTaskInfo
        [pscustomobject]@{
            name = $n; registered = $true; state = "$($t.State)"
            lastRun = if ($i.LastRunTime -and $i.LastRunTime.Year -gt 2000) { $i.LastRunTime.ToString('s') } else { $null }
            lastResult = $i.LastTaskResult; lastResultOk = ($i.LastTaskResult -in 0, 267009, 267011)
            nextRun = if ($i.NextRunTime) { $i.NextRunTime.ToString('s') } else { $null }
        }
    }
}

function Get-LogTail([string]$Name, [int]$Lines) {
    $p = Join-Path $JF.Logs "$Name.log"
    if (-not (Test-Path -LiteralPath $p)) { return @() }
    return @(Get-Content -LiteralPath $p -Encoding UTF8 -Tail $Lines)
}

function Get-RecentProblems {
    $since = (Get-Date).AddHours(-24)
    $out = @()
    foreach ($n in 'backup', 'archive', 'mixdown', 'migrate') {
        foreach ($l in Get-LogTail $n 400) {
            if ($l -notmatch 'FAIL|LOW SPACE|NOT COMPLETE|ERROR') { continue }
            $t = $null
            if ($l.Length -ge 19 -and [datetime]::TryParse($l.Substring(0, 19), [ref]$t) -and $t -lt $since) { continue }
            $out += "[$n] $l"
        }
    }
    return $out
}

function Get-Status {
    $drives = foreach ($d in 'C', 'D', 'E', 'F', 'G') {
        $v = Get-Volume -DriveLetter $d -ErrorAction SilentlyContinue
        if (-not $v -or -not $v.Size) { continue }
        [pscustomobject]@{ drive = $d; label = $v.FileSystemLabel; sizeGB = [math]::Round($v.Size / 1GB)
            freeGB = [math]::Round($v.SizeRemaining / 1GB); freePct = [math]::Round(100 * $v.SizeRemaining / $v.Size)
            low = ((100 * $v.SizeRemaining / $v.Size) -lt $JF.WarnFreePct) }
    }
    $disks = Get-PhysicalDisk -ErrorAction SilentlyContinue | ForEach-Object {
        [pscustomobject]@{ name = $_.FriendlyName; media = "$($_.MediaType)"; sizeGB = [math]::Round($_.Size / 1GB)
            health = "$($_.HealthStatus)"; operational = "$($_.OperationalStatus)" }
    }
    $stale = (Get-Date).AddDays(-$JF.StaleDays)
    $projects = foreach ($p in Get-JFProjects $JF.Work) {
        $files = Get-JFFiles $p.FullName
        $newest = $files | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $hasDone = [System.IO.File]::Exists((Join-Path $p.FullName $JF.DoneMarker))
        [pscustomobject]@{ project = $p.Rel; sizeGB = [math]::Round((($files | Measure-Object Length -Sum).Sum) / 1GB, 2)
            lastChange = if ($newest) { $newest.LastWriteTime.ToString('s') } else { $null }
            done = $hasDone; stale = ((-not $hasDone) -and $newest -and $newest.LastWriteTime -lt $stale) }
    }
    $archivedFile = Join-Path $JF.System 'archived.txt'
    $archived = if (Test-Path -LiteralPath $archivedFile) { @([System.IO.File]::ReadAllLines($archivedFile, $enc) | Where-Object { $_ }) } else { @() }
    $macSync = Join-Path $JF.System 'mac-last-sync.txt'
    [pscustomobject]@{
        generated     = (Get-Date).ToString('s')
        host          = $env:COMPUTERNAME
        drives        = @($drives)
        physicalDisks = @($disks)
        tasks         = @(Get-TaskInfoList)
        dropboxAppRunning = [bool](Get-Process -Name Dropbox -ErrorAction SilentlyContinue)
        smbSessions   = @(Get-SmbSession -ErrorAction SilentlyContinue | ForEach-Object { "$($_.ClientUserName) from $($_.ClientComputerName)" })
        macLastSync   = if (Test-Path -LiteralPath $macSync) { ([System.IO.File]::ReadAllText($macSync, $enc)).Trim() } else { $null }
        work          = [pscustomobject]@{
            projectCount = @($projects).Count
            totalGB      = [math]::Round((@($projects) | Measure-Object sizeGB -Sum).Sum, 1)
            pendingArchive = @($projects | Where-Object done | ForEach-Object project)
            staleProjects  = @($projects | Where-Object stale | ForEach-Object project)
            projects       = @($projects)
        }
        archivedCount = $archived.Count
        recentlyArchived = @($archived | Select-Object -Last 5)
        problemsLast24h  = @(Get-RecentProblems)
        lastLogLines  = [pscustomobject]@{ backup = @(Get-LogTail 'backup' 6); archive = @(Get-LogTail 'archive' 6); mixdown = @(Get-LogTail 'mixdown' 6) }
    }
}

function Get-SetupCheck {
    $vol = { param($l) $v = Get-Volume -DriveLetter $l -ErrorAction SilentlyContinue; [bool]($v -and $v.FileSystem -eq 'NTFS') }
    $remoteOk = $false
    if ((Test-Path $JF.RcloneExe) -and (Test-Path $JF.RcloneConf)) {
        $remoteOk = [bool]((& $JF.RcloneExe --config $JF.RcloneConf listremotes 2>$null) -match '^dropbox:$')
    }
    $dbxInfo = Join-Path $env:LOCALAPPDATA 'Dropbox\info.json'
    $dbxPath = $null
    if (Test-Path $dbxInfo) { try { $dbxPath = ((Get-Content $dbxInfo -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | Select-Object -First 1).Value.path } catch {} }
    $mig = Get-LogTail 'migrate' 2000
    $claude = Get-Command claude -ErrorAction SilentlyContinue
    [ordered]@{
        '1_windows'   = [ordered]@{ computerName = $env:COMPUTERNAME; edition = (Get-CimInstance Win32_OperatingSystem).Caption
                          sleepDisabled = [bool]((powercfg /query SCHEME_CURRENT SUB_SLEEP STANDBYIDLE) -match 'AC.*0x00000000') }
        '2_disks'     = [ordered]@{ D_ntfs = (& $vol 'D'); E_ntfs = (& $vol 'E') }
        '3_server'    = [ordered]@{ folders = (Test-Path $JF.Work) -and (Test-Path $JF.Archive) -and (Test-Path $JF.System)
                          shareUser = [bool](Get-LocalUser -Name 'jflipnas' -ErrorAction SilentlyContinue)
                          shares = @(@(Get-SmbShare -Name 'JFLIP*' -ErrorAction SilentlyContinue | ForEach-Object Name) +
                                     @((net share 2>$null) -match '^JFLIP' | ForEach-Object { ($_ -split '\s+')[0] }) | Sort-Object -Unique) }
        '4_mac'       = [ordered]@{ macHasSynced = Test-Path (Join-Path $JF.System 'mac-last-sync.txt'); smbSessions = @(Get-SmbSession -ErrorAction SilentlyContinue).Count }
        '5_migration' = [ordered]@{ rcloneExe = Test-Path $JF.RcloneExe; dropboxRemote = $remoteOk
                          started = ($mig.Count -gt 0); allOk = [bool]($mig | Select-String -SimpleMatch 'ALL OK' -Quiet)
                          lastLines = @($mig | Select-Object -Last 4) }
        '6_dropboxApp' = [ordered]@{ running = [bool](Get-Process -Name Dropbox -ErrorAction SilentlyContinue); folder = $dbxPath
                          folderOnD = [bool]($dbxPath -like 'D:\*'); completeLocal = Test-Path $JF.CompleteDir
                          recordingSyncedLocally = [bool]($dbxPath -and (Test-Path (Join-Path $dbxPath 'Recording'))) }
        '8_tasks'     = @(Get-TaskInfoList)
        'claude'      = [ordered]@{ installed = [bool]$claude }
    }
}

switch ($Command) {
    'status'         { Get-Status | ConvertTo-Json -Depth 6 }
    'setup-check'    { Get-SetupCheck | ConvertTo-Json -Depth 6 }
    'tasks'          { Get-TaskInfoList | Format-Table -AutoSize | Out-String -Width 200 }
    'logs'           { $n = if ($Arg2) { [int]$Arg2 } else { 40 }; Get-LogTail $Arg1 $n }
    'archive-dryrun' { & "$PSScriptRoot\archive-completed.ps1" -DryRun }
    'run' {
        if ($Arg1 -notin 'backup-nightly', 'archive-completed', 'mixdown-to-complete') { throw "unknown task: $Arg1" }
        Start-ScheduledTask -TaskPath '\JFLIPSTUDIO\' -TaskName $Arg1
        "started \JFLIPSTUDIO\$Arg1 - follow it with: jf.ps1 logs $(@{ 'backup-nightly'='backup'; 'archive-completed'='archive'; 'mixdown-to-complete'='mixdown' }[$Arg1])"
    }
    'mark-done' {
        $parts = $Arg1 -split '[\\/]'
        if ($parts.Count -ne 2) { throw 'usage: mark-done <Client/Project>' }
        $dir = Join-Path (Join-Path $JF.Work $parts[0]) $parts[1]
        if (-not [System.IO.Directory]::Exists($dir)) { throw "not a work project: $Arg1" }
        [System.IO.File]::WriteAllText((Join-Path $dir $JF.DoneMarker), '', $enc)
        Write-JFLog 'archive' "MARK  $Arg1 marked done from the server"
        "marked done: $Arg1 (archived at the next archive-completed run, after $($JF.QuietMinutes) quiet minutes)"
    }
    default { throw "unknown command: $Command  (status|setup-check|tasks|logs|archive-dryrun|run|mark-done)" }
}
