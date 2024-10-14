// src/pages/ChessGame.tsx

import React, { useEffect, useState } from 'react';
import ChessBoard from '../components/ChessBoard/ChessBoard';
import webSocketService from '../services/WebSocketService';

const ChessGame: React.FC = () => {
    const [moves, setMoves] = useState<string[]>([]);

    useEffect(() => {
        // Activate WebSocket connection
        webSocketService.activate();

        // Add a function to handle incoming moves
        const handleMoveReceived = (message: { body: string }) => {
            console.log('Move received:', message.body);
            setMoves((prevMoves) => [...prevMoves, message.body]);
        };

        // Subscribe to incoming moves when connected
        const onConnect = () => {
            webSocketService.client.subscribe('/topic/moveMade', handleMoveReceived);
        };

        webSocketService.client.onConnect = onConnect;

        // Cleanup function to unsubscribe and disconnect
        return () => {
            webSocketService.client.unsubscribe('/topic/moveMade');
            webSocketService.disconnect();
        };
    }, []);

    const handleMove = (move: string) => {
        webSocketService.sendMove(move);
        setMoves((prevMoves) => [...prevMoves, move]);
    };

    return (
        <div>
            <h1>Chess Game</h1>
            <ChessBoard handleMove={handleMove} />
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
