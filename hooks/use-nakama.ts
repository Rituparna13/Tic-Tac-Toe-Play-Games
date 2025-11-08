"use client"

import { useState, useCallback, useEffect } from "react"

interface User {
  userId: string
  username: string
  email: string
}

interface GameState {
  board: (string | null)[]
  currentPlayer: string
  winner: string | null
  gameOver: boolean
  players: Record<string, { username: string; symbol: string }>
  createdAt: number
}

export const useNakama = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("nakama_user")
    const storedToken = localStorage.getItem("nakama_token")

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const username = email.split("@")[0]
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const userData = { userId, username, email }

    localStorage.setItem("nakama_user", JSON.stringify(userData))
    localStorage.setItem("nakama_token", `token_${Date.now()}`)

    setUser(userData)
    setIsAuthenticated(true)

    console.log("[v0] User authenticated:", userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("nakama_user")
    localStorage.removeItem("nakama_token")
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const rpc = useCallback(
    async (method: string, payload: any) => {
      console.log(`[v0] RPC Call: ${method}`, payload)

      switch (method) {
        case "createGameRoom": {
          if (!user?.userId) {
            return JSON.stringify({ error: "Not authenticated" })
          }

          const gameState: GameState = {
            board: Array(9).fill(null),
            currentPlayer: user.userId,
            winner: null,
            gameOver: false,
            createdAt: Date.now(),
            players: {
              [user.userId]: { username: user.username, symbol: "X" },
            },
          }

          const roomId = `room_${Date.now()}`
          const storageKey = `game_${roomId}`
          localStorage.setItem(storageKey, JSON.stringify(gameState))

          console.log("[v0] Game room created:", roomId, "Storage key:", storageKey)
          const response = { gameRoomId: roomId, gameState }
          return JSON.stringify(response)
        }

        case "getGameState": {
          const storageKey = `game_${payload.gameRoomId}`
          const gameData = localStorage.getItem(storageKey)

          console.log("[v0] Looking for game with storage key:", storageKey)
          console.log("[v0] Found data:", gameData ? "yes" : "no")

          if (!gameData) {
            // Debug: list all storage keys to help troubleshoot
            const allKeys = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key?.startsWith("game_")) {
                allKeys.push(key)
              }
            }
            console.log("[v0] Available game keys:", allKeys)
            return JSON.stringify({ error: "Game not found", requestedKey: storageKey, availableKeys: allKeys })
          }

          try {
            const gameState = JSON.parse(gameData) as GameState

            if (!gameState.players || typeof gameState.board !== "object") {
              return JSON.stringify({ error: "Invalid game state" })
            }

            console.log("[v0] Game state retrieved:", gameState)
            return JSON.stringify({ gameState })
          } catch (e) {
            console.error("[v0] Failed to parse game state:", e)
            return JSON.stringify({ error: "Failed to parse game state" })
          }
        }

        case "joinGameRoom": {
          if (!user?.userId) {
            return JSON.stringify({ error: "Not authenticated" })
          }

          const storageKey = `game_${payload.gameRoomId}`
          const gameData = localStorage.getItem(storageKey)

          if (!gameData) {
            console.log("[v0] Game not found for join:", storageKey)
            return JSON.stringify({ error: "Game not found" })
          }

          const gameState: GameState = JSON.parse(gameData)

          if (Object.keys(gameState.players).length >= 2) {
            return JSON.stringify({ error: "Game room is full" })
          }

          if (!gameState.players[user.userId]) {
            gameState.players[user.userId] = {
              username: user.username,
              symbol: "O",
            }
          }

          localStorage.setItem(storageKey, JSON.stringify(gameState))
          console.log("[v0] Player joined room:", payload.gameRoomId, "Players:", Object.keys(gameState.players))

          return JSON.stringify({
            gameRoomId: payload.gameRoomId,
            gameState,
          })
        }

        case "makeMove": {
          if (!user?.userId) {
            return JSON.stringify({ error: "Not authenticated" })
          }

          const storageKey = `game_${payload.gameRoomId}`
          const gameData = localStorage.getItem(storageKey)
          if (!gameData) {
            return JSON.stringify({ error: "Game not found" })
          }

          const gameState: GameState = JSON.parse(gameData)
          const playerSymbol = gameState.players[user.userId]?.symbol

          if (!playerSymbol) {
            return JSON.stringify({ error: "Player not in this game" })
          }

          if (gameState.currentPlayer !== user.userId) {
            return JSON.stringify({ error: "Not your turn" })
          }

          if (gameState.board[payload.position] !== null) {
            return JSON.stringify({ error: "Position already taken" })
          }

          gameState.board[payload.position] = playerSymbol

          // Check for winner
          const winner = checkWinner(gameState.board)
          if (winner) {
            gameState.winner = winner
            gameState.gameOver = true
          } else if (gameState.board.every((cell) => cell !== null)) {
            gameState.gameOver = true
          } else {
            // Switch turn to other player
            const otherPlayer = Object.entries(gameState.players).find(([id]) => id !== user.userId)
            if (otherPlayer) {
              gameState.currentPlayer = otherPlayer[0]
            }
          }

          localStorage.setItem(storageKey, JSON.stringify(gameState))
          console.log("[v0] Move made at position:", payload.position)

          return JSON.stringify({ gameState })
        }

        case "getAvailableGames": {
          const rooms: { id: string; data: GameState }[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith("game_")) {
              const gameData = localStorage.getItem(key)
              if (gameData) {
                try {
                  const gameState = JSON.parse(gameData) as GameState
                  if (Object.keys(gameState.players).length === 1 && !gameState.gameOver) {
                    const roomId = key.replace("game_", "")
                    rooms.push({ id: roomId, data: gameState })
                    console.log("[v0] Found available game:", roomId)
                  }
                } catch (e) {
                  console.error("[v0] Failed to parse game room:", key)
                }
              }
            }
          }
          console.log("[v0] Available games count:", rooms.length)
          return JSON.stringify({ games: rooms })
        }

        case "joinRandomGame": {
          if (!user?.userId) {
            return JSON.stringify({ error: "Not authenticated" })
          }

          const rooms: { id: string; data: GameState }[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith("game_")) {
              const gameData = localStorage.getItem(key)
              if (gameData) {
                try {
                  const gameState = JSON.parse(gameData) as GameState
                  if (Object.keys(gameState.players).length === 1 && !gameState.gameOver) {
                    const roomId = key.replace("game_", "")
                    rooms.push({ id: roomId, data: gameState })
                  }
                } catch (e) {
                  console.error("[v0] Failed to parse game room:", key)
                }
              }
            }
          }

          if (rooms.length === 0) {
            console.log("[v0] No available games for quick match")
            return JSON.stringify({ error: "No available games" })
          }

          const { id: roomId, data: gameState } = rooms[0]
          if (!gameState.players[user.userId]) {
            gameState.players[user.userId] = {
              username: user.username,
              symbol: "O",
            }
          }

          const storageKey = `game_${roomId}`
          localStorage.setItem(storageKey, JSON.stringify(gameState))
          console.log("[v0] Player auto-joined room:", roomId)

          return JSON.stringify({
            gameRoomId: roomId,
            gameState,
          })
        }

        default:
          return JSON.stringify({ error: "Unknown method" })
      }
    },
    [user],
  )

  return { user, isAuthenticated, login, logout, rpc }
}

function checkWinner(board: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }

  return null
}
