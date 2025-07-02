"use client"

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Leaderboard from '../components/Leaderboard'
import BackgroundDecorations from '../components/BackgroundDecorations'
import { ArrowLeft, Zap, Target, Timer, Users, Trophy, Activity } from 'lucide-react'

// --- DUMMY DATA ---
const dummyPlayers = [
  { id: "p1", name: "PlayerOne", score: 1500, hits: 45, accuracy: 78, streak: 12 },
  { id: "p2", name: "PlayerTwo", score: 1250, hits: 38, accuracy: 65, streak: 8 },
  { id: "p3", name: "PlayerThree", score: 900, hits: 28, accuracy: 52, streak: 5 },
  { id: "p4", name: "PlayerFour", score: 750, hits: 22, accuracy: 48, streak: 3 },
  { id: "p5", name: "PlayerFive", score: 650, hits: 19, accuracy: 41, streak: 2 },
  { id: "p6", name: "PlayerSix", score: 580, hits: 17, accuracy: 38, streak: 1 },
]

const gameStats = {
  duration: "12:34",
  totalHits: 169,
  averageAccuracy: 54,
  gameMode: "Team Deathmatch",
}

/**
 * A spectate page focused on displaying an awesome laser tag leaderboard
 */
const SpectateGamePage = () => {
  const { lobbyId } = useParams()
  const navigate = useNavigate()
  const [players, setPlayers] = useState(dummyPlayers)
  const [gameTime, setGameTime] = useState(gameStats.duration)

  // Simulate live updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) => ({
          ...player,
          score: player.score + Math.floor(Math.random() * 50),
          hits: player.hits + Math.floor(Math.random() * 2),
        })),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#1f152b] to-[#0f051d] relative overflow-hidden">
      <BackgroundDecorations />

      {/* HBlast Header */}
      <header className="flex justify-between items-center py-4 md:py-6 relative z-10 px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-white hover:text-[#e971ff] transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-white text-xl md:text-2xl font-bold">HBlast</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[#b7b4bb] text-sm md:text-base">Live Match</div>
          <div className="w-8 h-8 md:w-10 md:h-10">
            <img src="/images/icon.png" alt="HBlast Score Icon" className="w-full h-full object-contain" />
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 pb-6 relative z-10">
        {/* Game Status Header */}
        <div className="mb-6 md:mb-8">
          <div className="text-center mb-6">
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-2">Live Match Spectator</h1>
            <p className="text-[#b7b4bb] text-lg md:text-xl">Watch the action unfold in real-time</p>
          </div>

          {/* Game Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-xl p-4 border border-[#2a3441]/30">
              <div className="flex items-center gap-2 mb-2">
                <Timer size={20} className="text-[#e971ff]" />
                <span className="text-[#b7b4bb] text-sm">Duration</span>
              </div>
              <div className="text-white text-xl md:text-2xl font-bold">{gameTime}</div>
            </div>

            <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-xl p-4 border border-[#2a3441]/30">
              <div className="flex items-center gap-2 mb-2">
                <Target size={20} className="text-[#e971ff]" />
                <span className="text-[#b7b4bb] text-sm">Total Hits</span>
              </div>
              <div className="text-white text-xl md:text-2xl font-bold">{gameStats.totalHits}</div>
            </div>

            <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-xl p-4 border border-[#2a3441]/30">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={20} className="text-[#e971ff]" />
                <span className="text-[#b7b4bb] text-sm">Avg Accuracy</span>
              </div>
              <div className="text-white text-xl md:text-2xl font-bold">{gameStats.averageAccuracy}%</div>
            </div>

            <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-xl p-4 border border-[#2a3441]/30">
              <div className="flex items-center gap-2 mb-2">
                <Users size={20} className="text-[#e971ff]" />
                <span className="text-[#b7b4bb] text-sm">Players</span>
              </div>
              <div className="text-white text-xl md:text-2xl font-bold">{players.length}</div>
            </div>
          </div>
        </div>

        {/* Main Leaderboard */}
        <div className="max-w-4xl mx-auto">
          <Leaderboard players={players} showDetailedStats={true} />
        </div>

        {/* Live Activity Feed */}
        <div className="max-w-4xl mx-auto mt-6 md:mt-8">
          <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-2xl p-4 md:p-6 border border-[#2a3441]/30 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Zap size={24} className="text-[#e971ff]" />
              <h3 className="text-white text-lg md:text-xl font-bold">Live Activity</h3>
              <div className="w-2 h-2 bg-[#e971ff] rounded-full animate-pulse ml-auto"></div>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#741ff5]/20 to-transparent rounded-lg">
                <Target size={16} className="text-[#e971ff]" />
                <span className="text-white text-sm">PlayerOne scored a hit! +50 points</span>
                <span className="text-[#b7b4bb] text-xs ml-auto">2s ago</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#9351f7]/20 to-transparent rounded-lg">
                <Zap size={16} className="text-[#e971ff]" />
                <span className="text-white text-sm">PlayerTwo on a 8-hit streak!</span>
                <span className="text-[#b7b4bb] text-xs ml-auto">5s ago</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#741ff5]/20 to-transparent rounded-lg">
                <Trophy size={16} className="text-[#e971ff]" />
                <span className="text-white text-sm">PlayerThree takes 3rd place!</span>
                <span className="text-[#b7b4bb] text-xs ml-auto">8s ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpectateGamePage