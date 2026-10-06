# JFLIPSTUDIO SERVER - Phase 2: prepare the 2TB SSD as D: (JF_WORK) and the 3TB HDD as E: (JF_ARCHIVE).
# Run as admin, normally via elevate.ps1.
#
#   prepare-disks.ps1                                  list disks only (changes nothing)
#   prepare-disks.ps1 -WorkDisk 1 -ArchiveDisk 2       prepare those disk numbers
#
# Safety:
#   - never touches the Windows (boot/system) disk or any disk holding C:
#   - checks the size (2TB-class for D:, 3TB-class for E:) unless -AnySize
#   - an empty (RAW) disk is initialized without asking
#   - a disk that already has partitions is only erased after the owner types "ERASE <number>"
#     in the administrator window - Claude cannot answer that prompt

param([int]$WorkDisk = -1, [int]$ArchiveDisk = -1, [switch]$AnySize)

#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'

function Show-Disks {
    Get-Disk | Sort-Object Number | ForEach-Object {
        $vols = Get-Partition -DiskNumber $_.Number -ErrorAction SilentlyContinue | Where-Object DriveLetter |
            ForEach-Object { $v = Get-Volume -Partition $_ -ErrorAction SilentlyContinue
                '{0}: {1} ({2:N0}/{3:N0} GB used)' -f $_.DriveLetter, $v.FileSystemLabel, (($v.Size - $v.SizeRemaining) / 1GB), ($v.Size / 1GB) }
        '#{0}  {1,-38} {2,6:N0} GB  {3,-4} boot={4} system={5}  {6}' -f $_.Number, $_.FriendlyName, ($_.Size / 1GB),
            $_.PartitionStyle, $_.IsBoot, $_.IsSystem, ($(if ($vols) { $vols -join ', ' } else { '(no volumes)' }))
    }
}

function Prepare([int]$Number, [string]$Letter, [string]$Label, [int]$MinGB, [int]$MaxGB) {
    Write-Host "`n=== Disk #$Number -> ${Letter}: $Label ===" -ForegroundColor Cyan
    $d = Get-Disk -Number $Number
    $parts = @(Get-Partition -DiskNumber $Number -ErrorAction SilentlyContinue)
    if ($d.IsBoot -or $d.IsSystem -or ($parts | Where-Object DriveLetter -eq 'C')) { throw "Disk #$Number is the Windows disk. Refusing." }
    $gb = [math]::Round($d.Size / 1GB)
    if (-not $AnySize -and ($gb -lt $MinGB -or $gb -gt $MaxGB)) { throw "Disk #$Number is $gb GB, expected $MinGB-$MaxGB GB for ${Letter}:. Wrong disk? (use -AnySize to override)" }

    $existing = $parts | Where-Object DriveLetter -eq $Letter | ForEach-Object { Get-Volume -Partition $_ }
    if ($existing -and $existing.FileSystem -eq 'NTFS' -and $existing.FileSystemLabel -eq $Label) { "already prepared: ${Letter}: $Label"; return }

    $other = Get-Volume -DriveLetter $Letter -ErrorAction SilentlyContinue
    if ($other) {
        $p = Get-Partition -DriveLetter $Letter -ErrorAction SilentlyContinue
        if ($p -and $p.DiskNumber -ne $Number) { throw "${Letter}: is already used by another drive ($($other.FileSystemLabel) $($other.DriveType)). Change that drive letter in Disk Management first." }
        if (-not $p) { throw "${Letter}: is used by a non-disk drive (DVD?). Change its letter in Disk Management first." }
    }

    if ($d.IsOffline) { Set-Disk -Number $Number -IsOffline $false }
    if ($d.IsReadOnly) { Set-Disk -Number $Number -IsReadOnly $false }

    $dataParts = @($parts | Where-Object Type -ne 'Reserved')
    if ($dataParts.Count -gt 0) {
        Write-Host "Disk #$Number already has partitions:" -ForegroundColor Yellow
        $dataParts | ForEach-Object { '  partition {0}  {1:N0} GB  letter={2}  type={3}' -f $_.PartitionNumber, ($_.Size / 1GB), $_.DriveLetter, $_.Type }
        Write-Host "ALL DATA ON DISK #$Number ($($d.FriendlyName), $gb GB) WILL BE ERASED." -ForegroundColor Red
        $answer = Read-Host "Type  ERASE $Number  to continue (anything else cancels)"
        if ($answer -ne "ERASE $Number") { "cancelled - disk #$Number unchanged"; return }
        Clear-Disk -Number $Number -RemoveData -RemoveOEM -Confirm:$false
    }
    if ((Get-Disk -Number $Number).PartitionStyle -eq 'RAW') { Initialize-Disk -Number $Number -PartitionStyle GPT }
    $part = New-Partition -DiskNumber $Number -UseMaximumSize -DriveLetter $Letter
    Format-Volume -Partition $part -FileSystem NTFS -NewFileSystemLabel $Label -Confirm:$false | Out-Null
    $v = Get-Volume -DriveLetter $Letter
    'done: {0}: {1}  {2:N0} GB NTFS' -f $Letter, $v.FileSystemLabel, ($v.Size / 1GB)
}

Show-Disks
if ($WorkDisk -lt 0 -and $ArchiveDisk -lt 0) { "`n(list only - pass -WorkDisk <n> -ArchiveDisk <n> to prepare)"; return }
if ($WorkDisk -ge 0 -and $WorkDisk -eq $ArchiveDisk) { throw 'WorkDisk and ArchiveDisk must be different disks.' }
if ($WorkDisk -ge 0) { Prepare $WorkDisk 'D' 'JF_WORK' 1700 2100 }
if ($ArchiveDisk -ge 0) { Prepare $ArchiveDisk 'E' 'JF_ARCHIVE' 2500 3100 }
"`nResult:"
Show-Disks
