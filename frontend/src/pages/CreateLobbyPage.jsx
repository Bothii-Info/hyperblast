import React, { useState } from 'react';
import { useNavigate }
from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import { Users, Gamepad2, Swords, User } from 'lucide-react'; // Import User icon
import { useWebSocket } from '../WebSocketContext';

/**
 * Page for creating a new game lobby.
 * Allows the user to set a lobby name, a custom lobby code, and the max players.
 */
const CreateLobbyPage = () => {
  const [lobbyName, setLobbyName] = useState('');
  const [username, setUsername] = useState(''); // New state for username
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { sendMessage, lastMessage, wsStatus, ws } = useWebSocket();

  // Listen for lobby_created response
  React.useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = JSON.parse(lastMessage);
      if (msg.type === 'lobby_created') {
        setIsLoading(false);
        navigate(`/lobby/${msg.code}/waitlist`);
      } else if (msg.type === 'lobby_list' && Array.isArray(msg.lobbies) && msg.lobbies.length > 0 && isLoading) {
        // Use the last lobby in the list (most recently created) - This logic might need refinement
        // A better approach would be to ensure 'lobby_created' message is always received with the correct code
        const lastLobby = msg.lobbies[msg.lobbies.length - 1];
        if (lastLobby && lastLobby.code) {
          setIsLoading(false);
          navigate(`/lobby/${lastLobby.code}/waitlist`);
        }
      } else if (msg.type === 'lobby_error') {
        setIsLoading(false);
        alert(msg.message || 'Failed to create lobby.');
      }
    } catch (e) {}
  }, [lastMessage, navigate, isLoading]);

  const handleCreateLobby = () => {
    // Validate that both name and code are filled out
    if (lobbyName.trim() === '') {
      alert('Please provide a Lobby Name');
      return;
    }
    if (username.trim() === '') { // Validate username
      alert('Please enter your username.');
      return;
    }

    // Make sure we have a userId
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Connection not properly established. Please refresh and try again.');
      return;
    }

    setIsLoading(true);
    console.log('Creating lobby with userId:', userId, 'username:', username.trim());
    sendMessage({
      type: 'create_lobby',
      name: lobbyName.trim(), // Trim lobby name
      maxPlayers: maxPlayers,
      username: username.trim(), // Send username
      role: 'player' // Ensure role is set to player
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header title="Create New Lobby" showBackButton />

      <main className="flex flex-grow flex-col justify-center p-4">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-4">
             {/* Informational Header */}
          <div className="flex flex-col items-center gap-2">
            <Swords size={40} className="text-indigo-400" />
            <h2 className="text-3xl font-bold md:text-4xl">Create Lobby</h2>
            <p className="text-gray-400 text-center">
              Create lobby, choose a name and dominate as an MVP
            </p>
          </div>
            {/* Input for Lobby Name */}
            <Input
              placeholder="Enter Lobby Name"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
            />
            {/* Input for Username */}
            <Input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User size={20} className="text-gray-400" />} // Optional: Add a user icon
            />
            
            <div className="space-y-3 rounded-lg bg-gray-800 p-4">
              <label htmlFor="max-players" className="flex items-center justify-between text-lg font-medium text-gray-300">
                <span className="flex items-center gap-2"><Users size={20} /> Max Players</span>
                <span className="font-bold text-indigo-400">{maxPlayers}</span>
              </label>
              <input
                id="max-players"
                type="range"
                min="4"
                max="8"
                step="1"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-indigo-500"
              />
            </div>
          </div>
          
          <Button onClick={handleCreateLobby} className="flex items-center justify-center gap-2" disabled={isLoading}>
            {isLoading ? (
              <span className="animate-spin mr-2 h-5 w-5 border-2 border-t-2 border-indigo-400 border-t-transparent rounded-full"></span>
            ) : (
              <Gamepad2 size={20} />
            )}
            <span>{isLoading ? 'Creating...' : 'Create and Join'}</span>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CreateLobbyPage;