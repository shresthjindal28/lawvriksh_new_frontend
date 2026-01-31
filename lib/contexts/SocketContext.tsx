'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from 'react';

// Define the shape of the context
interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (data: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
  on: () => {},
  off: () => {},
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const connectWebSocketRef = useRef<() => void>(() => {});
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  const connectWebSocket = useCallback(() => {
    // Don't connect if we already have an active connection
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Use environment variable for socket URL
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_API_BASE_URL environment variable is not set');
      return;
    }
    // Convert http:// to ws:// and https:// to wss://, remove trailing slash
    let wsUrl = baseUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/api/ai/ws';

    // Get user_id from localStorage (set during login)
    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;

    let accessToken: string | null = null;

    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith('ws_access_token=')) {
          accessToken = trimmed.substring('ws_access_token='.length);
          break;
        }
      }
    }

    if (userId && accessToken) {
      wsUrl += `?user_id=${userId}`;
    } else {
      console.warn(
        'Missing user_id or ws_access_token cookie. WebSocket connection may be rejected.'
      );
      if (!userId) console.warn('Reason: No user_id found');
      if (!accessToken) console.warn('Reason: No ws_access_token cookie found');
      return;
    }

    console.log(`Initializing WebSocket connection to ${wsUrl}`);

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        socketRef.current = null;
        setSocket(null);

        const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;

        if (event.code === 1008) {
          console.error(
            'WebSocket closed with policy violation (1008). Authentication failed or token is invalid. Not attempting to reconnect.'
          );
          return;
        }

        if (userId && event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocketRef.current();
          }, reconnectDelay * reconnectAttemptsRef.current);
        } else if (event.code !== 1000) {
          console.error('Max reconnection attempts reached or no user_id available');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const eventType = message.event || message.type || 'message';

          // Dispatch to registered event handlers
          const handlers = eventHandlersRef.current.get(eventType);
          if (handlers) {
            handlers.forEach((handler) => handler(message.data || message));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      setSocket(ws);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnected(false);
    }
  }, []);

  // Keep the ref updated with the latest function
  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;
  }, [connectWebSocket]);

  useEffect(() => {
    // Only connect if we have a user_id
    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    if (userId) {
      queueMicrotask(() => connectWebSocket());
    } else {
      console.log('No user_id available, skipping WebSocket connection');
    }

    return () => {
      console.log('Cleaning up WebSocket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
        socketRef.current = null;
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, []);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)!.add(handler);
  }, []);

  const off = useCallback((event: string, handler: (data: any) => void) => {
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, sendMessage, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};
