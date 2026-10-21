param(
    [string]$Container = 'rentacardb-db-test',
    [string]$DbPassword = $env:DB_PASSWORD
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($DbPassword)) { $DbPassword = 'RentaCar_Dev123!' }

$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$script = Join-Path $repo 'RentacarFinal.sql'
if (-not (Test-Path $script)) { throw "No se encontro $script" }

$sqlcmd = '/opt/mssql-tools18/bin/sqlcmd'
function Invoke-Sql([string]$query) {
    docker exec $Container $sqlcmd -S localhost -U sa -P $DbPassword -C -d RentaCarDB -W -h -1 -Q $query 2>&1
}

Write-Output "== Reconstruyendo RentaCarDB en $Container =="
docker exec $Container $sqlcmd -S localhost -U sa -P $DbPassword -C -Q "IF DB_ID('RentaCarDB') IS NOT NULL BEGIN ALTER DATABASE [RentaCarDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [RentaCarDB]; END" 2>&1 | Out-Null
docker cp $script "${Container}:/tmp/RentacarFinal.sql" | Out-Null
$load = docker exec $Container $sqlcmd -S localhost -U sa -P $DbPassword -C -b -i /tmp/RentacarFinal.sql 2>&1
if ($LASTEXITCODE -ne 0) { Write-Output $load; throw 'Fallo la ejecucion del script base.' }
Write-Output "Script base aplicado."

$resultsDir = Join-Path $PSScriptRoot 'results'
New-Item -ItemType Directory -Force -Path $resultsDir | Out-Null

$totalPass = 0; $totalFail = 0
$files = Get-ChildItem -Path $PSScriptRoot -Filter '*.sql' | Sort-Object Name
foreach ($file in $files) {
    Write-Output ("== " + $file.Name + " ==")
    docker cp $file.FullName "${Container}:/tmp/$($file.Name)" | Out-Null
    $out = docker exec $Container $sqlcmd -S localhost -U sa -P $DbPassword -C -d RentaCarDB -W -h -1 -i "/tmp/$($file.Name)" 2>&1
    $logPath = Join-Path $resultsDir ($file.BaseName + '.log')
    $out | Set-Content -Path $logPath -Encoding UTF8
    $pass = ([regex]::Matches(($out | Out-String), '(?m)^PASS\s+(\d+)')).Count
    $passCount = 0; $failCount = 0
    foreach ($line in $out) {
        if ($line -match '^PASS\s+(\d+)') { $passCount += [int]$Matches[1] }
        if ($line -match '^FAIL\s+(\d+)') { $failCount += [int]$Matches[1] }
    }
    if ($passCount -eq 0 -and $failCount -eq 0) {
        Write-Output "  (sin resumen PASS/FAIL; revisar $logPath)"
    } else {
        Write-Output ("  PASS=" + $passCount + " FAIL=" + $failCount)
    }
    $totalPass += $passCount; $totalFail += $failCount
}

Write-Output "======================================"
Write-Output ("TOTAL: PASS=" + $totalPass + " FAIL=" + $totalFail)
Write-Output ("Logs en: " + $resultsDir)
if ($totalFail -gt 0) { exit 1 }
