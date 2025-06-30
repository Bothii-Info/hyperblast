import React from 'react';

const GameOptions = ({ onBack, onCreateLobby, onJoinLobby }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <button
        onClick={onBack}
        className="self-start mb-6 px-4 py-2 bg-gray-700 text-white rounded-md shadow-md hover:bg-gray-600 transition duration-200"
      >
        &larr; Back to Home
      </button>

      <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500">
        Choose Your Game
      </h2>
      <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl">
        Decide whether to create a new private arena or join an existing battle!
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
        <button
          onClick={onCreateLobby}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 text-lg"
        >
          Create New Lobby
        </button>
        <button
          onClick={onJoinLobby}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-full shadow-lg hover:from-green-600 hover:to-teal-700 transition duration-300 ease-in-out transform hover:scale-105 text-lg"
        >
          Join Existing Lobby
        </button>
      </div>
      <p className="mt-10 text-md text-gray-400">
        Unleash your tactical prowess!
      </p>
    </div>
  );
};

export default GameOptions;
