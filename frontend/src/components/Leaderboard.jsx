import React from 'react';
import { Crown, Eye } from 'lucide-react'; // Using icons for clarity

/**
 * A reusable leaderboard component to display player scores.
 *
 * @param {object} props - The component's props.
 * @param {Array<object>} props.players - An array of player objects.
 * @param {string} [props.className=''] - Additional classes for styling.
 */
const Leaderboard = ({ players, className = '' }) => {
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className={`w-full rounded-lg bg-black/30 p-4 shadow-2xl backdrop-blur-md ${className}`}>
      <h3 className="mb-4 text-center text-2xl font-bold text-white">Leaderboard</h3>
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center justify-between rounded-md p-3 text-white transition-all duration-300
              ${index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-400 shadow-lg' : 'bg-white/10'}
            `}
          >
            <div className="flex items-center gap-4">
              <span className="w-6 text-center text-lg font-bold">{index + 1}</span>
              <span className="font-semibold">{player.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {index === 0 && <Crown className="text-yellow-900" size={20} />}
              <span className="text-lg font-bold">{player.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
