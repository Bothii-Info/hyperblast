import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Leaderboard from '../components/Leaderboard';
import { Skull } from 'lucide-react'; // Icon for killed players

// --- DUMMY DATA ---
// Added an `isAlive` property to simulate game state.
const dummyPlayers = [
  { id: 'p1', name: 'PlayerOne', score: 1500, isAlive: true },
  { id: 'p2', name: 'PlayerTwo', score: 1250, isAlive: true },
  { id: 'p3', name: 'PlayerThree', score: 900, isAlive: false }, // This player is "killed"
  { id: 'p4', name: 'PlayerFour', score: 750, isAlive: true },
];

/**
 * A mobile-first, responsive page for spectating a game.
 * It displays a live camera feed and handles the "killed" state for players.
 */
const SpectateGamePage = () => {
  const { lobbyId } = useParams();
  const [players, setPlayers] = useState(dummyPlayers);
  const [spectatingPlayer, setSpectatingPlayer] = useState(dummyPlayers[0]);
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

    if (spectatingPlayer.isAlive) {
      startStream();
    } else {
      stopStream();
    }

    // Cleanup function to stop the stream when the component unmounts or the player changes
    return () => {
      stopStream();
    };
  }, [spectatingPlayer]); // This effect re-runs whenever the spectatingPlayer changes

  const handleSelectPlayer = (player) => {
    setSpectatingPlayer(player);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      <Header title={`Spectating: Game ${lobbyId}`} showBackButton />
      
      <div className="flex flex-grow flex-col overflow-hidden md:flex-row">
        {/* Main Content: Player View */}
        <main className="relative flex flex-grow items-center justify-center bg-black md:w-3/4">
          {spectatingPlayer.isAlive ? (
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
          ) : (
            <div className="flex flex-col items-center gap-4 text-gray-500">
              <Skull size={64} />
              <h2 className="text-2xl font-bold">Player Eliminated</h2>
            </div>
          )}
          <div className="absolute bottom-0 left-0 w-full bg-black/50 p-2 text-center text-lg font-bold">
             Spectating: {spectatingPlayer.name}
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
                  disabled={!p.isAlive} // Disable button if player is not alive
                  className={`
                    flex w-full min-w-[120px] flex-col items-center justify-center rounded-md p-3 text-center text-sm font-semibold transition-colors
                    ${spectatingPlayer.id === p.id ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-white/10'}
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