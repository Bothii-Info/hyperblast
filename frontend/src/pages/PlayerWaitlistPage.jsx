import React, { useState, useEffect, useRef } from 'react'; // NEW: Added useRef for robust sound handling.
import { Crown, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import PlayerScan from '../components/PlayerScan';
import { useWebSocket } from '../WebSocketContext';

/**
 * The waitlist view specifically for a non-host player.
 */
const PlayerWaitlistPage = ({ players, currentUser, lobbyCode, isStarting, countdown, onReadyToggle, onNameChange }) => {
  const { sendMessage, lastMessage, wsStatus } = useWebSocket();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState('');
  const [isFaceScanComplete, setIsFaceScanComplete] = useState(false);
  // 30s countdown clock state
  const [autoCountdown, setAutoCountdown] = useState(120);
  const [autoCountdownActive, setAutoCountdownActive] = useState(true);
  // 30s countdown effect for top right clock
  // Track if we should show the scan face warning
  const [showScanFaceWarning, setShowScanFaceWarning] = useState(false);
  useEffect(() => {
    if (!autoCountdownActive) return;
    if (autoCountdown > 0) {
      const timer = setTimeout(() => setAutoCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (autoCountdown === 0 && autoCountdownActive) {
      // Only auto-ready if face is scanned
      if (players && players.length > 0 && currentUser && lobbyCode) {
        if (isFaceScanComplete) {
          sendMessage({ type: 'set_ready', code: lobbyCode, ready: true });
          setShowScanFaceWarning(false);
        } else {
          setShowScanFaceWarning(true);
        }
      }
      setAutoCountdownActive(false);
    }
  }, [autoCountdown, autoCountdownActive, players, currentUser, lobbyCode, sendMessage, isFaceScanComplete]);

  // If countdown reached 0 and face scan completes after, auto-ready
  useEffect(() => {
    if (
      autoCountdown === 0 &&
      !autoCountdownActive &&
      showScanFaceWarning &&
      isFaceScanComplete &&
      players && players.length > 0 && currentUser && lobbyCode
    ) {
      sendMessage({ type: 'set_ready', code: lobbyCode, ready: true });
      setShowScanFaceWarning(false);
    }
  }, [isFaceScanComplete, autoCountdown, autoCountdownActive, showScanFaceWarning, players, currentUser, lobbyCode, sendMessage]);

  // Restart timer if player goes from ready to not ready
  const prevIsReadyRef = useRef(currentUser?.isReady);
  useEffect(() => {
    if (!currentUser) return;
    if (prevIsReadyRef.current && !currentUser.isReady) {
      setAutoCountdown(120);
      setAutoCountdownActive(true);
    }
    prevIsReadyRef.current = currentUser.isReady;
  }, [currentUser]);
  // NEW: A ref to hold the Audio object, preventing it from being re-created on every render.
  const countdownSoundRef = useRef(null);
  // NEW: A ref that acts as a flag to ensure the sound plays only once per countdown.
  const countdownPlayed = useRef(false);
  // Ready sound effect
  const readySoundRef = useRef(null);
  // Track if ready sound has been played for this ready event
  const readyPlayedRef = useRef(false);

  useEffect(() => {
    if (currentUser) {
      setNameInputValue(currentUser.name);

      // Check if face scan is already complete for this user in this session
      try {
        const sessionKey = `playerFaces_${lobbyCode}`;
        const playerFaces = JSON.parse(localStorage.getItem(sessionKey) || '{}');
        const userId = localStorage.getItem('userId');
        if (userId && playerFaces[userId]) {
          setIsFaceScanComplete(true);
          console.log(`Face scan already complete for user ${currentUser.name} in session ${lobbyCode}`);
        }
      } catch (e) {
        console.error("Error checking face scan status:", e);
      }
    }
  }, [currentUser]);

  // NEW: This effect hook runs only once on mount to create the audio objects.
  useEffect(() => {
    countdownSoundRef.current = new Audio('/sounds/Countdown.mp3');
    readySoundRef.current = new Audio('/sounds/Ready.mp3');
    // Cleanup
    return () => {
      if (countdownSoundRef.current) {
        countdownSoundRef.current.pause();
        countdownSoundRef.current = null;
      }
      if (readySoundRef.current) {
        readySoundRef.current.pause();
        readySoundRef.current = null;
      }
    };
  }, []);
  // Play Ready.mp3 when player status changes to ready
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.isReady && !readyPlayedRef.current) {
      if (readySoundRef.current) {
        readySoundRef.current.volume = 0.7;
        readySoundRef.current.currentTime = 0;
        readySoundRef.current.play().catch(() => {});
      }
      readyPlayedRef.current = true;
    } else if (!currentUser.isReady) {
      readyPlayedRef.current = false;
    }
  }, [currentUser?.isReady]);

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
      {/* 30s countdown clock at top right, or ready icon if ready */}
      {currentUser?.isReady ? (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
          <div className="flex items-center gap-2 bg-green-600/90 px-4 py-2 rounded-lg shadow text-white font-bold text-lg">
            <CheckCircle2 size={22} className="text-white" />
            <span>Ready</span>
          </div>
        </div>
      ) : (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
          <div className="flex items-center gap-2 bg-gray-900/90 px-4 py-2 rounded-lg shadow text-white font-bold text-lg">
            <span>Auto-Ready in</span>
            <span className="text-yellow-400 font-mono">{autoCountdown}s</span>
          </div>
        </div>
      )}

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
      <div className="mt-4">
        {/* Face scanning section - only show for the current user */}
        {currentUser && !isStarting && (
          <PlayerScan 
            username={currentUser.name}
            lobbyCode={lobbyCode}
            onScanComplete={() => setIsFaceScanComplete(true)}
          />
        )}
      </div>
      <div className="mt-6 space-y-3">
        {showScanFaceWarning && !isFaceScanComplete && (
          <div className="text-center text-red-500 font-bold text-lg">Please scan your face before readying up!</div>
        )}
        {isEditingName ? (
          <>
            <Button onClick={handleSaveName} className="bg-green-600 hover:bg-green-700">Save Name</Button>
            <Button onClick={() => setIsEditingName(false)} className="bg-gray-600 hover:bg-gray-700">Cancel</Button>
          </>
        ) : (
          <>
            <Button onClick={handleReadyToggle} disabled={isEditingName || !isFaceScanComplete} className={`flex items-center justify-center gap-2 ${currentUser?.isReady ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} ${!isFaceScanComplete ? 'opacity-50 cursor-not-allowed' : ''}`}>
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