import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  Header  from '../components/Header';
import Button from '../components/Button'; 
import  Input  from '../components/Input';
import { ClassSelector } from '../components/ClassSelector';
import { Users, Gamepad2, Swords, User } from 'lucide-react';
import { useWebSocket } from '../WebSocketContext';

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
  const { sendMessage } = useWebSocket();

  const handleCreateLobby = () => {
    if (!username.trim() || !lobbyName.trim()) {
      alert('Please enter your username and a lobby name.');
      return;
    }
    setIsLoading(true);
    const lobbyData = {
      type: 'create_lobby',
      name: lobbyName.trim(),
      maxPlayers: maxPlayers,
      username: username.trim(),
      class: selectedClass.toLowerCase(), // Use "class" and lowercase for backend
      role: 'player'
    };
    console.log("Creating Lobby with data:", lobbyData);
    sendMessage(lobbyData);
    // Wait for lobby_created message from backend to get the real code
  };

  // Listen for lobby_created and navigate
  React.useEffect(() => {
    const handleLobbyCreated = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'lobby_created' && data.code) {
          navigate(`/lobby/${data.code}/waitlist`);
        }
      } catch (e) {}
    };
    const ws = (window.__WS__ && window.__WS__.current) || (window.ws && window.ws.current);
    if (ws && ws.addEventListener) {
      ws.addEventListener('message', handleLobbyCreated);
      return () => ws.removeEventListener('message', handleLobbyCreated);
    }
    // If using context, listen via WebSocketContext
    return undefined;
  }, [navigate]);

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
