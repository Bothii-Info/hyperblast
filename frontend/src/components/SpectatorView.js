import React, { useState, useEffect, useRef } from 'react';
import CameraFeed from './CameraFeed';

function SpectatorView({
  goToLandingPage,
  selectedSpectatorLobbyId,
  viewPlayerCamera,
  backToSpectatorLobbies,
  spectatorPlayers,
  activeLobbies,
}) {
  const playersInSelectedLobby = spectatorPlayers.filter(
    (player) => player.lobbyId === selectedSpectatorLobbyId
  );
  const selectedLobbyName = activeLobbies.find(
    (lobby) => lobby.id === selectedSpectatorLobbyId
  )?.name || 'Unknown Lobby';

  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      <button
        onClick={backToSpectatorLobbies}
        className="self-start mb-6 px-4 py-2 bg-gray-700 text-white rounded-md shadow-md hover:bg-gray-600 transition duration-200"
      >
        &larr; Back to Lobbies
      </button>

      <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 text-center">
        Spectating: {selectedLobbyName}
      </h2>

      {selectedSpectatorLobbyId ? (
        <div className="w-full bg-gray-700 p-6 rounded-lg shadow-xl border border-gray-600">
          <h3 className="text-2xl font-bold mb-4 text-gray-200 border-b border-gray-600 pb-2">
            Players in {selectedLobbyName}
          </h3>
          <p className="text-lg text-gray-300 mb-4">
            Active Players: <span className="font-bold text-yellow-300">{playersInSelectedLobby.length}</span>
          </p>
          {playersInSelectedLobby.length > 0 ? (
            <ul className="space-y-3">
              {playersInSelectedLobby
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <li
                    key={player.id}
                    onClick={() => viewPlayerCamera(player.id)}
                    className="flex justify-between items-center bg-gray-800 p-3 rounded-md shadow-inner border border-gray-500 cursor-pointer hover:bg-gray-600 transition duration-200 transform hover:scale-[1.02]"
                  >
                    <span className="text-lg font-semibold text-white">
                      {index + 1}. {player.name || `Player ${player.id.substring(player.id.length - 4)}`}
                    </span>
                    <span className="text-xl font-extrabold text-blue-400">{player.score}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400 py-4">No players currently in this lobby.</p>
          )}

          <p className="mt-4 text-sm text-gray-400 text-center">
            (Note: Camera feed is your own camera, simulating the player's view if you click on a player.)
          </p>
          <div className="mt-6">
            <CameraFeed showCrosshair={false} />
          </div>
        </div>
      ) : (
        <p className="text-xl text-gray-400 text-center">Please select a lobby to view players.</p>
      )}
    </div>
  );
}

export default SpectatorView;
