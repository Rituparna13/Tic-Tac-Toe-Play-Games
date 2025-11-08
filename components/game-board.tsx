"use client"

import { useState, useEffect } from "react"
import { useNakama } from "@/hooks/use-nakama"

interface GameBoardProps {
  gameRoomId: string
  onBack: () => void
}

export default function GameBoard({ gameRoomId, onBack }: GameBoardProps) {
  const { user, rpc } = useNakama()
  const [state, setState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        if (!rpc) return

        const result = await rpc("getGameState", { gameRoomId })
        if (!mounted) return

        const data = typeof result === "string" ? JSON.parse(result) : result

        if (data?.error) {
          setError(data.error)
          setLoading(false)
          return
        }

        if (!data?.gameState) {
          setError("Game not found")
          setLoading(false)
          return
        }

        setState(data.gameState)
        setError("")
        setLoading(false)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error loading game")
          setLoading(false)
        }
      }
    }

    load()
    const interval = setInterval(load, 500)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [gameRoomId, rpc])

  const handleMove = async (pos: number) => {
    if (!state || !user) return
    if (state.gameOver || state.currentPlayer !== user.userId) return

    try {
      const result = await rpc("makeMove", { gameRoomId, position: pos })
      const data = typeof result === "string" ? JSON.parse(result) : result

      if (data?.gameState) {
        setState(data.gameState)
      }
    } catch (err) {
      setError("Move failed")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p style={{ color: "#cbd5e1" }}>Loading game...</p>
        </div>
      </div>
    )
  }

  if (error || !state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center card">
          <p style={{ color: "#ef4444" }} className="mb-4 text-lg">
            {error || "Game not available"}
          </p>
          <button onClick={onBack} className="btn-secondary">
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  const players = state.players || {}
  const playerCount = Object.keys(players).length

  if (playerCount < 2) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center card">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-cyan-400 mb-2">Waiting for opponent...</h2>
          <p style={{ color: "#cbd5e1" }} className="mb-4">
            Room: {gameRoomId.slice(0, 8)}
          </p>
          <button onClick={onBack} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const isYourTurn = state.currentPlayer === user?.userId
  const playerX = Object.values(players as any).find((p: any) => p.symbol === "X")
  const playerO = Object.values(players as any).find((p: any) => p.symbol === "O")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="card space-y-4">
        <div>
          <h3 className="text-lg font-bold text-cyan-400 mb-2">Game Status</h3>
          {state.gameOver ? (
            <div>
              <p className="text-green-400 font-bold">Game Over</p>
              {state.winner && (
                <p style={{ color: "#cbd5e1" }}>Winner: {(players as any)[state.winner]?.username || "Unknown"}</p>
              )}
            </div>
          ) : (
            <p style={{ color: "#cbd5e1" }}>
              Turn: {(players as any)[state.currentPlayer]?.username || "?"}
              {isYourTurn && " (Your turn!)"}
            </p>
          )}
        </div>

        <div style={{ borderTopColor: "#334155" }} className="border-t pt-4">
          <h4 className="text-sm font-bold text-cyan-400 mb-2">Players</h4>
          <div className="space-y-2 text-sm">
            {playerX && (
              <div style={{ backgroundColor: "#0f172a" }} className="flex justify-between p-2 rounded">
                <span className="text-cyan-400 font-bold">X</span>
                <span style={{ color: "#cbd5e1" }}>{(playerX as any).username}</span>
              </div>
            )}
            {playerO && (
              <div style={{ backgroundColor: "#0f172a" }} className="flex justify-between p-2 rounded">
                <span className="text-pink-400 font-bold">O</span>
                <span style={{ color: "#cbd5e1" }}>{(playerO as any).username}</span>
              </div>
            )}
          </div>
        </div>

        <button onClick={onBack} className="btn-secondary w-full">
          Back to Lobby
        </button>
      </div>

      <div className="lg:col-span-2 card">
        <div className="game-board">
          {state.board.map((cell: any, i: number) => (
            <button
              key={i}
              onClick={() => handleMove(i)}
              disabled={cell || !isYourTurn || state.gameOver}
              className={`game-cell ${cell === "X" ? "x" : cell === "O" ? "o" : ""}`}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
