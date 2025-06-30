import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Tesseract from 'tesseract.js';

const CameraFeed = forwardRef(({ showCrosshair = false }, ref) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);

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

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden border-4 border-yellow-500 mb-6 relative aspect-video flex items-center justify-center">
      <video
        ref={videoRef}
        className={`w-full h-full object-cover rounded-md ${!stream ? 'hidden' : ''}`}
        autoPlay
        playsInline
        muted
      ></video>
      {/* Hidden canvas for OCR snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
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
      {isDetecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-30">
          <span className="text-white text-lg font-bold">Detecting number...</span>
        </div>
      )}
    </div>
  );
});

export default CameraFeed;
