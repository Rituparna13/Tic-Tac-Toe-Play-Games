"use client"

import { useState, useEffect } from "react"
import AuthForm from "@/components/auth-form"
import GameLobby from "@/components/game-lobby"
import GameBoard from "@/components/game-board"
import Leaderboard from "@/components/leaderboard"
import { useNakama } from "@/hooks/use-nakama"

export default function Home() {
  const { user, isAuthenticated, login, logout } = useNakama()
  const [currentPage, setCurrentPage] = useState<"auth" | "lobby" | "game" | "leaderboard">("auth")
  const [gameRoomId, setGameRoomId] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage("lobby")
    }
  }, [isAuthenticated])

  const handleGameStart = (roomId: string) => {
    setGameRoomId(roomId)
    setCurrentPage("game")
  }

  const handleBackToLobby = () => {
    setCurrentPage("lobby")
    setGameRoomId(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">⚔️</span>
            </div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Tic-Tac-Toe Arena
            </h1>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <span className="text-cyan-400 font-semibold">{user?.username || "Player"}</span>
              <button onClick={logout} className="btn-secondary text-sm">
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {isAuthenticated && (
          <div className="flex gap-4 mb-8 border-b border-[#334155] pb-4">
            <button
              onClick={() => setCurrentPage("lobby")}
              className={`px-4 py-2 font-semibold transition-all ${
                currentPage === "lobby"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-[#cbd5e1] hover:text-cyan-400"
              }`}
            >
              Play
            </button>
            <button
              onClick={() => setCurrentPage("leaderboard")}
              className={`px-4 py-2 font-semibold transition-all ${
                currentPage === "leaderboard"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-[#cbd5e1] hover:text-cyan-400"
              }`}
            >
              Leaderboard
            </button>
          </div>
        )}

        {/* Content */}
        {!isAuthenticated ? (
          <AuthForm onLogin={login} />
        ) : currentPage === "lobby" ? (
          <GameLobby onGameStart={handleGameStart} />
        ) : currentPage === "game" && gameRoomId ? (
          <GameBoard gameRoomId={gameRoomId} onBack={handleBackToLobby} />
        ) : currentPage === "leaderboard" ? (
          <Leaderboard />
        ) : null}
      </div>
    </main>
  )
}
