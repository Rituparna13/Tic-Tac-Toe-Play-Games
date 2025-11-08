"use client"

import { useState, useEffect } from "react"
import { useNakama } from "@/hooks/use-nakama"

interface GameLobbyProps {
  onGameStart: (roomId: string) => void
}

export default function GameLobby({ onGameStart }: GameLobbyProps) {
  const { rpc } = useNakama()
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [matchmaking, setMatchmaking] = useState(false)
  const [matchmakingStatus, setMatchmakingStatus] = useState("")

  useEffect(() => {
    loadAvailableRooms()
  }, [])

  const loadAvailableRooms = async () => {
    // In a real implementation, we'd query available game rooms
    setAvailableRooms([
      { id: "room-1", host: "Player1", players: 1, createdAt: Date.now() },
      { id: "room-2", host: "Player2", players: 1, createdAt: Date.now() - 5000 },
    ])
  }

  useEffect(() => {
    if (matchmaking) {
      const interval = setInterval(() => {
        pollForMatch()
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [matchmaking])

  const pollForMatch = async () => {
    try {
      console.log("[v0] Polling for available games...")
      const result = await rpc("getAvailableGames", {})
      const data = JSON.parse(result)
      console.log("[v0] Available games:", data.games)

      if (data.games && data.games.length > 0) {
        const gameRoomId = data.games[0]
        console.log("[v0] Joining game:", gameRoomId)
        await joinExistingGame(gameRoomId)
      } else {
        setMatchmakingStatus(`Searching for opponent...`)
      }
    } catch (err) {
      console.error("[v0] Polling error:", err)
    }
  }

  const handleCreateRoom = async () => {
    setLoading(true)
    setError("")
    try {
      console.log("[v0] Creating new game room...")
      const result = await rpc("createGameRoom", {})
      const gameRoomId = JSON.parse(result).gameRoomId
      console.log("[v0] Game created:", gameRoomId)
      onGameStart(gameRoomId)
    } catch (err) {
      console.error("[v0] Error creating game:", err)
      setError(err instanceof Error ? err.message : "Failed to create room")
    } finally {
      setLoading(false)
    }
  }

  const joinExistingGame = async (roomId: string) => {
    setLoading(true)
    setError("")
    try {
      console.log("[v0] Joining game:", roomId)
      await rpc("joinGameRoom", { gameRoomId: roomId })
      console.log("[v0] Successfully joined game:", roomId)
      setMatchmaking(false)
      onGameStart(roomId)
    } catch (err) {
      console.error("[v0] Error joining game:", err)
      setError(err instanceof Error ? err.message : "Failed to join room")
    } finally {
      setLoading(false)
    }
  }

  const startMatchmaking = async () => {
    setMatchmaking(true)
    setMatchmakingStatus("Searching for opponent...")
    setError("")

    try {
      const result = await rpc("joinRandomGame", {})
      const data = JSON.parse(result)
      console.log("[v0] Joined random game:", data)
      setMatchmaking(false)
      onGameStart(data.gameRoomId)
    } catch (err) {
      console.error("[v0] Matchmaking error:", err)
      setError(err instanceof Error ? err.message : "Matchmaking failed")
      setMatchmaking(false)
    }
  }

  const cancelMatchmaking = () => {
    setMatchmaking(false)
    setMatchmakingStatus("")
  }

  if (matchmaking) {
    return (
      <div className="card text-center py-12">
        <div className="mb-6">
          <div className="animate-spin w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Finding a random player...</h2>
        <p style={{ color: "#cbd5e1" }} className="mb-4">
          {matchmakingStatus}
        </p>
        <button onClick={cancelMatchmaking} className="btn-secondary">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create or Join Game */}
      <div className="card">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Ready to Play?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={handleCreateRoom} disabled={loading} className="btn-primary p-6 h-24 text-lg font-bold">
            {loading ? "Creating..." : "Create Game Room"}
          </button>
          <button onClick={startMatchmaking} disabled={loading} className="btn-secondary p-6 h-24 text-lg font-bold">
            {loading ? "Searching..." : "Quick Match"}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">{error}</div>
        )}
      </div>

      {/* Available Rooms */}
      {availableRooms.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-cyan-400 mb-4">Available Rooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRooms.map((room) => (
              <div key={room.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <h4 className="text-cyan-400 font-bold mb-2">Room by {room.host}</h4>
                <p style={{ color: "#cbd5e1" }} className="text-sm mb-2">
                  Players: {room.players}/2
                </p>
                <button className="btn-secondary w-full" onClick={() => joinExistingGame(room.id)} disabled={loading}>
                  {loading ? "Joining..." : "Join Game"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
