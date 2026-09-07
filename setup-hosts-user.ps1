$ErrorActionPreference = "Stop"
$rootHost = "e-school.et"
$rules = "MAP *.$rootHost 127.0.0.1, MAP $rootHost 127.0.0.1"
$desktop = [Environment]::GetFolderPath("Desktop")
$localApp = [Environment]::GetFolderPath("LocalApplicationData")
$profileDir = Join-Path $localApp "eschool-chrome"

$chrome = Join-Path ${env:ProgramFiles} "Google\Chrome\Application\chrome.exe"
$edge = Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe"
$browser = $null
$name = "e-school"
if (Test-Path $chrome) {
  $browser = $chrome
} elseif (Test-Path $edge) {
  $browser = $edge
  $name = "e-school (Edge)"
}

if (-not $browser) {
  Write-Host "Chrome/Edge not found. System wildcard still needs the elevated setup-hosts.bat."
  exit 0
}

$args = "--user-data-dir=`"$profileDir`" --host-resolver-rules=`"$rules`" --dns-over-https-mode=off http://$rootHost`:3000"
$lnkPath = Join-Path $desktop "$name.lnk"
$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut($lnkPath)
$lnk.TargetPath = $browser
$lnk.Arguments = $args
$lnk.WorkingDirectory = Split-Path $browser
$lnk.WindowStyle = 1
$lnk.Save()
Write-Host "Created $lnkPath"
Write-Host "This browser maps *.$rootHost to 127.0.0.1 (every campus slug, no hosts line)."
