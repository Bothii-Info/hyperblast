import React, { useState, useEffect } from 'react'; // Import useEffect
import { Crown, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useWebSocket } from '../WebSocketContext';

/**
 * The waitlist view specifically for a non-host player.
 */
const PlayerWaitlistPage = ({ players, currentUser, lobbyCode, isStarting, countdown, onReadyToggle, onNameChange }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState('');
  const { sendMessage, lastMessage, wsStatus, ws } = useWebSocket();

  useEffect(() => {
    if (currentUser) {
      setNameInputValue(currentUser.name);
    }
  }, [currentUser]);

  const handleEditName = () => {
    if (currentUser) { // Ensure currentUser exists before setting input value
      setNameInputValue(currentUser.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = () => {
    if (nameInputValue.trim() !== '') {
      onNameChange(nameInputValue.trim());
      setIsEditingName(false);
    }
  };
  
  // Function to handle ready toggle with WebSocket
  const handleReadyToggle = () => {
    if (currentUser && lobbyCode) {
      sendMessage({ 
        type: 'set_ready', 
        code: lobbyCode,
        ready: !currentUser.isReady 
      });
    } else {
      // Fall back to the passed onReadyToggle if no WebSocket or missing data
      onReadyToggle();
    }
  };

  if (!currentUser && !isStarting) { // Added a check for currentUser to prevent rendering issues before data loads
    return (
      <div className="text-center text-gray-400">
        Loading player data...
      </div>
    );
  }

  if (isStarting) {
    return (
      <div className="text-center">
        <div className="relative mx-auto h-32 w-32">
            <svg className="h-full w-full" viewBox="0 0 100 100">
                <circle className="stroke-current text-gray-700" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"></circle>
                <circle
                    className="stroke-current text-indigo-500 transition-all duration-1000 linear"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (countdown / 3) * 251.2}
                    strokeLinecap="round"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    transform="rotate(-90 50 50)"
                ></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold">{countdown}</div>
        </div>
        <h3 className="mt-4 text-2xl font-bold">Game Starting...</h3>
        <p className="text-gray-400">Get ready!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 rounded-lg bg-gray-800 p-4">
        {players.map(player => (
          <div key={player.id} className="flex items-center justify-between rounded-md bg-white/5 p-3">
            <div className="flex items-center gap-3">
              {player.isHost && <Crown size={20} className="text-yellow-400" />}
              {isEditingName && player.id === currentUser.id ? (
                <Input value={nameInputValue} onChange={(e) => setNameInputValue(e.target.value)} />
              ) : (
                <span className="font-semibold">{player.name} {player.id === currentUser.id && '(You)'}</span>
              )}
            </div>
            <span className={`flex items-center gap-2 text-sm ${player.isReady ? 'text-green-400' : 'text-red-400'}`}>
              {player.isReady ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {player.isReady ? 'Ready' : 'Not Ready'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {isEditingName ? (
          <>
            <Button onClick={handleSaveName} className="bg-green-600 hover:bg-green-700">Save Name</Button>
            <Button onClick={() => setIsEditingName(false)} className="bg-gray-600 hover:bg-gray-700">Cancel</Button>
          </>
        ) : (
          <>
            <Button onClick={handleReadyToggle} disabled={isEditingName} className={`flex items-center justify-center gap-2 ${currentUser?.isReady ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {currentUser?.isReady ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
              <span>{currentUser?.isReady ? 'Set to Not Ready' : 'Ready Up'}</span>
            </Button>
            <Button onClick={handleEditName} className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700">
              <Pencil size={18} />
              <span>Edit Name</span>
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default PlayerWaitlistPage;