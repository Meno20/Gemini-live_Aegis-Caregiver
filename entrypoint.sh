#!/bin/sh

# Set Hostname as recommended by Next.js and USER
export HOSTNAME=0.0.0.0

# Define internal ports
# We use 3001 for Next.js so it doesn't conflict with Cloud Run's $PORT (if it happens to be 3000 or 8080)
export NEXT_INTERNAL_PORT=3001
export WS_INTERNAL_PORT=8081

echo "--------------- Aegis Container Startup ---------------"
echo "Public Port (Cloud Run): $PORT"
echo "Next.js Internal Port: $NEXT_INTERNAL_PORT"
echo "WebSocket Internal Port: $WS_INTERNAL_PORT"

# 1. Start Next.js
echo ">> Starting Next.js app..."
PORT=$NEXT_INTERNAL_PORT node server.js &

# 2. Start WebSocket Server
echo ">> Starting Gemini Live WebSocket server..."
LIVE_WS_PORT=$WS_INTERNAL_PORT node server/live-ws.js &

# 3. Start Caddy as the entrypoint (Foreground)
echo ">> Starting Caddy Reverse Proxy..."
caddy run --config Caddyfile --adapter caddyfile
