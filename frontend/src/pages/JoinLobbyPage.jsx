import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import { Hash, LogIn } from 'lucide-react';
import { useWebSocket } from '../WebSocketContext';

/**
 * A focused page for players to join a private lobby using a specific code.
 * The layout is a simple vertical stack for all screen sizes.
 */
const JoinLobbyPage = () => {
  const [lobbyCode, setLobbyCode] = useState('');
  const navigate = useNavigate();
  const { sendMessage, lastMessage, wsStatus } = useWebSocket();

  React.useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = JSON.parse(lastMessage);
      if (msg.type === 'lobby_joined') {
        navigate(`/lobby/${msg.code}/waitlist`);
      } else if (msg.type === 'lobby_error') {
        alert(msg.message || 'Failed to join lobby.');
      }
    } catch (e) {}
  }, [lastMessage, navigate]);

  const handleJoinByCode = () => {
    if (lobbyCode.trim() === '') {
      alert('Please enter a lobby code to join.');
      return;
    }
    if (wsStatus !== 'open') {
      alert('WebSocket not connected.');
      return;
    }
    sendMessage({
      type: 'join_lobby',
      code: lobbyCode.trim().toUpperCase()
    });
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
              placeholder="ABCDEF"
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