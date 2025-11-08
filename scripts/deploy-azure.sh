#!/bin/bash
set -e

echo "🚀 Deploying Tic-Tac-Toe game to Microsoft Azure"
echo "================================================"

RESOURCE_GROUP=${1:-tictactoe-rg}
LOCATION=${2:-eastus}
VM_NAME=${3:-tictactoe-game}
VM_SIZE=${4:-Standard_B2s}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION

echo -e "${YELLOW}Creating network security group...${NC}"
az network nsg create --resource-group $RESOURCE_GROUP --name tictactoe-nsg

az network nsg rule create --resource-group $RESOURCE_GROUP --nsg-name tictactoe-nsg \
    --name AllowSSH --priority 1000 --source-address-prefixes '*' --destination-port-ranges 22 \
    --access Allow --protocol Tcp

az network nsg rule create --resource-group $RESOURCE_GROUP --nsg-name tictactoe-nsg \
    --name AllowHTTP --priority 1001 --source-address-prefixes '*' --destination-port-ranges 80 \
    --access Allow --protocol Tcp

az network nsg rule create --resource-group $RESOURCE_GROUP --nsg-name tictactoe-nsg \
    --name AllowGame --priority 1002 --source-address-prefixes '*' --destination-port-ranges 3000 \
    --access Allow --protocol Tcp

az network nsg rule create --resource-group $RESOURCE_GROUP --nsg-name tictactoe-nsg \
    --name AllowNakama --priority 1003 --source-address-prefixes '*' --destination-port-ranges 7350 \
    --access Allow --protocol Tcp

STARTUP_SCRIPT=$(cat <<'EOF'
#!/bin/bash
apt-get update
apt-get install -y docker.io docker-compose git curl
systemctl start docker
systemctl enable docker
usermod -aG docker azureuser
cd /home/azureuser
git clone https://github.com/yourusername/tictactoe-game.git
cd tictactoe-game
sudo -u azureuser ./scripts/auto-env.sh
sudo -u azureuser docker-compose up -d
EOF
)

echo -e "${YELLOW}Creating virtual machine...${NC}"
az vm create \
    --resource-group $RESOURCE_GROUP \
    --name $VM_NAME \
    --image UbuntuLTS \
    --size $VM_SIZE \
    --nsg tictactoe-nsg \
    --public-ip-sku Standard \
    --custom-data "$STARTUP_SCRIPT" \
    --generate-ssh-keys

PUBLIC_IP=$(az vm show --resource-group $RESOURCE_GROUP --name $VM_NAME \
    -d --query publicIps -o tsv)

echo -e "${GREEN}VM created successfully!${NC}"
echo -e "${GREEN}Public IP: $PUBLIC_IP${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Wait 2-3 minutes for services to initialize"
echo "  2. Open http://$PUBLIC_IP:3000 in your browser"
echo "  3. Nakama API: http://$PUBLIC_IP:7350"
echo ""
echo "SSH Access: ssh azureuser@$PUBLIC_IP"
