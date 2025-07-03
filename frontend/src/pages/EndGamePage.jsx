import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import Leaderboard from '../components/Leaderboard';
import { Crown, Home, Eye } from 'lucide-react';
import { useWebSocket } from '../WebSocketContext';

/**
 * The post-game summary page.
 * Displays the final leaderboard and declares a winner.
 */
const EndGamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [winner, setWinner] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const { ws } = useWebSocket();
  let firstTime = true;

  useEffect(() => {
    if (!ws) return;
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!firstTime) return; // Only run this effect once
        firstTime = false; // Set to false after the first run
        if (data.type === 'lobby_status' && data.players) {
          // players: array of { id, name, score }
          const sortedPlayers = [...data.players].sort((a, b) => b.score - a.score);
          setLeaderboardData(sortedPlayers);
          if (sortedPlayers.length > 0) {
            setWinner(sortedPlayers[0]);
          }
        }
      } catch (e) {}
    };
    ws.addEventListener('message', handleMessage);
    // Optionally, request the latest lobby status on mount
    ws.send(JSON.stringify({ type: 'get_lobby_status', gameId }));
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, gameId]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header title="Game Over" />

      <main className="flex-grow p-4 md:p-6">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          {/* Winner Announcement */}
          {winner && (
            <div className="text-center">
              <Crown size={64} className="mx-auto text-yellow-400" />
              <h2 className="mt-2 text-2xl font-bold text-gray-400">Winner</h2>
              <p className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-5xl font-black text-transparent">
                {winner.name}
              </p>
            </div>
          )}

          {/* Final Leaderboard */}
          <Leaderboard players={leaderboardData} />

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
             <Button 
                onClick={() => navigate('/spectate')} 
                className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700"
             >
              <Eye size={20} />
              <span>Spectate Other Games</span>
            </Button>
            <Button 
                onClick={() => navigate('/')} 
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600"
            >
              <Home size={20} />
              <span>Return to Home</span>
            </Button>
          </div>
        </div>
      </main>W4UE5Y
    </div>
  );
};

export default EndGamePage;
