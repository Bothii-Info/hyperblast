import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import { Hash, LogIn, User } from 'lucide-react'; // Import User icon
import { useWebSocket } from '../WebSocketContext';

/**
 * A focused page for players to join a private lobby using a specific code.
 * The layout is a simple vertical stack for all screen sizes.
 */
const JoinLobbyPage = () => {
  const [lobbyCode, setLobbyCode] = useState('');
  const [username, setUsername] = useState(''); // New state for username
  const navigate = useNavigate();
  const { sendMessage, lastMessage, wsStatus } = useWebSocket();

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
      role: 'player' // Ensure role is set to player
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
            <h2 className="text-3xl font-bold md:text-4xl">Enter Lobby</h2>
            <p className="text-gray-400">
              Enter the code provided by the lobby host as well as your username.
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleJoinByCode(); }} className="w-full space-y-3">
             {/* Username Input */}
            <Input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User size={20} className="text-gray-400" />} // Optional: Add a user icon
            />
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