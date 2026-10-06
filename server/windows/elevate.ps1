# CONNECTSTUDIO SERVER - run one of the scripts in this folder as administrator, for Claude Code.
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/elevate.ps1 <script.ps1> [-Param value ...]
#
# Windows shows a UAC prompt; the script runs in a visible window (passwords / confirmations are
# typed there by the owner, never through Claude). When it finishes, its output is printed here.
# Only scripts that live in this folder can be run.

param([Parameter(Mandatory = $true, Position = 0)][string]$Script,
      [Parameter(ValueFromRemainingArguments = $true)][string[]]$ScriptArgs)

$enc = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $enc

$allowed = 'setup-windows.ps1', 'prepare-disks.ps1', 'setup-server.ps1', 'register-tasks.ps1', 'rename-to-connect.ps1'
if ($allowed -notcontains $Script) { throw "elevate.ps1 only runs: $($allowed -join ', ')" }
$path = Join-Path $PSScriptRoot $Script

$quoted = @($ScriptArgs | Where-Object { $_ -ne $null } | ForEach-Object {
    if ($_ -match '^-[A-Za-z]+$') { $_ } else { "'" + ($_ -replace "'", "''") + "'" }
}) -join ' '
$log = Join-Path $env:TEMP ('cs-elevated-' + [guid]::NewGuid().ToString('N') + '.log')
$rcFile = "$log.rc"

$inner = @"
`$Host.UI.RawUI.WindowTitle = 'CONNECTSTUDIO - $Script (administrator)'
Start-Transcript -LiteralPath '$log' | Out-Null
`$rc = 0
try { & '$path' $quoted 2>&1 | Out-Host; if (`$LASTEXITCODE) { `$rc = `$LASTEXITCODE } }
catch { Write-Host ('ERROR: ' + `$_.Exception.Message) -ForegroundColor Red; `$rc = 1 }
finally { Stop-Transcript | Out-Null; Set-Content -LiteralPath '$rcFile' -Value `$rc }
Write-Host ''
Write-Host 'Finished. This window closes in 10 seconds.'
Start-Sleep -Seconds 10
"@
$b64 = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($inner))

Write-Host "Requesting administrator rights for $Script (approve the Windows UAC prompt)..."
try {
    Start-Process -FilePath "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" -Verb RunAs -Wait `
        -ArgumentList "-NoProfile -ExecutionPolicy Bypass -EncodedCommand $b64"
} catch {
    Write-Host 'UAC prompt was cancelled - nothing was run.'
    exit 2
}

if (Test-Path -LiteralPath $log) {
    Get-Content -LiteralPath $log | Where-Object { $_ -notmatch '^\*{10,}|^(Windows PowerShell transcript|Start time|End time|Username|RunAs User|Configuration Name|Machine|Host Application|Process ID|PSVersion|PSEdition|PSCompatibleVersions|BuildVersion|CLRVersion|WSManStackVersion|PSRemotingProtocolVersion|SerializationVersion|Transcript started)' }
    Remove-Item -LiteralPath $log -Force
}
$rc = 1
if (Test-Path -LiteralPath $rcFile) { $rc = [int](Get-Content -LiteralPath $rcFile | Select-Object -First 1); Remove-Item -LiteralPath $rcFile -Force }
Write-Host "exit code: $rc"
exit $rc
