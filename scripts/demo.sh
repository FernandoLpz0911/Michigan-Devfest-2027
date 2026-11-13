#!/usr/bin/env bash
# Reset the data folder and start the backend for a live demo.
# Usage: scripts/demo.sh          (real Granite)
#        scripts/demo.sh --mock   (MOCK_GRANITE=1, no network)
set -euo pipefail

REPO="$(realpath "$(dirname "$0")/..")"
DATA_DIR="$(realpath -m "${DATA_DIR:-$REPO/data}")"
API_PORT="${API_PORT:-8000}"

# Refuse to delete anything outside the repo.
case "$DATA_DIR/" in
  "$REPO/"*) ;;
  *) echo "Refusing: data folder $DATA_DIR is not inside the repo. Nothing was deleted." >&2; exit 1 ;;
esac
if [ "$DATA_DIR" = "$REPO" ]; then
  echo "Refusing: data folder cannot be the repo folder itself. Nothing was deleted." >&2
  exit 1
fi

MODE_TEXT="real Granite (IBM watsonx)"
if [ "${1:-}" = "--mock" ]; then
  export MOCK_GRANITE=1
  MODE_TEXT="mock Granite (no network)"
fi

# Empty the data folder (database, formats, uploads, files), then recreate it.
mkdir -p "$DATA_DIR"
find "$DATA_DIR" -mindepth 1 -delete
export DATA_DIR

if [ -x "$REPO/.venv/bin/uvicorn" ]; then
  UVICORN="$REPO/.venv/bin/uvicorn"
else
  UVICORN="uvicorn"
fi

echo "Demo reset done. Running with $MODE_TEXT on port $API_PORT."
echo "To start the screens, open a second terminal: cd frontend && npm run dev"

cd "$REPO"
exec "$UVICORN" backend.main:app --port "$API_PORT"
