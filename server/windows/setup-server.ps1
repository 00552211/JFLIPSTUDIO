# JFLIPSTUDIO SERVER - one-time Windows setup.
# Run in an ADMIN PowerShell AFTER D: (2TB SSD) and E: (3TB HDD) are formatted:
#   powershell -ExecutionPolicy Bypass -File C:\JFLIPSTUDIO\server\windows\setup-server.ps1
# Safe to run again; every step checks before it changes anything.

#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\config.ps1"

$ShareUser = 'jflipnas'   # account the Mac uses to log in to the share

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

Step 'Check drives'
foreach ($d in 'D', 'E') {
    $v = Get-Volume -DriveLetter $d -ErrorAction SilentlyContinue
    if (-not $v) { throw "Drive ${d}: not found. Format the disks in Disk Management first." }
    if ($v.FileSystem -ne 'NTFS') { throw "Drive ${d}: is $($v.FileSystem), expected NTFS." }
    '{0}:  {1,-12} {2,8:N0} GB total  {3,8:N0} GB free' -f $d, $v.FileSystemLabel, ($v.Size / 1GB), ($v.SizeRemaining / 1GB)
}

Step 'Create folders'
$dirs = @(
    $JF.Work, $JF.System, $JF.Archive, $JF.WorkBackup,
    'E:\JFLIPSTUDIO\Archive\Dropbox', 'D:\Dropbox',
    'C:\JFLIPSTUDIO\bin', $JF.Logs
)
foreach ($p in $dirs) { [System.IO.Directory]::CreateDirectory($p) | Out-Null; "  $p" }
$archivedList = Join-Path $JF.System 'archived.txt'
if (-not (Test-Path -LiteralPath $archivedList)) { [System.IO.File]::WriteAllText($archivedList, '', $Utf8NoBom) }

Step 'Power: never sleep / hibernate on AC'
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /change disk-timeout-ac 0
powercfg /change monitor-timeout-ac 10
powercfg /hibernate off

Step 'Network: Private profile + File and Printer Sharing'
Get-NetConnectionProfile | Where-Object NetworkCategory -ne 'Private' |
    ForEach-Object { Set-NetConnectionProfile -InterfaceIndex $_.InterfaceIndex -NetworkCategory Private }
# Resource-string group name works on Japanese Windows too
Get-NetFirewallRule -Group '@FirewallAPI.dll,-28502' |
    Where-Object { $_.Profile -match 'Private' -or $_.Profile -eq 'Any' } |
    Enable-NetFirewallRule
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force
# Other stores reach the share over Tailscale (100.64.0.0/10). Only Tailscale peers match this rule.
if (-not (Get-NetFirewallRule -Name 'JFLIP-SMB-Tailscale' -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -Name 'JFLIP-SMB-Tailscale' -DisplayName 'JFLIPSTUDIO SMB via Tailscale' -Direction Inbound `
        -Protocol TCP -LocalPort 445 -RemoteAddress '100.64.0.0/10' -Profile Any -Action Allow | Out-Null
}

Step "Local account '$ShareUser' for the Mac"
if (-not (Get-LocalUser -Name $ShareUser -ErrorAction SilentlyContinue)) {
    $pw = Read-Host "Password for $ShareUser (write it down - the Mac keychain will store it)" -AsSecureString
    New-LocalUser -Name $ShareUser -Password $pw -PasswordNeverExpires -AccountNeverExpires `
        -Description 'JFLIPSTUDIO SMB access from Mac' | Out-Null
    "  created"
} else { "  already exists" }

Step 'NTFS permissions'
icacls $JF.Root /grant "${ShareUser}:(OI)(CI)M" | Out-Null
icacls 'E:\JFLIPSTUDIO\Archive' /grant "${ShareUser}:(OI)(CI)RX" | Out-Null
"  D:\JFLIPSTUDIO          -> $ShareUser Modify"
"  E:\JFLIPSTUDIO\Archive  -> $ShareUser Read"

Step 'SMB shares'
$admins = (New-Object System.Security.Principal.SecurityIdentifier 'S-1-5-32-544').Translate(
    [System.Security.Principal.NTAccount]).Value
if (-not (Get-SmbShare -Name 'JFLIPSTUDIO' -ErrorAction SilentlyContinue)) {
    New-SmbShare -Name 'JFLIPSTUDIO' -Path $JF.Root -ChangeAccess $ShareUser -FullAccess $admins `
        -Description 'JFLIPSTUDIO work area (Mac sync target)' | Out-Null
}
if (-not (Get-SmbShare -Name 'JFLIP_ARCHIVE' -ErrorAction SilentlyContinue)) {
    New-SmbShare -Name 'JFLIP_ARCHIVE' -Path 'E:\JFLIPSTUDIO\Archive' -ReadAccess $ShareUser -FullAccess $admins `
        -Description 'JFLIPSTUDIO archive (read-only from Mac)' | Out-Null
}
Get-SmbShare -Name 'JFLIP*' | Format-Table Name, Path -AutoSize

Step 'Done'
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -in 'Dhcp', 'Manual' -and $_.IPAddress -notlike '169.*' } |
       Select-Object -First 1).IPAddress
"From the Mac (Finder > Go > Connect to Server):"
"  smb://$ip/JFLIPSTUDIO"
"  smb://$ip/JFLIP_ARCHIVE"
"Reserve $ip for this PC in your router (DHCP reservation) so it never changes."
