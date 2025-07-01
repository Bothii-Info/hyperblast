import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import { Users, Gamepad2, Hash } from 'lucide-react';
import { useWebSocket } from '../WebSocketContext';

/**
 * Page for creating a new game lobby.
 * Allows the user to set a lobby name, a custom lobby code, and the max players.
 */
const CreateLobbyPage = () => {
  const [lobbyName, setLobbyName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const navigate = useNavigate();
  const { sendMessage, lastMessage, wsStatus } = useWebSocket();

  // Listen for lobby_created response
  React.useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = JSON.parse(lastMessage);
      if (msg.type === 'lobby_created') {
        navigate(`/lobby/${msg.code}/waitlist`);
      } else if (msg.type === 'lobby_error') {
        alert(msg.message || 'Failed to create lobby.');
      }
    } catch (e) {}
  }, [lastMessage, navigate]);

  const handleCreateLobby = () => {
    // Validate that both name and code are filled out
    if (lobbyName.trim() === '') {
      alert('Please provide a Lobby Name');
      return;
    }
    if (wsStatus !== 'open') {
      alert('WebSocket not connected.');
      return;
    }
    sendMessage({
      type: 'create_lobby',
      name: lobbyName,
      maxPlayers: maxPlayers
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header title="Create New Lobby" showBackButton />

      <main className="flex flex-grow flex-col justify-center p-4">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-4">
            {/* Input for Lobby Name */}
            <Input
              placeholder="Enter Lobby Name"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
            />
            
            <div className="space-y-3 rounded-lg bg-gray-800 p-4">
              <label htmlFor="max-players" className="flex items-center justify-between text-lg font-medium text-gray-300">
                <span className="flex items-center gap-2"><Users size={20} /> Max Players</span>
                <span className="font-bold text-indigo-400">{maxPlayers}</span>
              </label>
              <input
                id="max-players"
                type="range"
                min="2"
                max="16"
                step="1"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-indigo-500"
              />
            </div>
          </div>
          
          <Button onClick={handleCreateLobby} className="flex items-center justify-center gap-2">
            <Gamepad2 size={20} />
            <span>Create and Join</span>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CreateLobbyPage;