#!/bin/zsh

set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
RUNTIME_DIR="$PROJECT_DIR/.run"
PID_FILE="$RUNTIME_DIR/dev-server.pid"
LOG_FILE="$RUNTIME_DIR/dev-server.log"
URL_FILE="$RUNTIME_DIR/dev-server.url"
NPM_BIN="$(command -v npm || true)"

mkdir -p "$RUNTIME_DIR"

if [[ -z "$NPM_BIN" ]]; then
  echo "npm was not found. Install Node.js first, then run this launcher again."
  exit 1
fi

is_our_app_ready() {
  local url="$1"
  /usr/bin/curl -sfI "$url" >/dev/null 2>&1
}

read_url_file() {
  if [[ -f "$URL_FILE" ]]; then
    tr -d '[:space:]' < "$URL_FILE"
  fi
}

find_running_app_url() {
  local known_url
  known_url="$(read_url_file || true)"
  if [[ -n "${known_url:-}" ]] && is_our_app_ready "$known_url"; then
    echo "$known_url"
    return 0
  fi

  local port
  for port in {5173..5179}; do
    local candidate_url="http://127.0.0.1:${port}/"
    if is_our_app_ready "$candidate_url"; then
      echo "$candidate_url"
      return 0
    fi
  done

  return 1
}

find_available_port() {
  local port
  for port in {5173..5179}; do
    if ! /usr/bin/curl -sfI "http://127.0.0.1:${port}/" >/dev/null 2>&1; then
      echo "$port"
      return 0
    fi
  done

  return 1
}

wait_for_app_url() {
  local url="$1"
  local attempt
  for attempt in {1..60}; do
    if is_our_app_ready "$url"; then
      echo "$url" > "$URL_FILE"
      echo "5mao-Imager is ready."
      /usr/bin/open "$url"
      return 0
    fi
    sleep 1
  done

  return 1
}

read_pid_file() {
  if [[ -f "$PID_FILE" ]]; then
    tr -d '[:space:]' < "$PID_FILE"
  fi
}

RUNNING_APP_URL="$(find_running_app_url || true)"
if [[ -n "${RUNNING_APP_URL:-}" ]]; then
  /usr/bin/open "$RUNNING_APP_URL"
  exit 0
fi

if [[ ! -d "$PROJECT_DIR/node_modules" ]]; then
  echo "Installing dependencies for 5mao-Imager..."
  cd "$PROJECT_DIR"
  "$NPM_BIN" install
fi

EXISTING_PID="$(read_pid_file || true)"
if [[ -n "${EXISTING_PID:-}" ]] && kill -0 "$EXISTING_PID" >/dev/null 2>&1; then
  echo "Waiting for the existing 5mao-Imager service to become ready..."
else
  rm -f "$PID_FILE"
  APP_PORT="$(find_available_port || true)"
  if [[ -z "${APP_PORT:-}" ]]; then
    echo "No available localhost port was found between 5173 and 5179."
    exit 1
  fi
  APP_URL="http://127.0.0.1:${APP_PORT}/"
  echo "Starting 5mao-Imager..."
  cd "$PROJECT_DIR"
  nohup "$NPM_BIN" exec vite -- --host 127.0.0.1 --port "$APP_PORT" --strictPort >"$LOG_FILE" 2>&1 &
  echo "$!" > "$PID_FILE"
fi

APP_URL="${APP_URL:-$(find_running_app_url || true)}"
if [[ -n "${APP_URL:-}" ]] && wait_for_app_url "$APP_URL"; then
  exit 0
fi

echo "5mao-Imager did not start within 60 seconds."
echo "Check the log file: $LOG_FILE"
exit 1
