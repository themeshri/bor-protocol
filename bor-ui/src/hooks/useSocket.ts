import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { SOCKET_EVENTS } from '../utils/socketEvents';

let socketInstance: Socket | null = null; // Single socket instance outside the hook

export const useSocket = () => {
  const [peerCount, setPeerCount] = useState(0);
  const [isServerOnline, setIsServerOnline] = useState(true);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        reconnectionDelay: 1000,
        reconnection: true,
        reconnectionAttempts: 10,
        transports: ['websocket'],
        agent: false,
        upgrade: false,
        rejectUnauthorized: false
      });
    }

    const socket = socketInstance;

    socket.on(SOCKET_EVENTS.CONNECTION, () => {
      // console.log('Connected to server');
      setIsServerOnline(true);
      socket.emit(SOCKET_EVENTS.REQUEST_PEER_COUNT);
    });

    socket.on(SOCKET_EVENTS.INITIAL_STATE, (data: { peerCount: number }) => {
      setPeerCount(data.peerCount);
    });

    socket.on(SOCKET_EVENTS.PEER_COUNT, (data: { count: number }) => {
      setPeerCount(data.count);
    });

    return () => {
      // Don't disconnect on cleanup, just remove listeners
      socket.off(SOCKET_EVENTS.CONNECTION);
      socket.off(SOCKET_EVENTS.INITIAL_STATE);
      socket.off(SOCKET_EVENTS.PEER_COUNT);
    };
  }, []);

  return {
    socket: socketInstance,
    peerCount,
    isServerOnline,
    emit: (event: string, data: any) => socketInstance?.emit(event, data)
  };
};

