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
    // Set up WebSocket connection
    // Using ws:// protocol for HTTP testing (non-secure)
    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    ws.current = new window.WebSocket(`${wsProtocol}${wsHost}`);

    ws.current.onopen = () => setWsStatus('open');
    ws.current.onclose = () => setWsStatus('closed');
    ws.current.onerror = () => setWsStatus('error');
    ws.current.onmessage = (event) => {
      console.log('WS received:', event.data); // ADDED LOG
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
