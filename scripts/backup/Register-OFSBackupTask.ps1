[CmdletBinding()]
param(
    [string]$TaskName = 'OFS-Daily-Backup',
    [string]$Time = '02:00',
    [string]$ConfigPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
    $ConfigPath = Join-Path $PSScriptRoot 'backup.config.json'
}

if (-not (Test-Path $ConfigPath)) {
    throw "Arquivo não encontrado: '$ConfigPath'."
}

$backupScript = Join-Path $PSScriptRoot 'New-OFSBackup.ps1'
if (-not (Test-Path $backupScript)) {
    throw "Script de backup não encontrado: '$backupScript'."
}

$startTime = [DateTime]::ParseExact($Time, 'HH:mm', $null)
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`" -ConfigPath `"$ConfigPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $startTime
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Host "Tarefa agendada com sucesso: $TaskName às $Time" -ForegroundColor Green
