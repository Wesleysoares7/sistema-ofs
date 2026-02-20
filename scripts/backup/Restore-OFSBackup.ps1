[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$ConfigPath,
    [switch]$RestoreFiles,
    [switch]$RestoreEnvFiles
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
        throw "Arquivo de configuração não encontrado em '$Path'."
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

function Copy-RestoredItem([string]$ExtractRoot, [string]$RelativePath, [string]$ProjectRoot) {
    $source = Join-Path $ExtractRoot (Join-Path 'files' $RelativePath)
    if (-not (Test-Path $source)) {
        Write-Info "Não encontrado no backup: $RelativePath"
        return
    }

    $destination = Join-Path $ProjectRoot $RelativePath
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

    Write-Info "Restaurado: $RelativePath"
}

if (-not (Test-Path $BackupFile)) {
    throw "Arquivo de backup não encontrado: '$BackupFile'."
}

$projectRoot = Get-ProjectRoot
$config = Load-Config -Path $ConfigPath

$databaseUrl = $config.databaseUrl
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = Read-DatabaseUrlFromEnv -ProjectRoot $projectRoot
}

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    throw 'DATABASE_URL não definida. Informe em backup.config.json ou backend/.env.'
}

$pgRestore = Resolve-CommandPath -ConfiguredPath $config.pgRestorePath -CommandName 'pg_restore'

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$extractRoot = Join-Path $env:TEMP "ofs-restore-$timestamp"
New-Item -ItemType Directory -Path $extractRoot -Force | Out-Null

Write-Info 'Descompactando backup...'
Expand-Archive -Path $BackupFile -DestinationPath $extractRoot -Force

$dumpPath = Join-Path $extractRoot 'database/ofs.dump'
if (-not (Test-Path $dumpPath)) {
    throw "Dump não encontrado no backup: $dumpPath"
}

Write-Info 'Restaurando banco PostgreSQL...'
& $pgRestore "--dbname=$databaseUrl" '--clean' '--if-exists' '--no-owner' '--no-privileges' '--verbose' $dumpPath
if ($LASTEXITCODE -ne 0) {
    throw "pg_restore falhou com código $LASTEXITCODE"
}
Write-Success 'Banco restaurado com sucesso.'

if ($RestoreFiles) {
    foreach ($item in @($config.includePaths)) {
        if (-not [string]::IsNullOrWhiteSpace($item)) {
            Copy-RestoredItem -ExtractRoot $extractRoot -RelativePath $item -ProjectRoot $projectRoot
        }
    }
}

if ($RestoreEnvFiles) {
    foreach ($item in @($config.includeEnvFiles)) {
        if (-not [string]::IsNullOrWhiteSpace($item)) {
            Copy-RestoredItem -ExtractRoot $extractRoot -RelativePath $item -ProjectRoot $projectRoot
        }
    }
}

Remove-Item -Path $extractRoot -Recurse -Force -ErrorAction SilentlyContinue
Write-Success 'Rotina de restauração finalizada.'
