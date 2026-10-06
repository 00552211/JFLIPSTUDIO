# CONNECTSTUDIO SERVER - one-time copy of the existing Dropbox data to the HDD.
# Copy only (never deletes anything in Dropbox). Safe to stop and re-run: it resumes.
#
#   powershell -ExecutionPolicy Bypass -File migrate-dropbox.ps1            # copy, then verify
#   powershell -ExecutionPolicy Bypass -File migrate-dropbox.ps1 -CheckOnly # verify again only
#
# Dropbox:/Recording       -> E:\CONNECTSTUDIO\Archive\Recording
# Dropbox:/<other folders> -> E:\CONNECTSTUDIO\Archive\Dropbox\<folder>

param([switch]$CheckOnly)
. "$PSScriptRoot\config.ps1"

$jobs = @(
    @{ Src = 'dropbox:Recording'; Dst = $JF.Archive }
)
foreach ($f in 'Complete', 'Deliver', 'RecData', 'BackUp', 'Songs', 'R2M', 'Template', 'STUDIO BEAT', 'INM PARA') {
    $jobs += @{ Src = "dropbox:$f"; Dst = "E:\CONNECTSTUDIO\Archive\Dropbox\$f" }
}

$failed = @()
foreach ($j in $jobs) {
    Write-JFLog 'migrate' "---- $($j.Src) -> $($j.Dst)"
    if (-not $CheckOnly) {
        $rc = Invoke-JFRclone 'migrate' @('copy', $j.Src, $j.Dst,
            '--transfers', '4', '--checkers', '8', '--tpslimit', '12',
            '--exclude', '.DS_Store', '--exclude', '._*', '--progress', '--stats-one-line')
        Write-JFLog 'migrate' "copy exit=$rc"
    }
    # Compares every file by size + Dropbox content hash
    $rc = Invoke-JFRclone 'migrate' @('check', $j.Src, $j.Dst, '--one-way',
        '--exclude', '.DS_Store', '--exclude', '._*',
        '--missing-on-dst', (Join-Path $JF.Logs ("migrate-missing-" + ($j.Src -replace '[^A-Za-z0-9]', '_') + '.txt')))
    if ($rc -eq 0) { Write-JFLog 'migrate' 'CHECK OK' }
    else { Write-JFLog 'migrate' "CHECK FAILED (exit=$rc)"; $failed += $j.Src }
}

if ($failed.Count) {
    Write-JFLog 'migrate' ("NOT COMPLETE: " + ($failed -join ', ') + "  -> run this script again")
    exit 1
}
Write-JFLog 'migrate' 'ALL OK - every Dropbox file now also exists on E:'
