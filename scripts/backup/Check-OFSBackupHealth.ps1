[CmdletBinding()]
param(
    [string]$TaskName = 'OFS-Daily-Backup',
    [string]$BackupDir = 'C:\OFS\backups',
    [int]$MaxAgeHours = 26,
    [string]$LogFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($LogFile)) {
    $LogFile = Join-Path $BackupDir 'backup-health.log'
}

$timestamp = Get-Date
$messages = New-Object System.Collections.Generic.List[string]
$healthy = $true

try {
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
    $info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction Stop

    if ($info.LastTaskResult -ne 0) {
        $healthy = $false
        $messages.Add("LastTaskResult diferente de 0: $($info.LastTaskResult)")
    }
}
catch {
    $healthy = $false
    $messages.Add("Tarefa não encontrada ou inacessível: $TaskName")
}

$latestBackup = $null
if (-not (Test-Path $BackupDir)) {
    $healthy = $false
    $messages.Add("Diretório de backup não encontrado: $BackupDir")
}
else {
    $latestBackup = Get-ChildItem -Path $BackupDir -Filter 'ofs-backup-*.zip' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1

    if ($null -eq $latestBackup) {
        $healthy = $false
        $messages.Add('Nenhum arquivo ofs-backup-*.zip encontrado.')
    }
    else {
        $ageHours = ($timestamp - $latestBackup.LastWriteTime).TotalHours
        if ($ageHours -gt $MaxAgeHours) {
            $healthy = $false
            $messages.Add("Último backup está antigo (${ageHours:N1}h): $($latestBackup.Name)")
        }
    }
}

if ($messages.Count -eq 0) {
    $messages.Add('Backup saudável.')
}

$status = if ($healthy) { 'OK' } else { 'FALHA' }
$line = "[$($timestamp.ToString('yyyy-MM-dd HH:mm:ss'))] [$status] $($messages -join ' | ')"

$logDir = Split-Path -Parent $LogFile
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
Add-Content -Path $LogFile -Value $line -Encoding UTF8

$result = [PSCustomObject]@{
    timestamp = $timestamp
    status = $status
    taskName = $TaskName
    latestBackup = if ($latestBackup) { $latestBackup.FullName } else { $null }
    latestBackupTime = if ($latestBackup) { $latestBackup.LastWriteTime } else { $null }
    logFile = $LogFile
    details = $messages
}

$result | ConvertTo-Json -Depth 5

if (-not $healthy) {
    exit 1
}
