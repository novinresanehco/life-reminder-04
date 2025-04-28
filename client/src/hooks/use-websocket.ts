import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./use-auth";
import { WSMessage } from "@shared/types";

export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds
  
  // Function to create and setup WebSocket
  const setupWebSocket = useCallback(() => {
    if (!user) return null;
    
    // Create WebSocket connection with auth info
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}&sessionId=${Date.now()}`;
    
    const socket = new WebSocket(wsUrl);
    
    // Connection opened
    socket.addEventListener("open", () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
    });
    
    // Listen for messages
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        setLastMessage(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
    
    // Connection closed
    socket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed", event.code);
      setIsConnected(false);
      
      // Attempt to reconnect if not closed cleanly and within max attempts
      if (!event.wasClean && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
        
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Set timeout for reconnection
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (socketRef.current) {
            socketRef.current = setupWebSocket();
          }
        }, RECONNECT_DELAY);
      }
    });
    
    // Connection error
    socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    });
    
    return socket;
  }, [user]);
  
  // Connect to WebSocket
  useEffect(() => {
    if (!user) {
      // Disconnect if user is not authenticated
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setIsConnected(false);
      }
      
      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      return;
    }
    
    // Setup WebSocket connection
    socketRef.current = setupWebSocket();
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, setupWebSocket]);
  
  // Send message function
  const sendMessage = useCallback((message: WSMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);
  
  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
