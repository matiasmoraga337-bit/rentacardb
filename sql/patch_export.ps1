# patch_export.ps1
# ---------------------------------------------------------------------------
# Post-proceso para el script exportado de RentaCarDB con SSMS "Generate Scripts".
# Aplica sobre el archivo exportado:
#   1) Guarda de base de datos: IF DB_ID('RentaCarDB') IS NULL (no falla si existe)
#   2) Saneamiento de opciones de BD (ANSI_WARNINGS, ARITHABORT,
#      CONCAT_NULL_YIELDS_NULL, READ_COMMITTED_SNAPSHOT -> ON)
#   3) Reporte de verificacion: triggers y GRANT/DENY presentes
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File sql\patch_export.ps1 -Path "100script.sql"
# ---------------------------------------------------------------------------
param(
    [Parameter(Mandatory = $true)][string]$Path
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Path)) { throw "No existe el archivo: $Path" }

# Detectar codificacion (SSMS suele exportar en UTF-16 LE con BOM)
$bytes = [System.IO.File]::ReadAllBytes($Path)
$isUtf16 = ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE)
$enc = if ($isUtf16) { [System.Text.Encoding]::Unicode } else { New-Object System.Text.UTF8Encoding($false) }

$text = [System.IO.File]::ReadAllText($Path, $enc)
$cambios = New-Object System.Collections.Generic.List[string]

# 1) Guarda de base de datos
if ($text -notmatch "IF DB_ID\('RentaCarDB'\) IS NULL") {
    $text = $text -replace "(?m)^CREATE DATABASE \[RentaCarDB\]", "IF DB_ID('RentaCarDB') IS NULL`r`nCREATE DATABASE [RentaCarDB]"
    $cambios.Add("Guarda IF DB_ID('RentaCarDB') IS NULL agregada")
} else {
    $cambios.Add("Guarda de BD ya presente (sin cambios)")
}

# 2) Saneamiento de opciones de BD
$mapa = [ordered]@{
    'ALTER DATABASE \[RentaCarDB\] SET ANSI_WARNINGS OFF'            = 'ALTER DATABASE [RentaCarDB] SET ANSI_WARNINGS ON'
    'ALTER DATABASE \[RentaCarDB\] SET ARITHABORT OFF'               = 'ALTER DATABASE [RentaCarDB] SET ARITHABORT ON'
    'ALTER DATABASE \[RentaCarDB\] SET CONCAT_NULL_YIELDS_NULL OFF'  = 'ALTER DATABASE [RentaCarDB] SET CONCAT_NULL_YIELDS_NULL ON'
    'ALTER DATABASE \[RentaCarDB\] SET READ_COMMITTED_SNAPSHOT OFF'  = 'ALTER DATABASE [RentaCarDB] SET READ_COMMITTED_SNAPSHOT ON'
}
foreach ($k in $mapa.Keys) {
    if ($text -match $k) {
        $text = $text -replace $k, $mapa[$k]
        $cambios.Add("Opcion: $($mapa[$k])")
    }
}

# Guardar con la misma codificacion
[System.IO.File]::WriteAllText($Path, $text, $enc)

# 3) Verificacion
$trg    = ([regex]::Matches($text, '(?im)^\s*CREATE\s+TRIGGER')).Count
$grants = ([regex]::Matches($text, '(?im)^\s*(GRANT|DENY)\s')).Count
$perms  = ([regex]::Matches($text, '(?im)Script Permissions')).Count

Write-Host "=== patch_export.ps1 ==="
Write-Host "Archivo: $Path ($(if($isUtf16){'UTF-16 LE'}else{'UTF-8'}))"
Write-Host "Cambios aplicados:"
$cambios | ForEach-Object { Write-Host "  - $_" }
Write-Host ""
Write-Host "Verificacion:"
Write-Host ("  Triggers (CREATE TRIGGER) : {0}  {1}" -f $trg,    $(if ($trg -gt 0)    { 'OK' } else { '<-- FALTA: reexporta con Script Triggers = True' }))
Write-Host ("  Permisos (GRANT/DENY)     : {0}  {1}" -f $grants, $(if ($grants -gt 0) { 'OK' } else { '<-- FALTA: reexporta con Script Permissions = True' }))
Write-Host ""
if ($trg -eq 0 -or $grants -eq 0) {
    Write-Host "AVISO: el export no trae triggers y/o permisos. Revisa los pasos de SSMS o ejecuta"
    Write-Host "       sql\00_master_rentacar.sql (Fases 4 y 7.5) para recrearlos."
}
