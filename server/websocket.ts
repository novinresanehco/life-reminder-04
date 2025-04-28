import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WSMessage } from '@shared/types';

interface ConnectedClient {
  userId: number;
  socket: WebSocket;
  sessionId: string;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private wss: WebSocketServer | null = null;
  private clients: Map<number, ConnectedClient[]> = new Map();
  
  private constructor() {
    // Private constructor for singleton
  }
  
  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }
  
  public initialize(server: Server): WebSocketServer {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.wss.on('connection', (socket, request) => {
      console.log('New WebSocket connection');
      
      // Extract user ID and session ID from request (will be set by middleware)
      const urlParams = new URLSearchParams(request.url?.split('?')[1] || '');
      const userIdStr = urlParams.get('userId');
      const sessionId = urlParams.get('sessionId');
      
      if (!userIdStr || !sessionId) {
        console.log('WS connection rejected: missing userId or sessionId');
        socket.close(1008, 'Missing authentication');
        return;
      }
      
      const userId = parseInt(userIdStr, 10);
      
      // Store the client
      const client: ConnectedClient = { userId, socket, sessionId };
      if (!this.clients.has(userId)) {
        this.clients.set(userId, []);
      }
      this.clients.get(userId)?.push(client);
      
      // Handle messages
      socket.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message.toString()) as WSMessage;
          this.handleClientMessage(userId, parsedMessage);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });
      
      // Handle disconnection
      socket.on('close', () => {
        this.removeClient(userId, sessionId);
        console.log(`WebSocket connection closed for user ${userId}`);
      });
      
      // Send a welcome message
      this.sendToUser(userId, {
        type: 'notification',
        payload: {
          title: 'Connected',
          content: 'WebSocket connection established successfully'
        }
      });
    });
    
    return this.wss;
  }
  
  private removeClient(userId: number, sessionId: string): void {
    const userClients = this.clients.get(userId);
    if (!userClients) return;
    
    const updatedClients = userClients.filter(client => client.sessionId !== sessionId);
    
    if (updatedClients.length === 0) {
      this.clients.delete(userId);
    } else {
      this.clients.set(userId, updatedClients);
    }
  }
  
  private handleClientMessage(userId: number, message: WSMessage): void {
    // Process client messages if needed
    console.log(`Received message from user ${userId}:`, message);
    
    // For now, we just echo the message back
    this.sendToUser(userId, {
      type: 'notification',
      payload: {
        title: 'Message Received',
        content: 'Your message was received'
      }
    });
  }
  
  public sendToUser(userId: number, message: WSMessage): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.length === 0) return;
    
    const messageStr = JSON.stringify(message);
    
    for (const client of userClients) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(messageStr);
      }
    }
  }
  
  public broadcastToAll(message: WSMessage): void {
    const messageStr = JSON.stringify(message);
    
    for (const [_, clients] of this.clients) {
      for (const client of clients) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(messageStr);
        }
      }
    }
  }
  
  public shutdown(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    
    this.clients.clear();
  }
}

export const wsManager = WebSocketManager.getInstance();
