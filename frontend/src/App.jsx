import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import the pages we have already created
import LandingPage from './pages/LandingPage';
import SpectatorLobbyListPage from './pages/SpectatorLobbyListPage';
import SpectateGamePage from './pages/SpectateGamePage';

// Import for Player pages (we will create these files in the next steps)
import LobbyPage from './pages/LobbyPage';
import CreateLobbyPage from './pages/CreateLobbyPage';
import JoinLobbyPage from './pages/JoinLobbyPage';
import WaitlistPage from './pages/WaitlistPage';
import PlayerPage from './pages/PlayerPage';
import EndGamePage from './pages/EndGamePage';

/**
 * The root component of the application.
 * It sets up the router and defines the routes for each page.
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* --- Core Route --- */}
        <Route path="/" element={<LandingPage />} />

        {/* --- Spectator Routes --- */}
        <Route path="/spectate" element={<SpectatorLobbyListPage />} />
        <Route path="/spectate/:lobbyId" element={<SpectateGamePage />} />
        <Route path="/lobby" element={<LobbyPage />} /> 
        <Route path="/lobby/create" element={<CreateLobbyPage />} /> 
        <Route path="/lobby/join" element={<JoinLobbyPage />} />
       <Route path="/lobby/:lobbyId/waitlist" element={<WaitlistPage />} /> 
        <Route path="/game/:gameId" element={<PlayerPage />} />
        <Route path="/game/:gameId/end" element={<EndGamePage />} />

      </Routes>
    </Router>
  );
}

export default App;
