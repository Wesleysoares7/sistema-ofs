[CmdletBinding()]
param(
    [string]$ConfigPath,
    [switch]$SkipRetention
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
    $ConfigPath = Join-Path $PSScriptRoot 'backup.config.json'
}

function Write-Info([string]$Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success([string]$Message) {
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Get-ProjectRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
}

function Load-Config([string]$Path) {
    if (-not (Test-Path $Path)) {
        $examplePath = Join-Path $PSScriptRoot 'backup.config.example.json'
        throw "Arquivo de configuração não encontrado em '$Path'. Copie '$examplePath' para 'backup.config.json' e ajuste os valores."
    }

    $raw = Get-Content -Path $Path -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        throw "Arquivo de configuração vazio: '$Path'."
    }

    return $raw | ConvertFrom-Json
}

function Read-DatabaseUrlFromEnv([string]$ProjectRoot) {
    $envFile = Join-Path $ProjectRoot 'backend/.env'
    if (-not (Test-Path $envFile)) {
        return $null
    }

    $line = Get-Content $envFile | Where-Object { $_ -match '^DATABASE_URL\s*=' } | Select-Object -First 1
    if (-not $line) {
        return $null
    }

    $value = ($line -replace '^DATABASE_URL\s*=\s*', '').Trim()
    $value = $value.Trim('"')
    return $value
}

function Resolve-CommandPath([string]$ConfiguredPath, [string]$CommandName) {
    if ($ConfiguredPath -and (Test-Path $ConfiguredPath)) {
        return (Resolve-Path $ConfiguredPath).Path
    }

    $command = Get-Command $CommandName -ErrorAction SilentlyContinue
    if (-not $command) {
        throw "Comando '$CommandName' não encontrado. Instale PostgreSQL client tools ou configure o caminho no backup.config.json."
    }

    return $command.Source
}

function Copy-RelativeItem([string]$ProjectRoot, [string]$RelativePath, [string]$DestinationRoot) {
    $source = Join-Path $ProjectRoot $RelativePath
    if (-not (Test-Path $source)) {
        Write-Info "Ignorado (não existe): $RelativePath"
        return
    }

    $destination = Join-Path $DestinationRoot $RelativePath
    $destinationDir = Split-Path -Parent $destination
    if (-not (Test-Path $destinationDir)) {
        New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    }

    if ((Get-Item $source).PSIsContainer) {
        Copy-Item -Path $source -Destination $destination -Recurse -Force
    }
    else {
        Copy-Item -Path $source -Destination $destination -Force
    }

    Write-Info "Incluído: $RelativePath"
}

$projectRoot = Get-ProjectRoot
$config = Load-Config -Path $ConfigPath

if (-not $config.backupRoot) {
    throw 'Defina backupRoot no backup.config.json.'
}

$backupRoot = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($config.backupRoot)
if (-not (Test-Path $backupRoot)) {
    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
}

$databaseUrl = $config.databaseUrl
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = Read-DatabaseUrlFromEnv -ProjectRoot $projectRoot
}

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    throw 'DATABASE_URL não definida. Informe em backup.config.json ou backend/.env.'
}

$pgDump = Resolve-CommandPath -ConfiguredPath $config.pgDumpPath -CommandName 'pg_dump'

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$tempRoot = Join-Path $env:TEMP "ofs-backup-$timestamp"
$databaseDir = Join-Path $tempRoot 'database'
$filesDir = Join-Path $tempRoot 'files'
$manifestPath = Join-Path $tempRoot 'manifest.json'

New-Item -ItemType Directory -Path $databaseDir -Force | Out-Null
New-Item -ItemType Directory -Path $filesDir -Force | Out-Null

$dumpPath = Join-Path $databaseDir 'ofs.dump'
$zipPath = Join-Path $backupRoot "ofs-backup-$timestamp.zip"

Write-Info 'Gerando dump do PostgreSQL...'
& $pgDump "--dbname=$databaseUrl" '--format=custom' "--file=$dumpPath" '--no-owner' '--no-privileges' '--verbose'
if ($LASTEXITCODE -ne 0) {
    throw "pg_dump falhou com código $LASTEXITCODE"
}
Write-Success "Dump gerado: $dumpPath"

foreach ($item in @($config.includeEnvFiles)) {
    if (-not [string]::IsNullOrWhiteSpace($item)) {
        Copy-RelativeItem -ProjectRoot $projectRoot -RelativePath $item -DestinationRoot $filesDir
    }
}

foreach ($item in @($config.includePaths)) {
    if (-not [string]::IsNullOrWhiteSpace($item)) {
        Copy-RelativeItem -ProjectRoot $projectRoot -RelativePath $item -DestinationRoot $filesDir
    }
}

$manifest = [PSCustomObject]@{
    generatedAt = (Get-Date).ToString('o')
    machineName = $env:COMPUTERNAME
    projectRoot = $projectRoot
    backupVersion = 1
    database = [PSCustomObject]@{
        format = 'pg_dump custom'
        file = 'database/ofs.dump'
    }
    includedFiles = @($config.includeEnvFiles)
    includedPaths = @($config.includePaths)
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Info 'Compactando backup...'
Compress-Archive -Path (Join-Path $tempRoot '*') -DestinationPath $zipPath -CompressionLevel Optimal -Force
Write-Success "Backup criado: $zipPath"

Remove-Item -Path $tempRoot -Recurse -Force -ErrorAction SilentlyContinue

if (-not $SkipRetention) {
    $retentionDays = [int]($config.retentionDays)
    if ($retentionDays -gt 0) {
        $limit = (Get-Date).AddDays(-$retentionDays)
        $oldFiles = Get-ChildItem -Path $backupRoot -Filter 'ofs-backup-*.zip' -File | Where-Object { $_.LastWriteTime -lt $limit }
        foreach ($file in $oldFiles) {
            Remove-Item -Path $file.FullName -Force
            Write-Info "Removido por retenção: $($file.Name)"
        }
    }
}

Write-Success 'Rotina de backup finalizada.'
