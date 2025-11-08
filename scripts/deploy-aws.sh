#!/bin/bash
set -e

echo "🚀 Deploying Tic-Tac-Toe game to AWS EC2"
echo "=========================================="

AWS_REGION=${1:-us-east-1}
INSTANCE_TYPE=${2:-t3.medium}
KEY_PAIR_NAME=${3:-tictactoe-key}
SECURITY_GROUP_NAME="tictactoe-sg"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating security group...${NC}"
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name $SECURITY_GROUP_NAME \
    --description "Tic-Tac-Toe game security group" \
    --region $AWS_REGION \
    --query 'GroupId' \
    --output text 2>/dev/null || echo "")

if [ -z "$SECURITY_GROUP_ID" ]; then
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
        --region $AWS_REGION \
        --query 'SecurityGroups[0].GroupId' \
        --output text)
fi

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 7350 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION 2>/dev/null || true

echo -e "${GREEN}Security group configured: $SECURITY_GROUP_ID${NC}"

if ! aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME --region $AWS_REGION &>/dev/null; then
    echo -e "${YELLOW}Creating key pair...${NC}"
    aws ec2 create-key-pair \
        --key-name $KEY_PAIR_NAME \
        --region $AWS_REGION \
        --query 'KeyMaterial' \
        --output text > $KEY_PAIR_NAME.pem
    chmod 600 $KEY_PAIR_NAME.pem
    echo -e "${GREEN}Key pair created: $KEY_PAIR_NAME.pem${NC}"
fi

echo -e "${YELLOW}Finding Ubuntu 22.04 LTS AMI...${NC}"
AMI_ID=$(aws ec2 describe-images \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
    --region $AWS_REGION \
    --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
    --output text)

echo -e "${GREEN}Using AMI: $AMI_ID${NC}"

read -r -d '' USER_DATA << 'EOF' || true
#!/bin/bash
set -e
apt-get update
apt-get install -y docker.io docker-compose git curl
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu
cd /home/ubuntu
git clone https://github.com/yourusername/tictactoe-game.git
cd tictactoe-game
./scripts/auto-env.sh
docker-compose up -d
echo "Deployment complete!"
EOF

echo -e "${YELLOW}Launching EC2 instance...${NC}"
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_PAIR_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --region $AWS_REGION \
    --user-data "$USER_DATA" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo -e "${GREEN}Instance launched: $INSTANCE_ID${NC}"

echo -e "${YELLOW}Waiting for instance to start...${NC}"
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION

PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $AWS_REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo -e "${GREEN}Instance is running!${NC}"
echo -e "${GREEN}Public IP: $PUBLIC_IP${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Wait 2-3 minutes for services to initialize"
echo "  2. Open http://$PUBLIC_IP:3000 in your browser"
echo "  3. Nakama API: http://$PUBLIC_IP:7350"
echo ""
echo "SSH Access: ssh -i $KEY_PAIR_NAME.pem ubuntu@$PUBLIC_IP"
