#!/bin/bash
set -e

echo "🚀 Deploying Tic-Tac-Toe game to DigitalOcean"
echo "=============================================="

API_TOKEN=${1:-$DIGITALOCEAN_TOKEN}
REGION=${2:-nyc3}
SIZE=${3:-s-2vcpu-4gb}
DROPLET_NAME=${4:-tictactoe-game}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$API_TOKEN" ]; then
    echo -e "${RED}DigitalOcean API token required. Set DIGITALOCEAN_TOKEN env var or pass as argument.${NC}"
    exit 1
fi

STARTUP_SCRIPT=$(cat <<'EOF'
#!/bin/bash
apt-get update
apt-get install -y docker.io docker-compose git curl
systemctl start docker
systemctl enable docker
usermod -aG docker root
cd /root
git clone https://github.com/yourusername/tictactoe-game.git
cd tictactoe-game
./scripts/auto-env.sh
docker-compose up -d
EOF
)

echo -e "${YELLOW}Creating DigitalOcean droplet...${NC}"
RESPONSE=$(curl -s -X POST "https://api.digitalocean.com/v2/droplets" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_TOKEN" \
    -d @- <<PAYLOAD
{
  "name": "$DROPLET_NAME",
  "region": "$REGION",
  "size": "$SIZE",
  "image": "ubuntu-22-04-x64",
  "user_data": "$(echo "$STARTUP_SCRIPT" | base64 -w 0)"
}
PAYLOAD
)

DROPLET_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$DROPLET_ID" ]; then
    echo -e "${RED}Failed to create droplet${NC}"
    echo $RESPONSE
    exit 1
fi

echo -e "${GREEN}Droplet created: $DROPLET_ID${NC}"

echo -e "${YELLOW}Waiting for droplet to be active...${NC}"
for i in {1..30}; do
    STATUS=$(curl -s -X GET "https://api.digitalocean.com/v2/droplets/$DROPLET_ID" \
        -H "Authorization: Bearer $API_TOKEN" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    
    if [ "$STATUS" = "active" ]; then
        break
    fi
    echo "Status: $STATUS... waiting"
    sleep 5
done

IP=$(curl -s -X GET "https://api.digitalocean.com/v2/droplets/$DROPLET_ID" \
    -H "Authorization: Bearer $API_TOKEN" | grep -o '"ip_address":"[^"]*' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}Droplet is active!${NC}"
echo -e "${GREEN}IP Address: $IP${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Wait 2-3 minutes for services to initialize"
echo "  2. Open http://$IP:3000 in your browser"
echo "  3. Nakama API: http://$IP:7350"
echo ""
echo "SSH Access: ssh root@$IP"
