#!/bin/bash
set -e

echo "🚀 Deploying Tic-Tac-Toe game to Google Cloud"
echo "=============================================="

PROJECT_ID=${1:-your-gcp-project}
ZONE=${2:-us-central1-a}
INSTANCE_NAME=${3:-tictactoe-game}
MACHINE_TYPE=${4:-e2-medium}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}gcloud CLI not found. Please install Google Cloud SDK.${NC}"
    exit 1
fi

gcloud config set project $PROJECT_ID

echo -e "${YELLOW}Creating firewall rules...${NC}"
gcloud compute firewall-rules create allow-game-ports --allow tcp:22,tcp:3000,tcp:7350,tcp:80,tcp:443 --source-ranges 0.0.0.0/0 2>/dev/null || true

STARTUP_SCRIPT=$(cat <<'EOF'
#!/bin/bash
apt-get update
apt-get install -y docker.io docker-compose git curl
systemctl start docker
systemctl enable docker
usermod -aG docker _default
cd /root
git clone https://github.com/yourusername/tictactoe-game.git
cd tictactoe-game
./scripts/auto-env.sh
docker-compose up -d
EOF
)

echo -e "${YELLOW}Creating Compute Engine instance...${NC}"
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --metadata-from-file startup-script=<(echo "$STARTUP_SCRIPT") \
    --tags=tictactoe-game

echo -e "${YELLOW}Waiting for instance to initialize...${NC}"
sleep 30

EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
    --zone=$ZONE \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo -e "${GREEN}Instance created: $INSTANCE_NAME${NC}"
echo -e "${GREEN}External IP: $EXTERNAL_IP${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Wait 2-3 minutes for services to initialize"
echo "  2. Open http://$EXTERNAL_IP:3000 in your browser"
echo "  3. Nakama API: http://$EXTERNAL_IP:7350"
echo ""
echo "SSH Access: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
