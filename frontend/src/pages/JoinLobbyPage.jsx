import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import { Hash, LogIn } from 'lucide-react';

/**
 * A focused page for players to join a private lobby using a specific code.
 * The layout is a simple vertical stack for all screen sizes.
 */
const JoinLobbyPage = () => {
  const [lobbyCode, setLobbyCode] = useState('');
  const navigate = useNavigate();

  const handleJoinByCode = () => {
    if (lobbyCode.trim() === '') {
      alert('Please enter a lobby code to join.');
      return;
    }

    // --- BACKEND INTEGRATION GUIDE ---
    // Here, you would send a WebSocket message to your server to validate the lobby code.
    // The server should check if the lobby exists and has space.
    //
    // For example:
    // ws.send(JSON.stringify({
    //   type: 'join_lobby',
    //   payload: { code: lobbyCode.trim().toUpperCase() }
    // }));
    //
    // The server would then respond with a success or failure message.
    // On success, the server could trigger the navigation for the client,
    // or the client could navigate after receiving a 'join_success' message.

    // For now, we'll optimistically navigate to the waitlist page.
    navigate(`/lobby/${lobbyCode.trim().toUpperCase()}/waitlist`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header title="Join Private Lobby" showBackButton />

      <main className="flex flex-grow flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          {/* Informational Header */}
          <div className="flex flex-col items-center gap-2">
            <Hash size={40} className="text-indigo-400" />
            <h2 className="text-3xl font-bold md:text-4xl">Enter Lobby Code</h2>
            <p className="text-gray-400">
              Enter the code provided by the lobby host to join their game.
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleJoinByCode(); }} className="w-full space-y-3">
            <Input
              placeholder="LOBBY-CODE"
              value={lobbyCode}
              // Automatically convert input to uppercase for consistency
              onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
            />
            <Button type="submit" className="flex items-center justify-center gap-2">
              <LogIn size={20} />
              <span>Join</span>
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default JoinLobbyPage;