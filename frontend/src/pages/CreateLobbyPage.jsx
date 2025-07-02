import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  Header  from '../components/Header';
import Button from '../components/Button'; 
import  Input  from '../components/Input';
import { ClassSelector } from '../components/ClassSelector';
import { Users, Gamepad2, Swords, User } from 'lucide-react';
// import { useWebSocket } from '../WebSocketContext'; // Assuming you have a WebSocket context

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
  // const { sendMessage } = useWebSocket();

  const handleCreateLobby = () => {
    if (!username.trim() || !lobbyName.trim()) {
      alert('Please enter your username and a lobby name.');
      return;
    }
    setIsLoading(true);

    // --- BACKEND INTEGRATION GUIDE ---
    // Send all relevant info, including the chosen class, to the backend.
    const lobbyData = {
      type: 'create_lobby',
      name: lobbyName.trim(),
      maxPlayers: maxPlayers,
      username: username.trim(),
      playerClass: selectedClass, // Include the selected class
      role: 'player'
    };
    console.log("Creating Lobby with data:", lobbyData);
    // sendMessage(lobbyData);
    
    // Simulate backend response and navigate
    setTimeout(() => {
        const fakeLobbyCode = "HBLAST1";
        navigate(`/lobby/${fakeLobbyCode}/waitlist`);
    }, 1000);
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
