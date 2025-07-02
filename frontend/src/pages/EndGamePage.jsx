import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/HeaderOld';
import Button from '../components/Button';
import Leaderboard from '../components/Leaderboard';
import { Crown, Home, Eye } from 'lucide-react';

// --- DUMMY DATA ---
// This simulates the final results you would fetch from your backend.
const finalPlayers = [
  { id: 'p1', name: 'PlayerOne', score: 1750 },
  { id: 'p2', name: 'PlayerTwo', score: 1300 },
  { id: 'p3', name: 'PlayerThree', score: 950 },
  { id: 'p4', name: 'PlayerFour', score: 800 },
];

/**
 * The post-game summary page.
 * Displays the final leaderboard and declares a winner.
 */
const EndGamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [winner, setWinner] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    // --- BACKEND INTEGRATION GUIDE ---
    // Here, you would fetch the final game results from your backend using the gameId.
    // fetch(`https://your-backend.com/api/results/${gameId}`)
    //   .then(res => res.json())
    //   .then(data => {
    //     const sortedPlayers = [...data.players].sort((a, b) => b.score - a.score);
    //     setLeaderboardData(sortedPlayers);
    //     if (sortedPlayers.length > 0) {
    //       setWinner(sortedPlayers[0]);
    //     }
    //   })
    //   .catch(error => console.error("Failed to fetch results:", error));

    // For now, we use the dummy data.
    const sortedPlayers = [...finalPlayers].sort((a, b) => b.score - a.score);
    setLeaderboardData(sortedPlayers);
    if (sortedPlayers.length > 0) {
      setWinner(sortedPlayers[0]);
    }
  }, [gameId]);

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
      </main>
    </div>
  );
};

export default EndGamePage;
