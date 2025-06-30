import React, { useState, useEffect, useCallback } from 'react';
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

  return (
    <div style={{ padding: '20px' }}>
      <h1>React WebSocket Chat</h1>
      <CameraFeed />
      <p>Connection Status: {connectionStatus}</p>

      <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', marginBottom: '10px', padding: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender || 'Server'}:</strong> {msg.message || msg.text}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        placeholder="Type your message..."
        disabled={readyState !== ReadyState.OPEN}
        style={{ width: 'calc(100% - 80px)', marginRight: '10px', padding: '8px' }}
      />
      <button onClick={handleSendMessage} disabled={readyState !== ReadyState.OPEN}>
        Send
      </button>
    </div>
  );
}

export default App;