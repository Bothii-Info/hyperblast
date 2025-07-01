import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const WebSocketContext = createContext(null);

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }) {
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connecting', 'open', 'closed', 'error'
  const ws = useRef(null);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    ws.current = new window.WebSocket('ws://localhost:8080');

    ws.current.onopen = () => setWsStatus('open');
    ws.current.onclose = () => setWsStatus('closed');
    ws.current.onerror = () => setWsStatus('error');
    ws.current.onmessage = (event) => {
      setLastMessage(event.data);
      // Store userId from welcome message
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'welcome' && msg.userId) {
          localStorage.setItem('userId', msg.userId);
        }
      } catch (e) {
        // Ignore parse errors for non-JSON messages
      }
    };

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  // Send a message helper
  const sendMessage = (msgObj) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msgObj));
    }
  };

  return (
    <WebSocketContext.Provider value={{ ws, wsStatus, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}
