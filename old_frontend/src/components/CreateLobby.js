import React, { useState } from 'react';

function CreateLobby({ onBack, onCreateLobbyConfirm }) {
  const [lobbyName, setLobbyName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);

  const handleCreate = () => {
    if (lobbyName.trim()) {
      onCreateLobbyConfirm({ name: lobbyName, maxPlayers: parseInt(maxPlayers, 10) });
    } else {
      console.warn("Lobby name cannot be empty!");
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border-4 border-yellow-500 w-full max-w-md text-center relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-gray-400 hover:text-white text-lg transition-colors duration-200"
      >
        &larr; Back
      </button>
      <h2 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-600">
        Create New Lobby
      </h2>
      <div className="mb-6">
        <label htmlFor="lobbyName" className="block text-lg font-semibold text-gray-200 mb-2">
          Lobby Name:
        </label>
        <input
          type="text"
          id="lobbyName"
          value={lobbyName}
          onChange={(e) => setLobbyName(e.target.value)}
          placeholder="e.g., Alpha Squad Arena"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-8">
        <label htmlFor="maxPlayers" className="block text-lg font-semibold text-gray-200 mb-2">
          Max Players:
        </label>
        <input
          type="number"
          id="maxPlayers"
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(e.target.value)}
          min="2"
          max="8"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={handleCreate}
        className="px-8 py-4 bg-gradient-to-r from-teal-500 to-green-600 text-white font-bold rounded-full shadow-lg hover:from-teal-600 hover:to-green-700 transition duration-300 ease-in-out transform hover:scale-105 text-lg"
      >
        Create Lobby
      </button>
      <p className="mt-6 text-sm text-gray-400">
        Set up your game and invite your friends!
      </p>
    </div>
  );
}

export default CreateLobby;
