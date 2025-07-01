import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { Users, Signal } from 'lucide-react';
import { useWebSocket } from '../WebSocketContext';

// --- DUMMY DATA ---
// In a real application, you would fetch this data from your backend.
const dummyLobbies = [
  { id: 'lobby-alpha-123', name: "Rooftop Rumble", players: 5, maxPlayers: 10, status: 'In Progress' },
  { id: 'lobby-beta-456', name: "Office Warfare", players: 8, maxPlayers: 8, status: 'In Progress' },
  { id: 'lobby-gamma-789', name: "Midnight Mayhem", players: 3, maxPlayers: 12, status: 'Waiting' },
];

/**
 * Page to display a list of active game lobbies for spectators.
 */
const SpectatorLobbyListPage = () => {
  const [lobbies, setLobbies] = useState([]);
  const navigate = useNavigate();
  const { sendMessage, lastMessage, wsStatus } = useWebSocket();

  useEffect(() => {
    if (wsStatus === 'open') {
      sendMessage({ type: 'show_lobbies' });
    }
  }, [wsStatus, sendMessage]);

  useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = JSON.parse(lastMessage);
      console.log(msg);
      if (msg.type === 'lobby_list' && Array.isArray(msg.lobbies)) {
        // Map backend lobby format to frontend format
        setLobbies(msg.lobbies.map(lobby => ({
          id: lobby.code,
          name: lobby.name || 'Unnamed Lobby',
          players: lobby.playerCount,
          maxPlayers: lobby.maxPlayers || 8,
          status: lobby.playerCount >= (lobby.maxPlayers || 8) ? 'Full' : 'Waiting',
        })));
      }
    } catch (e) {}
  }, [lastMessage]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header title="Spectate a Game" showBackButton />
      <main className="flex-grow p-4 sm:p-6">
        <h2 className="mb-6 text-3xl font-bold">Active Lobbies</h2>
        <div className="space-y-4">
          {lobbies.length > 0 ? (
            lobbies.map(lobby => (
              <div key={lobby.id} className="rounded-lg bg-white/5 p-4 shadow-lg transition-transform hover:scale-[1.02] hover:bg-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-4 sm:mb-0">
                    <h3 className="text-xl font-semibold text-indigo-400">{lobby.name}</h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Users size={16} /> {lobby.players}/{lobby.maxPlayers}</span>
                      <span className="flex items-center gap-1"><Signal size={16} /> {lobby.status}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/spectate/${lobby.id}`)}
                    className="w-full sm:w-auto"
                  >
                    Spectate
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">No active lobbies found.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default SpectatorLobbyListPage;
