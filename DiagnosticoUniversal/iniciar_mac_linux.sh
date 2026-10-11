#!/bin/sh
# macOS / Linux: doble clic o ./iniciar_mac_linux.sh
cd "$(dirname "$0")" && python3 diagnostico_pc.py "$@"
