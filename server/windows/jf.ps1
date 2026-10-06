# JFLIPSTUDIO SERVER - single entry point for Claude Code (and humans).
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/jf.ps1 <command> [args]
#
# Read-only (safe to run any time):
#   status                  JSON: drives, disk health, tasks, work projects, pending archive, errors, Mac sync
#   logs <name> [lines]     tail C:\JFLIPSTUDIO\logs\<name>.log  (backup|archive|mixdown|migrate|...)
#   tasks                   scheduled task states
#   setup-check             which setup phases are done (JSON)
#   archive-dryrun          what archive-completed would do now
#   disks                   physical disks + volumes (for choosing D:/E:)
#   migration-progress      how much of the Dropbox data is already on E:
#   open <page>             open a Windows settings page for the owner: windowsupdate | diskmgmt | taskschd | autologon
# Changes something (Claude must ask the user first):
#   run <task>              start a scheduled task now: backup-nightly | archive-completed | mixdown-to-complete
#   mark-done <Client/Project>   create _DONE in a work project (it will be archived at the next archive run)
#   rclone-login            connect rclone to Dropbox (opens the browser for the owner to log in)
#   start-migration         start the Dropbox -> E: copy in its own window (keeps running after Claude stops)
#   mac-kit [STORE]         put the Mac installer (server IP + store code filled in) on the share

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
    $macSync = [ordered]@{}
    foreach ($f in Get-ChildItem -LiteralPath $JF.System -Filter 'mac-last-sync*.txt' -ErrorAction SilentlyContinue) {
        $store = if ($f.BaseName -eq 'mac-last-sync') { 'main' } else { $f.BaseName.Substring('mac-last-sync-'.Length) }
        $macSync[$store] = ([System.IO.File]::ReadAllText($f.FullName, $enc)).Trim()
    }
    foreach ($s in $JF.Stores) { $k = if ($s) { $s } else { 'main' }; if (-not $macSync.Contains($k)) { $macSync[$k] = $null } }
    [pscustomobject]@{
        studioName    = $JF.StudioName
        generated     = (Get-Date).ToString('s')
        host          = $env:COMPUTERNAME
        drives        = @($drives)
        physicalDisks = @($disks)
        tasks         = @(Get-TaskInfoList)
        dropboxAppRunning = [bool](Get-Process -Name Dropbox -ErrorAction SilentlyContinue)
        smbSessions   = @(Get-SmbSession -ErrorAction SilentlyContinue | ForEach-Object { "$($_.ClientUserName) from $($_.ClientComputerName)" })
        macLastSync   = $macSync   # per store: 'main', 'HN', ... (null = that store's Mac never synced)
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
                          sleepDisabled = [bool]((powercfg /query SCHEME_CURRENT SUB_SLEEP STANDBYIDLE) -match 'AC.*0x00000000')
                          autologon = ((Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon' -ErrorAction SilentlyContinue).AutoAdminLogon -eq '1')
                          git = [bool](Get-Command git -ErrorAction SilentlyContinue)
                          wired = [bool](Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' -and $_.MediaType -notmatch '802\.11|Wireless' })
                          ip = (Get-ServerIP) }
        '2_disks'     = [ordered]@{ D_ntfs = (& $vol 'D'); E_ntfs = (& $vol 'E') }
        '3_server'    = [ordered]@{ folders = (Test-Path $JF.Work) -and (Test-Path $JF.Archive) -and (Test-Path $JF.System)
                          shareUser = [bool](Get-LocalUser -Name 'jflipnas' -ErrorAction SilentlyContinue)
                          shares = @(@(Get-SmbShare -Name 'JFLIP*' -ErrorAction SilentlyContinue | ForEach-Object Name) +
                                     @((net share 2>$null) -match '^JFLIP' | ForEach-Object { ($_ -split '\s+')[0] }) | Sort-Object -Unique) }
        '4_mac'       = [ordered]@{ macKitReady = Test-Path (Join-Path $JF.System 'mac-setup\recsync.conf'); macHasSynced = Test-Path (Join-Path $JF.System 'mac-last-sync.txt'); hnKitReady = Test-Path (Join-Path $JF.System 'mac-setup-HN\recsync.conf'); hnHasSynced = Test-Path (Join-Path $JF.System 'mac-last-sync-HN.txt'); tailscaleIP = (Get-TailscaleIP); smbSessions = @(Get-SmbSession -ErrorAction SilentlyContinue).Count }
        '5_migration' = [ordered]@{ rcloneExe = Test-Path $JF.RcloneExe; dropboxRemote = $remoteOk
                          running = [bool](Get-MigrationProcess); started = ($mig.Count -gt 0); allOk = [bool]($mig | Select-String -SimpleMatch 'ALL OK' -Quiet)
                          lastLines = @($mig | Select-Object -Last 4) }
        '6_dropboxApp' = [ordered]@{ running = [bool](Get-Process -Name Dropbox -ErrorAction SilentlyContinue); folder = $dbxPath
                          folderOnD = [bool]($dbxPath -like 'D:\*'); completeLocal = Test-Path $JF.CompleteDir
                          recordingSyncedLocally = [bool]($dbxPath -and (Test-Path (Join-Path $dbxPath 'Recording'))) }
        '8_tasks'     = @(Get-TaskInfoList)
        'claude'      = [ordered]@{ installed = [bool]$claude }
    }
}


function Get-ServerIP {
    (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -in 'Dhcp', 'Manual' -and $_.IPAddress -notlike '169.*' } |
        Select-Object -First 1).IPAddress
}

function Get-TailscaleIP {
    $ts = Get-Command tailscale -ErrorAction SilentlyContinue
    if (-not $ts) { $c = "$env:ProgramFiles\Tailscale\tailscale.exe"; if (Test-Path $c) { $ts = $c } else { return $null } }
    $ip = (& $ts ip -4 2>$null | Select-Object -First 1)
    if ($ip -match '^100\.') { return $ip.Trim() } else { return $null }
}

function Get-MigrationProcess {
    Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match 'migrate-dropbox\.ps1' }
}

function Get-MigrationProgress {
    $cache = Join-Path $JF.Logs 'migrate-source-sizes.json'
    $sources = @{ 'Recording' = $JF.Archive }
    foreach ($f in 'Complete', 'Deliver', 'RecData', 'BackUp', 'Songs', 'R2M', 'Template', 'STUDIO BEAT', 'INM PARA') {
        $sources[$f] = "E:\JFLIPSTUDIO\Archive\Dropbox\$f"
    }
    $sizes = @{}
    if (Test-Path $cache) { (Get-Content $cache -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $sizes[$_.Name] = $_.Value } }
    else {
        foreach ($k in $sources.Keys) {
            $j = & $JF.RcloneExe --config $JF.RcloneConf size "dropbox:$k" --json 2>$null
            if ($LASTEXITCODE -eq 0 -and $j) { $sizes[$k] = ($j | ConvertFrom-Json).bytes }
        }
        [System.IO.File]::WriteAllText($cache, ($sizes | ConvertTo-Json), $enc)
    }
    $rows = foreach ($k in ($sources.Keys | Sort-Object)) {
        $local = (Get-JFFiles $sources[$k] | Measure-Object Length -Sum).Sum
        if (-not $local) { $local = 0 }
        $remote = $sizes[$k]
        [pscustomobject]@{ folder = $k; dropboxGB = if ($remote) { [math]::Round($remote / 1GB, 1) } else { $null }
            onEGB = [math]::Round($local / 1GB, 1); pct = if ($remote) { [math]::Min(100, [math]::Round(100 * $local / $remote)) } else { $null } }
    }
    $totR = ($rows | Measure-Object dropboxGB -Sum).Sum; $totL = ($rows | Measure-Object onEGB -Sum).Sum
    [pscustomobject]@{
        running = [bool](Get-MigrationProcess)
        totalDropboxGB = $totR; totalOnEGB = $totL
        totalPct = if ($totR) { [math]::Round(100 * $totL / $totR) } else { $null }
        verified = [bool]((Get-LogTail 'migrate' 2000) | Select-String -SimpleMatch 'ALL OK' -Quiet)
        folders = @($rows)
        lastLog = @(Get-LogTail 'migrate' 5)
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
    'disks' {
        try {
            Get-Disk -ErrorAction Stop | Sort-Object Number | ForEach-Object {
                $letters = (Get-Partition -DiskNumber $_.Number -ErrorAction SilentlyContinue | Where-Object DriveLetter | ForEach-Object { "$($_.DriveLetter):" }) -join ' '
                '#{0}  {1,-38} {2,6:N0} GB  {3,-4} boot={4}  {5}' -f $_.Number, $_.FriendlyName, ($_.Size / 1GB), $_.PartitionStyle, $_.IsBoot, $letters
            }
        } catch {
            'Get-Disk needs administrator rights here. Showing physical disks instead:'
            Get-PhysicalDisk | Sort-Object DeviceId | ForEach-Object { '#{0}  {1,-38} {2,6:N0} GB  {3}  health={4}' -f $_.DeviceId, $_.FriendlyName, ($_.Size / 1GB), $_.MediaType, $_.HealthStatus }
        }
    }
    'migration-progress' { Get-MigrationProgress | ConvertTo-Json -Depth 4 }
    'open' {
        $target = @{ windowsupdate = 'ms-settings:windowsupdate'; diskmgmt = 'diskmgmt.msc'; taskschd = 'taskschd.msc'
                     autologon = 'Autologon64.exe'; about = 'ms-settings:about'; dropbox = 'Dropbox' }[$Arg1]
        if (-not $target) { throw 'open: windowsupdate | diskmgmt | taskschd | autologon | about | dropbox' }
        if ($Arg1 -eq 'autologon') {
            $exe = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages", "$env:ProgramFiles\WinGet\Packages" -Recurse -Filter 'Autologon64.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($exe) { $target = $exe.FullName }
        }
        Start-Process $target
        "opened $Arg1"
    }
    'rclone-login' {
        if (-not (Test-Path $JF.RcloneExe)) { throw "rclone not found at $($JF.RcloneExe) - run setup-windows.ps1 first" }
        $has = (& $JF.RcloneExe --config $JF.RcloneConf listremotes 2>$null) -match '^dropbox:$'
        if ($has) { & $JF.RcloneExe --config $JF.RcloneConf config reconnect dropbox: --auto-confirm }
        else { & $JF.RcloneExe --config $JF.RcloneConf config create dropbox dropbox }
        "check: " + ((& $JF.RcloneExe --config $JF.RcloneConf lsd dropbox: --max-depth 1 2>&1 | Select-Object -First 5) -join '; ')
    }
    'start-migration' {
        if (Get-MigrationProcess) { 'migration is already running'; break }
        if (-not (Test-Path 'E:\JFLIPSTUDIO\Archive')) { throw 'E:\JFLIPSTUDIO\Archive missing - run setup-server.ps1 first' }
        Start-Process -FilePath "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" -WindowStyle Minimized `
            -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSScriptRoot\migrate-dropbox.ps1`""
        'migration started in its own (minimized) window. Do not close it. Progress: jf.ps1 migration-progress'
    }
    'mac-kit' {
        # mac-kit          -> main store Mac (same LAN, server LAN IP)
        # mac-kit HN       -> other store Mac (over Tailscale, store code enforced in project names)
        $store = if ($Arg1) { $Arg1.ToUpper() } else { '' }
        if ($store -and ($JF.Stores -notcontains $store)) { throw "unknown store '$store' - add it to Stores in config.ps1 first" }
        if ($store) {
            $ip = Get-TailscaleIP
            if (-not $ip) { throw 'Tailscale is not running on this server (install: winget install -e --id Tailscale.Tailscale, then log in)' }
        } else { $ip = Get-ServerIP }
        $kit = Join-Path $JF.System $(if ($store) { "mac-setup-$store" } else { 'mac-setup' })
        [System.IO.Directory]::CreateDirectory($kit) | Out-Null
        $macDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'mac'
        foreach ($f in 'install-mac.sh', 'jflip-recsync.sh', 'jflip-done.sh') {
            $text = [System.IO.File]::ReadAllText((Join-Path $macDir $f), $enc) -replace "`r`n", "`n"
            [System.IO.File]::WriteAllText((Join-Path $kit $f), $text, $enc)
        }
        [System.IO.File]::WriteAllText((Join-Path $kit 'recsync.conf'), "SERVER=`"$ip`"`nSTORE=`"$store`"`n", $enc)
        $where = if ($store) { "store $store, over Tailscale" } else { 'main store, LAN' }
        "Mac kit ready ($where, server $ip). On the Mac:"
        if ($store) { "  0. Install Tailscale (Mac App Store) and log in with the SAME account as this server" }
        "  1. Finder > Go > Connect to Server > smb://$ip/JFLIPSTUDIO  (user jflipnas, save password in Keychain)"
        "  2. brew install rsync"
        "  3. bash /Volumes/JFLIPSTUDIO/_system/$(Split-Path $kit -Leaf)/install-mac.sh"
        if ($store) { "  Project names at this store must contain _$store + number, e.g. 260924_${store}1" }
    }
    default { throw "unknown command: $Command  (status|setup-check|tasks|logs|archive-dryrun|disks|migration-progress|open|run|mark-done|rclone-login|start-migration|mac-kit)" }
}
