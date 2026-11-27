#!/bin/bash
# Corre todas las pruebas del juego. Uso: bash tests/todo.sh [carpeta_para_capturas]
cd "$(dirname "$0")/.." && node build.js >/dev/null || exit 1
OUT=${1:-/tmp}
fail=0
for t in smoke newplayer pets rural obby obby_walk survive adventure park extras; do
  r=$(node tests/$t.js "$OUT" 2>&1)
  e=$(echo "$r" | grep -E "ERRORES" | tail -1)
  if echo "$e" | grep -q "ERRORES \[\]"; then echo "OK    $t"; else echo "FALLA $t"; echo "$r" | tail -8; fail=1; fi
done
exit $fail
