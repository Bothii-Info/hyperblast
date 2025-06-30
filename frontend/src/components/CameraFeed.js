import React, { useState, useEffect, useRef } from 'react';

function CameraFeed({ showCrosshair = false }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

export default CameraFeed;
