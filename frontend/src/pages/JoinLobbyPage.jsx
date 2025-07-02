import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  Header  from '../components/Header';
import  Button  from '../components/Button';
import  Input  from '../components/Input';
import { ClassSelector } from '../components/ClassSelector';
import { Hash, LogIn } from 'lucide-react';
import { useWebSocket } from '../WebSocketContext';

/**
 * Page for joining a lobby, now with class selection.
 */
const JoinLobbyPage = () => {
  const [lobbyCode, setLobbyCode] = useState('');
  const [username, setUsername] = useState('');
  const [selectedClass, setSelectedClass] = useState('Pistol'); // Default class
  const navigate = useNavigate();

  const { sendMessage, lastMessage, wsStatus, ws } = useWebSocket();

  React.useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = JSON.parse(lastMessage);
      console.log(msg);
      if (msg.type === 'lobby_joined') {

        // Use the code from the message, or fallback to the entered code
        const code = msg.code || lobbyCode.trim().toUpperCase();
        navigate(`/lobby/${code}/waitlist`);
      } else if (msg.type === 'lobby_error') {
        alert(msg.message || 'Failed to join lobby.');
      }
    } catch (e) {}
  }, [lastMessage, navigate, lobbyCode]);

  const handleJoinByCode = () => {
    if (lobbyCode.trim() === '') {
      alert('Please enter a lobby code to join.');
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
    sendMessage({
      type: 'join_lobby',
      code: lobbyCode.trim().toUpperCase(),
      username: username.trim(), // Send username
      role: 'player', // Ensure role is set to player
      class: selectedClass.toLowerCase() // Use "class" and lowercase for backend
    });
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
