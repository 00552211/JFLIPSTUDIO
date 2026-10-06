# CONNECT Studio SERVER - switch a server that was set up under the old name (JFLIPSTUDIO) to CONNECTSTUDIO.
# Run as admin via elevate.ps1, from the NEW folder C:\CONNECTSTUDIO\server.
#
# Nothing is copied or deleted: folders are renamed on the same drive (instant), the SMB shares are
# re-created on the renamed folders (removing a share never touches its files), the Mac user is
# renamed (same password), and the scheduled tasks are re-registered under \CONNECTSTUDIO\.
# Refuses to run while the Dropbox migration (or any rclone / old task) is still running.

param([switch]$KeepComputerName)

#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\config.ps1"
function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
$restart = $false

Step 'Safety checks'
$mig = Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" | Where-Object { $_.CommandLine -match 'migrate-dropbox\.ps1' }
if ($mig) { throw 'The Dropbox migration is still running. Wait until it finishes (ALL OK), then run this again.' }
if (Get-Process -Name rclone -ErrorAction SilentlyContinue) { throw 'rclone is still running. Wait until it finishes, then run this again.' }
$oldTasks = @(Get-ScheduledTask -TaskPath '\JFLIPSTUDIO\' -ErrorAction SilentlyContinue)
if ($oldTasks | Where-Object State -eq 'Running') { throw 'An old JFLIPSTUDIO task is running right now. Try again in a few minutes.' }
$pairs = @(
    @{ Old = 'D:\JFLIPSTUDIO'; New = 'D:\CONNECTSTUDIO' },
    @{ Old = 'E:\JFLIPSTUDIO'; New = 'E:\CONNECTSTUDIO' }
)
foreach ($p in $pairs) {
    if ((Test-Path -LiteralPath $p.Old) -and (Test-Path -LiteralPath $p.New)) {
        $items = @(Get-ChildItem -LiteralPath $p.New -Recurse -File -Force -ErrorAction SilentlyContinue)
        if ($items.Count -gt 0) { throw "Both $($p.Old) and $($p.New) exist and the new one has files. Stopping - ask Claude/the owner to check which one is current." }
        Remove-Item -LiteralPath $p.New -Recurse -Force   # empty skeleton from an earlier run
    }
}
'ok'

Step 'Old scheduled tasks (re-registered at the end)'
foreach ($t in $oldTasks) { Unregister-ScheduledTask -TaskPath '\JFLIPSTUDIO\' -TaskName $t.TaskName -Confirm:$false; "  removed \JFLIPSTUDIO\$($t.TaskName)" }
try { $svc = New-Object -ComObject Schedule.Service; $svc.Connect(); $svc.GetFolder('\').DeleteFolder('JFLIPSTUDIO', 0) } catch {}

Step 'Old SMB shares (files are not touched)'
foreach ($n in 'JFLIPSTUDIO', 'JFLIP_ARCHIVE') {
    if (Get-SmbShare -Name $n -ErrorAction SilentlyContinue) { Remove-SmbShare -Name $n -Force; "  removed share $n" }
}

Step 'Rename folders (same drive, no copy)'
foreach ($p in $pairs) {
    if (Test-Path -LiteralPath $p.Old) { Rename-Item -LiteralPath $p.Old -NewName (Split-Path $p.New -Leaf); "  $($p.Old) -> $($p.New)" }
    elseif (Test-Path -LiteralPath $p.New) { "  $($p.New) already in place" }
}

Step 'Move tools, logs and the Dropbox login from C:\JFLIPSTUDIO'
[System.IO.Directory]::CreateDirectory('C:\CONNECTSTUDIO') | Out-Null
foreach ($n in 'bin', 'logs', 'rclone.conf') {
    $src = Join-Path 'C:\JFLIPSTUDIO' $n; $dst = Join-Path 'C:\CONNECTSTUDIO' $n
    if (-not (Test-Path -LiteralPath $src)) { continue }
    if (Test-Path -LiteralPath $dst) {
        if ($n -eq 'rclone.conf') { "  $dst already exists - kept, old file left in place"; continue }
        Get-ChildItem -LiteralPath $src -Force | ForEach-Object {
            $t = Join-Path $dst $_.Name
            if (-not (Test-Path -LiteralPath $t)) { Move-Item -LiteralPath $_.FullName -Destination $t }
        }
        "  merged $src -> $dst"
    } else { Move-Item -LiteralPath $src -Destination $dst; "  $src -> $dst" }
}
'  (C:\JFLIPSTUDIO\server - the old scripts - is left as it is; delete it later when everything works)'

Step 'Mac user jflipnas -> connectnas (same password)'
if ((Get-LocalUser -Name 'jflipnas' -ErrorAction SilentlyContinue) -and -not (Get-LocalUser -Name 'connectnas' -ErrorAction SilentlyContinue)) {
    Rename-LocalUser -Name 'jflipnas' -NewName 'connectnas'; '  renamed'
} else { '  nothing to rename' }

Step 'Drive labels'
foreach ($x in @(@{ L = 'D'; Old = 'JF_WORK'; New = 'CS_WORK' }, @{ L = 'E'; Old = 'JF_ARCHIVE'; New = 'CS_ARCHIVE' })) {
    $v = Get-Volume -DriveLetter $x.L -ErrorAction SilentlyContinue
    if ($v -and $v.FileSystemLabel -eq $x.Old) { Set-Volume -DriveLetter $x.L -NewFileSystemLabel $x.New; "  $($x.L): $($x.Old) -> $($x.New)" }
}

Step 'Firewall rule'
Remove-NetFirewallRule -Name 'JFLIP-SMB-Tailscale' -ErrorAction SilentlyContinue

Step 'Re-create shares, permissions and firewall rule under the new names'
& "$PSScriptRoot\setup-server.ps1"

if ($oldTasks.Count -gt 0) {
    Step 'Re-register scheduled tasks under \CONNECTSTUDIO\'
    & "$PSScriptRoot\register-tasks.ps1"
}

if (-not $KeepComputerName -and $env:COMPUTERNAME -eq 'JFLIP-SERVER') {
    Step 'Computer name JFLIP-SERVER -> CONNECT-SERVER'
    Rename-Computer -NewName 'CONNECT-SERVER' -Force
    $restart = $true
}

Step 'Done'
'Next:'
'  - Macs: make a new installer with  cs.ps1 mac-kit  (and  cs.ps1 mac-kit HN ) and run it on each Mac.'
'    Each Mac must reconnect to smb://<server>/CONNECTSTUDIO as user connectnas (same password).'
if ($restart) { '  - RESTART the PC for the new computer name.' }
