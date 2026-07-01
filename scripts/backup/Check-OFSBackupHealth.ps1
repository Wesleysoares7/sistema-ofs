[CmdletBinding()]
param(
    [string]$TaskName = 'OFS-Daily-Backup',
    [string]$ConfigPath,
    [string]$BackupDir,
    [int]$MaxAgeHours = 26,
    [string]$LogFile,
    [switch]$ValidateScheduledTask
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
    $ConfigPath = Join-Path $PSScriptRoot 'backup.config.json'
}

function Load-Config([string]$Path) {
    if (-not (Test-Path $Path)) {
        throw "Arquivo de configuração não encontrado em '$Path'."
    }

    $raw = Get-Content -Path $Path -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        throw "Arquivo de configuração vazio: '$Path'."
    }

    return $raw | ConvertFrom-Json
}

$config = Load-Config -Path $ConfigPath

if ([string]::IsNullOrWhiteSpace($BackupDir)) {
    if ([string]::IsNullOrWhiteSpace($config.backupRoot)) {
        throw 'Defina backupRoot no backup.config.json ou informe -BackupDir.'
    }

    $BackupDir = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($config.backupRoot)
}

if ([string]::IsNullOrWhiteSpace($LogFile)) {
    $LogFile = Join-Path $BackupDir 'backup-health.log'
}

$timestamp = Get-Date
$messages = New-Object System.Collections.Generic.List[string]
$healthy = $true

if ($ValidateScheduledTask) {
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
            $formattedAge = '{0:N1}' -f $ageHours
            $messages.Add("Último backup está antigo (${formattedAge}h): $($latestBackup.Name)")
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
