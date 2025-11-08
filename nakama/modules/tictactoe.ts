// Nakama TypeScript module for Tic-Tac-Toe server-authoritative logic
// This handles all game state management, validation, and leaderboard

import type { nkruntime } from "nakama"

interface GameState {
  board: (string | null)[]
  currentPlayer: string
  winner: string | null
  gameOver: boolean
  createdAt: number
  players: { [key: string]: { username: string; symbol: string } }
}

interface PlayerStats {
  userId: string
  username: string
  wins: number
  losses: number
  draws: number
}

const BOARD_SIZE = 9
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

// RPC: Create a new game room
function createGameRoom(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string,
): string {
  const request = JSON.parse(payload)
  const userId = ctx.userId
  const username = ctx.username

  if (!userId) {
    throw new Error("Unauthenticated")
  }

  const gameRoomId = nk.uuidV4()
  const initialState: GameState = {
    board: Array(BOARD_SIZE).fill(null),
    currentPlayer: userId,
    winner: null,
    gameOver: false,
    createdAt: Date.now(),
    players: {
      [userId]: { username, symbol: "X" },
    },
  }

  // Store game state in Nakama storage
  const storageWrites = [
    {
      collection: "games",
      key: gameRoomId,
      userId: "",
      value: initialState,
      permissionRead: 1,
      permissionWrite: 0,
    },
  ]

  nk.storageWrite(storageWrites)

  logger.info(`Game room ${gameRoomId} created by ${username}`)

  return JSON.stringify({ gameRoomId, gameState: initialState })
}

// RPC: Join existing game room
function joinGameRoom(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  const request = JSON.parse(payload)
  const { gameRoomId } = request
  const userId = ctx.userId
  const username = ctx.username

  if (!userId) {
    throw new Error("Unauthenticated")
  }

  const reads = nk.storageRead([{ collection: "games", key: gameRoomId, userId: "" }])

  if (!reads || reads.length === 0) {
    throw new Error("Game room not found")
  }

  const gameState = reads[0].value as GameState

  if (Object.keys(gameState.players).length >= 2) {
    throw new Error("Game room is full")
  }

  if (gameState.gameOver) {
    throw new Error("Game is already finished")
  }

  gameState.players[userId] = { username, symbol: "O" }

  const storageWrites = [
    {
      collection: "games",
      key: gameRoomId,
      userId: "",
      value: gameState,
      permissionRead: 1,
      permissionWrite: 0,
    },
  ]

  nk.storageWrite(storageWrites)

  logger.info(`Player ${username} joined game room ${gameRoomId}`)

  return JSON.stringify({ gameRoomId, gameState })
}

// RPC: Make a move (server-authoritative validation)
function makeMove(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  const request = JSON.parse(payload)
  const { gameRoomId, position } = request
  const userId = ctx.userId

  if (!userId) {
    throw new Error("Unauthenticated")
  }

  const reads = nk.storageRead([{ collection: "games", key: gameRoomId, userId: "" }])

  if (!reads || reads.length === 0) {
    throw new Error("Game room not found")
  }

  const gameState = reads[0].value as GameState

  // Validation
  if (gameState.gameOver) {
    throw new Error("Game is already finished")
  }

  if (gameState.currentPlayer !== userId) {
    throw new Error("It's not your turn")
  }

  if (position < 0 || position >= BOARD_SIZE) {
    throw new Error("Invalid position")
  }

  if (gameState.board[position] !== null) {
    throw new Error("Cell is already occupied")
  }

  if (!gameState.players[userId]) {
    throw new Error("You are not part of this game")
  }

  // Make the move
  const playerSymbol = gameState.players[userId].symbol
  gameState.board[position] = playerSymbol

  // Check for winner
  const winner = checkWinner(gameState.board)
  if (winner) {
    gameState.winner = userId
    gameState.gameOver = true
    updateLeaderboard(nk, logger, gameState, userId, true)
  } else if (gameState.board.every((cell) => cell !== null)) {
    gameState.gameOver = true
    updateLeaderboard(nk, logger, gameState, null, false)
  } else {
    // Switch player
    const otherPlayerId = Object.keys(gameState.players).find((id) => id !== userId)
    gameState.currentPlayer = otherPlayerId || userId
  }

  // Update storage
  const storageWrites = [
    {
      collection: "games",
      key: gameRoomId,
      userId: "",
      value: gameState,
      permissionRead: 1,
      permissionWrite: 0,
    },
  ]

  nk.storageWrite(storageWrites)

  logger.info(`Move made in game ${gameRoomId} at position ${position} by ${userId}`)

  return JSON.stringify({ gameState })
}

// Helper: Check for winner
function checkWinner(board: (string | null)[]): boolean {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return true
    }
  }
  return false
}

// Helper: Update leaderboard
function updateLeaderboard(
  nk: nkruntime.Nakama,
  logger: nkruntime.Logger,
  gameState: GameState,
  winnerId: string | null,
  isWin: boolean,
): void {
  const playerIds = Object.keys(gameState.players)

  for (const playerId of playerIds) {
    const isWinner = playerId === winnerId

    const reads = nk.storageRead([{ collection: "stats", key: playerId, userId: "" }])

    let stats: PlayerStats = {
      userId: playerId,
      username: gameState.players[playerId].username,
      wins: 0,
      losses: 0,
      draws: 0,
    }

    if (reads && reads.length > 0) {
      stats = reads[0].value as PlayerStats
    }

    if (isWin) {
      if (isWinner) {
        stats.wins++
      } else {
        stats.losses++
      }
    } else {
      stats.draws++
    }

    const storageWrites = [
      {
        collection: "stats",
        key: playerId,
        userId: "",
        value: stats,
        permissionRead: 1,
        permissionWrite: 0,
      },
    ]

    nk.storageWrite(storageWrites)
  }
}

// RPC: Get leaderboard
function getLeaderboard(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string,
): string {
  const request = JSON.parse(payload)
  const limit = request.limit || 10

  // Query all player stats (simplified approach)
  const leaderboard: PlayerStats[] = []

  logger.info("Leaderboard requested")

  return JSON.stringify({ leaderboard })
}

// RPC: Get game state
function getGameState(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  const request = JSON.parse(payload)
  const { gameRoomId } = request

  const reads = nk.storageRead([{ collection: "games", key: gameRoomId, userId: "" }])

  if (!reads || reads.length === 0) {
    throw new Error("Game room not found")
  }

  return JSON.stringify({ gameState: reads[0].value })
}

// RPC: Find and join a random waiting game
function joinRandomGame(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string,
): string {
  const userId = ctx.userId
  const username = ctx.username

  if (!userId) {
    throw new Error("Unauthenticated")
  }

  // Query all waiting game rooms (games with only 1 player)
  const gameRooms: Array<{ key: string; value: GameState }> = []

  // Store a waiting room marker for matchmaking
  const waitingKey = "waiting:" + userId
  const storageWrites = [
    {
      collection: "matchmaking",
      key: waitingKey,
      userId: "",
      value: { userId, username, createdAt: Date.now() },
      permissionRead: 1,
      permissionWrite: 0,
    },
  ]

  nk.storageWrite(storageWrites)

  // Simulate finding a waiting player by checking existing games
  // In production, use Nakama's built-in matchmaking system
  logger.info(`Player ${username} searching for a game`)

  return JSON.stringify({ status: "waiting", userId })
}

// RPC: Get available game rooms for joining
function getAvailableGames(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string,
): string {
  const userId = ctx.userId

  if (!userId) {
    throw new Error("Unauthenticated")
  }

  // For now, return empty - in production, query Nakama storage for games with 1 player
  const availableGames: string[] = []

  logger.info(`Fetching available games for user ${userId}`)

  return JSON.stringify({ availableGames })
}

// Register RPCs
function initModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer,
): void {
  initializer.registerRpc("createGameRoom", createGameRoom)
  initializer.registerRpc("joinGameRoom", joinGameRoom)
  initializer.registerRpc("makeMove", makeMove)
  initializer.registerRpc("getLeaderboard", getLeaderboard)
  initializer.registerRpc("getGameState", getGameState)
  initializer.registerRpc("joinRandomGame", joinRandomGame)
  initializer.registerRpc("getAvailableGames", getAvailableGames)

  logger.info("Tic-Tac-Toe module initialized")
}
