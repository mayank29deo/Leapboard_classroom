import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../services/socket';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (socket.connected) setConnected(true);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return { socket: socketRef.current || getSocket(), connected };
}
