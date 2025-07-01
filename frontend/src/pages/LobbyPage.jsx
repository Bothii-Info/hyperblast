import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { Home } from 'lucide-react';

/**
 * The main lobby for players.
 * Provides options to create a new game lobby or join an existing one.
 */
const LobbyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header title="Player Lobby" showBackButton />

      <main className="flex flex-grow flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h2 className="text-3xl font-bold">What would you like to do?</h2>
          <div className="space-y-4">
            <Button onClick={() => navigate('/lobby/create')}>
              Create a New Lobby
            </Button>
            <Button 
              onClick={() => navigate('/lobby/join')}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Join an Existing Lobby
            </Button>
          </div>
        </div>
      </main>
      
      {/* Footer containing the "Back to Home" button */}
      <footer className="p-4">
        {/* This div constrains the button's width and centers it */}
        <div className="mx-auto max-w-xs">
          <Button 
            onClick={() => navigate('/')} 
            className="flex items-center justify-center gap-2 bg-gray-700 font-normal normal-case tracking-normal hover:scale-100 hover:bg-gray-600"
          >
            <Home size={20} />
            <span>Back to Home</span>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default LobbyPage;