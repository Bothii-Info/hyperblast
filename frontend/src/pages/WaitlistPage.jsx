import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { LogOut } from 'lucide-react';
import { useWebSocket } from '../WebSocketContext'; // Import useWebSocket
import PlayerWaitlistPage from './PlayerWaitlistPage'; // Import PlayerWaitlistPage

/**
 * This component acts as a controller. It fetches shared data
 * and then renders either the Host or Player view.
 */ 
const WaitlistPage = () => {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const { lastMessage, sendMessage, wsStatus, ws } = useWebSocket(); // Use useWebSocket to receive messages

  // --- STATE MANAGEMENT ---
  const [players, setPlayers] = useState([]); // Initialize as empty array
  const [lobbyName, setLobbyName] = useState('Game Lobby'); // New state for lobby name
  const [currentUserId, setCurrentUserId] = useState(null); // New state for current user ID
  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // --- DERIVED STATE ---
  const currentUser = useMemo(() => {
    if (!currentUserId || players.length === 0) return null;
    const user = players.find(p => p.id === currentUserId);
    return user || null;
  }, [players, currentUserId]);
  
  const allPlayersReady = useMemo(() => players.length > 0 && players.every(p => p.isReady), [players]);

  // --- WEBSOCKET & COUNTDOWN LOGIC ---
  useEffect(() => {
    if (wsStatus === 'open' && lobbyId) {
      // Try to get userId from localStorage
      const storedId = localStorage.getItem('userId');
      if (storedId) {
        setCurrentUserId(storedId);
      }
      // Request lobby members
      sendMessage({ type: 'get_lobby_members', code: lobbyId });
    }
  }, [wsStatus, lobbyId, sendMessage]);

  // Request lobby members if not received after 1s
  useEffect(() => {
    if (wsStatus === 'open' && lobbyId && players.length <2 ) {
      const timeout = setTimeout(() => {
        sendMessage({ type: 'get_lobby_members', code: lobbyId });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [wsStatus, lobbyId, players.length, sendMessage]);

  useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = JSON.parse(lastMessage);
      if (msg.type === 'lobby_members' && msg.code === lobbyId) {
        setPlayers(msg.members.map(p => ({
          id: p.userId,
          name: p.username || `Player ${p.userId.substring(0, 4)}`,
          isReady: !!p.isReady
        })));
        // Set currentUserId if not already set and userId is present in the list
        if (!currentUserId && msg.members.length > 0) {
          // Try to find the userId from a unique identifier (e.g., from localStorage or a welcome message)
          const storedId = localStorage.getItem('userId');
          if (storedId && msg.members.some(m => m.userId === storedId)) {
            setCurrentUserId(storedId);
          }
        }
      }
      // Also update players on lobby_state_update (for ready state changes)
      if (msg.type === 'lobby_state_update') {
        setPlayers(msg.players.map(p => ({
          id: p.userId || p.id,
          name: p.username || `Player ${(p.userId || p.id)?.substring(0, 4)}`,
          isReady: !!p.isReady
        })));
        setLobbyName(msg.lobbyName);
        setCurrentUserId(msg.currentUserId);
      } else if (msg.type === 'game_start_countdown') {
        setIsStarting(true);
        setCountdown(msg.countdown);
      } else if (msg.type === 'game_started') {
        setTimeout(() => {
          navigate(`/game/${lobbyId}`);
        }, 2000); // 2 second delay before navigating
      }
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e);
    }
  }, [lastMessage, lobbyId, navigate]);


  useEffect(() => {
    let timerId;
    if (isStarting && countdown > 0) {
      timerId = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (isStarting && countdown === 0) {
      setTimeout(() => {
        navigate(`/game/${lobbyId}`);
      }, 1000); // 1 second delay before navigating
    }
    return () => clearInterval(timerId);
  }, [isStarting, countdown, lobbyId, navigate]);

  // --- EVENT HANDLERS (to be passed down as props) ---
  const handleReadyToggle = () => {
    // This should ideally send a message to the WebSocket to update readiness on the server
    // For now, we'll simulate the local update.
    setPlayers(players.map(p => p.id === currentUserId ? { ...p, isReady: !p.isReady } : p));
  };

  const handleNameChange = (newName) => {
    // This should ideally send a message to the WebSocket to update name on the server
    // For now, we'll simulate the local update.
    setPlayers(players.map(p => p.id === currentUserId ? { ...p, name: newName } : p));
  };

  const handleStart = () => {
    if (allPlayersReady) {
      setIsStarting(true);
      setCountdown(3); // Set countdown to 3 seconds instead of 30
      // Ideally, send a 'start_game' message to the WebSocket here
    }
  };

  const handleCancel = () => {
    setIsStarting(false);
    // Ideally, send a 'cancel_start' message to the WebSocket here
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header title={lobbyName} showBackButton={!isStarting} />

      {/* LOBBY CODE AT TOP */}
      <div className="mx-auto mt-4 w-full max-w-2xl text-center">
        <div className="inline-block rounded bg-gray-800/80 px-4 py-2 text-lg font-mono font-semibold text-blue-300 shadow">
          Lobby Code: <span className="text-white">{lobbyId?.toUpperCase()}</span>
        </div>
      </div>

      <main className="flex flex-grow flex-col justify-center p-4 md:p-6">
        <div className="mx-auto w-full max-w-2xl">
          {/* If the user is already loaded and we're not waiting for their player data */}
          {<PlayerWaitlistPage
              players={players}
              currentUser={currentUser}
              lobbyCode={lobbyId}
              isStarting={isStarting}
              countdown={countdown}
              onReadyToggle={handleReadyToggle}
              onNameChange={handleNameChange}
            />
          }

          {/* If the user is not yet loaded or we're still waiting for player data */}
          {!currentUser && !isStarting && (
            <div className="text-center text-gray-400">
              Loading player data...
            </div>
          )}

          {/* COUNTDOWN IF STARTING */}
          {isStarting && (
            <div className="mb-6 text-center text-2xl font-bold text-blue-400">
              Game starting in {countdown}...
            </div>
          )}
        </div>
      </main>

      {!isStarting && (
         <footer className="p-4">
            <div className="mx-auto max-w-md">
              <Button onClick={() => navigate('/lobby')} className="flex items-center justify-center gap-2 bg-red-800/80 font-normal normal-case tracking-normal hover:bg-red-700/80">
                <LogOut size={20} /><span>Leave Lobby</span>
              </Button>
            </div>
        </footer>
      )}
    </div>
  );
};

export default WaitlistPage;