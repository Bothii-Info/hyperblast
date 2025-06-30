import React, { useState, useEffect, useRef } from 'react';
import CameraFeed from './CameraFeed';

function PlayerView({
  goToLandingPage,
  playerName,
  setPlayerName,
  playerScore,
  isGameActive,
  handlePlayerShoot,
  isShooting,
  isHit,
}) {
  return (
    <div className="flex flex-col items-center w-full max-w-2xl relative min-h-[calc(100vh-100px)]">
      <button
        onClick={goToLandingPage}
        className="self-start mb-6 px-4 py-2 bg-gray-700 text-white rounded-md shadow-md hover:bg-gray-600 transition duration-200"
      >
        &larr; Back to Home
      </button>

      <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-600 text-center">
        Player View
      </h2>

      <input
        type="text"
        placeholder="Enter your player name..."
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        className="w-full p-3 mb-6 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mb-6 bg-gray-700 px-6 py-3 rounded-full shadow-inner flex items-center justify-center border border-gray-600">
        <span className="text-xl sm:text-2xl font-bold text-teal-300 mr-2">Your Score:</span>
        <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">{playerScore}</span>
      </div>

      <div className="w-full relative">
        <CameraFeed showCrosshair={true} />

        {isShooting && (
          <div className="absolute inset-0 bg-blue-500 opacity-0 animate-laser-shot rounded-lg z-30"></div>
        )}
        {isHit && (
          <div className="absolute inset-0 bg-emerald-500 bg-opacity-70 rounded-lg flex items-center justify-center animate-ping-once z-40">
            <span className="text-4xl sm:text-6xl font-black text-white drop-shadow-lg">HIT!</span>
          </div>
        )}

        <button
          onClick={handlePlayerShoot}
          disabled={!isGameActive}
          className="absolute bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg z-50"
        >
          Shoot Laser
        </button>
      </div>

      <p className="mt-6 text-sm text-gray-400 text-center">
        Ensure camera access is granted. The crosshair helps you aim!
      </p>
    </div>
  );
}

export default PlayerView;
