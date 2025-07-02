"use client"

import { useState } from "react"
import { Crown, Play, ShieldX, CheckCircle2, XCircle, Copy, Edit3, Save, Users } from "lucide-react"
import Button from "../components/Button"
import Input from "../components/Input"

/**
 * The waitlist view specifically for the host of the lobby with HBlast design.
 */
function HostWaitlistPage({
  lobbyId,
  players,
  currentUser,
  allPlayersReady,
  isStarting,
  countdown,
  onStart,
  onCancel,
  onReadyToggle,
  onNameChange,
}) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(currentUser?.name || "")

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(lobbyId.toUpperCase())
    // You could replace this alert with a toast notification
    alert(`Lobby Code "${lobbyId.toUpperCase()}" copied to clipboard!`)
  }

  const handleNameSave = () => {
    if (tempName.trim()) {
      onNameChange(tempName.trim())
      setIsEditingName(false)
    }
  }

  const handleNameCancel = () => {
    setTempName(currentUser?.name || "")
    setIsEditingName(false)
  }

  if (isStarting) {
    return (
      <div className="text-center">
        <div className="relative mx-auto h-32 w-32 mb-6">
          <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
            <circle className="stroke-[#2a3441]" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
            <circle
              className="stroke-[#e971ff] transition-all duration-1000 linear"
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (countdown / 3) * 251.2}
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl md:text-5xl font-bold text-white">{countdown}</span>
          </div>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Game Starting...</h3>
        <p className="text-[#b7b4bb] mb-8">Get ready for battle!</p>

        <div className="max-w-xs mx-auto">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex items-center justify-center gap-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white bg-transparent"
          >
            <ShieldX size={20} />
            <span>Cancel</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Lobby Code Section */}
      <div className="text-center">
        <label className="block text-sm text-[#b7b4bb] mb-3">Share this code with your friends</label>
        <div
          className="bg-gradient-to-r from-[#1f152b] to-[#0f051d] border-2 border-[#9351f7]/40 rounded-2xl p-4 cursor-pointer hover:border-[#e971ff]/60 transition-all duration-200 hover:shadow-lg hover:shadow-[#9351f7]/20"
          onClick={copyLobbyCode}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl md:text-3xl font-bold tracking-widest text-[#e971ff]">
              {lobbyId.toUpperCase()}
            </span>
            <Copy size={24} className="text-[#b7b4bb] hover:text-[#e971ff] transition-colors" />
          </div>
          <p className="text-xs text-[#b7b4bb] mt-2">Click to copy</p>
        </div>
      </div>

      {/* Host Profile Section */}
      <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-2xl p-4 md:p-6 border-2 border-yellow-400/40 shadow-xl">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Crown size={20} className="text-yellow-400" />
          Host Profile
        </h3>

        <div className="space-y-4">
          {/* Name Section */}
          <div>
            <label className="block text-sm text-[#b7b4bb] mb-2">Your Name</label>
            {isEditingName ? (
              <div className="flex gap-2">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter your name"
                  className="flex-1"
                />
                <Button
                  onClick={handleNameSave}
                  size="small"
                  className="px-3 bg-gradient-to-r from-[#741ff5] to-[#9351f7]"
                >
                  <Save size={16} />
                </Button>
                <Button onClick={handleNameCancel} size="small" variant="outline" className="px-3 bg-transparent">
                  ✕
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-gradient-to-r from-yellow-400/20 to-transparent rounded-xl p-3 border border-yellow-400/30">
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-yellow-400" />
                  <span className="font-semibold text-white">{currentUser?.name}</span>
                  <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full">Host</span>
                </div>
                <button
                  onClick={() => {
                    setTempName(currentUser?.name || "")
                    setIsEditingName(true)
                  }}
                  className="text-[#b7b4bb] hover:text-[#e971ff] transition-colors p-1"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Ready Status */}
          <div>
            <label className="block text-sm text-[#b7b4bb] mb-2">Ready Status</label>
            <Button
              onClick={onReadyToggle}
              className={`flex items-center justify-center gap-2 ${
                currentUser?.isReady
                  ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                  : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400"
              }`}
            >
              {currentUser?.isReady ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              <span>{currentUser?.isReady ? "Ready!" : "Not Ready"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* All Players List */}
      <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-2xl p-4 md:p-6 border border-[#2a3441]/30 shadow-xl">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users size={20} className="text-[#e971ff]" />
          All Players ({players.length})
        </h3>

        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-xl p-3 md:p-4 border transition-all duration-200 ${
                player.isHost
                  ? "bg-gradient-to-r from-yellow-400/20 to-transparent border-yellow-400/40"
                  : "bg-gradient-to-r from-[#2a3441]/30 to-transparent border-[#2a3441]/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {player.isHost && <Crown size={18} className="text-yellow-400" />}
                <span className="font-semibold text-white text-sm md:text-base">{player.name}</span>
                {player.isHost && (
                  <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full">Host</span>
                )}
              </div>
              <div className={`flex items-center gap-2 text-sm ${player.isReady ? "text-green-400" : "text-red-400"}`}>
                {player.isReady ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span className="hidden sm:inline">{player.isReady ? "Ready" : "Not Ready"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start Game Section */}
      <div className="space-y-4">
        <Button
          onClick={onStart}
          disabled={!allPlayersReady}
          className={`flex items-center justify-center gap-2 ${
            allPlayersReady
              ? "bg-gradient-to-r from-[#741ff5] to-[#9351f7] hover:from-[#9351f7] hover:to-[#e971ff]"
              : "bg-gradient-to-r from-[#7b7583] to-[#838383] cursor-not-allowed"
          }`}
        >
          <Play size={20} />
          <span>{allPlayersReady ? "Start Game" : "Waiting for Players..."}</span>
        </Button>

        {!allPlayersReady && (
          <p className="text-center text-sm text-[#b7b4bb]">All players must be ready before starting the game</p>
        )}
      </div>
    </div>
  )
}

export default HostWaitlistPage
