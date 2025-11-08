#!/bin/bash

# Deployment script for Tic-Tac-Toe game
# Supports AWS, GCP, Azure, and DigitalOcean

set -e

echo "🎮 Multiplayer Tic-Tac-Toe Deployment Script"
echo "============================================"

# Detect cloud provider
if [ -z "$CLOUD_PROVIDER" ]; then
  read -p "Enter cloud provider (aws/gcp/azure/digitalocean): " CLOUD_PROVIDER
fi

case "$CLOUD_PROVIDER" in
  aws)
    echo "📦 Deploying to AWS..."
    
    # Push to ECR
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
    docker build -t tictactoe:latest .
    docker tag tictactoe:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tictactoe:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tictactoe:latest
    
    echo "✅ Pushed to AWS ECR"
    echo "Deploy Docker image to ECS/EKS"
    ;;
    
  gcp)
    echo "📦 Deploying to Google Cloud..."
    
    # Push to GCR
    docker build -t gcr.io/$GCP_PROJECT/tictactoe:latest .
    docker push gcr.io/$GCP_PROJECT/tictactoe:latest
    
    echo "✅ Pushed to Google Container Registry"
    echo "Deploy to Cloud Run or GKE"
    ;;
    
  azure)
    echo "📦 Deploying to Azure..."
    
    # Push to ACR
    az acr build --registry $AZURE_REGISTRY --image tictactoe:latest .
    
    echo "✅ Pushed to Azure Container Registry"
    echo "Deploy to ACI or AKS"
    ;;
    
  digitalocean)
    echo "📦 Deploying to DigitalOcean..."
    
    # Push to DOCR
    doctl registry login
    docker build -t registry.digitalocean.com/$DO_REGISTRY/tictactoe:latest .
    docker push registry.digitalocean.com/$DO_REGISTRY/tictactoe:latest
    
    echo "✅ Pushed to DigitalOcean Container Registry"
    echo "Deploy App Platform or Kubernetes"
    ;;
    
  *)
    echo "❌ Unknown cloud provider: $CLOUD_PROVIDER"
    exit 1
    ;;
esac

echo ""
echo "🎮 Deployment script completed!"
