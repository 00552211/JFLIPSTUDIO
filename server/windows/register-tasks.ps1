# JFLIPSTUDIO SERVER - register the scheduled jobs (run once in an ADMIN PowerShell).
# Jobs run as SYSTEM: no windows pop up and they run even when nobody is logged in.
# Check them in Task Scheduler > Task Scheduler Library > JFLIPSTUDIO.

#Requires -RunAsAdministrator
$ps = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"

function Register-JFTask([string]$Name, [string]$Script, $Trigger, [int]$MaxHours) {
    $action = New-ScheduledTaskAction -Execute $ps `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PSScriptRoot\$Script`""
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
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

"Run one now to test:  schtasks /run /tn \JFLIPSTUDIO\backup-nightly"
