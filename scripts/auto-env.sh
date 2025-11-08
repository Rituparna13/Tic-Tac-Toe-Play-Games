#!/bin/bash
set -e

echo "🔧 Setting up automatic environment variables..."

# Create .env.auto if not exists
if [ ! -f .env.auto ]; then
  echo "📝 Generating .env.auto file with secure values..."
  
  # Generate secure random values
  DB_PASSWORD=$(openssl rand -hex 12)
  ENCRYPTION_KEY=$(openssl rand -hex 16)
  
  cat > .env.auto <<EOT
# ============================================
# AUTO-GENERATED ENVIRONMENT VARIABLES
# Generated: $(date)
# ============================================

# Database Configuration
DB_NAME=nakama
DB_USER=nakama
DB_PASSWORD=${DB_PASSWORD}

# Nakama Configuration (Server-only)
NAKAMA_ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Frontend Configuration (Safe to expose to client)
NEXT_PUBLIC_NAKAMA_URL=http://localhost:7350

# Cloud & Deployment (optional - for reference)
CLOUD_PROVIDER=local
AWS_ACCOUNT_ID=
GCP_PROJECT=
AZURE_REGISTRY=
DO_REGISTRY=

# Logging
LOG_LEVEL=debug
EOT
  
  echo "✅ .env.auto created with secure encryption keys"
else
  echo "ℹ️  .env.auto already exists — using existing configuration"
fi

echo "✅ Environment setup complete!"
