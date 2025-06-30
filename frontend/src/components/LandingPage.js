import React from 'react';

function LandingPage({ goToPlayerView, goToSpectatorView }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 animate-bounce-in">
        Welcome to Laser Tag Arena!
      </h1>
      <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl">
        Experience a thrilling laser tag game right from your smartphone. Team up with friends or challenge rivals in a fast-paced battle for supremacy. Aim, shoot, and dominate the arena!
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
        <button
          onClick={goToPlayerView}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-full shadow-lg hover:from-green-600 hover:to-teal-700 transition duration-300 ease-in-out transform hover:scale-105 text-lg"
        >
          Play Game
        </button>
        <button
          onClick={goToSpectatorView}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-full shadow-lg hover:from-purple-600 hover:to-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 text-lg"
        >
          Spectate Game
        </button>
      </div>
      <p className="mt-10 text-md text-gray-400">
        Minimum 2 players, maximum 8 players.
      </p>
    </div>
  );
}

export default LandingPage;
