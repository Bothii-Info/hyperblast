import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import Tesseract from 'tesseract.js';

const CameraFeed = forwardRef(({ showCrosshair = false, onPeopleDetected }, ref) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const nextPersonIdRef = useRef(1);
  const trackedPeopleRef = useRef([]);

  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectedPeople, setDetectedPeople] = useState([]);

  // Load TensorFlow.js and COCO-SSD model
  useEffect(() => {
    async function loadModel() {
      try {
        console.log('Starting to load TensorFlow.js and COCO-SSD...');

        // Load TensorFlow.js
        if (!window.tf) {
          console.log('Loading TensorFlow.js...');
          const tfScript = document.createElement('script');
          tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.2.0/dist/tf.min.js';
          document.head.appendChild(tfScript);

          await new Promise((resolve, reject) => {
            tfScript.onload = resolve;
            tfScript.onerror = () => reject(new Error('Failed to load TensorFlow.js'));
            setTimeout(() => reject(new Error('TensorFlow.js loading timeout')), 30000);
          });
          console.log('TensorFlow.js loaded successfully');
        }

        // Wait a bit for TensorFlow to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Load COCO-SSD model
        if (!window.cocoSsd) {
          console.log('Loading COCO-SSD model...');
          const cocoScript = document.createElement('script');
          cocoScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js';
          document.head.appendChild(cocoScript);

          await new Promise((resolve, reject) => {
            cocoScript.onload = resolve;
            cocoScript.onerror = () => reject(new Error('Failed to load COCO-SSD'));
            setTimeout(() => reject(new Error('COCO-SSD loading timeout')), 30000);
          });
          console.log('COCO-SSD script loaded successfully');
        }

        // Wait a bit more for the library to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Initialize the model
        console.log('Initializing COCO-SSD model...');
        const model = await window.cocoSsd.load();
        modelRef.current = model;
        setIsModelLoaded(true);
        console.log('Person detection model loaded and ready!');
      } catch (error) {
        console.error('Failed to load person detection model:', error);
        // Try alternative approach with MediaPipe or basic detection
        console.log('Trying fallback detection method...');
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
    const maxDistance = 150; // Increased maximum distance for matching
    const updatedPeople = [];
    const usedIndices = new Set();

    // Try to match new detections with existing tracked people
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
        // Person found - update their info
        updatedPeople.push({
          ...trackedPerson,
          bbox: bestMatch.bbox,
          confidence: bestMatch.score,
          lastSeen: Date.now(),
          isVisible: true
        });
        usedIndices.add(bestIndex);
      } else {
        // Person not found - keep them as invisible but don't remove immediately
        updatedPeople.push({
          ...trackedPerson,
          isVisible: false
        });
      }
    });

    // For unmatched detections, try to match with recently disappeared people first
    newDetections.forEach((detection, index) => {
      if (usedIndices.has(index)) return;

      // Check if this could be a recently disappeared person
      let matchedWithOldPerson = false;

      // Look for people who disappeared recently but might be the same person
      for (let i = 0; i < updatedPeople.length; i++) {
        const person = updatedPeople[i];
        if (!person.isVisible) {
          // Use a more lenient matching for people who just disappeared
          const timeSinceLastSeen = Date.now() - person.lastSeen;
          if (timeSinceLastSeen < 3000) { // Within 3 seconds
            // Check if the new detection could be this person
            // Use a larger distance threshold for recently disappeared people
            const distance = calculateDistance(person.bbox, detection.bbox);
            if (distance < 250) { // More lenient distance for re-entry
              // This is likely the same person coming back
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

      // If no match with old person, create new person
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

    // Only remove people who haven't been seen for a longer time (15 seconds)
    const currentTime = Date.now();
    const activePeople = updatedPeople.filter(person =>
      currentTime - person.lastSeen < 15000
    );

    trackedPeopleRef.current = activePeople;

    // Return only visible people for display
    return activePeople.filter(person => person.isVisible);
  }, [calculateDistance]);

  // Detect people in the video frame
  const detectPeople = useCallback(async () => {
    if (!modelRef.current || !videoRef.current) return;

    try {
      const predictions = await modelRef.current.detect(videoRef.current);

      // Filter for people only
      const peopleDetections = predictions
        .filter(prediction => prediction.class === 'person')
        .map(prediction => ({
          bbox: prediction.bbox,
          score: prediction.score
        }));

      // Track people and maintain IDs
      const trackedPeople = trackPeople(peopleDetections);
      setDetectedPeople(trackedPeople);

      // Notify parent component
      if (onPeopleDetected) {
        onPeopleDetected(trackedPeople);
      }

    } catch (error) {
      console.error('Error during person detection:', error);
    }
  }, [trackPeople, onPeopleDetected]);


  useEffect(() => {
    async function setupCamera() {
      setIsLoading(true);
      setError(null);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
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
  }, [stream]); // Check this first if broken

  // Start detection when model is loaded and video is ready
  useEffect(() => {
    if (isModelLoaded && videoRef.current) {
      const startDetection = () => {
        detectionIntervalRef.current = setInterval(() => {
          detectPeople();
        }, 200); // Detect every 200ms
      };

      // Wait for video to be ready
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

  // Draw bounding boxes on canvas
  useEffect(() => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw bounding boxes for detected people
      detectedPeople.forEach(person => {
        const [x, y, width, height] = person.bbox;

        // Draw bounding box
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw person ID label
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';
        ctx.fillRect(x, y - 25, 80, 25);
        ctx.fillStyle = '#000000';
        ctx.fillText(`Person ${person.id}`, x + 5, y - 8);
      });
    }
  }, [detectedPeople]);

  // Expose detectNumberAtCenter to parent
  useImperativeHandle(ref, () => ({
    detectNumberAtCenter: async () => {
      if (!videoRef.current) return;
      setIsDetecting(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Set canvas size to a small square at the center
      const size = Math.floor(Math.min(video.videoWidth, video.videoHeight) * 0.25) || 100;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      // Center coordinates
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
      // Run OCR
      try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
          tessedit_char_whitelist: '0123456789',
        });
        // Extract first number found
        const match = text.match(/\d+/);
        if (match) {
          console.log('Detected number at center:', match[0]);
        } else {
          console.log('No number detected at center.');
        }
      } catch (err) {
        console.error('Tesseract OCR error:', err);
      }
      setIsDetecting(false);
    }
  }));

  // return (
  //   <div className="w-full bg-black rounded-lg overflow-hidden border-4 border-yellow-500 mb-6 relative aspect-video flex items-center justify-center">
  //     <video
  //       ref={videoRef}
  //       className={`w-full h-full object-cover rounded-md ${!stream ? 'hidden' : ''}`}
  //       autoPlay
  //       playsInline
  //       muted
  //     ></video>
  //     {/* Hidden canvas for OCR snapshot */}
  //     <canvas ref={canvasRef} style={{ display: 'none' }} />
  //     {isLoading && (
  //       <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-700 bg-opacity-75 z-10 rounded-lg p-4">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500 mb-3"></div>
  //         <p className="text-xl font-semibold text-white">Loading camera...</p>
  //       </div>
  //     )}
  //     {error && (
  //       <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-800 bg-opacity-85 z-10 rounded-lg p-4 text-center">
  //         <p className="text-white text-lg font-bold mb-2">Camera Error!</p>
  //         <p className="text-white text-md">{error}</p>
  //       </div>
  //     )}
  //     {!stream && !error && !isLoading && (
  //       <div className="absolute inset-0 flex items-center justify-center bg-gray-700 bg-opacity-75 z-10 rounded-lg">
  //         <p className="text-white text-xl">Waiting for camera access...</p>
  //       </div>
  //     )}
  //     {showCrosshair && stream && !error && (
  //       <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
  //         <div className="w-12 h-12 border-2 border-red-500 rounded-full flex items-center justify-center relative">
  //           <div className="w-2 h-2 bg-red-500 rounded-full"></div>
  //           <div className="absolute w-full h-0.5 bg-red-500"></div>
  //           <div className="absolute h-full w-0.5 bg-red-500"></div>
  //         </div>
  //       </div>
  //     )}
  //     {isDetecting && (
  //       <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-30">
  //         <span className="text-white text-lg font-bold">Detecting number...</span>
  //       </div>
  //     )}
  //   </div>
  // );
  return (
    <div className="camera-feed">
      <h2>Camera Feed</h2>
      <p>Model Status: {isModelLoaded ? '✅ Loaded' : '⏳ Loading...'}</p>
      <p>People Detected: {detectedPeople.length}</p>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            maxWidth: '640px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            maxWidth: '640px',
            pointerEvents: 'none'
          }}
        />
      </div>

      {(detectedPeople.length > 0 || trackedPeopleRef.current.length > 0) && (
        <div style={{ marginTop: '10px' }}>
          <h4>People Tracking Status:</h4>
          <div style={{ fontSize: '14px' }}>
            <strong>Visible:</strong> {detectedPeople.length} |
            <strong> Total Tracked:</strong> {trackedPeopleRef.current.length}
          </div>
          <ul style={{ marginTop: '5px' }}>
            {trackedPeopleRef.current.map(person => (
              <li key={person.id} style={{
                color: person.isVisible ? '#000' : '#666',
                fontStyle: person.isVisible ? 'normal' : 'italic'
              }}>
                Person {person.id} -
                {person.isVisible ? (
                  <span> Confidence: {(person.confidence * 100).toFixed(1)}% ✅</span>
                ) : (
                  <span> Out of frame 👻</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

export default CameraFeed;
