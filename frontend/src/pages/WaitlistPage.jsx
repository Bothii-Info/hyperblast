import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import HostWaitlistPage from './HostWaitlistPage';
import PlayerWaitlistPage from './PlayerWaitlistPage';
import { LogOut } from 'lucide-react';

// --- DUMMY DATA & SETUP ---
const initialPlayers = [
  { id: 1, name: 'PlayerOne', isReady: true, isHost: true },
  { id: 2, name: 'PlayerTwo', isReady: true, isHost: false },
  { id: 3, name: 'PlayerThree', isReady: true, isHost: false },
];
const currentUserId = 1; // Change this to 2 to test the player view

/**
 * This component acts as a controller. It fetches shared data
 * and then renders either the Host or Player view.
 */
const WaitlistPage = () => {
  const { lobbyId } = useParams();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [players, setPlayers] = useState(initialPlayers);
  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // --- DERIVED STATE ---
  const currentUser = useMemo(() => players.find(p => p.id === currentUserId), [players]);
  const isHost = currentUser?.isHost || false;
  const allPlayersReady = useMemo(() => players.every(p => p.isReady), [players]);

  // --- WEBSOCKET & COUNTDOWN LOGIC ---
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
    setPlayers(players.map(p => p.id === currentUserId ? { ...p, isReady: !p.isReady } : p));
  };

  const handleNameChange = (newName) => {
    setPlayers(players.map(p => p.id === currentUserId ? { ...p, name: newName } : p));
  };

  const handleStart = () => {
    if (isHost && allPlayersReady) {
      setIsStarting(true);
      setCountdown(30);
    }
  };

  const handleCancel = () => {
    setIsStarting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header title="Game Lobby" showBackButton={!isStarting} />

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
              currentUser={currentUser}
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