#Requires -RunAsAdministrator
$ErrorActionPreference = "Continue"
$log = "C:\Users\Public\school-setup-hosts.log"

function Write-SetupLog {
  param([string]$Message)
  $line = "$(Get-Date -Format o) $Message"
  Add-Content -Path $log -Value $line -ErrorAction SilentlyContinue
  Write-Host $Message
}

Set-Content -Path $log -Value "$(Get-Date -Format o) setup-hosts.ps1 start" -ErrorAction SilentlyContinue

$rawHost = if ($env:APP_HOST) { $env:APP_HOST } else { "e-school.et" }
$rootHost = $rawHost -replace ':\d+$', ''
$mark = "# $rootHost (managed by setup-hosts.sh)"
$nrptName = "$rootHost local wildcard"
$line = "127.0.0.1 $rootHost www.$rootHost admin.$rootHost app.$rootHost $mark"
$path = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"

$dnsIp = "127.0.0.1"
$dnsIpFile = "C:\Users\Public\school-dns-ip.txt"
if (Test-Path $dnsIpFile) {
  $fromFile = (Get-Content -Path $dnsIpFile -TotalCount 1).Trim()
  if ($fromFile -match '^\d+\.\d+\.\d+\.\d+$') {
    $dnsIp = $fromFile
  }
}
Write-SetupLog "Campus DNS server: $dnsIp"

$preserved = @(
  "# Copyright (c) 1993-2009 Microsoft Corp.",
  "#",
  "127.0.0.1 localhost",
  "::1 localhost"
)

$existing = @()
if (Test-Path $path) {
  $existing = @(
    Get-Content -Path $path -ErrorAction SilentlyContinue |
      Where-Object { $_ -notlike "*$mark*" }
  )
}
if ($existing.Count -eq 0) {
  $existing = $preserved
}

$out = @($existing + $line | Where-Object { $_ -ne $null })
$out | Set-Content -Path $path -Encoding ascii
Write-SetupLog "Updated $path (apex, www, admin, app only; campus slugs use DNS)"

Get-DnsClientNrptRule -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName -like "$rootHost local wildcard*" } |
  ForEach-Object {
    Remove-DnsClientNrptRule -Name $_.Name -Force
    Write-SetupLog "Removed old NRPT $($_.Name)"
  }

try {
  Add-DnsClientNrptRule -Namespace ".$rootHost" -NameServers $dnsIp -DisplayName $nrptName | Out-Null
  Add-DnsClientNrptRule -Namespace $rootHost -NameServers $dnsIp -DisplayName "$nrptName apex" | Out-Null
  Write-SetupLog "NRPT: *.$rootHost -> $dnsIp"
} catch {
  Write-SetupLog "NRPT failed: $($_.Exception.Message)"
}

Clear-DnsClientCache
Write-SetupLog "Wildcard DNS: *.$rootHost -> 127.0.0.1 via $dnsIp"
Write-SetupLog "Open http://$rootHost`:3000"
Write-SetupLog "Campus sites: http://<slug>.$rootHost`:3000"
Write-SetupLog "Turn off Chrome Secure DNS (Settings -> Privacy and security -> Security -> Use secure DNS) or Chrome will skip this resolver."
