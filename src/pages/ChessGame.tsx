// src/pages/ChessGame.tsx

import React, { useEffect, useState } from 'react';
import ChessBoard from '../components/ChessBoard/ChessBoard';
import { sendMove, onMoveReceived, connectWebSocket, disconnectWebSocket } from '../services/WebSocketService';

const ChessGame: React.FC = () => {
  const [moves, setMoves] = useState<string[]>([]);

  useEffect(() => {
    // Connect WebSocket when the component mounts
    connectWebSocket();

    // Listen for incoming moves
    onMoveReceived((move) => {
      setMoves((prevMoves) => [...prevMoves, move]);
    });

    // Cleanup WebSocket connection on unmount
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const handleMove = (move: string) => {
    sendMove(move);
    setMoves((prevMoves) => [...prevMoves, move]);
  };

  return (
    <div>
      <h1>Chess Game</h1>
      <ChessBoard  />
      <div>
        <h2>Moves History:</h2>
        <ul>
          {moves.map((move, index) => (
            <li key={index}>{move}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChessGame;
