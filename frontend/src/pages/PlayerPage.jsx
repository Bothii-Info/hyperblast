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
  const resizeObserverRef = useRef(null);

  // Detection model refs and state
  const modelRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const nextPersonIdRef = useRef(1);
  const trackedPeopleRef = useRef([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectedPeople, setDetectedPeople] = useState([]);

  // Add MediaPipe Selfie Segmentation integration
  const selfieSegmentationRef = useRef(null);
  const [isSegmentationLoaded, setIsSegmentationLoaded] = useState(false);
  const [segmentationMask, setSegmentationMask] = useState(null);

  // --- Game State ---
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(300); // 5 minutes in seconds
  const [showHitIndicator, setShowHitIndicator] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // New state for the menu
  const [gameStarting, setGameStarting] = useState(false);
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

  // Load MediaPipe Selfie Segmentation
  useEffect(() => {
    const loadSegmentation = async () => {
      if (!window.SelfieSegmentation) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      if (window.SelfieSegmentation) {
        try {
          selfieSegmentationRef.current = new window.SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
          });
          selfieSegmentationRef.current.setOptions({
            modelSelection: 1,
            selfieMode: false // CHANGED: match camera, not mirrored
          });
          selfieSegmentationRef.current.onResults((results) => {
            setSegmentationMask(results.segmentationMask);
          });
          setIsSegmentationLoaded(true);
        } catch (err) {
          // eslint-disable-next-line no-alert
          alert('Failed to initialize MediaPipe SelfieSegmentation. Please check the library version and usage.');
        }
      } else {
        // eslint-disable-next-line no-alert
        alert('MediaPipe SelfieSegmentation library failed to load.');
      }
    };
    loadSegmentation();
  }, []);

  // Run segmentation on each frame
  useEffect(() => {
    let animationId;
    const runSegmentation = async () => {
      if (
        isSegmentationLoaded &&
        videoRef.current &&
        selfieSegmentationRef.current &&
        videoRef.current.videoWidth > 0 &&
        videoRef.current.videoHeight > 0
      ) {
        await selfieSegmentationRef.current.send({ image: videoRef.current });
      }
      animationId = requestAnimationFrame(runSegmentation);
    };
    if (isSegmentationLoaded) {
      runSegmentation();
    }
    return () => cancelAnimationFrame(animationId);
  }, [isSegmentationLoaded]);

  // Setup canvas sizing with ResizeObserver
  useEffect(() => {
    const setupCanvasSize = () => {
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        // Get the actual displayed size of the video element
        const rect = video.getBoundingClientRect();
        
        // Set canvas to match the video's display size exactly
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
    };

    // Initial setup
    setupCanvasSize();

    // Setup ResizeObserver to handle window resizing
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        setupCanvasSize();
      });
      
      if (videoRef.current) {
        resizeObserverRef.current.observe(videoRef.current);
      }
    }

    // Fallback for older browsers
    const handleResize = () => setupCanvasSize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Draw segmentation mask with proper video cropping handling
  useEffect(() => {
    if (canvasRef.current && videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;
      
      // Get video element's display dimensions
      const videoRect = video.getBoundingClientRect();
      
      // Calculate how the video is actually displayed with object-cover
      const videoAspect = video.videoWidth / video.videoHeight;
      const displayAspect = videoRect.width / videoRect.height;
      
      let sourceX = 0, sourceY = 0, sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
      let destX = 0, destY = 0, destWidth = canvas.width, destHeight = canvas.height;
      
      // Handle object-cover cropping behavior
      if (displayAspect > videoAspect) {
        // Display is wider than video - crop top/bottom of video
        const newHeight = video.videoWidth / displayAspect;
        sourceY = (video.videoHeight - newHeight) / 2;
        sourceHeight = newHeight;
      } else {
        // Display is taller than video - crop left/right of video  
        const newWidth = video.videoHeight * displayAspect;
        sourceX = (video.videoWidth - newWidth) / 2;
        sourceWidth = newWidth;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (segmentationMask) {
        ctx.save();
        
        // Create properly sized temporary canvas for the mask
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // Draw cropped segmentation mask to match video display
        tempCtx.drawImage(
          segmentationMask,
          sourceX, sourceY, sourceWidth, sourceHeight,  // Source crop area
          0, 0, canvas.width, canvas.height  // Destination full canvas
        );
        
        // Draw cropped video frame
        ctx.drawImage(
          video,
          sourceX, sourceY, sourceWidth, sourceHeight,  // Source crop area  
          destX, destY, destWidth, destHeight  // Destination full canvas
        );
        
        // Apply mask
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(tempCanvas, 0, 0);
        
        // Add green overlay
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(0,255,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.restore();
        
        // Draw person labels with proper coordinate transformation
        if (detectedPeople && detectedPeople.length > 0) {
          detectedPeople.forEach(person => {
            const [x, y, width, height] = person.bbox;
            
            // Transform bounding box coordinates to match the cropped/scaled display
            const scaleX = canvas.width / sourceWidth;
            const scaleY = canvas.height / sourceHeight;
            const labelX = (x - sourceX) * scaleX + width * scaleX / 2;
            const labelY = (y - sourceY) * scaleY - 10;
            
            // Only draw labels for people visible in the cropped area
            if (labelX >= 0 && labelX <= canvas.width && labelY >= -30 && labelY <= canvas.height) {
              ctx.fillStyle = '#00ff00';
              ctx.font = '20px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(`Person ${person.id}`, labelX, labelY);
            }
          });
        }
      } else if (detectedPeople && detectedPeople.length > 0) {
        // Fallback: draw properly scaled bounding boxes
        detectedPeople.forEach(person => {
          const [x, y, width, height] = person.bbox;
          
          // Transform coordinates to match cropped display
          const scaleX = canvas.width / sourceWidth;
          const scaleY = canvas.height / sourceHeight;
          
          const scaledX = (x - sourceX) * scaleX;
          const scaledY = (y - sourceY) * scaleY;
          const scaledWidth = width * scaleX;
          const scaledHeight = height * scaleY;
          
          // Only draw boxes for people visible in the cropped area
          if (scaledX + scaledWidth >= 0 && scaledX <= canvas.width && 
              scaledY + scaledHeight >= 0 && scaledY <= canvas.height) {
            
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
            ctx.fillStyle = '#00ff00';
            ctx.font = '16px Arial';
            ctx.fillRect(scaledX, scaledY - 25, 80, 25);
            ctx.fillStyle = '#000000';
            ctx.fillText(`Person ${person.id}`, scaledX + 5, scaledY - 8);
          }
        });
      }
    }
  }, [detectedPeople, segmentationMask]);

  // --- Event Handlers ---
  const handlePlayerHit = (personId) => {
    setShowHitIndicator('hit');
    setScore(s => {
      const newScore = s + 50;
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(JSON.stringify({ type: 'score', score: newScore }));
      }
      return newScore;
    });
  };

  // Updated hit detection with proper coordinate transformation
  const handleShoot = () => {
    if (health <= 0 || isMenuOpen) return;
    let hit = false;

    if (segmentationMask && detectedPeople.length > 0 && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const videoRect = video.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      // Calculate the center of the canvas (crosshair position in display coordinates)
      const displayCenterX = canvasRect.left + canvasRect.width / 2;
      const displayCenterY = canvasRect.top + canvasRect.height / 2;
      // Map display center to video coordinates, considering cropping/scaling
      const videoAspect = video.videoWidth / video.videoHeight;
      const displayAspect = canvasRect.width / canvasRect.height;
      let sourceX = 0, sourceY = 0, sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
      if (displayAspect > videoAspect) {
        const newHeight = video.videoWidth / displayAspect;
        sourceY = (video.videoHeight - newHeight) / 2;
        sourceHeight = newHeight;
      } else {
        const newWidth = video.videoHeight * displayAspect;
        sourceX = (video.videoWidth - newWidth) / 2;
        sourceWidth = newWidth;
      }
      // Calculate the relative position of the crosshair in the canvas
      const relX = (displayCenterX - canvasRect.left) / canvasRect.width;
      const relY = (displayCenterY - canvasRect.top) / canvasRect.height;
      // Map to video coordinates (cropped area)
      const videoX = sourceX + relX * sourceWidth;
      const videoY = sourceY + relY * sourceHeight;
      // Get segmentation mask pixel data at mapped point
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(segmentationMask, 0, 0, video.videoWidth, video.videoHeight);
      const maskData = tempCtx.getImageData(Math.floor(videoX), Math.floor(videoY), 1, 1).data;
      // Check if mapped point is on a person in the segmentation mask
      if (maskData[3] > 128 && (maskData[0] > 128 || maskData[1] > 128 || maskData[2] > 128)) {
        // Find the closest detected person to the mapped point
        let minDist = Infinity;
        let hitPerson = null;
        detectedPeople.forEach(person => {
          const [x, y, width, height] = person.bbox;
          const px = x + width / 2;
          const py = y + height / 2;
          const dist = Math.sqrt(Math.pow(videoX - px, 2) + Math.pow(videoY - py, 2));
          if (dist < minDist) {
            minDist = dist;
            hitPerson = person;
          }
        });
        if (hitPerson) {
          handlePlayerHit(hitPerson.id);
          hit = true;
        }
      }
    } else if (detectedPeople.length > 0 && videoRef.current) {
      // Fallback: old logic if no segmentation
      const video = videoRef.current;
      const videoRect = video.getBoundingClientRect();
      const videoAspect = video.videoWidth / video.videoHeight;
      const displayAspect = videoRect.width / videoRect.height;
      let sourceX = 0, sourceY = 0, sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
      if (displayAspect > videoAspect) {
        const newHeight = video.videoWidth / displayAspect;
        sourceY = (video.videoHeight - newHeight) / 2;
        sourceHeight = newHeight;
      } else {
        const newWidth = video.videoHeight * displayAspect;
        sourceX = (video.videoWidth - newWidth) / 2;
        sourceWidth = newWidth;
      }
      const centerX = sourceX + sourceWidth / 2;
      const centerY = sourceY + sourceHeight / 2;
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

  const handleSuicide = () => {
    setHealth(0);
    setIsMenuOpen(false);
  };

  const handleQuit = () => {
    navigate('/');
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
            {/* Health bar moved to top right, left of score 
            <div className="max-w-xs"><HealthBar health={health} /></div>*/}
            <div className="flex flex-col items-end rounded-lg bg-black/50 p-2 text-right backdrop-blur-sm"><span className="text-xs font-bold uppercase">Score</span><span className="text-2xl font-black">{score}</span></div>
            
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="rounded-lg bg-black/50 p-2 backdrop-blur-sm"><Menu size={24} /></button>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button onClick={handleShoot} disabled={health <= 0 || isMenuOpen || gameStarting} className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/50 bg-red-600/80 text-white transition-transform active:scale-90 disabled:cursor-not-allowed disabled:bg-gray-700/80"><Crosshair size={48} /></button>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
