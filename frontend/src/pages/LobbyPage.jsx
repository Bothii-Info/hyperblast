"use client"

import { useNavigate } from "react-router-dom"
import BackgroundDecorations from "../components/BackgroundDecorations"
import { ArrowLeft, Plus, Users, Home, Gamepad2, Target } from "lucide-react"

/**
 * The main lobby page for players with HBlast design consistency.
 */
function LobbyPage() {
  const navigate = useNavigate()

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
          <div className="text-[#b7b4bb] text-sm md:text-base">Player Lobby</div>
          <div className="w-8 h-8 md:w-10 md:h-10">
            <img src="/images/icon.png" alt="HBlast Score Icon" className="w-full h-full object-contain" />
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 md:px-6 lg:px-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="block">Ready to</span>
            <span className="block">Join the Battle?</span>
          </h1>
          <p className="text-[#b7b4bb] text-base md:text-lg max-w-md mx-auto">
            Create your own arena or jump into an existing match
          </p>
        </div>

        {/* Action Cards */}
        <div className="w-full max-w-md space-y-4 md:space-y-6 mb-8">
          {/* Create Lobby Card */}
          <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-2xl p-6 md:p-8 border-2 border-[#9351f7]/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-[#e971ff]/60 hover:shadow-[#9351f7]/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-[#741ff5] to-[#9351f7] p-3 rounded-full">
                <Plus size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold">Create New Lobby</h3>
                <p className="text-[#b7b4bb] text-sm">Start your own match</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/lobby/create")}
              className="w-full bg-gradient-to-r from-[#741ff5] to-[#9351f7] hover:from-[#9351f7] hover:to-[#e971ff] text-white px-6 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Create Lobby
            </button>
          </div>

          {/* Join Lobby Card */}
          <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-2xl p-6 md:p-8 border-2 border-[#9351f7]/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-[#e971ff]/60 hover:shadow-[#9351f7]/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-[#9351f7] to-[#e971ff] p-3 rounded-full">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold">Join Existing Lobby</h3>
                <p className="text-[#b7b4bb] text-sm">Enter a match in progress</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/lobby/join")}
              className="w-full bg-gradient-to-r from-[#9351f7] to-[#e971ff] hover:from-[#e971ff] hover:to-[#fc149f] text-white px-6 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Join Lobby
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-8">
          <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-xl p-4 border border-[#2a3441]/30 text-center">
            <Gamepad2 size={20} className="text-[#e971ff] mx-auto mb-2" />
            <div className="text-white text-lg font-bold">12</div>
            <div className="text-[#b7b4bb] text-xs">Active Games</div>
          </div>
          <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-xl p-4 border border-[#2a3441]/30 text-center">
            <Users size={20} className="text-[#e971ff] mx-auto mb-2" />
            <div className="text-white text-lg font-bold">48</div>
            <div className="text-[#b7b4bb] text-xs">Players Online</div>
          </div>
          <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-xl p-4 border border-[#2a3441]/30 text-center">
            <Target size={20} className="text-[#e971ff] mx-auto mb-2" />
            <div className="text-white text-lg font-bold">156</div>
            <div className="text-[#b7b4bb] text-xs">Total Hits</div>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="w-full max-w-xs">
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#7b7583] to-[#838383] hover:from-[#838383] hover:to-[#7b7583] text-white px-6 py-3 rounded-full font-medium transition-all duration-200 hover:scale-105"
          >
            <Home size={18} />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LobbyPage
