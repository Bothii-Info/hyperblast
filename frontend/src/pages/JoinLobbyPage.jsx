import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  Header  from '../components/Header';
import  Button  from '../components/Button';
import  Input  from '../components/Input';
import { ClassSelector } from '../components/ClassSelector';
import { Hash, LogIn } from 'lucide-react';
// import { useWebSocket } from '../WebSocketContext';

/**
 * Page for joining a lobby, now with class selection.
 */
const JoinLobbyPage = () => {
  const [lobbyCode, setLobbyCode] = useState('');
  const [username, setUsername] = useState('');
  const [selectedClass, setSelectedClass] = useState('Pistol'); // Default class
  const navigate = useNavigate();
  // const { sendMessage } = useWebSocket();

  const handleJoinByCode = () => {
    if (!lobbyCode.trim() || !username.trim()) {
      alert('Please enter your username and a lobby code.');
      return;
    }

    // --- BACKEND INTEGRATION GUIDE ---
    const joinData = {
      type: 'join_lobby',
      code: lobbyCode.trim().toUpperCase(),
      username: username.trim(),
      playerClass: selectedClass, // Include the selected class
      role: 'player'
    };
    console.log("Joining Lobby with data:", joinData);
    // sendMessage(joinData);

    // Simulate successful join and navigate
    navigate(`/lobby/${lobbyCode.trim().toUpperCase()}/waitlist`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#2c1a4d] to-[#100c28] text-white">
      <Header title="Join Lobby" showBackButton />

      <main className="flex flex-grow flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Hash size={40} className="text-purple-400" />
            <h2 className="text-3xl font-bold md:text-4xl">Join Game</h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleJoinByCode(); }} className="w-full space-y-4">
            <Input placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="LOBBY-CODE" value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value.toUpperCase())} />
            <ClassSelector selectedClass={selectedClass} onSelectClass={setSelectedClass} />
            <Button type="submit" className="flex items-center justify-center gap-2">
              <LogIn size={20} />
              <span>Join Lobby</span>
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default JoinLobbyPage;
