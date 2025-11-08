# Multiplayer Tic-Tac-Toe Game

A real-time multiplayer Tic-Tac-Toe game built with modern web technologies. Features live matchmaking, leaderboards, and a robust backend powered by Nakama.

## Features

- **Real-time Multiplayer**: Play against other players in real-time using WebSockets
- **Live Matchmaking**: Automatic matchmaking system to find opponents
- **Leaderboard System**: Track player rankings and statistics
- **User Authentication**: Secure authentication with Nakama backend
- **Responsive UI**: Modern React interface with Tailwind CSS
- **Real-time Updates**: Live game state synchronization
- **Cross-platform**: Works on desktop and mobile browsers

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Real-time**: Native WebSocket support
- **State Management**: React hooks with SWR

### Backend
- **Game Server**: Nakama
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Scripting**: Lua modules for game logic

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Cloud Support**: AWS, GCP, Azure, DigitalOcean

## Project Structure

\`\`\`
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main page component
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── auth-form.tsx            # Authentication component
│   ├── game-board.tsx           # Game board logic
│   ├── game-lobby.tsx           # Matchmaking lobby
│   ├── leaderboard.tsx          # Leaderboard display
│   ├── theme-provider.tsx       # Theme context
│   └── ui/                      # shadcn/ui components
├── hooks/                        # Custom React hooks
│   ├── use-nakama.ts            # Nakama integration hook
│   ├── use-mobile.ts            # Mobile detection hook
│   └── use-toast.ts             # Toast notifications
├── lib/                          # Utility functions
│   └── utils.ts                 # Helper functions
├── nakama/                       # Nakama backend
│   ├── modules/                 # Game logic modules
│   │   └── tictactoe.ts        # Tic-Tac-Toe game rules
│   ├── nakama.yml              # Nakama configuration
│   └── Dockerfile              # Nakama container build
├── scripts/                      # Deployment & utility scripts
│   ├── deploy.sh               # Multi-cloud deployment
│   └── health-check.sh         # Health verification
├── public/                       # Static assets
├── docker-compose.yml           # Local development setup
├── docker-compose.prod.yml      # Production setup
├── Dockerfile                   # Frontend build
├── Dockerfile.prod              # Optimized production build
└── .env.example                 # Environment template

\`\`\`

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Local Development

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/multiplayer-tictactoe.git
   cd multiplayer-tictactoe
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   # Edit .env.local with your values
   \`\`\`

4. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Access the application**
   - Frontend: http://localhost:3000
   - Nakama Admin: http://localhost:7350

### Docker Development

\`\`\`bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
\`\`\`

## Usage

### Playing the Game

1. **Sign Up / Login**
   - Enter a username and password
   - Click "Create Account" or "Login"

2. **Find an Opponent**
   - Click "Find Match" in the lobby
   - Wait for the matchmaking system to find an opponent
   - Game starts automatically

3. **Play**
   - Click cells to place your mark
   - Alternate turns with your opponent
   - First to get 3 in a row wins

4. **View Leaderboard**
   - Click "Leaderboard" tab
   - See top players by rating
   - Track your progress

## API Documentation

### Game Room Events

The game uses WebSocket rooms for real-time communication:

#### Message Types

**Game State Update**
\`\`\`json
{
  "board": [0, 1, 2, 1, 2, 1, 0, 0, 2],
  "currentTurn": 1,
  "gameStatus": "active"
}
\`\`\`

**Player Move**
\`\`\`json
{
  "type": "move",
  "position": 4,
  "player": 1
}
\`\`\`

**Game End**
\`\`\`json
{
  "type": "game_end",
  "winner": 1,
  "loser": 2
}
\`\`\`

### REST Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/logout` - Logout

#### Leaderboard
- `GET /api/leaderboard` - Get top players
- `GET /api/leaderboard/:userId` - Get user stats

#### Matchmaking
- `POST /api/match/find` - Find opponent
- `POST /api/match/cancel` - Cancel search

## Configuration

### Environment Variables

\`\`\`bash
# Database (Server-only - NOT exposed to client)
DB_NAME=nakama
DB_USER=nakama
DB_PASSWORD=your_password

# Nakama (Server-only - NOT exposed to client)
NAKAMA_ENCRYPTION_KEY=your_secret_key

# Frontend (Public - safe to expose to client)
NEXT_PUBLIC_NAKAMA_URL=http://localhost:7350

# Node
NODE_ENV=development
\`\`\`

### Security Notes

⚠️ **Important**: Only environment variables prefixed with `NEXT_PUBLIC_` are exposed to the client-side code. All other variables are server-only and secure:

- ✅ `NEXT_PUBLIC_NAKAMA_URL` - Safe to expose (just the server address)
- ✅ `NEXT_PUBLIC_*` - Any var with this prefix is public
- ❌ `NAKAMA_ENCRYPTION_KEY` - Server-only, never expose
- ❌ `DB_PASSWORD` - Server-only, never expose

### Nakama Configuration

Edit `nakama/nakama.yml`:

\`\`\`yaml
name: nakama-node
session:
  encryption_key: "your-secret-encryption-key"
logger:
  level: debug
  format: json
\`\`\`

## Development Guide

### Adding Features

1. **Frontend Component**
   \`\`\`bash
   # Create new component
   touch components/my-component.tsx
   \`\`\`

2. **Backend Logic**
   \`\`\`bash
   # Update nakama/modules/tictactoe.ts
   # Add new RPC or match callback
   \`\`\`

3. **Test Locally**
   \`\`\`bash
   npm run dev
   docker-compose logs -f
   \`\`\`

### Running Tests

\`\`\`bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Linting
npm run lint
\`\`\`

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting

## Deployment

### Quick Start with Docker Compose

\`\`\`bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Health check
./scripts/health-check.sh
\`\`\`

### Cloud Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- AWS deployment with ECS
- Google Cloud Platform deployment
- Azure Container Instances
- DigitalOcean App Platform
- Kubernetes setup

### CI/CD Pipeline

GitHub Actions automatically:
- Builds and tests on every push
- Pushes Docker images on main branch
- Deploys to production on production branch

## Performance Optimization

### Frontend
- Server-side rendering with Next.js
- Image optimization
- Code splitting
- Caching with SWR

### Backend
- Connection pooling
- Database query optimization
- Message compression
- Load balancing

### Database
- Indexed queries
- Connection pooling
- Automatic backups
- Query monitoring

## Monitoring

### Health Checks

\`\`\`bash
# Run health checks
./scripts/health-check.sh

# Check specific service
curl http://localhost:7350/status
\`\`\`

### Logs

\`\`\`bash
# Docker Compose logs
docker-compose logs -f <service>

# Production logs
# AWS: CloudWatch Logs
# GCP: Cloud Logging
# Azure: Application Insights
\`\`\`

## Troubleshooting

### Cannot connect to Nakama

\`\`\`bash
# Check if Nakama is running
docker-compose logs nakama

# Verify network connectivity
curl http://localhost:7350/status

# Check environment variables
echo $NEXT_PUBLIC_NAKAMA_URL
\`\`\`

### Database connection error

\`\`\`bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify credentials
docker-compose exec postgres psql -U nakama -c "SELECT 1"
\`\`\`

### Game not syncing in real-time

- Check WebSocket connection in browser console
- Verify NEXT_PUBLIC_NAKAMA_URL is correct
- Check Nakama logs for errors
- Restart frontend service

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## Acknowledgments

- [Nakama](https://heroiclabs.com/nakama/) - Open-source game server
- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

## Support

For support and questions:

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
2. Review Nakama [documentation](https://heroiclabs.com/docs/)
3. Open an issue on GitHub
4. Check existing issues for solutions

## Roadmap

- [ ] Player profiles and statistics
- [ ] Achievements and badges
- [ ] Tournament mode
- [ ] Chat system
- [ ] Mobile app with React Native
- [ ] AI opponent
- [ ] Custom themes
- [ ] Spectator mode

---

Built with ❤️ using Nakama and Next.js
