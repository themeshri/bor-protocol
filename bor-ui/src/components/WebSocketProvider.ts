import WebSocket from 'isomorphic-ws';

// This ensures tmi.js uses the correct WebSocket implementation
(global as any).WebSocket = WebSocket;