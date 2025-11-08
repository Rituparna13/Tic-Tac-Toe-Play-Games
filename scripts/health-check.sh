#!/bin/bash

# Health check script for deployment verification

set -e

echo "🏥 Running health checks..."

NAKAMA_URL=${NEXT_PUBLIC_NAKAMA_URL:-http://localhost:7350}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}

# Check Nakama API
echo "Checking Nakama API..."
if curl -s "${NAKAMA_URL}/status" > /dev/null; then
  echo "✓ Nakama API is healthy"
else
  echo "✗ Nakama API is not responding"
  exit 1
fi

# Check Frontend
echo "Checking Frontend..."
if curl -s "${FRONTEND_URL}/" > /dev/null; then
  echo "✓ Frontend is healthy"
else
  echo "✗ Frontend is not responding"
  exit 1
fi

# Check Database connectivity through Nakama
echo "Checking Database connectivity..."
if curl -s "${NAKAMA_URL}/healthz" > /dev/null; then
  echo "✓ Database connectivity verified"
else
  echo "✗ Database connectivity failed"
  exit 1
fi

echo ""
echo "✅ All health checks passed!"
