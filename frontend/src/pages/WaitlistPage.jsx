"use client"

import React, { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LogOut } from 'lucide-react'
import { useWebSocket } from '../WebSocketContext'
import PlayerWaitlistPage from './PlayerWaitlistPage'
import HostWaitlistPage from './HostWaitlistPage'
import BackgroundDecorations from '../components/BackgroundDecorations'
import Button from '../components/Button'

/**
 * This component acts as a controller with HBlast design consistency.
 * It fetches shared data and renders either the Host or Player view.
 */
const WaitlistPage = () => {
  const { lobbyId } = useParams()
  const navigate = useNavigate()
  const { lastMessage, sendMessage, wsStatus } = useWebSocket()

  // --- STATE MANAGEMENT ---
  const [players, setPlayers] = useState([])
  const [lobbyName, setLobbyName] = useState("Game Lobby")
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isStarting, setIsStarting] = useState(false)
  const [countdown, setCountdown] = useState(30)

  // --- DERIVED STATE ---
  const currentUser = useMemo(() => {
    if (!currentUserId || players.length === 0) return null
    const user = players.find((p) => p.id === currentUserId)
    return user || null
  }, [players, currentUserId])

  const allPlayersReady = useMemo(() => players.length > 0 && players.every((p) => p.isReady), [players])

  const isHost = useMemo(() => currentUser?.isHost || false, [currentUser])

  // --- WEBSOCKET & COUNTDOWN LOGIC ---
  React.useEffect(() => {
    if (wsStatus === "open" && lobbyId) {
      const storedId = localStorage.getItem("userId")
      if (storedId) {
        setCurrentUserId(storedId)
      }
      sendMessage({ type: "get_lobby_members", code: lobbyId })
    }
  }, [wsStatus, lobbyId, sendMessage])

  React.useEffect(() => {
    if (!lastMessage) return

    try {
      const msg = JSON.parse(lastMessage)
      if (msg.type === "lobby_members" && msg.code === lobbyId) {
        setPlayers(
          msg.members.map((p) => ({
            id: p.userId,
            name: p.username || `Player ${p.userId.substring(0, 4)}`,
            isReady: !!p.isReady,
            isHost: !!p.isHost,
          })),
        )

        if (!currentUserId && msg.members.length > 0) {
          const storedId = localStorage.getItem("userId")
          if (storedId && msg.members.some((m) => m.userId === storedId)) {
            setCurrentUserId(storedId)
          }
        }
      }

      if (msg.type === "lobby_state_update") {
        setPlayers(
          msg.players.map((p) => ({
            id: p.userId || p.id,
            name: p.username || `Player ${(p.userId || p.id)?.substring(0, 4)}`,
            isReady: !!p.isReady,
            isHost: !!p.isHost,
          })),
        )
        setLobbyName(msg.lobbyName)
        setCurrentUserId(msg.currentUserId)
      } else if (msg.type === "game_start_countdown") {
        setIsStarting(true)
        setCountdown(msg.countdown)
      } else if (msg.type === "game_started") {
        navigate(`/game/${lobbyId}`)
      }
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e)
    }
  }, [lastMessage, lobbyId, navigate, currentUserId])

  React.useEffect(() => {
    let timerId
    if (isStarting && countdown > 0) {
      timerId = setInterval(() => setCountdown((prev) => prev - 1), 1000)
    } else if (isStarting && countdown === 0) {
      navigate(`/game/${lobbyId}`)
    }
    return () => clearInterval(timerId)
  }, [isStarting, countdown, lobbyId, navigate])

  // --- EVENT HANDLERS ---
  const handleReadyToggle = () => {
    sendMessage({
      type: "toggle_ready",
      code: lobbyId,
      userId: currentUserId,
    })

    setPlayers(players.map((p) => (p.id === currentUserId ? { ...p, isReady: !p.isReady } : p)))
  }

  const handleNameChange = (newName) => {
    sendMessage({
      type: "update_username",
      code: lobbyId,
      userId: currentUserId,
      username: newName,
    })

    setPlayers(players.map((p) => (p.id === currentUserId ? { ...p, name: newName } : p)))
  }

  const handleStart = () => {
    if (allPlayersReady && isHost) {
      sendMessage({
        type: "start_game",
        code: lobbyId,
      })

      setIsStarting(true)
      setCountdown(3)
    }
  }

  const handleCancel = () => {
    sendMessage({
      type: "cancel_start",
      code: lobbyId,
    })

    setIsStarting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#1f152b] to-[#0f051d] relative overflow-hidden">
      <BackgroundDecorations />

      {/* HBlast Header */}
      <header className="flex justify-between items-center py-4 md:py-6 relative z-10 px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {!isStarting && (
            <button
              onClick={() => navigate("/lobby")}
              className="text-white hover:text-[#e971ff] transition-colors p-2 rounded-full hover:bg-white/10"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="text-white text-xl md:text-2xl font-bold">HBlast</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[#b7b4bb] text-sm md:text-base">{lobbyName}</div>
          <div className="w-8 h-8 md:w-10 md:h-10">
            <img src="/images/icon.png" alt="HBlast Score Icon" className="w-full h-full object-contain" />
          </div>
        </div>
      </header>

      {/* Lobby Code Display */}
      <div className="text-center mb-6 px-4 relative z-10">
        <div className="inline-block bg-gradient-to-r from-[#1f152b] to-[#0f051d] border border-[#9351f7]/40 rounded-xl px-4 py-2 shadow-lg">
          <span className="text-sm text-[#b7b4bb]">Lobby Code: </span>
          <span className="text-lg font-mono font-bold text-[#e971ff]">{lobbyId?.toUpperCase()}</span>
        </div>
      </div>

      <main className="flex-grow flex flex-col justify-center p-4 md:p-6 relative z-10">
        <div className="mx-auto w-full max-w-2xl">
          {currentUser && isHost && (
            <HostWaitlistPage
              lobbyId={lobbyId}
              players={players}
              currentUser={currentUser}
              allPlayersReady={allPlayersReady}
              isStarting={isStarting}
              countdown={countdown}
              onStart={handleStart}
              onCancel={handleCancel}
              onReadyToggle={handleReadyToggle}
              onNameChange={handleNameChange}
            />
          )}

          {currentUser && !isHost && (
            <PlayerWaitlistPage
              players={players}
              currentUser={currentUser}
              lobbyCode={lobbyId}
              isStarting={isStarting}
              countdown={countdown}
              onReadyToggle={handleReadyToggle}
              onNameChange={handleNameChange}
            />
          )}

          {!currentUser && !isStarting && (
            <div className="text-center">
              <div className="bg-gradient-to-br from-[#1f152b] to-[#0f051d] rounded-2xl p-8 border border-[#2a3441]/30">
                <div className="w-8 h-8 border-2 border-[#e971ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#b7b4bb]">Loading player data...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {!isStarting && (
        <footer className="p-4 relative z-10">
          <div className="mx-auto max-w-md">
            <Button
              onClick={() => navigate("/lobby")}
              variant="outline"
              className="flex items-center justify-center gap-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
            >
              <LogOut size={20} />
              <span>Leave Lobby</span>
            </Button>
          </div>
        </footer>
      )}
    </div>
  )
}

export default WaitlistPage
