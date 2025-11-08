# Deployment Guide - Multiplayer Tic-Tac-Toe

## Overview

This guide covers deploying the Multiplayer Tic-Tac-Toe game to various cloud providers. The application consists of:

- **Frontend**: Next.js React application
- **Backend**: Nakama game server
- **Database**: PostgreSQL

## Prerequisites

- Docker & Docker Compose installed
- Cloud provider account (AWS, GCP, Azure, or DigitalOcean)
- Git repository with GitHub Actions enabled (optional)

## Local Development

### Quick Start with Docker Compose

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd multiplayer-tictactoe

# Copy environment template
cp .env.example .env.local

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Nakama Admin: http://localhost:7350
\`\`\`

### Verify Local Setup

\`\`\`bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
\`\`\`

## Production Deployment

### Environment Configuration

1. Copy `.env.example` to `.env.production`
2. Update all variables with production values:

\`\`\`bash
DB_PASSWORD=<strong-random-password>
NAKAMA_ENCRYPTION_KEY=<32-character-secret>
NEXT_PUBLIC_NAKAMA_URL=https://api.yourdomain.com:7350
\`\`\`

### AWS Deployment

#### Prerequisites

- AWS Account with ECR access
- AWS CLI configured with credentials

#### Steps

\`\`\`bash
# 1. Set environment variables
export AWS_ACCOUNT_ID=<your-account-id>
export CLOUD_PROVIDER=aws

# 2. Run deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 3. Create ECS task definition
# - Use the ECR image URI
# - Configure environment variables
# - Set up RDS for PostgreSQL
# - Configure load balancer

# 4. Deploy to ECS
aws ecs create-service \
  --cluster tictactoe-cluster \
  --service-name tictactoe-service \
  --task-definition tictactoe:1 \
  --desired-count 2 \
  --load-balancers targetGroupArn=<arn>,containerName=frontend,containerPort=3000
\`\`\`

### Google Cloud Platform (GCP)

#### Prerequisites

- Google Cloud Project
- gcloud CLI configured

#### Steps

\`\`\`bash
# 1. Set environment variables
export GCP_PROJECT=<your-project-id>
export CLOUD_PROVIDER=gcp

# 2. Run deployment script
./scripts/deploy.sh

# 3. Deploy to Cloud Run
gcloud run deploy tictactoe-frontend \
  --image gcr.io/$GCP_PROJECT/tictactoe:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars NEXT_PUBLIC_NAKAMA_URL=https://nakama.yourdomain.com:7350

# 4. Deploy Nakama to GKE or Cloud Run for Backend
\`\`\`

### Azure Deployment

#### Prerequisites

- Azure subscription
- Azure CLI configured

#### Steps

\`\`\`bash
# 1. Set environment variables
export AZURE_REGISTRY=<registry-name>
export CLOUD_PROVIDER=azure

# 2. Run deployment script
./scripts/deploy.sh

# 3. Deploy to Azure Container Instances or App Service
az container create \
  --resource-group tictactoe-rg \
  --name tictactoe-app \
  --image $AZURE_REGISTRY.azurecr.io/tictactoe:latest \
  --environment-variables \
    NEXT_PUBLIC_NAKAMA_URL=https://nakama.yourdomain.com:7350
\`\`\`

### DigitalOcean Deployment

#### Prerequisites

- DigitalOcean account
- doctl CLI configured

#### Steps

\`\`\`bash
# 1. Set environment variables
export DO_REGISTRY=<registry-name>
export CLOUD_PROVIDER=digitalocean

# 2. Run deployment script
./scripts/deploy.sh

# 3. Deploy to App Platform
doctl apps create --spec app.yaml

# 4. Or deploy via Kubernetes
doctl kubernetes cluster create tictactoe-cluster
kubectl apply -f k8s/deployment.yaml
\`\`\`

## Quick Deploy Commands

Deploy to any cloud provider with a single command:

### AWS EC2 Deployment
\`\`\`bash
chmod +x scripts/deploy-aws.sh
./scripts/deploy-aws.sh                    # Default: us-east-1, t3.medium
./scripts/deploy-aws.sh us-west-2 t3.large # Custom region and instance type
\`\`\`

**What it does:**
- Creates security group with game ports (3000, 7350)
- Generates or uses existing SSH key pair
- Finds latest Ubuntu 22.04 LTS AMI
- Launches EC2 instance with Docker
- Auto-clones repository and starts services
- Returns public IP for immediate access

### Google Cloud Deployment
\`\`\`bash
chmod +x scripts/deploy-gcp.sh
./scripts/deploy-gcp.sh your-project-id           # Default: us-central1-a, e2-medium
./scripts/deploy-gcp.sh your-project-id us-west1-b e2-large
\`\`\`

**What it does:**
- Sets up firewall rules for game
- Creates Compute Engine instance
- Configures startup script
- Auto-initializes services
- Provides gcloud SSH command

### Azure Deployment
\`\`\`bash
chmod +x scripts/deploy-azure.sh
./scripts/deploy-azure.sh                 # Default: eastus
./scripts/deploy-azure.sh my-rg eastus    # Custom resource group
\`\`\`

**What it does:**
- Creates resource group
- Sets up network security group
- Configures firewall rules
- Launches Ubuntu VM
- Auto-starts all services
- Provides SSH access details

### DigitalOcean Deployment
\`\`\`bash
chmod +x scripts/deploy-digitalocean.sh
export DIGITALOCEAN_TOKEN="your_api_token"
./scripts/deploy-digitalocean.sh          # Default: nyc3, s-2vcpu-4gb
./scripts/deploy-digitalocean.sh $TOKEN sfo3 s-4vcpu-8gb
\`\`\`

**What it does:**
- Creates DigitalOcean droplet
- Configures networking
- Auto-initializes services
- Monitors deployment status
- Returns droplet IP address

## Post-Deployment

After deployment, you'll receive:
- Public IP address
- SSH connection command
- Service URLs (Frontend: 3000, Nakama: 7350)

**Access your game:**
\`\`\`
Frontend:  http://<PUBLIC_IP>:3000
Nakama:    http://<PUBLIC_IP>:7350
Admin:     http://<PUBLIC_IP>:7350/console
\`\`\`

Wait 2-3 minutes for services to initialize after deployment.

## Deployment Cost Estimates

| Provider | Instance | Monthly Cost |
|----------|----------|--------------|
| AWS      | t3.medium (1 month free eligible) | $30-40 |
| GCP      | e2-medium (free tier available) | $25-35 |
| Azure    | Standard_B2s | $40-50 |
| DigitalOcean | 2GB Droplet | $12-18 |

## CI/CD Pipeline

The repository includes GitHub Actions workflows for automated deployment:

1. **Build & Test**: Runs on every push and PR
   - Installs dependencies
   - Runs linter
   - Builds Next.js application
   - Builds Docker image

2. **Push to Registry**: Runs on main branch
   - Builds and pushes Docker image to GHCR

3. **Production Deploy**: Runs on production branch
   - Executes cloud provider deployment script

### Setting up GitHub Actions

1. Add secrets to GitHub repository:
   - `CLOUD_PROVIDER` - aws/gcp/azure/digitalocean
   - `AWS_ACCOUNT_ID` - (for AWS)
   - `GCP_PROJECT` - (for GCP)
   - `AZURE_REGISTRY` - (for Azure)
   - `DO_REGISTRY` - (for DigitalOcean)

2. Push to appropriate branches:
   - Push to `main` - triggers build & test
   - Push to `production` - triggers full deployment

## Monitoring & Maintenance

### Health Checks

\`\`\`bash
./scripts/health-check.sh
\`\`\`

### View Logs

#### Docker Compose
\`\`\`bash
docker-compose logs -f frontend
docker-compose logs -f nakama
\`\`\`

#### Cloud Providers
- AWS: CloudWatch Logs
- GCP: Cloud Logging
- Azure: Application Insights
- DigitalOcean: Logs in App Platform

### Database Backups

#### PostgreSQL
\`\`\`bash
# Backup
docker-compose exec postgres pg_dump -U nakama nakama > backup.sql

# Restore
docker-compose exec -T postgres psql -U nakama nakama < backup.sql
\`\`\`

## Scaling

### Horizontal Scaling

For production, scale by:

1. **Frontend**: Add more container replicas behind a load balancer
2. **Nakama**: Deploy multiple instances with shared database
3. **Database**: Consider managed services (AWS RDS, Cloud SQL, etc.)

### Performance Tips

- Enable caching on CDN
- Use WebSocket connection pooling
- Monitor database queries
- Set appropriate resource limits
- Use auto-scaling policies

## Troubleshooting

### Container won't start

\`\`\`bash
# Check logs
docker-compose logs <service-name>

# Rebuild image
docker-compose build --no-cache
\`\`\`

### Database connection issues

- Verify DATABASE_URL is correct
- Check database credentials
- Ensure network connectivity
- Check firewall rules

### WebSocket connection failures

- Verify NEXT_PUBLIC_NAKAMA_URL is correct
- Check CORS configuration
- Ensure ports are exposed
- Check network policies

### Services not starting after deployment

SSH to instance and check logs:
\`\`\`bash
docker-compose logs -f
docker-compose ps
\`\`\`

### Cannot access frontend on port 3000

Check firewall rules:
- AWS: Security group allows 3000
- GCP: Firewall rule allows 3000
- Azure: NSG rule allows 3000
- DigitalOcean: Cloud Firewall allows 3000

### Database connection errors

SSH to instance and restart services:
\`\`\`bash
docker-compose restart postgres
docker-compose restart nakama
docker-compose restart frontend
\`\`\`

### Nakama API unreachable

Verify Nakama is running:
\`\`\`bash
curl http://localhost:7350/status
docker-compose logs nakama
\`\`\`

## Support

For issues or questions:
1. Check logs with health check script
2. Review cloud provider documentation
3. Open GitHub issue with error details
