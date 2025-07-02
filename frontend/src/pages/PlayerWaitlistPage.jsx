"use client"

import { useState } from 'react'
import { Crown, CheckCircle2, XCircle, Edit3, Save, Users } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'

/**
 * The waitlist view for regular players with HBlast design.
 */
const PlayerWaitlistPage = ({
  players,
  currentUser,
  lobbyCode,
  isStarting,
  countdown,
  onReadyToggle,
  onNameChange,
}) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(currentUser?.name || "")

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
        <p className="text-[#b7b4bb] mb-4">Get ready for battle!</p>
        <p className="text-sm text-[#b7b4bb]">Prepare your laser tag gear!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Player Profile Section */}
      <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-2xl p-4 md:p-6 border-2 border-[#9351f7]/40 shadow-xl">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users size={20} className="text-[#e971ff]" />
          Your Profile
        </h3>

        <div className="space-y-4">
          {/* Name Section */}
          <div>
            <label className="block text-sm text-[#b7b4bb] mb-2">Player Name</label>
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
              <div className="flex items-center justify-between bg-gradient-to-r from-[#2a3441]/30 to-transparent rounded-xl p-3 border border-[#2a3441]/20">
                <span className="font-semibold text-white">{currentUser?.name}</span>
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
          <Crown size={20} className="text-[#e971ff]" />
          All Players ({players.length})
        </h3>

        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-xl p-3 md:p-4 border transition-all duration-200 ${
                player.id === currentUser?.id
                  ? "bg-gradient-to-r from-[#9351f7]/20 to-[#e971ff]/10 border-[#9351f7]/40"
                  : "bg-gradient-to-r from-[#2a3441]/30 to-transparent border-[#2a3441]/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {player.isHost && <Crown size={18} className="text-yellow-400" />}
                <span className="font-semibold text-white text-sm md:text-base">{player.name}</span>
                {player.id === currentUser?.id && (
                  <span className="text-xs bg-[#e971ff]/20 text-[#e971ff] px-2 py-1 rounded-full">You</span>
                )}
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

      {/* Game Status */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-[#1f152b] to-[#0f051d] rounded-xl p-4 border border-[#2a3441]/30">
          <p className="text-[#b7b4bb] text-sm mb-2">Waiting for host to start the game</p>
          <p className="text-white font-semibold">
            {players.filter((p) => p.isReady).length} of {players.length} players ready
          </p>
        </div>
      </div>
    </div>
  )
}

export default PlayerWaitlistPage