import React, { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import CameraFeed from './components/CameraFeed';

function App() {
  const WS_URL = 'ws://localhost:8080';

  const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => console.log('WebSocket connection opened.'),
    onClose: () => console.log('WebSocket connection closed.'),
    onError: (event) => console.error('WebSocket error:', event),
    shouldReconnect: (closeEvent) => true, 
    reconnectInterval: 3000, 
  });

  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentPeople, setCurrentPeople] = useState([]);
  const lastDetectionUpdateRef = useRef(null);

  // Effect to handle incoming messages
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const parsedMessage = JSON.parse(lastMessage.data);
        setMessages((prevMessages) => [...prevMessages, parsedMessage]);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    }
  }, [lastMessage]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  const handleSendMessage = useCallback(() => {
    if (messageInput.trim() && readyState === ReadyState.OPEN) {
      sendMessage(JSON.stringify({ text: messageInput }));
      setMessageInput(''); // Clear input after sending
    }
  }, [messageInput, sendMessage, readyState]);

  // Handle person detection updates
  const handlePeopleDetected = useCallback((people) => {
    setCurrentPeople(people);
    
    // Send person detection updates to WebSocket
    if (people.length > 0 && readyState === ReadyState.OPEN) {
      const now = Date.now();
      
      // Only send updates every 3 seconds to avoid spam
      if (!lastDetectionUpdateRef.current || now - lastDetectionUpdateRef.current > 3000) {
        const detectionData = {
          type: 'person_detection',
          count: people.length,
          people: people.map(person => ({
            id: person.id,
            confidence: person.confidence,
            bbox: person.bbox
          })),
          timestamp: new Date().toISOString()
        };
        
        sendMessage(JSON.stringify(detectionData));
        lastDetectionUpdateRef.current = now;
        
        // Also add to local messages for display
        const detectionMessage = {
          sender: 'System',
          message: `Detected ${people.length} person(s): ${people.map(p => `Person ${p.id}`).join(', ')}`,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setMessages(prev => [...prev, detectionMessage]);
      }
    } else if (people.length === 0 && currentPeople.length > 0) {
      // Send message when no people are detected (after having people)
      if (readyState === ReadyState.OPEN) {
        const noPeopleData = {
          type: 'person_detection',
          count: 0,
          people: [],
          timestamp: new Date().toISOString()
        };
        
        sendMessage(JSON.stringify(noPeopleData));
        
        const noPeopleMessage = {
          sender: 'System',
          message: 'No people detected in frame',
          timestamp: new Date().toLocaleTimeString()
        };
        
        setMessages(prev => [...prev, noPeopleMessage]);
      }
    }
  }, [readyState, sendMessage, currentPeople]);

  // Add keyboard support for sending messages
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>React WebSocket Chat with Person Detection</h1>
      
      <CameraFeed onPeopleDetected={handlePeopleDetected} />
      
      <p>Connection Status: {connectionStatus}</p>

      {/* Current Detection Status */}
      <div style={{ 
        marginBottom: '10px', 
        padding: '10px', 
        backgroundColor: '#f0f8ff', 
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Live Detection Status:</h4>
        <p style={{ margin: '5px 0' }}>
          <strong>People in frame:</strong> {currentPeople.length}
        </p>
        {currentPeople.length > 0 && (
          <div>
            {currentPeople.map(person => (
              <div key={person.id} style={{ margin: '3px 0' }}>
                👤 Person {person.id} - Confidence: {(person.confidence * 100).toFixed(1)}%
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ 
        border: '1px solid #ccc', 
        height: '300px', 
        overflowY: 'scroll', 
        marginBottom: '10px', 
        padding: '10px',
        backgroundColor: '#fafafa'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <strong>{msg.sender || 'Server'}:</strong> {msg.message || msg.text}
            {msg.timestamp && (
              <span style={{ color: '#666', fontSize: '12px', marginLeft: '10px' }}>
                {msg.timestamp}
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={readyState !== ReadyState.OPEN}
          style={{ 
            flex: 1, 
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={readyState !== ReadyState.OPEN}
          style={{
            padding: '8px 16px',
            backgroundColor: readyState === ReadyState.OPEN ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: readyState === ReadyState.OPEN ? 'pointer' : 'not-allowed'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;