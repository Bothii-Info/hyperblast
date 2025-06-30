import React from 'react';

// LobbyPopUp component displays options to create or join a game lobby.
function LobbyPopUp({ isOpen, onClose, onCreateLobby, onJoinLobby }) {
  // If the pop-up is not open, return null to render nothing.
  if (!isOpen) return null;

  return (
    // Overlay for the modal pop-up, covering the entire screen
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      {/* Modal content container */}
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border-4 border-teal-500 w-full max-w-md text-center relative transform transition-all duration-300 scale-100 opacity-100">
        {/* Close button for the modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold transition-colors duration-200"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          Game Lobby
        </h2>

        {/* Buttons for creating or joining a lobby */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={onCreateLobby}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 text-lg"
          >
            Create Lobby
          </button>
          <button
            onClick={onJoinLobby}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-full shadow-lg hover:from-green-600 hover:to-teal-700 transition duration-300 ease-in-out transform hover:scale-105 text-lg"
          >
            Join Lobby
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-400">
          Choose an option to start your laser tag adventure!
        </p>
      </div>
    </div>
  );
}

export default LobbyPopUp;
