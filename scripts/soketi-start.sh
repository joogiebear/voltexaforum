#!/usr/bin/env bash
set -e

echo "=== VoltexaHub Soketi WebSocket Server ==="
echo ""

# Check if soketi is installed globally
if npm list -g @soketi/soketi >/dev/null 2>&1; then
  echo "[OK] Soketi is installed."
else
  echo "[!] Soketi is NOT installed globally."
  echo ""
  echo "    Install it with:"
  echo "      npm install -g @soketi/soketi"
  echo ""
  exit 1
fi

echo ""
echo "Starting Soketi on port 6001..."
echo "  APP_ID:  voltexahub"
echo "  KEY:     voltexahub-key"
echo "  SECRET:  voltexahub-secret"
echo ""

soketi start \
  --default.appId="voltexahub" \
  --default.appKey="voltexahub-key" \
  --default.appSecret="voltexahub-secret" \
  --port=6001 \
  --debug=true
