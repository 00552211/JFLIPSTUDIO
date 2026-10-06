# JFLIPSTUDIO SERVER - register the scheduled jobs (run once in an ADMIN PowerShell).
# Jobs run as SYSTEM: no windows pop up and they run even when nobody is logged in.
# Check them in Task Scheduler > Task Scheduler Library > JFLIPSTUDIO.

#Requires -RunAsAdministrator
$ps = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"

function Register-JFTask([string]$Name, [string]$Script, $Trigger, [int]$MaxHours, $Principal) {
    $action = New-ScheduledTaskAction -Execute $ps `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PSScriptRoot\$Script`""
    $principal = if ($Principal) { $Principal } else {
        New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest }
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew `
        -ExecutionTimeLimit (New-TimeSpan -Hours $MaxHours)
    Register-ScheduledTask -TaskPath '\JFLIPSTUDIO\' -TaskName $Name -Action $action -Trigger $Trigger `
        -Principal $principal -Settings $settings -Force | Out-Null
    "registered \JFLIPSTUDIO\$Name"
}

Register-JFTask 'mixdown-to-complete' 'mixdown-to-complete.ps1' `
    (New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 10)) 1
Register-JFTask 'backup-nightly' 'backup-nightly.ps1' (New-ScheduledTaskTrigger -Daily -At '02:00') 12
Register-JFTask 'archive-completed' 'archive-completed.ps1' (New-ScheduledTaskTrigger -Daily -At '05:00') 12

# Claude's morning report runs as YOU (Claude Code's login lives in your profile), so it needs
# you to be signed in - auto sign-in (Autologon) covers that.
$me = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
Register-JFTask 'daily-report' 'daily-report.ps1' (New-ScheduledTaskTrigger -Daily -At '08:00') 1 $me

# Let this (non-elevated) user read and start the SYSTEM tasks, so Claude Code does not need an
# admin terminal for "jf.ps1 status" / "jf.ps1 run ...". Nothing else about the tasks changes.
$sid = ([System.Security.Principal.WindowsIdentity]::GetCurrent()).User.Value
$svc = New-Object -ComObject Schedule.Service
$svc.Connect()
$folder = $svc.GetFolder('\JFLIPSTUDIO')
foreach ($n in 'mixdown-to-complete', 'backup-nightly', 'archive-completed') {
    $t = $folder.GetTask($n)
    $sd = $t.GetSecurityDescriptor(0xF)
    if ($sd -notmatch [regex]::Escape($sid)) { $t.SetSecurityDescriptor($sd + "(A;;GRGX;;;$sid)", 0) }
}
"granted read/run on the tasks to $env:USERNAME"

"Run one now to test:  schtasks /run /tn \JFLIPSTUDIO\backup-nightly"
