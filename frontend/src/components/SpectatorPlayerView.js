import React, { useState, useEffect, useRef } from 'react';

// CameraFeed component - Defined directly within SpectatorPlayerView.js for stability
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


function SpectatorPlayerView({ onBack, selectedPlayerId, spectatorPlayers }) {
  // Find the selected player from the spectatorPlayers array
  const player = spectatorPlayers.find(p => p.id === selectedPlayerId);

  // If no player is found, display a message
  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 rounded-lg shadow-2xl border-4 border-red-500 w-full max-w-md">
        <h2 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">
          Player Not Found
        </h2>
        <p className="text-lg text-gray-300 mb-8">The selected player could not be found.</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-700 text-white rounded-md shadow-md hover:bg-gray-600 transition duration-200"
        >
          &larr; Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      <button
        onClick={onBack}
        className="self-start mb-6 px-4 py-2 bg-gray-700 text-white rounded-md shadow-md hover:bg-gray-600 transition duration-200"
      >
        &larr; Back to Lobby Players
      </button>

      <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 text-center">
        Spectating: {player.name || `Player ${player.id.substring(player.id.length - 4)}`}
      </h2>

      <div className="bg-gray-700 p-6 rounded-lg shadow-xl w-full border border-gray-600">
        <div className="mb-6 bg-gray-800 px-6 py-3 rounded-full shadow-inner flex items-center justify-center border border-gray-700">
          <span className="text-xl sm:text-2xl font-bold text-teal-300 mr-2">Score:</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">{player.score}</span>
        </div>

        <p className="text-md text-gray-400 mb-4 text-center">
          (Note: This is your own camera feed, simulating the player's view.)
        </p>
        <CameraFeed showCrosshair={false} />
      </div>
    </div>
  );
}

export default SpectatorPlayerView;