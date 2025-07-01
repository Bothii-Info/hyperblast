import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { LogOut } from 'lucide-react';
import { useWebSocket } from '../WebSocketContext'; // Import useWebSocket

/**
 * This component acts as a controller. It fetches shared data
 * and then renders either the Host or Player view.
 */
const WaitlistPage = () => {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const { lastMessage, sendMessage, wsStatus } = useWebSocket(); // Use useWebSocket to receive messages

  // --- STATE MANAGEMENT ---
  const [players, setPlayers] = useState([]); // Initialize as empty array
  const [lobbyName, setLobbyName] = useState('Game Lobby'); // New state for lobby name
  const [currentUserId, setCurrentUserId] = useState(null); // New state for current user ID
  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // --- DERIVED STATE ---
  const currentUser = useMemo(() => players.find(p => p.id === currentUserId), [players, currentUserId]);
  const allPlayersReady = useMemo(() => players.every(p => p.isReady), [players]);

  // --- WEBSOCKET & COUNTDOWN LOGIC ---
  useEffect(() => {
    if (wsStatus === 'open' && lobbyId) {
      sendMessage({ type: 'get_lobby_members', code: lobbyId });
    }
  }, [wsStatus, lobbyId, sendMessage]);

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
        navigate(`/game/${lobbyId}`);
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
      navigate(`/game/${lobbyId}`);
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
          Lobby Code: <span className="text-white">{lobbyId}</span>
        </div>
      </div>

      <main className="flex flex-grow flex-col justify-center p-4 md:p-6">
        <div className="mx-auto w-full max-w-2xl">
          {/* --- LOBBY USER LIST --- */}
          <div className="mb-6 rounded-lg bg-gray-800/80 p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold text-blue-300">Players in Lobby</h2>
            <ul className="space-y-1">
              {players.map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-2 rounded px-2 py-1 ${p.id === currentUserId ? 'font-bold text-green-300' : ''}`}
                >
                  <span>{p.name}</span>
                  {/* Ready status icon */}
                  {p.isReady ? (
                    <span className="ml-2 text-green-400" title="Ready">&#10003;</span> // green check
                  ) : (
                    <span className="ml-2 text-red-400" title="Not Ready">&#10007;</span> // red x
                  )}
                  {p.id === currentUserId && !p.isReady && <span className="ml-2 text-xs text-gray-400">(You)</span>}
                </li>
              ))}
            </ul>
          </div>
          {/* --- END LOBBY USER LIST --- */}

          {/* READY BUTTON FOR CURRENT USER */}
          {!isStarting && currentUser && (
            <div className="mb-6 flex justify-center">
              <Button
                onClick={() => {
                  // Send ready/unready state to backend
                  sendMessage({ type: 'set_ready', code: lobbyId, ready: !currentUser.isReady });
                  // Do NOT optimistically update local state; wait for backend update
                }}
                className={`px-8 py-2 text-lg font-semibold transition-colors duration-150 ${currentUser.isReady ? 'bg-green-700/80 hover:bg-green-600/80' : 'bg-green-800/80 hover:bg-green-700/80'}`}
              >
                {currentUser.isReady ? 'Unready' : 'Ready'}
              </Button>
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