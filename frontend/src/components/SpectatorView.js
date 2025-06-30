import React, { useState, useEffect, useRef } from 'react';

// CameraFeed component - Defined directly within SpectatorView.js for stability
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


function SpectatorView({
  goToLandingPage,
  selectedSpectatorPlayerId,
  viewPlayerCamera,
  backToSpectatorScoreboard,
  spectatorPlayers,
}) {
  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      <button
        onClick={goToLandingPage}
        className="self-start mb-6 px-4 py-2 bg-gray-700 text-white rounded-md shadow-md hover:bg-gray-600 transition duration-200"
      >
        &larr; Back to Home
      </button>

      <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 text-center">
        Spectator View
      </h2>

      {selectedSpectatorPlayerId ? (
        <div className="w-full">
          <button
            onClick={backToSpectatorScoreboard}
            className="mb-4 px-4 py-2 bg-gray-700 text-white rounded-md shadow-md hover:bg-gray-600 transition duration-200"
          >
            &larr; Back to Scoreboard
          </button>
          <h3 className="text-2xl font-bold mb-4 text-gray-200">
            Viewing: {spectatorPlayers.find(p => p.id === selectedSpectatorPlayerId)?.name || 'Unknown Player'}
          </h3>
          <CameraFeed showCrosshair={false} />

          <p className="mt-4 text-sm text-gray-400 text-center">
            (Note: This is your own camera feed, simulating the player's view.)
          </p>
        </div>
      ) : (
        <div className="bg-gray-700 p-6 rounded-lg shadow-xl w-full">
          <h3 className="text-2xl font-bold mb-4 text-gray-200 border-b border-gray-600 pb-2">
            Live Scoreboard
          </h3>
          <p className="text-lg text-gray-300 mb-4">
            Active Players: <span className="font-bold text-yellow-300">{spectatorPlayers.length} / 8</span>
          </p>
          <ul className="space-y-3">
            {spectatorPlayers.length > 0 ? (
              spectatorPlayers
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <li
                    key={player.id}
                    onClick={() => viewPlayerCamera(player.id)}
                    className="flex justify-between items-center bg-gray-800 p-3 rounded-md shadow-inner border border-gray-600 cursor-pointer hover:bg-gray-600 transition duration-200 transform hover:scale-[1.02]"
                  >
                    <span className="text-lg font-semibold text-white">
                      {index + 1}. {player.name || `Player ${player.id.substring(player.id.length - 4)}`}
                    </span>
                    <span className="text-xl font-extrabold text-blue-400">{player.score}</span>
                  </li>
                ))
            ) : (
              <li className="text-center text-gray-400 py-4">No players active yet.</li>
            )}
          </ul>
        </div>
      )}

      {!selectedSpectatorPlayerId && (
        <p className="mt-8 text-sm text-gray-400 text-center">
          Watch the action unfold! Click on a player's name to view their simulated camera feed.
        </p>
      )}
    </div>
  );
}

export default SpectatorView;
