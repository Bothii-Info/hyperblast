import React, { useState, useEffect, useRef } from 'react'; // NEW: Added useRef for robust sound handling.
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
  const { sendMessage, lastMessage, wsStatus } = useWebSocket();
  // NEW: A ref to hold the Audio object, preventing it from being re-created on every render.
  const countdownSoundRef = useRef(null);
  // NEW: A ref that acts as a flag to ensure the sound plays only once per countdown.
  const countdownPlayed = useRef(false);

  useEffect(() => {
    if (currentUser) {
      setNameInputValue(currentUser.name);
    }
  }, [currentUser]);

  // NEW: This effect hook runs only once on mount to create the audio object.
  useEffect(() => {
    // NEW: The audio path is corrected to '/sounds/Countdown.mp3' for consistency.
    countdownSoundRef.current = new Audio('/sounds/Countdown.mp3');

    // NEW: A cleanup function is returned to properly handle the audio object when the component unmounts.
    return () => {
      if (countdownSoundRef.current) {
        countdownSoundRef.current.pause();
        countdownSoundRef.current = null;
      }
    };
  }, []); // NEW: The empty dependency array ensures this effect runs only once.

  // This useEffect block handles playing the sound when the 'isStarting' prop changes.
  useEffect(() => {
    // NEW: Check if the countdown is starting AND if the sound has not already been played for this sequence.
    if (isStarting && !countdownPlayed.current) {
      // NEW: Check that the audio object has been loaded before attempting to play it.
      if (countdownSoundRef.current) {
        countdownSoundRef.current.volume = 0.7; // Set volume to a reasonable level
        countdownSoundRef.current.currentTime = 0; // NEW: Rewind the sound to the start.
        countdownSoundRef.current.play().catch(error => console.error("Error playing sound:", error));
        // NEW: Set the flag to true to prevent the sound from playing again during this countdown.
        countdownPlayed.current = true;
      }
    } else if (!isStarting) {
      // NEW: If the countdown is over or cancelled, reset the flag for the next game.
      countdownPlayed.current = false;
    }
  }, [isStarting]);

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