import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./use-auth";
import { WSMessage } from "@shared/types";

export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Connect to WebSocket
  useEffect(() => {
    if (!user) {
      // Disconnect if user is not authenticated
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }
    
    // Create WebSocket connection with auth info
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}&sessionId=${Date.now()}`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    // Connection opened
    socket.addEventListener("open", () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
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
    socket.addEventListener("close", () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    });
    
    // Connection error
    socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    });
    
    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, [user]);
  
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
