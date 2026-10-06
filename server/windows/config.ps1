# JFLIPSTUDIO SERVER - shared settings and helpers.
# Every script dot-sources this file. Edit the paths here, nowhere else.
# Keep this file ASCII-only: Windows PowerShell 5.1 reads BOM-less .ps1 as Shift_JIS.

$JF = @{
    # D: 2TB SSD - active projects (Mac -> here), shared to the Mac as \\SERVER\JFLIPSTUDIO
    Root         = 'D:\JFLIPSTUDIO'
    Work         = 'D:\JFLIPSTUDIO\Work\Recording'
    System       = 'D:\JFLIPSTUDIO\_system'          # status files the Mac reads

    # E: 3TB HDD - archive + backup of D:
    Archive      = 'E:\JFLIPSTUDIO\Archive\Recording'
    WorkBackup   = 'E:\JFLIPSTUDIO\Backup\Work\Recording'

    # Dropbox desktop app folder (selective sync: Complete only, NOT Recording)
    CompleteDir  = 'D:\Dropbox\Complete'

    # rclone (talks to Dropbox directly, independent of the desktop app)
    RcloneExe    = 'C:\JFLIPSTUDIO\bin\rclone.exe'
    RcloneConf   = 'C:\JFLIPSTUDIO\rclone.conf'
    RemoteRec    = 'dropbox:Recording'

    Logs         = 'C:\JFLIPSTUDIO\logs'

    DoneMarker   = '_DONE'       # put this empty file in a project folder to archive it
    QuietMinutes = 60            # project must be untouched this long before archiving
    StaleDays    = 60            # report projects untouched this long (no auto action)
    MixdownExt   = @('.wav')     # extensions copied from Mixdown\ to Dropbox\Complete
    SettleMin    = 3             # Mixdown file must be this old before copying
    WarnFreePct  = 15            # warn when a drive has less free space than this
}

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-JFLog([string]$Name, [string]$Message) {
    [System.IO.Directory]::CreateDirectory($JF.Logs) | Out-Null
    $line = '{0}  {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    [System.IO.File]::AppendAllText((Join-Path $JF.Logs "$Name.log"), $line + "`r`n", $Utf8NoBom)
    Write-Host $line
}

function Add-JFLine([string]$Path, [string]$Line) {
    [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($Path)) | Out-Null
    [System.IO.File]::AppendAllText($Path, $Line + "`n", $Utf8NoBom)
}

# Projects are always <Base>\<Client>\<Project>, e.g. Work\Recording\TI_xxx\260924_1
function Get-JFProjects([string]$Base) {
    if (-not [System.IO.Directory]::Exists($Base)) { return }
    foreach ($client in [System.IO.Directory]::GetDirectories($Base)) {
        $clientName = [System.IO.Path]::GetFileName($client)
        if ($clientName.StartsWith('.') -or $clientName.StartsWith('_')) { continue }
        foreach ($proj in [System.IO.Directory]::GetDirectories($client)) {
            $projName = [System.IO.Path]::GetFileName($proj)
            if ($projName.StartsWith('.')) { continue }
            [pscustomobject]@{
                Client   = $clientName
                Project  = $projName
                Rel      = "$clientName/$projName"
                FullName = $proj
            }
        }
    }
}

function Get-JFFiles([string]$Dir) {
    if (-not [System.IO.Directory]::Exists($Dir)) { return @() }
    $di = New-Object System.IO.DirectoryInfo($Dir)
    return $di.GetFiles('*', [System.IO.SearchOption]::AllDirectories)
}

function Invoke-JFRclone([string]$LogName, [string[]]$RcloneArgs) {
    $all = @('--config', $JF.RcloneConf) + $RcloneArgs +
           @('--log-file', (Join-Path $JF.Logs "$LogName-rclone.log"), '--log-level', 'INFO')
    & $JF.RcloneExe @all
    return $LASTEXITCODE
}
