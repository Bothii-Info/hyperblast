import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HealthBar from '../components/HealthBar';
import Button from '../components/Button'; // We'll need the Button component for the menu
import { Zap, Crosshair, Timer, Menu, LogOut, Skull } from 'lucide-react';

/**
 * The redesigned main game view for the player.
 * Features a new HUD layout, a game menu with quit/suicide options, and hit indicator.
 */
const PlayerPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const ws = useRef(null);

  // --- Game State ---
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(300); // 5 minutes in seconds
  const [showHitIndicator, setShowHitIndicator] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // New state for the menu

  // --- Game Timer & WebSocket Logic ---
  useEffect(() => {
    // We only run the timer if the menu is closed
    let timerInterval;
    if (!isMenuOpen) {
      timerInterval = setInterval(() => {
        setGameTime(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerInterval);
            navigate(`/game/${gameId}/end`);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [gameId, navigate, isMenuOpen]); // Re-run effect when menu opens/closes

  useEffect(() => {
    // Camera and WebSocket setup (runs once)
    const enableCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { console.error("Camera Error:", err); alert("Could not access camera."); }
    };
    enableCamera();
    
    // ws.current = new WebSocket('ws://localhost:8080');
    // ... (WebSocket connection logic) ...

    return () => {
      // if (ws.current) ws.current.close();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty array ensures this runs only once

  // --- Event Handlers ---
  const handleShoot = () => {
    if (health <= 0 || isMenuOpen) return;
    // ... (shooting logic) ...
    setShowHitIndicator(true);
    setScore(s => s + 10);
  };

  const handleSuicide = () => {
    // --- BACKEND INTEGRATION ---
    // Send a message to the server that you've been eliminated
    // ws.current.send(JSON.stringify({ type: 'player_suicide' }));
    console.log("Player has committed suicide.");
    setHealth(0); // Set health to 0 to trigger the death overlay
    setIsMenuOpen(false);
  };

  const handleQuit = () => {
    // --- BACKEND INTEGRATION ---
    // Send a message to the server that you are leaving the game
    // ws.current.send(JSON.stringify({ type: 'player_quit' }));
    console.log("Player has quit the game.");
    navigate('/'); // Navigate back to the home page
  };

  // --- Other Effects ---
  useEffect(() => { if (showHitIndicator) { const t = setTimeout(() => setShowHitIndicator(false), 500); return () => clearTimeout(t); } }, [showHitIndicator]);
  useEffect(() => { if (health <= 0) { setTimeout(() => navigate(`/game/${gameId}/end`), 1500); } }, [health, gameId, navigate]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <video ref={videoRef} className={`h-full w-full object-cover ${isMenuOpen ? 'blur-sm' : ''}`} autoPlay playsInline muted />

      {/* --- Overlays --- */}
      {showHitIndicator && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"><h2 className="animate-ping-once text-5xl font-black text-white drop-shadow-lg">HIT</h2></div>}
      {health <= 0 && <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 text-red-500"><h1 className="text-6xl font-black">ELIMINATED</h1></div>}
      
      {/* --- Game Menu Modal --- */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-lg bg-gray-900 p-6 shadow-2xl">
            <h2 className="text-center text-2xl font-bold">Game Menu</h2>
            <Button onClick={() => setIsMenuOpen(false)}>Resume Game</Button>
            <Button onClick={handleSuicide} className="flex items-center justify-center gap-2 bg-yellow-700 hover:bg-yellow-600">
              <Skull size={20} /><span>Commit Suicide</span>
            </Button>
            <Button onClick={handleQuit} className="flex items-center justify-center gap-2 bg-red-800 hover:bg-red-700">
              <LogOut size={20} /><span>Quit to Main Menu</span>
            </Button>
          </div>
        </div>
      )}

      {/* --- Main HUD --- */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-black/50 p-2 backdrop-blur-sm"><Timer size={20} /><span className="text-xl font-bold">{formatTime(gameTime)}</span></div>
          <button onClick={() => setIsMenuOpen(true)} className="rounded-lg bg-black/50 p-2 backdrop-blur-sm"><Menu size={24} /></button>
          <div className="flex flex-col items-end rounded-lg bg-black/50 p-2 text-right backdrop-blur-sm"><span className="text-xs font-bold uppercase">Score</span><span className="text-2xl font-black">{score}</span></div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-xs"><HealthBar health={health} /></div>
          <button onClick={handleShoot} disabled={health <= 0 || isMenuOpen} className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/50 bg-red-600/80 text-white transition-transform active:scale-90 disabled:cursor-not-allowed disabled:bg-gray-700/80"><Crosshair size={48} /></button>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
