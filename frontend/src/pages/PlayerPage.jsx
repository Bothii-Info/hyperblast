import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const canvasRef = useRef(null); // For optional bounding box overlay
  const ws = useRef(null);

  // Detection model refs and state
  const modelRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const nextPersonIdRef = useRef(1);
  const trackedPeopleRef = useRef([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectedPeople, setDetectedPeople] = useState([]);

  // --- Game State ---
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(300); // 5 minutes in seconds
  const [showHitIndicator, setShowHitIndicator] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // New state for the menu
  const [gameStarting, setGameStarting] = useState(true);
  const [startCountdown, setStartCountdown] = useState(3); // 3 seconds instead of 30

  // --- Game Start Countdown ---
  useEffect(() => {
    if (gameStarting) {
      if (startCountdown > 0) {
        const timer = setTimeout(() => setStartCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameStarting(false);
      }
    }
  }, [gameStarting, startCountdown]);

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
    // WebSocket setup (runs once)
    ws.current = new WebSocket('ws://localhost:8080');
    ws.current.onopen = () => {
      // Optionally send join event
    };
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'hit' && data.shooter) {
          if (data.shooter === 'me') {
            setScore(data.newScore || (s => s + (data.points || 50)));
            setShowHitIndicator(true);
          }
        }
        if (data.type === 'score' && data.userId === 'me') {
          setScore(data.score);
        }
      } catch (e) {}
    };
    
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []); // Empty array ensures this runs only once

  // Load TensorFlow.js and COCO-SSD model
  useEffect(() => {
    async function loadModel() {
      try {
        if (!window.tf) {
          const tfScript = document.createElement('script');
          tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.2.0/dist/tf.min.js';
          document.head.appendChild(tfScript);
          await new Promise((resolve, reject) => {
            tfScript.onload = resolve;
            tfScript.onerror = () => reject(new Error('Failed to load TensorFlow.js'));
            setTimeout(() => reject(new Error('TensorFlow.js loading timeout')), 30000);
          });
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!window.cocoSsd) {
          const cocoScript = document.createElement('script');
          cocoScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js';
          document.head.appendChild(cocoScript);
          await new Promise((resolve, reject) => {
            cocoScript.onload = resolve;
            cocoScript.onerror = () => reject(new Error('Failed to load COCO-SSD'));
            setTimeout(() => reject(new Error('COCO-SSD loading timeout')), 30000);
          });
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        const model = await window.cocoSsd.load();
        modelRef.current = model;
        setIsModelLoaded(true);
      } catch (error) {
        setIsModelLoaded(false);
      }
    }
    loadModel();
  }, []);

  // Calculate distance between two bounding boxes
  const calculateDistance = useCallback((box1, box2) => {
    const centerX1 = box1[0] + box1[2] / 2;
    const centerY1 = box1[1] + box1[3] / 2;
    const centerX2 = box2[0] + box2[2] / 2;
    const centerY2 = box2[1] + box2[3] / 2;
    return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
  }, []);

  // Track people across frames
  const trackPeople = useCallback((newDetections) => {
    const maxDistance = 150;
    const updatedPeople = [];
    const usedIndices = new Set();
    trackedPeopleRef.current.forEach(trackedPerson => {
      let bestMatch = null;
      let bestDistance = Infinity;
      let bestIndex = -1;
      newDetections.forEach((detection, index) => {
        if (usedIndices.has(index)) return;
        const distance = calculateDistance(trackedPerson.bbox, detection.bbox);
        if (distance < bestDistance && distance < maxDistance) {
          bestDistance = distance;
          bestMatch = detection;
          bestIndex = index;
        }
      });
      if (bestMatch) {
        updatedPeople.push({
          ...trackedPerson,
          bbox: bestMatch.bbox,
          confidence: bestMatch.score,
          lastSeen: Date.now(),
          isVisible: true
        });
        usedIndices.add(bestIndex);
      } else {
        updatedPeople.push({
          ...trackedPerson,
          isVisible: false
        });
      }
    });
    newDetections.forEach((detection, index) => {
      if (usedIndices.has(index)) return;
      let matchedWithOldPerson = false;
      for (let i = 0; i < updatedPeople.length; i++) {
        const person = updatedPeople[i];
        if (!person.isVisible) {
          const timeSinceLastSeen = Date.now() - person.lastSeen;
          if (timeSinceLastSeen < 3000) {
            const distance = calculateDistance(person.bbox, detection.bbox);
            if (distance < 250) {
              updatedPeople[i] = {
                ...person,
                bbox: detection.bbox,
                confidence: detection.score,
                lastSeen: Date.now(),
                isVisible: true
              };
              usedIndices.add(index);
              matchedWithOldPerson = true;
              break;
            }
          }
        }
      }
      if (!matchedWithOldPerson) {
        updatedPeople.push({
          id: nextPersonIdRef.current++,
          bbox: detection.bbox,
          confidence: detection.score,
          lastSeen: Date.now(),
          isVisible: true
        });
        usedIndices.add(index);
      }
    });
    const currentTime = Date.now();
    const activePeople = updatedPeople.filter(person =>
      currentTime - person.lastSeen < 15000
    );
    trackedPeopleRef.current = activePeople;
    return activePeople.filter(person => person.isVisible);
  }, [calculateDistance]);

  // Detect people in the video frame
  const detectPeople = useCallback(async () => {
    if (!modelRef.current || !videoRef.current) return;
    try {
      const predictions = await modelRef.current.detect(videoRef.current);
      const peopleDetections = predictions
        .filter(prediction => prediction.class === 'person')
        .map(prediction => ({
          bbox: prediction.bbox,
          score: prediction.score
        }));
      const trackedPeople = trackPeople(peopleDetections);
      setDetectedPeople(trackedPeople);
    } catch (error) {}
  }, [trackPeople]);

  // Setup camera for the videoRef
  useEffect(() => {
    async function enableCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { console.error("Camera Error:", err); alert("Could not access camera."); }
    }
    enableCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Start detection when model is loaded and video is ready
  useEffect(() => {
    if (isModelLoaded && videoRef.current) {
      const startDetection = () => {
        detectionIntervalRef.current = setInterval(() => {
          detectPeople();
        }, 200);
      };
      if (videoRef.current.readyState >= 2) {
        startDetection();
      } else {
        videoRef.current.addEventListener('loadeddata', startDetection);
      }
    }
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isModelLoaded, detectPeople]);

  // Optional: Draw bounding boxes on a canvas overlay
  useEffect(() => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      detectedPeople.forEach(person => {
        const [x, y, width, height] = person.bbox;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';
        ctx.fillRect(x, y - 25, 80, 25);
        ctx.fillStyle = '#000000';
        ctx.fillText(`Person ${person.id}`, x + 5, y - 8);
      });
    }
  }, [detectedPeople]);

  // --- Event Handlers ---
  const handlePlayerHit = (personId) => {
    setShowHitIndicator('hit');
    if (ws.current && ws.current.readyState === 1) {
      ws.current.send(JSON.stringify({ type: 'hit', points: 50 }));
    }
    setScore(s => s + 50);
  };

  // Detect hit when shooting
  const handleShoot = () => {
    if (health <= 0 || isMenuOpen) return;
    // Check if a person is at the center of the video
    let hit = false;
    if (detectedPeople.length > 0) {
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      const centerX = videoWidth / 2;
      const centerY = videoHeight / 2;
      const hitPerson = detectedPeople.find(person => {
        const [x, y, width, height] = person.bbox;
        return centerX >= x && centerX <= (x + width) && centerY >= y && centerY <= (y + height);
      });
      if (hitPerson) {
        handlePlayerHit(hitPerson.id);
        hit = true;
      }
    }
    if (!hit) {
      setShowHitIndicator('miss');
    }
    if (ws.current && ws.current.readyState === 1) {
      ws.current.send(JSON.stringify({ type: 'shoot' }));
    }
  };

  // --- Other Effects ---
  useEffect(() => {
    if (showHitIndicator) {
      const t = setTimeout(() => setShowHitIndicator(false), 500);
      return () => clearTimeout(t);
    }
  }, [showHitIndicator]);
  useEffect(() => { if (health <= 0) { setTimeout(() => navigate(`/game/${gameId}/end`), 1500); } }, [health, gameId, navigate]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <video ref={videoRef} className={`h-full w-full object-cover ${isMenuOpen ? 'blur-sm' : ''}`} autoPlay playsInline muted />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{zIndex: 1}} />
      {/* --- Crosshair Overlay --- */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
        <div className="w-16 h-16 relative flex items-center justify-center">
          <div className="absolute left-1/2 top-0 w-0.5 h-4 bg-red-500" style={{transform: 'translateX(-50%)'}}></div>
          <div className="absolute left-1/2 bottom-0 w-0.5 h-4 bg-red-500" style={{transform: 'translateX(-50%)'}}></div>
          <div className="absolute top-1/2 left-0 h-0.5 w-4 bg-red-500" style={{transform: 'translateY(-50%)'}}></div>
          <div className="absolute top-1/2 right-0 h-0.5 w-4 bg-red-500" style={{transform: 'translateY(-50%)'}}></div>
          <div className="w-3 h-3 rounded-full border-2 border-red-500 bg-white/80"></div>
        </div>
      </div>
      {/* --- Overlays --- */}
      {gameStarting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70">
          <h2 className="text-5xl font-black text-white mb-4">Game Starting</h2>
          <div className="text-6xl font-extrabold text-emerald-400 animate-bounce-in">{startCountdown > 0 ? startCountdown : 'GO!'}</div>
        </div>
      )}
      {showHitIndicator === 'hit' && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"><h2 className="animate-ping-once text-5xl font-black text-white drop-shadow-lg">HIT</h2></div>}
      {showHitIndicator === 'miss' && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"><h2 className="animate-ping-once text-5xl font-black text-red-400 drop-shadow-lg">MISS</h2></div>}
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
          <div className="flex items-center gap-4">
            {/* Health bar moved to top right, left of score */}
            <div className="max-w-xs"><HealthBar health={health} /></div>
            <div className="flex flex-col items-end rounded-lg bg-black/50 p-2 text-right backdrop-blur-sm"><span className="text-xs font-bold uppercase">Score</span><span className="text-2xl font-black">{score}</span></div>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="rounded-lg bg-black/50 p-2 backdrop-blur-sm"><Menu size={24} /></button>
        </div>
        <div className="flex flex-col items-center gap-3">
          {/* Removed health bar from here */}
          <button onClick={handleShoot} disabled={health <= 0 || isMenuOpen || gameStarting} className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/50 bg-red-600/80 text-white transition-transform active:scale-90 disabled:cursor-not-allowed disabled:bg-gray-700/80"><Crosshair size={48} /></button>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
