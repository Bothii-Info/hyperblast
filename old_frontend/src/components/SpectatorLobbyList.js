import React from 'react';

const SpectatorLobbyList = ({ onBack, activeLobbies, onViewLobby }) => {
  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border-4 border-emerald-500 w-full max-w-md text-center relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-gray-400 hover:text-white text-lg transition-colors duration-200"
      >
        &larr; Back to Home
      </button>
      <h2 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-green-400">
        Spectate Lobbies
      </h2>
      <div className="max-h-64 overflow-y-auto bg-gray-700 p-4 rounded-lg border border-gray-600 mb-6">
        {activeLobbies.length > 0 ? (
          <ul className="space-y-3">
            {activeLobbies.map((lobby) => (
              <li
                key={lobby.id}
                onClick={() => onViewLobby(lobby.id)}
                className="flex justify-between items-center bg-gray-600 p-3 rounded-md shadow-sm border border-gray-500 cursor-pointer hover:bg-gray-600 transition duration-200 transform hover:scale-[1.02]"
              >
                <span className="text-lg font-semibold text-white">
                  {lobby.name} ({lobby.currentPlayers}/{lobby.maxPlayers})
                </span>
                <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                  View Players
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center py-4">No active lobbies available to spectate.</p>
        )}
      </div>
      <p className="mt-6 text-sm text-gray-400">
        Select a lobby to watch the action unfold.
      </p>
    </div>
  );
};

export default SpectatorLobbyList;
