#!/bin/bash
# Inicializacion idempotente de RentaCarDB para el contenedor SQL Server (Linux).
# Aplica el esquema solo si la base no tiene tablas todavia.
set -euo pipefail

SQLCMD=""
for candidate in /opt/mssql-tools18/bin/sqlcmd /opt/mssql-tools/bin/sqlcmd; do
  if [ -x "$candidate" ]; then
    SQLCMD="$candidate"
    break
  fi
done

if [ -z "$SQLCMD" ]; then
  echo "ERROR: no se encontro sqlcmd en la imagen." >&2
  exit 1
fi

TRUST=""
case "$SQLCMD" in
  *tools18*) TRUST="-C" ;;
esac

echo "Verificando estado de RentaCarDB..."
STATE=$(
  "$SQLCMD" -S db -U sa -P "$MSSQL_SA_PASSWORD" ${TRUST} -h -1 -Q \
    "SET NOCOUNT ON; SELECT CASE WHEN OBJECT_ID('RentaCarDB.dbo.Usuario') IS NULL THEN 0 ELSE 1 END" \
    | tr -d '[:space:]'
)

if [ "$STATE" = "1" ]; then
  echo "RentaCarDB ya inicializada. Nada que hacer."
  exit 0
fi

if [ "$STATE" != "0" ]; then
  echo "ERROR: verificacion inesperada del estado de la BD ('$STATE')." >&2
  exit 1
fi

echo "Aplicando RentacarFinal.sql..."
"$SQLCMD" -S db -U sa -P "$MSSQL_SA_PASSWORD" ${TRUST} -b -i /scripts/RentacarFinal.sql
echo "Esquema RentaCarDB aplicado correctamente."
