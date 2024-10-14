import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
    public client: Client;
    private isConnected: boolean = false;

    constructor() {
        this.client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/chess'),
            onConnect: () => {
                console.log('Connected to WebSocket');
                this.isConnected = true; // Track connection status
                // Subscribe to the moveMade topic when connected
                this.client.subscribe('/topic/moveMade', (message) => {
                    console.log('Move received:', message.body);
                    // Notify listeners about the received move
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            },
        });
    }

    activate() {
        if (!this.isConnected) {
            this.client.activate(); // Activate the connection
        }
    }

    sendMove(move: string) {
        if (this.isConnected) {
            this.client.publish({
                destination: '/app/move',
                body: move,
            });
        } else {
            console.error('Cannot send move, not connected');
        }
    }

    disconnect() {
        this.client.deactivate();
        this.isConnected = false; // Update connection status
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;
