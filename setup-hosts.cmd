@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-hosts.ps1" %*
