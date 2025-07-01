import React, { useState, useEffect, useRef, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import GameOptions from './components/GameOptions';
import CreateLobby from './components/CreateLobby';
import JoinLobby from './components/JoinLobby';
import PlayerView from './components/PlayerView';
import SpectatorView from './components/SpectatorView';
import SpectatorLobbyList from './components/SpectatorLobbyList';
import CameraFeed from './components/CameraFeed'; // Keep CameraFeed import for PlayerView and new SpectatorPlayerView
import SpectatorPlayerView from './components/SpectatorPlayerView'; // New Import

function App() {
  const WS_URL = 'ws://localhost:8080';
  const ws = useRef(null); // Ref to hold the WebSocket instance
  const [readyState, setReadyState] = useState(0); // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED

  // Game-related states
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'gameOptions', 'createLobby', 'joinLobby', 'player', 'spectatorLobbyList', 'spectator', 'spectatorPlayerDetail'
  const [isGameActive, setIsGameActive] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerScore, setPlayerScore] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const [selectedSpectatorPlayerId, setSelectedSpectatorPlayerId] = useState(null);
  const [selectedSpectatorLobbyId, setSelectedSpectatorLobbyId] = useState(null);

  // Updated spectatorPlayers to include lobbyId for filtering
  const [spectatorPlayers, setSpectatorPlayers] = useState([
    { id: 'player1', name: 'Alice', score: 120, lobbyId: 'lobby1' },
    { id: 'player2', name: 'Bob', score: 90, lobbyId: 'lobby1' },
    { id: 'player3', name: 'Charlie', score: 150, lobbyId: 'lobby2' },
    { id: 'player4', name: 'Diana', score: 80, lobbyId: 'lobby2' },
    { id: 'player5', name: 'Eve', score: 110, lobbyId: 'lobby3' },
    { id: 'player6', name: 'Frank', score: 130, lobbyId: 'lobby1' },
  ]);

  // States for Lobby functionality (simplified as they are now full pages)
  const [activeLobbies, setActiveLobbies] = useState([
    { id: 'lobby1', name: 'Forest Arena', currentPlayers: 3, maxPlayers: 8 },
    { id: 'lobby2', name: 'City Scrimmage', currentPlayers: 7, maxPlayers: 8 },
    { id: 'lobby3', name: 'Desert Storm', currentPlayers: 1, maxPlayers: 4 },
  ]);


  // WebSocket initialization and message handling
  useEffect(() => {
    // Initialize WebSocket connection
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connection opened.');
      setReadyState(WebSocket.OPEN);
    };

    ws.current.onmessage = (event) => {
      try {
        // This part was removed as per user request to remove chat functionality.
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed.');
      setReadyState(WebSocket.CLOSED);
    };

    ws.current.onerror = (event) => {
      console.error('WebSocket error:', event);
    };

    // Clean up WebSocket connection on component unmount
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  // Dynamic Tailwind CSS CDN injection
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.tailwindcss.com';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const connectionStatusMap = {
    [WebSocket.CONNECTING]: 'Connecting',
    [WebSocket.OPEN]: 'Open',
    [WebSocket.CLOSING]: 'Closing',
    [WebSocket.CLOSED]: 'Closed',
  };
  const connectionStatus = connectionStatusMap[readyState];


  // Game-related functions
  const goToGameOptions = () => {
    setCurrentPage('gameOptions');
  };

  const goToPlayerView = () => {
    setCurrentPage('player');
    setIsGameActive(true);
  };

  const goToSpectatorView = () => {
    setCurrentPage('spectatorLobbyList');
    setSelectedSpectatorLobbyId(null);
    setSelectedSpectatorPlayerId(null); // Ensure player ID is also cleared
  };

  const goToLandingPage = () => {
    setSelectedSpectatorPlayerId(null);
    setSelectedSpectatorLobbyId(null);
    setIsGameActive(false);
    setCurrentPage('landing');
    setPlayerScore(0);
  };

  const handlePlayerShoot = () => {
    if (isGameActive && currentPage === 'player') {
      setIsShooting(true);

      setTimeout(() => {
        setIsShooting(false);
        setIsHit(false);
      }, 200);
    }
  };

  const handleIncreaseScore = (increaseAmount) => {
    setPlayerScore(playerScore + 50);
  }

  // Modified viewPlayerCamera to navigate to the new SpectatorPlayerView
  const onViewSpectatorPlayerDetails = (playerId) => {
    setSelectedSpectatorPlayerId(playerId);
    setCurrentPage('spectatorPlayerDetail'); // New page state
  };

  const backToSpectatorLobbies = () => {
    setCurrentPage('spectatorLobbyList');
    setSelectedSpectatorPlayerId(null);
  };

  // Function to go back from SpectatorPlayerView to SpectatorView (lobby players list)
  const backToSpectatorPlayersInLobby = () => {
    setCurrentPage('spectator');
    setSelectedSpectatorPlayerId(null);
  };

  // Lobby-related navigation
  const onCreateLobby = () => {
    setCurrentPage('createLobby');
  };

  const onJoinLobby = () => {
    setCurrentPage('joinLobby');
  };

  const onCreateLobbyConfirm = (lobbyDetails) => {
    console.log("Creating lobby:", lobbyDetails);
    const newLobby = {
      id: `lobby${activeLobbies.length + 1}`,
      name: lobbyDetails.name,
      currentPlayers: 1,
      maxPlayers: lobbyDetails.maxPlayers,
    };
    setActiveLobbies(prev => [...prev, newLobby]);
    goToPlayerView();
  };

  const onJoinLobbyConfirm = (lobbyId) => {
    console.log("Joining lobby:", lobbyId);
    const updatedLobbies = activeLobbies.map(lobby =>
      lobby.id === lobbyId && lobby.currentPlayers < lobby.maxPlayers
        ? { ...lobby, currentPlayers: lobby.currentPlayers + 1 }
        : lobby
    );
    setActiveLobbies(updatedLobbies);
    goToPlayerView();
  };

  const onViewSpectatorLobby = (lobbyId) => {
    setSelectedSpectatorLobbyId(lobbyId);
    setCurrentPage('spectator');
  };


  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans text-gray-100 overflow-auto">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col items-center border-4 border-emerald-500 relative">
        {currentPage === 'landing' && (
          <LandingPage
            goToGameOptions={goToGameOptions}
            goToSpectatorView={goToSpectatorView}
          />
        )}
        {currentPage === 'gameOptions' && (
          <GameOptions
            onBack={goToLandingPage}
            onCreateLobby={onCreateLobby}
            onJoinLobby={onJoinLobby}
          />
        )}
        {currentPage === 'createLobby' && (
          <CreateLobby
            onBack={goToGameOptions}
            onCreateLobbyConfirm={onCreateLobbyConfirm}
          />
        )}
        {currentPage === 'joinLobby' && (
          <JoinLobby
            onBack={goToGameOptions}
            activeLobbies={activeLobbies}
            onJoinLobbyConfirm={onJoinLobbyConfirm}
          />
        )}
        {currentPage === 'spectatorLobbyList' && (
          <SpectatorLobbyList
            onBack={goToLandingPage}
            activeLobbies={activeLobbies}
            onViewLobby={onViewSpectatorLobby}
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
            onIncreaseScore={handleIncreaseScore}
          />
        )}
        {currentPage === 'spectator' && (
          <SpectatorView
            // goToLandingPage={goToLandingPage} // Consider if this should be back to lobbies instead
            selectedSpectatorLobbyId={selectedSpectatorLobbyId}
            onViewPlayerDetails={onViewSpectatorPlayerDetails} // Pass new handler
            backToSpectatorLobbies={backToSpectatorLobbies}
            spectatorPlayers={spectatorPlayers}
            activeLobbies={activeLobbies}
          />
        )}
        {currentPage === 'spectatorPlayerDetail' && ( // New conditional render for player detail
          <SpectatorPlayerView
            onBack={backToSpectatorPlayersInLobby} // Go back to the lobby's player list
            selectedPlayerId={selectedSpectatorPlayerId}
            spectatorPlayers={spectatorPlayers}
          />
        )}
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
