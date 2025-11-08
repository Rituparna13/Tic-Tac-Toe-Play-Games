# Quick Start: Deploy Nakama Multiplayer Game to AWS

## Prerequisites
- AWS Account with AWS CLI configured (`aws configure`)
- Git installed
- Docker and Docker Compose (for local testing)

## One-Command Deployment

### Step 1: Deploy Nakama Server to AWS EC2

\`\`\`bash
# Clone the repository
git clone <your-repo-url> tictactoe-game
cd tictactoe-game

# Make the script executable
chmod +x scripts/deploy-aws.sh

# Deploy to AWS (will create EC2 instance with everything)
./scripts/deploy-aws.sh us-east-1 t3.medium
\`\`\`

The script will:
1. Create security groups with proper firewall rules
2. Generate/use SSH key pair
3. Launch Ubuntu EC2 instance
4. Auto-clone your repo and start services
5. Return the public IP address

### Step 2: Wait for Services to Start

After deployment, wait 2-3 minutes for:
- PostgreSQL to initialize
- Nakama server to start
- Frontend to build and launch

### Step 3: Access Your Game

Once deployment completes, you'll see:
\`\`\`
Public IP: XX.XX.XX.XX
\`\`\`

Access these URLs:
- **Frontend**: http://XX.XX.XX.XX:3000
- **Nakama API**: http://XX.XX.XX.XX:7350
- **Nakama Console**: http://XX.XX.XX.XX:7351

### Step 4: Test Multiplayer

1. Open the frontend URL in two browser windows
2. Window 1: Sign up with email1@test.com
3. Window 2: Sign up with email2@test.com
4. Window 1: Click "Create Game"
5. Window 2: Click "Join Game" and select the room
6. Play Tic-Tac-Toe in real-time!

## Local Testing Before Deployment

\`\`\`bash
# Start services locally
./scripts/auto-env.sh
docker-compose up --build

# Access at http://localhost:3000
\`\`\`

## SSH Access to EC2 Instance

\`\`\`bash
# Get the key pair name from deployment output
ssh -i tictactoe-key.pem ubuntu@<PUBLIC_IP>

# View logs
docker logs tictactoe_nakama
docker logs tictactoe_frontend
\`\`\`

## How It Works

### Client-Side (React Frontend)
- Located at `http://<PUBLIC_IP>:3000`
- Uses WebSocket to connect to Nakama server
- Sends game actions (create room, join, make move)
- Receives real-time game state updates

### Server-Side (Nakama Backend)
- Located at `http://<PUBLIC_IP>:7350`
- Manages all game state and validation
- Prevents client-side cheating with server-authoritative logic
- Broadcasts updates to all connected players
- Stores player stats and leaderboard in PostgreSQL

### Database (PostgreSQL)
- Runs inside the EC2 instance
- Stores all persistent data (games, players, stats)
- Automatically initialized by Nakama on first run

## Key Features Implemented

✅ **Server-Authoritative Game Logic** - All moves validated on server
✅ **Real-Time Multiplayer** - WebSocket updates for instant play
✅ **Leaderboard System** - Track wins/losses/draws
✅ **Concurrent Games** - Multiple games running simultaneously
✅ **Auto-Matchmaking** - Quick match system to pair players
✅ **Secure Deployment** - Proper security groups and isolated network

## Cost Estimation

- **t3.medium EC2**: ~$0.04/hour (~$30/month)
- **Data transfer**: Minimal (~$0-5/month)
- **Storage**: ~1GB PostgreSQL (~$0/month)
- **Total**: ~$30-35/month

## Troubleshooting

### Services won't start
\`\`\`bash
ssh -i tictactoe-key.pem ubuntu@<PUBLIC_IP>
docker-compose logs -f
\`\`\`

### Port 3000 not accessible
- Check security group allows port 3000 inbound from 0.0.0.0/0
- Wait 2-3 minutes for services to fully initialize

### Game room not found when joining
- Ensure both players are connected to same Nakama server
- Check Nakama logs: `docker logs tictactoe_nakama`

## Next Steps

1. **Custom Domain**: Use Route 53 to point custom domain to EC2 IP
2. **SSL Certificate**: Use AWS Certificate Manager + Application Load Balancer
3. **Auto-Scaling**: Setup Auto Scaling Group for multiple instances
4. **Monitoring**: Configure CloudWatch alerts for CPU/Memory/Errors
5. **Backup**: Setup RDS for automated database backups

## Support

For issues:
1. Check CloudWatch Logs in AWS Console
2. SSH into instance and check `docker-compose logs`
3. Review DEPLOYMENT.md for advanced configuration
