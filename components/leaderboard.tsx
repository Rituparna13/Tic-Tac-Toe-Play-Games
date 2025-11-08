"use client"

import { useState, useEffect } from "react"
import { useNakama } from "@/hooks/use-nakama"

interface LeaderboardEntry {
  rank: number
  username: string
  wins: number
  losses: number
  draws: number
  winRate: number
}

export default function Leaderboard() {
  const { rpc } = useNakama()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      // Mock leaderboard data - in production this would come from Nakama
      const mockData: LeaderboardEntry[] = [
        { rank: 1, username: "ProPlayer", wins: 45, losses: 5, draws: 2, winRate: 0.89 },
        { rank: 2, username: "GameMaster", wins: 38, losses: 8, draws: 4, winRate: 0.79 },
        { rank: 3, username: "StrategyKing", wins: 32, losses: 10, draws: 3, winRate: 0.76 },
        { rank: 4, username: "TacticalMind", wins: 28, losses: 15, draws: 5, winRate: 0.65 },
        { rank: 5, username: "RisingChamp", wins: 22, losses: 12, draws: 2, winRate: 0.64 },
      ]
      setLeaderboard(mockData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-3xl font-bold text-cyan-400 mb-6">Global Leaderboard</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p style={{ color: "#cbd5e1" }}>Loading leaderboard...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottomColor: "#334155" }} className="border-b">
                <th className="text-left px-4 py-3 text-cyan-400">Rank</th>
                <th className="text-left px-4 py-3 text-cyan-400">Player</th>
                <th className="text-center px-4 py-3 text-cyan-400">Wins</th>
                <th className="text-center px-4 py-3 text-cyan-400">Losses</th>
                <th className="text-center px-4 py-3 text-cyan-400">Draws</th>
                <th className="text-center px-4 py-3 text-cyan-400">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottomColor: "#334155" }}
                  className="border-b"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td className="px-4 py-3">
                    <span className="text-lg font-bold">
                      {entry.rank === 1 && "🥇"}
                      {entry.rank === 2 && "🥈"}
                      {entry.rank === 3 && "🥉"}
                      {entry.rank > 3 && `#${entry.rank}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cyan-400 font-semibold">{entry.username}</td>
                  <td className="px-4 py-3 text-center text-green-400">{entry.wins}</td>
                  <td className="px-4 py-3 text-center text-red-400">{entry.losses}</td>
                  <td className="px-4 py-3 text-center text-yellow-400">{entry.draws}</td>
                  <td className="px-4 py-3 text-center text-cyan-400 font-semibold">
                    {(entry.winRate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
