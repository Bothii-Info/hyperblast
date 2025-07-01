import React from 'react';

function JoinLobby({ onBack, activeLobbies, onJoinLobbyConfirm }) {
  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border-4 border-purple-500 w-full max-w-md text-center relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-gray-400 hover:text-white text-lg transition-colors duration-200"
      >
        &larr; Back
      </button>
      <h2 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
        Join Existing Lobby
      </h2>
      <div className="max-h-64 overflow-y-auto bg-gray-700 p-4 rounded-lg border border-gray-600 mb-6">
        {activeLobbies.length > 0 ? (
          <ul className="space-y-3">
            {activeLobbies.map((lobby) => (
              <li
                key={lobby.id}
                className="flex justify-between items-center bg-gray-600 p-3 rounded-md shadow-sm border border-gray-500"
              >
                <span className="text-lg font-semibold text-white">
                  {lobby.name} ({lobby.currentPlayers}/{lobby.maxPlayers})
                </span>
                <button
                  onClick={() => onJoinLobbyConfirm(lobby.id)}
                  disabled={lobby.currentPlayers >= lobby.maxPlayers}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-full shadow-md hover:from-yellow-600 hover:to-orange-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {lobby.currentPlayers >= lobby.maxPlayers ? 'Full' : 'Join'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center py-4">No active lobbies found. Why not create one?</p>
        )}
      </div>
      <p className="mt-6 text-sm text-gray-400">
        Select a lobby to join the game.
      </p>
    </div>
  );
}

export default JoinLobby;
