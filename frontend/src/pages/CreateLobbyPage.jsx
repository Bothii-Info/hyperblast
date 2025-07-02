import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  Header  from '../components/Header';
import Button from '../components/Button'; 
import  Input  from '../components/Input';
import { ClassSelector } from '../components/ClassSelector';
import { Users, Gamepad2, Swords, User } from 'lucide-react';
import { useWebSocket } from '../WebSocketContext'; // Assuming you have a WebSocket context

/**
 * Page for creating a new game lobby with class selection.
 */
const CreateLobbyPage = () => {
  const [lobbyName, setLobbyName] = useState('');
  const [username, setUsername] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [selectedClass, setSelectedClass] = useState('Pistol'); // Default class
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
    if (wsStatus !== 'open') {
      alert('WebSocket not connected.');
      return;
    }
    setIsLoading(true);
    sendMessage({
      type: 'create_lobby',
      name: lobbyName.trim(), // Trim lobby name
      maxPlayers: maxPlayers,
      username: username.trim(), // Send username
      role: 'player' // Ensure role is set to player
    });
  };


  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#2c1a4d] to-[#100c28] text-white">
      <Header title="Create Lobby" showBackButton />

      <main className="flex flex-grow flex-col justify-center p-4">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <Swords size={40} className="text-purple-400" />
              <h2 className="text-3xl font-bold md:text-4xl">Lobby Setup</h2>
            </div>
            <Input placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="Enter Lobby Name" value={lobbyName} onChange={(e) => setLobbyName(e.target.value)} />
            
            <div className="space-y-3 rounded-lg bg-gray-800/50 p-4">
              <label htmlFor="max-players" className="flex items-center justify-between text-lg font-medium text-gray-300">
                <span className="flex items-center gap-2"><Users size={20} /> Max Players</span>
                <span className="font-bold text-purple-400">{maxPlayers}</span>
              </label>
              <input id="max-players" type="range" min="4" max="8" step="1" value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-purple-500" />
            </div>
            
            <ClassSelector selectedClass={selectedClass} onSelectClass={setSelectedClass} />
          </div>
          
          <Button onClick={handleCreateLobby} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create and Join'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CreateLobbyPage;
