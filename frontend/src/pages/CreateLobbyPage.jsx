"use client"

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Swords, Gamepad2, User, Users, Zap, Crown } from 'lucide-react'
import { useWebSocket } from '../WebSocketContext'
import BackgroundDecorations from '../components/BackgroundDecorations'
import Button from '../components/Button'
import Input from '../components/Input'

/**
 * Page for creating a new game lobby with HBlast design consistency.
 */
const CreateLobbyPage = () => {
  const [lobbyName, setLobbyName] = useState('')
  const [username, setUsername] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { sendMessage, lastMessage, wsStatus } = useWebSocket()

  React.useEffect(() => {
    if (!lastMessage) return

    try {
      const msg = JSON.parse(lastMessage)
      if (msg.type === "lobby_created") {
        setIsLoading(false)
        navigate(`/lobby/${msg.code}/waitlist`)
      } else if (msg.type === "lobby_list" && Array.isArray(msg.lobbies) && msg.lobbies.length > 0 && isLoading) {
        const lastLobby = msg.lobbies[msg.lobbies.length - 1]
        if (lastLobby && lastLobby.code) {
          setIsLoading(false)
          navigate(`/lobby/${lastLobby.code}/waitlist`)
        }
      } else if (msg.type === "lobby_error") {
        setIsLoading(false)
        alert(msg.message || "Failed to create lobby.")
      }
    } catch (e) {
      setIsLoading(false)
    }
  }, [lastMessage, navigate, isLoading])

  const handleCreateLobby = () => {
    if (lobbyName.trim() === "") {
      alert("Please provide a Lobby Name")
      return
    }

    if (username.trim() === "") {
      alert("Please enter your username.")
      return
    }

    if (wsStatus !== "open") {
      alert("WebSocket not connected.")
      return
    }

    setIsLoading(true)
    sendMessage({
      type: "create_lobby",
      name: lobbyName.trim(),
      maxPlayers: maxPlayers,
      username: username.trim(),
      role: "player",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#1f152b] to-[#0f051d] relative overflow-hidden">
      <BackgroundDecorations />

      {/* HBlast Header */}
      <header className="flex justify-between items-center py-4 md:py-6 relative z-10 px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/lobby")}
            className="text-white hover:text-[#e971ff] transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-white text-xl md:text-2xl font-bold">HBlast</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[#b7b4bb] text-sm md:text-base">Create Lobby</div>
          <div className="w-8 h-8 md:w-10 md:h-10">
            <img src="/images/icon.png" alt="HBlast Score Icon" className="w-full h-full object-contain" />
          </div>
        </div>
      </header>

      <main className="flex flex-grow flex-col items-center justify-center p-4 md:p-6 relative z-10 min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-[#741ff5] to-[#9351f7] rounded-full flex items-center justify-center">
              <Crown size={32} className="text-white" />
            </div>
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-4">
              <span className="block">Create Your</span>
              <span className="block">Arena</span>
            </h1>
            <p className="text-[#b7b4bb] text-base md:text-lg">Set up your lobby and dominate as the MVP</p>
          </div>

          {/* Create Form */}
          <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-2xl p-6 md:p-8 border-2 border-[#9351f7]/40 shadow-xl mb-6">
            <div className="space-y-6">
              {/* Lobby Name Input */}
              <div>
                <label className="block text-sm text-[#b7b4bb] mb-2 flex items-center gap-2">
                  <Swords size={16} className="text-[#e971ff]" />
                  Lobby Name
                </label>
                <Input
                  placeholder="Enter lobby name"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-sm text-[#b7b4bb] mb-2 flex items-center gap-2">
                  <User size={16} className="text-[#e971ff]" />
                  Your Username (Host)
                </label>
                <Input
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Max Players Slider */}
              <div className="bg-gradient-to-r from-[#2a3441]/30 to-transparent rounded-xl p-4 border border-[#2a3441]/20">
                <label className="flex items-center justify-between text-sm text-[#b7b4bb] mb-3">
                  <span className="flex items-center gap-2">
                    <Users size={16} className="text-[#e971ff]" />
                    Max Players
                  </span>
                  <span className="text-xl font-bold text-[#e971ff]">{maxPlayers}</span>
                </label>
                <input
                  type="range"
                  min="4"
                  max="8"
                  step="1"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number.parseInt(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-[#2a3441] rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #9351f7 0%, #9351f7 ${((maxPlayers - 4) / 4) * 100}%, #2a3441 ${((maxPlayers - 4) / 4) * 100}%, #2a3441 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-[#b7b4bb] mt-2">
                  <span>4 players</span>
                  <span>8 players</span>
                </div>
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateLobby}
                disabled={isLoading || !lobbyName.trim() || !username.trim()}
                className={`flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-gradient-to-r from-[#7b7583] to-[#838383] cursor-not-allowed"
                    : "bg-gradient-to-r from-[#741ff5] to-[#9351f7] hover:from-[#9351f7] hover:to-[#e971ff]"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 size={20} />
                    <span>Create & Join</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-gradient-to-r from-[#1f152b] to-[#0f051d] rounded-xl p-3 md:p-4 border border-[#2a3441]/30 flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${wsStatus === "open" ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
            ></div>
            <span className="text-white text-sm font-medium">
              {wsStatus === "open" ? "Connected to Game Network" : "Connecting..."}
            </span>
            {wsStatus === "open" && <Zap size={16} className="text-[#e971ff] ml-auto" />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default CreateLobbyPage
