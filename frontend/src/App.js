import React, { useState, useEffect, useRef, useCallback } from 'react';

// CameraFeed component - Defined directly within App.js for stability
function CameraFeed({ showCrosshair = false }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading state

  useEffect(() => {
    async function setupCamera() {
      setIsLoading(true);
      setError(null);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please ensure a camera is connected.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera already in use or inaccessible. Try closing other apps using the camera.');
        } else if (err.name === 'AbortError') {
            setError('Camera access aborted. Please try again.');
        } else {
          setError('An unexpected error occurred while accessing the camera.');
        }
        setStream(null);
      } finally {
        setIsLoading(false);
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden border-4 border-yellow-500 mb-6 relative aspect-video flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-700 bg-opacity-75 z-10 rounded-lg p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500 mb-3"></div>
          <p className="text-xl font-semibold text-white">Loading camera...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-800 bg-opacity-85 z-10 rounded-lg p-4 text-center">
          <p className="text-white text-lg font-bold mb-2">Camera Error!</p>
          <p className="text-white text-md">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        className={`w-full h-full object-cover rounded-md ${!stream ? 'hidden' : ''}`}
        autoPlay
        playsInline
        muted
      ></video>

      {!stream && !error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 bg-opacity-75 z-10 rounded-lg">
          <p className="text-white text-xl">Waiting for camera access...</p>
        </div>
      )}

      {showCrosshair && stream && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-12 h-12 border-2 border-red-500 rounded-full flex items-center justify-center relative">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="absolute w-full h-0.5 bg-red-500"></div>
            <div className="absolute h-full w-0.5 bg-red-500"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// LandingPage Component
const LandingPage = ({ goToPlayerView, goToSpectatorView }) => (
  <div className="flex flex-col items-center justify-center text-center">
    <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 animate-bounce-in">
      Welcome to Laser Tag Arena!
    </h1>
    <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl">
      Experience a thrilling laser tag game right from your smartphone. Team up with friends or challenge rivals in a fast-paced battle for supremacy. Aim, shoot, and dominate the arena!
    </p>
    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
      <button
        onClick={goToPlayerView}
        className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-full shadow-lg hover:from-green-600 hover:to-teal-700 transition duration-300 ease-in-out transform hover:scale-105 text-lg"
      >
        Play Game
      </button>
      <button
        onClick={goToSpectatorView}
        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-full shadow-lg hover:from-purple-600 hover:to-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 text-lg"
      >
        Spectate Game
      </button>
    </div>
    <p className="mt-10 text-md text-gray-400">
      Minimum 2 players, maximum 8 players.
    </p>
  </div>
);

// PlayerView Component
const PlayerView = ({
  goToLandingPage,
  playerName,
  setPlayerName,
  playerScore,
  isGameActive,
  handlePlayerShoot,
  isShooting,
  isHit,
}) => (
  <div className="flex flex-col items-center w-full max-w-2xl relative min-h-[calc(100vh-100px)]">
    <button
      onClick={goToLandingPage}
      className="self-start mb-6 px-4 py-2 bg-gray-700 text-white rounded-md shadow-md hover:bg-gray-600 transition duration-200"
    >
      &larr; Back to Home
    </button>

    <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-600 text-center">
      Player View
    </h2>

    <input
      type="text"
      placeholder="Enter your player name..."
      value={playerName}
      onChange={(e) => setPlayerName(e.target.value)}
      className="w-full p-3 mb-6 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <div className="mb-6 bg-gray-700 px-6 py-3 rounded-full shadow-inner flex items-center justify-center border border-gray-600">
      <span className="text-xl sm:text-2xl font-bold text-teal-300 mr-2">Your Score:</span>
      <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">{playerScore}</span>
    </div>

    <div className="w-full relative">
      <CameraFeed showCrosshair={true} />

      {isShooting && (
        <div className="absolute inset-0 bg-blue-500 opacity-0 animate-laser-shot rounded-lg z-30"></div>
      )}
      {isHit && (
        <div className="absolute inset-0 bg-emerald-500 bg-opacity-70 rounded-lg flex items-center justify-center animate-ping-once z-40">
          <span className="text-4xl sm:text-6xl font-black text-white drop-shadow-lg">HIT!</span>
        </div>
      )}

      <button
        onClick={handlePlayerShoot}
        disabled={!isGameActive}
        className="absolute bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg z-50"
      >
        Shoot Laser
      </button>
    </div>

    <p className="mt-6 text-sm text-gray-400 text-center">
      Ensure camera access is granted. The crosshair helps you aim!
    </p>
  </div>
);

// SpectatorView Component
const SpectatorView = ({
  goToLandingPage,
  selectedSpectatorPlayerId,
  viewPlayerCamera,
  backToSpectatorScoreboard,
  spectatorPlayers,
}) => (
  <div className="flex flex-col items-center w-full max-w-2xl">
    <button
      onClick={goToLandingPage}
      className="self-start mb-6 px-4 py-2 bg-gray-700 text-white rounded-md shadow-md hover:bg-gray-600 transition duration-200"
    >
      &larr; Back to Home
    </button>

    <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 text-center">
      Spectator View
    </h2>

    {selectedSpectatorPlayerId ? (
      <div className="w-full">
        <button
          onClick={backToSpectatorScoreboard}
          className="mb-4 px-4 py-2 bg-gray-700 text-white rounded-md shadow-md hover:bg-gray-600 transition duration-200"
        >
          &larr; Back to Scoreboard
        </button>
        <h3 className="text-2xl font-bold mb-4 text-gray-200">
          Viewing: {spectatorPlayers.find(p => p.id === selectedSpectatorPlayerId)?.name || 'Unknown Player'}
        </h3>
        <CameraFeed showCrosshair={false} />

        <p className="mt-4 text-sm text-gray-400 text-center">
          (Note: This is your own camera feed, simulating the player's view.)
        </p>
      </div>
    ) : (
      <div className="bg-gray-700 p-6 rounded-lg shadow-xl w-full">
        <h3 className="text-2xl font-bold mb-4 text-gray-200 border-b border-gray-600 pb-2">
          Live Scoreboard
        </h3>
        <p className="text-lg text-gray-300 mb-4">
          Active Players: <span className="font-bold text-yellow-300">{spectatorPlayers.length} / 8</span>
        </p>
        <ul className="space-y-3">
          {spectatorPlayers.length > 0 ? (
            spectatorPlayers
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                  <li
                    key={player.id}
                    onClick={() => viewPlayerCamera(player.id)}
                    className="flex justify-between items-center bg-gray-800 p-3 rounded-md shadow-inner border border-gray-600 cursor-pointer hover:bg-gray-600 transition duration-200 transform hover:scale-[1.02]"
                  >
                    <span className="text-lg font-semibold text-white">
                      {index + 1}. {player.name || `Player ${player.id.substring(player.id.length - 4)}`}
                    </span>
                    <span className="text-xl font-extrabold text-blue-400">{player.score}</span>
                  </li>
                ))
          ) : (
            <li className="text-center text-gray-400 py-4">No players active yet.</li>
          )}
        </ul>
      </div>
    )}

    {!selectedSpectatorPlayerId && (
      <p className="mt-8 text-sm text-gray-400 text-center">
        Watch the action unfold! Click on a player's name to view their simulated camera feed.
      </p>
    )}
  </div>
);


function App() {
  const WS_URL = 'ws://localhost:8080';
  const ws = useRef(null); // Ref to hold the WebSocket instance
  const [readyState, setReadyState] = useState(0); // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED

  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);

  // Game-related states
  const [currentPage, setCurrentPage] = useState('landing');
  const [isGameActive, setIsGameActive] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerScore, setPlayerScore] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const [selectedSpectatorPlayerId, setSelectedSpectatorPlayerId] = useState(null);
  const [spectatorPlayers, setSpectatorPlayers] = useState([
    { id: 'player1', name: 'Alice', score: 120 },
    { id: 'player2', name: 'Bob', score: 90 },
    { id: 'player3', name: 'Charlie', score: 150 },
    { id: 'player4', name: 'Diana', score: 80 },
    { id: 'player5', name: 'Eve', score: 110 },
    { id: 'player6', name: 'Frank', score: 130 },
  ]);

  // WebSocket initialization and message handling
  useEffect(() => {
    // Initialize WebSocket connection
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connection opened.');
      setReadyState(WebSocket.OPEN); // Use WebSocket.OPEN
    };

    ws.current.onmessage = (event) => {
      try {
        const parsedMessage = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, parsedMessage]);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed.');
      setReadyState(WebSocket.CLOSED); // Use WebSocket.CLOSED
      // Implement reconnect logic if needed, or rely on browser auto-reconnect if it's handling it.
      // For this example, we will just log the closed state.
    };

    ws.current.onerror = (event) => {
      console.error('WebSocket error:', event);
      // setReadyState can be set to a custom error state if desired
    };

    // Clean up WebSocket connection on component unmount
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Dynamic Tailwind CSS CDN injection
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.tailwindcss.com';
    script.async = true; // Load asynchronously
    document.head.appendChild(script);

    // Optional: Clean up the script if the component unmounts
    return () => {
      document.head.removeChild(script);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const connectionStatusMap = {
    [WebSocket.CONNECTING]: 'Connecting',
    [WebSocket.OPEN]: 'Open',
    [WebSocket.CLOSING]: 'Closing',
    [WebSocket.CLOSED]: 'Closed',
  };
  const connectionStatus = connectionStatusMap[readyState];


  const handleSendMessage = useCallback(() => {
    if (messageInput.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ text: messageInput }));
      setMessageInput(''); // Clear input after sending
    }
  }, [messageInput, readyState]);


  // Game-related functions
  const goToPlayerView = () => {
    setCurrentPage('player');
    setIsGameActive(true);
  };

  const goToSpectatorView = () => {
    setCurrentPage('spectator');
    setIsGameActive(true);
  };

  const goToLandingPage = () => {
    setSelectedSpectatorPlayerId(null);
    setIsGameActive(false);
    setCurrentPage('landing');
    setPlayerScore(0);
  };

  const handlePlayerShoot = () => {
    if (isGameActive && currentPage === 'player') {
      setIsShooting(true);
      const didHit = Math.random() > 0.6;
      if (didHit) {
        setPlayerScore(prevScore => prevScore + 10);
        setIsHit(true);
      } else {
        setIsHit(false);
      }
      setTimeout(() => {
        setIsShooting(false);
        setIsHit(false);
      }, 200);
    }
  };

  const viewPlayerCamera = (playerId) => {
    setSelectedSpectatorPlayerId(playerId);
  };

  const backToSpectatorScoreboard = () => {
    setSelectedSpectatorPlayerId(null);
  };


  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans text-gray-100 overflow-auto">
      {/* The script tag directly in JSX was problematic. Now dynamically injected in useEffect. */}
      {/* The main content div */}
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col items-center border-4 border-emerald-500 relative">
        {currentPage === 'landing' && (
          <LandingPage
            goToPlayerView={goToPlayerView}
            goToSpectatorView={goToSpectatorView}
          />
        )}
        {currentPage === 'player' && (
          <PlayerView
            goToLandingPage={goToLandingPage}
            playerName={playerName}
            setPlayerName={setPlayerName}
            playerScore={playerScore}
            isGameActive={isGameActive}
            handlePlayerShoot={handlePlayerShoot}
            isShooting={isShooting}
            isHit={isHit}
          />
        )}
        {currentPage === 'spectator' && (
          <SpectatorView
            goToLandingPage={goToLandingPage}
            selectedSpectatorPlayerId={selectedSpectatorPlayerId}
            viewPlayerCamera={viewPlayerCamera}
            backToSpectatorScoreboard={backToSpectatorScoreboard}
            spectatorPlayers={spectatorPlayers}
          />
        )}
      </div>

      {/* WebSocket Chat Interface - Integrated below the game view */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mt-8">
        <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
          WebSocket Chat
        </h2>
        <p className="text-sm text-gray-400 mb-4">Connection Status: <span className="font-semibold text-blue-300">{connectionStatus}</span></p>

        <div className="border border-gray-600 bg-gray-700 h-48 overflow-y-scroll mb-4 p-3 rounded-md">
          {messages.map((msg, index) => (
            <div key={index} className="mb-1 text-gray-200">
              <strong className="text-blue-300">{msg.sender || 'Server'}:</strong> {msg.message || msg.text}
            </div>
          ))}
        </div>

        <div className="flex">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            disabled={readyState !== WebSocket.OPEN}
            className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={readyState !== WebSocket.OPEN || !messageInput.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-r-lg shadow-md hover:from-blue-700 hover:to-indigo-800 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-500 text-center">
            Note: WebSocket connection to `ws://localhost:8080` requires a local server running at that address.
            If you see "Connection Status: Closed" or errors, ensure your WebSocket server is active and accessible.
        </p>
      </div>

      {/* Custom CSS for animations (Tailwind doesn't have these by default) */}
      <style>{`
        @keyframes pulseLight {
          0%, 100% { box-shadow: 0 0 0px 0px rgba(74, 222, 128, 0.7); }
          50% { box-shadow: 0 0 20px 10px rgba(74, 222, 128, 0.7); }
        }

        @keyframes laserShot {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.8; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.5); }
        }

        @keyframes pingOnce {
          0% { transform: scale(0.2); opacity: 0; }
          50% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        @keyframes bounceIn {
          0%, 20%, 40%, 60%, 80%, 100% {
            transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
          }
          0% {
            opacity: 0;
            transform: scale3d(0.3, 0.3, 0.3);
          }
          20% {
            transform: scale3d(1.1, 1.1, 1.1);
          }
          40% {
            transform: scale3d(0.9, 0.9, 0.9);
          }
          60% {
            opacity: 1;
            transform: scale3d(1.03, 1.03, 1.03);
          }
          80% {
            transform: scale3d(0.97, 0.97, 0.97);
          }
          100% {
            opacity: 1;
            transform: scale3d(1, 1, 1);
          }
        }

        .animate-pulse-light {
          animation: pulseLight 1.5s infinite;
        }

        .animate-laser-shot {
          animation: laserShot 0.2s ease-out forwards;
        }

        .animate-ping-once {
          animation: pingOnce 0.3s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounceIn 1s;
        }
      `}</style>
    </div>
  );
}

export default App;
