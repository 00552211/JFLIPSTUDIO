# JFLIPSTUDIO SERVER - Phase 1: Windows basics (run as admin, normally via elevate.ps1).
# Safe to run again. Prints a report of what still needs a human (BIOS, Autologon, Windows Update).

param([string]$ComputerName = 'JFLIP-SERVER',
      [int]$ActiveHoursStart = 9,     # Windows Update will not restart between these hours
      [int]$ActiveHoursEnd = 1)

#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
$todo = @()

Step 'Edition'
$os = Get-CimInstance Win32_OperatingSystem
"$($os.Caption)  build $($os.BuildNumber)"
if ($os.Caption -notmatch 'Pro|Enterprise|Education') { $todo += 'Windows Home: Home Assistant will need VirtualBox instead of Hyper-V (README 12-1).' }

Step 'Computer name'
if ($env:COMPUTERNAME -ne $ComputerName) {
    Rename-Computer -NewName $ComputerName -Force
    "renamed $env:COMPUTERNAME -> $ComputerName (takes effect after restart)"
    $todo += 'RESTART needed for the new computer name.'
} else { "already $ComputerName" }

Step 'Power: never sleep / hibernate on AC'
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /change disk-timeout-ac 0
powercfg /change monitor-timeout-ac 10
powercfg /hibernate off
'done'

Step "Windows Update active hours ${ActiveHoursStart}:00 - ${ActiveHoursEnd}:00"
$wu = 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings'
if (-not (Test-Path $wu)) { New-Item -Path $wu -Force | Out-Null }
Set-ItemProperty -Path $wu -Name ActiveHoursStart -Value $ActiveHoursStart -Type DWord
Set-ItemProperty -Path $wu -Name ActiveHoursEnd -Value $ActiveHoursEnd -Type DWord
Set-ItemProperty -Path $wu -Name SmartActiveHoursState -Value 0 -Type DWord
'done'

Step 'Folders'
foreach ($p in 'C:\JFLIPSTUDIO\bin', 'C:\JFLIPSTUDIO\logs') { [System.IO.Directory]::CreateDirectory($p) | Out-Null; "  $p" }

Step 'Apps (winget)'
$winget = Get-Command winget -ErrorAction SilentlyContinue
if (-not $winget) { $todo += 'winget missing: install "App Installer" from Microsoft Store, then run this again.' }
else {
    foreach ($id in 'Git.Git', 'CrystalDewWorld.CrystalDiskInfo', 'Microsoft.Sysinternals.Autologon') {
        $installed = (winget list -e --id $id --accept-source-agreements 2>$null | Out-String) -match [regex]::Escape($id)
        if ($installed) { "  $id already installed"; continue }
        "  installing $id ..."
        winget install -e --id $id --silent --accept-source-agreements --accept-package-agreements | Out-Null
    }
}

Step 'rclone -> C:\JFLIPSTUDIO\bin\rclone.exe'
$rclone = 'C:\JFLIPSTUDIO\bin\rclone.exe'
if (Test-Path $rclone) { & $rclone version | Select-Object -First 1 }
else {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $zip = Join-Path $env:TEMP 'rclone.zip'
    $tmp = Join-Path $env:TEMP 'rclone-extract'
    Invoke-WebRequest -Uri 'https://downloads.rclone.org/rclone-current-windows-amd64.zip' -OutFile $zip -UseBasicParsing
    Expand-Archive -LiteralPath $zip -DestinationPath $tmp -Force
    Copy-Item -Path (Get-ChildItem -Path $tmp -Recurse -Filter rclone.exe | Select-Object -First 1).FullName -Destination $rclone
    & $rclone version | Select-Object -First 1
}

Step 'Network'
Get-NetAdapter -Physical | Where-Object Status -eq 'Up' | ForEach-Object {
    $ip = (Get-NetIPAddress -InterfaceIndex $_.ifIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
    '{0,-30} {1,-12} {2}  IP {3}' -f $_.Name, $_.LinkSpeed, $_.MediaType, $ip
    if ($_.MediaType -match '802\.11|Wireless') { $script:todo += "Connected by Wi-Fi ($($_.Name)). Use a LAN cable for the server." }
}

Step 'Disks (health)'
Get-PhysicalDisk | Sort-Object DeviceId | ForEach-Object {
    '{0,-3} {1,-40} {2,6:N0} GB  {3,-4} health={4}' -f $_.DeviceId, $_.FriendlyName, ($_.Size / 1GB), $_.MediaType, $_.HealthStatus
    if ($_.HealthStatus -ne 'Healthy') { $script:todo += "Disk $($_.FriendlyName) health is $($_.HealthStatus) - check it in CrystalDiskInfo before storing data on it." }
}

Step 'BitLocker / device encryption'
try {
    Get-BitLockerVolume -ErrorAction Stop | ForEach-Object { '{0}  {1}  {2}' -f $_.MountPoint, $_.VolumeStatus, $_.ProtectionStatus
        if ($_.ProtectionStatus -eq 'On') { $script:todo += "BitLocker is ON for $($_.MountPoint): make sure the recovery key is saved (https://account.microsoft.com/devices/recoverykey)." } }
} catch { 'BitLocker not available on this edition' }

Step 'Still needs you (cannot be done from a script)'
$todo += 'BIOS/UEFI: set "Restore on AC Power Loss" (or similar) to Power On.'
$todo += 'Run Autologon (Start menu > Autologon) and enter your Windows password, so Dropbox and the morning report run after a reboot.'
$todo += 'Windows Update: install everything until "You are up to date" (Settings > Windows Update).'
$todo += 'Router: reserve this PC''s IP address (DHCP reservation).'
$todo | ForEach-Object { "  - $_" }
