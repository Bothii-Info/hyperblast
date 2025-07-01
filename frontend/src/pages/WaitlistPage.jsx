import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import HostWaitlistPage from './HostWaitlistPage';
import PlayerWaitlistPage from './PlayerWaitlistPage';
import { LogOut } from 'lucide-react';
import { useWebSocket } from '../WebSocketContext'; // Import useWebSocket

/**
 * This component acts as a controller. It fetches shared data
 * and then renders either the Host or Player view.
 */
const WaitlistPage = () => {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const { lastMessage } = useWebSocket(); // Use useWebSocket to receive messages

  // --- STATE MANAGEMENT ---
  const [players, setPlayers] = useState([]); // Initialize as empty array
  const [lobbyName, setLobbyName] = useState('Game Lobby'); // New state for lobby name
  const [currentUserId, setCurrentUserId] = useState(null); // New state for current user ID
  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // --- DERIVED STATE ---
  const currentUser = useMemo(() => players.find(p => p.id === currentUserId), [players, currentUserId]);
  const isHost = currentUser?.isHost || false;
  const allPlayersReady = useMemo(() => players.every(p => p.isReady), [players]);

  // --- WEBSOCKET & COUNTDOWN LOGIC ---
  useEffect(() => {
    if (!lastMessage) return;

    try {
      const msg = JSON.parse(lastMessage);
      // Handle messages that update lobby state (e.g., player joined, player ready, lobby created/joined)
      if (msg.type === 'lobby_state_update') { // Assuming a message type for lobby state updates
        setPlayers(msg.players);
        setLobbyName(msg.lobbyName); // Update lobby name
        setCurrentUserId(msg.currentUserId); // Set current user ID
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
    if (isHost && allPlayersReady) {
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
      <Header title={lobbyName} showBackButton={!isStarting} /> {/* Use lobbyName as title */}

      <main className="flex flex-grow flex-col justify-center p-4 md:p-6">
        <div className="mx-auto w-full max-w-2xl">
          {isHost ? (
            <HostWaitlistPage
              lobbyId={lobbyId}
              players={players}
              allPlayersReady={allPlayersReady}
              isStarting={isStarting}
              countdown={countdown}
              onStart={handleStart}
              onCancel={handleCancel}
            />
          ) : (
            <PlayerWaitlistPage
              players={players}
              currentUser={currentUser} // Ensure currentUser is passed
              isStarting={isStarting}
              countdown={countdown}
              onReadyToggle={handleReadyToggle}
              onNameChange={handleNameChange}
            />
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