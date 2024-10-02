import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8080';
const socket = io(SOCKET_URL);

export const connectWebSocket = () => {
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });
};

export const sendMove = (move: string) => {
  socket.emit('move', { move });
};

export const onMoveReceived = (callback: (move: string) => void) => {
  socket.on('move', callback);
};

export const disconnectWebSocket = () => {
  socket.disconnect();
};
