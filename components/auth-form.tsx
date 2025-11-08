"use client"

import type React from "react"

import { useState } from "react"

interface AuthFormProps {
  onLogin: (email: string, password: string, isSignUp: boolean) => Promise<void>
}

export default function AuthForm({ onLogin }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await onLogin(email, password, isSignUp)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-cyan-400 mb-2">{isSignUp ? "Join the Arena" : "Welcome Back"}</h2>
          <p style={{ color: "#cbd5e1" }}>
            {isSignUp ? "Create your account to start playing" : "Sign in to continue playing"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your gaming name"
                style={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  color: "#ffffff",
                }}
                className="w-full border rounded-lg px-4 py-2 placeholder-[#64748b] focus:border-cyan-500 focus:outline-none transition"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                color: "#ffffff",
              }}
              className="w-full border rounded-lg px-4 py-2 placeholder-[#64748b] focus:border-cyan-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                color: "#ffffff",
              }}
              className="w-full border rounded-lg px-4 py-2 placeholder-[#64748b] focus:border-cyan-500 focus:outline-none transition"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center text-cyan-400 hover:text-cyan-300 transition"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}
