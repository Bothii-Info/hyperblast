import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button'; // We'll create this button next

/**
 * The main landing page for the Laser Tag game.
 * It features an animated background and clear calls to action.
 */
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-900 p-4 text-white">
      {/* Animated background element */}
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 left-[-20%] right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
        <div className="absolute bottom-[-40%] right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-12 text-center">
          <h1 className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-6xl font-black uppercase tracking-tighter text-transparent drop-shadow-lg md:text-7xl">
            HyperBlast
          </h1>
          <p className="mt-2 text-lg font-medium text-gray-300 md:text-xl">
            A Computer Vision Laser Tag Experience
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <Button onClick={() => navigate('/lobby')}>Become a Player</Button>
          <Button
            onClick={() => navigate('/spectate')}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Spectate a Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;