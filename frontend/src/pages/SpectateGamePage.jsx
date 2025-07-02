import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../WebSocketContext';
import Header from '../components/Header';
import Leaderboard from '../components/Leaderboard';
import { Skull } from 'lucide-react'; // Icon for killed players


/**
 * A mobile-first, responsive page for spectating a game.
 * It displays a live camera feed and handles the "killed" state for players.
 */
const SpectateGamePage = () => {
  const { lobbyId } = useParams();
  const { ws } = useWebSocket();
  const [players, setPlayers] = useState([]);
  const [spectatingPlayer, setSpectatingPlayer] = useState(null);
  const videoRef = useRef(null);

  // Effect to manage the camera stream based on the spectated player's status
  useEffect(() => {
    const videoElement = videoRef.current;
    let stream = null;

    const startStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoElement) videoElement.srcObject = stream;
      } catch (err) {
        console.error("Camera Error:", err);
        alert("Could not access camera. Please grant permission.");
      }
    };

    const stopStream = () => {
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }
    };

    if (spectatingPlayer && spectatingPlayer.isAlive) {
      startStream();
    } else {
      stopStream();
    }

    // Cleanup function to stop the stream when the component unmounts or the player changes
    return () => {
      stopStream();
    };
  }, [spectatingPlayer]); // This effect re-runs whenever the spectatingPlayer changes

  // Listen for lobby_status updates
  useEffect(() => {
    if (!ws) return;
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'lobby_status' && Array.isArray(data.players)) {
          // Assume each player: { id, name, score, isAlive }
          setPlayers(data.players);
          // If no spectatingPlayer or spectatingPlayer is gone, pick the first alive player
          if (!spectatingPlayer || !data.players.some(p => p.id === spectatingPlayer.id && p.isAlive)) {
            const firstAlive = data.players.find(p => p.isAlive);
            setSpectatingPlayer(firstAlive || data.players[0] || null);
          }
        }
      } catch (e) {}
    };
    ws.addEventListener('message', handleMessage);
    // Request lobby status on mount
    ws.send(JSON.stringify({ type: 'get_lobby_status', gameId: lobbyId }));
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, lobbyId, spectatingPlayer]);

  const handleSelectPlayer = (player) => {
    setSpectatingPlayer(player);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      <Header title={`Spectating: Game ${lobbyId}`} showBackButton />
      
      <div className="flex flex-grow flex-col overflow-hidden md:flex-row">
        {/* Main Content: Player View */}
        <main className="relative flex flex-grow items-center justify-center bg-black md:w-3/4">
          {spectatingPlayer && spectatingPlayer.isAlive ? (
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
          ) : (
            <div className="flex flex-col items-center gap-4 text-gray-500">
              <Skull size={64} />
              <h2 className="text-2xl font-bold">Player Eliminated</h2>
            </div>
          )}
          <div className="absolute bottom-0 left-0 w-full bg-black/50 p-2 text-center text-lg font-bold">
             Spectating: {spectatingPlayer ? spectatingPlayer.name : 'Loading...'}
          </div>
        </main>

        {/* Sidebar/Bottom bar for controls */}
        <aside className="flex flex-col space-y-4 overflow-y-auto bg-gray-900 p-4 md:w-1/4">
          <Leaderboard players={players} />
          
          <div>
            <h3 className="mb-3 text-lg font-bold">Switch Perspective</h3>
            {/* On mobile, this is a horizontal scrollable list. On desktop, it's a vertical list. */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-x-visible">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPlayer(p)}
                  disabled={!p.isAlive}
                  className={`
                    flex w-full min-w-[120px] flex-col items-center justify-center rounded-md p-3 text-center text-sm font-semibold transition-colors
                    ${spectatingPlayer && spectatingPlayer.id === p.id ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-white/10'}
                    ${p.isAlive ? 'hover:bg-white/20' : 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  {p.name}
                  {!p.isAlive && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-red-400">
                      <Skull size={14} />
                      <span>Killed</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SpectateGamePage;