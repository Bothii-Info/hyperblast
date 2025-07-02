import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../WebSocketContext';
import Header from '../components/Header';
import Leaderboard from '../components/Leaderboard';


/**
 * A mobile-first, responsive page for spectating a game.
 * It displays a live leaderboard of players' scores.
 */
const SpectateGamePage = () => {
  const { lobbyId } = useParams();
  const { ws } = useWebSocket();
  const [players, setPlayers] = useState([]);
  const [spectatingPlayer, setSpectatingPlayer] = useState(null);

  // Listen for lobby_status updates
  useEffect(() => {
    if (!ws) return;
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'lobby_status' && Array.isArray(data.players)) {
          // Only keep player name and score
          const simplePlayers = data.players.map(p => ({
            id: p.id || p.userId,
            name: p.name || p.username || `Player ${(p.id || p.userId)?.substring(0, 4)}`,
            score: p.score || 0
          }));
          setPlayers(simplePlayers);
          // If no spectatingPlayer or spectatingPlayer is gone, pick the first player
          if (!spectatingPlayer || !simplePlayers.some(p => p.id === spectatingPlayer.id)) {
            setSpectatingPlayer(simplePlayers[0] || null);
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
      <div className="flex flex-grow flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <Leaderboard players={players} />
        </div>
      </div>
    </div>
  );
};

export default SpectateGamePage;