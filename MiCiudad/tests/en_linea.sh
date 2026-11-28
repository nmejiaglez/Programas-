#!/bin/bash
# Pruebas en línea REALES contra Firebase (necesitan internet). Uso: bash tests/en_linea.sh
cd "$(dirname "$0")/.." && node build.js >/dev/null || exit 1
for t in online parents account_transfer logout invites; do
  r=$(node tests/$t.js "${1:-/tmp}" 2>&1); e=$(echo "$r" | grep -E "ERRORES" | tail -1)
  if echo "$e" | grep -qE "ERRORES( A)? \[\]( B \[\])?( \[\])?$"; then echo "OK    $t"; else echo "FALLA $t"; echo "$r" | tail -8; fi
done
