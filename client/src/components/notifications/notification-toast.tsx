import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationData {
  id: number;
  title: string;
  content: string;
  item_id?: number;
  interaction_type: "INFO" | "CHECKBOX" | "TEXTAREA";
  interaction_data?: Record<string, any>;
  is_read: boolean;
}

export function NotificationToast() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const [visible, setVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);
  const [response, setResponse] = useState<string>("");
  
  // Fetch unread notifications
  const { data: notifications = [] } = useQuery<NotificationData[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });
  
  // Show a new notification when received via WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'notification') {
      setCurrentNotification(lastMessage.payload);
      setVisible(true);
      
      // Hide notification after 5 seconds for INFO type
      if (lastMessage.payload.interaction_type === 'INFO') {
        const timeout = setTimeout(() => {
          setVisible(false);
        }, 5000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [lastMessage]);
  
  // Show the first unread notification if none is currently shown
  useEffect(() => {
    if (!visible && !currentNotification && notifications.length > 0) {
      const unreadNotification = notifications.find(n => !n.is_read);
      if (unreadNotification) {
        setCurrentNotification(unreadNotification);
        setVisible(true);
      }
    }
  }, [notifications, visible, currentNotification]);
  
  const handleClose = async () => {
    if (currentNotification && currentNotification.id) {
      // Ensure notification ID is valid
      const notificationId = parseInt(String(currentNotification.id));
      
      if (!isNaN(notificationId) && notificationId > 0) {
        // Mark as read
        try {
          await apiRequest('POST', `/api/notifications/${notificationId}/read`);
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }
    }
    
    setVisible(false);
    setCurrentNotification(null);
    setResponse("");
  };
  
  const handleAction = async () => {
    if (!currentNotification || !currentNotification.id) return;
    
    // Ensure notification ID is valid
    const notificationId = parseInt(String(currentNotification.id));
    if (isNaN(notificationId) || notificationId <= 0) return;
    
    try {
      // Handle different interaction types
      if (currentNotification.interaction_type === 'CHECKBOX') {
        // Send checkbox state
        await apiRequest('POST', `/api/notifications/${notificationId}/respond`, {
          response: true
        });
      } else if (currentNotification.interaction_type === 'TEXTAREA') {
        // Send text response
        await apiRequest('POST', `/api/notifications/${notificationId}/respond`, {
          response
        });
        setResponse("");
      }
      
      // Mark as read
      await apiRequest('POST', `/api/notifications/${notificationId}/read`);
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      // Hide notification
      setVisible(false);
      setCurrentNotification(null);
    } catch (error) {
      console.error('Error responding to notification:', error);
    }
  };
  
  const handleItemClick = () => {
    if (currentNotification?.item_id) {
      const itemId = parseInt(String(currentNotification.item_id));
      if (!isNaN(itemId) && itemId > 0) {
        window.location.href = `/items/${itemId}`;
        handleClose();
      }
    }
  };
  
  if (!visible || !currentNotification) return null;
  
  return (
    <div className={cn(
      "fixed top-16 p-4 z-50 transition-transform duration-300",
      "right-4" // Position on the right for both RTL and LTR
    )}>
      <Card className="w-80 shadow-lg">
        <div className="flex justify-between items-start p-4 pb-2">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-primary-500 mr-2" />
            <h4 className="font-medium">{currentNotification.title}</h4>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 -mt-1 -mr-1">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <CardContent className="p-4 pt-2">
          <p className="text-sm text-neutral-700">
            {currentNotification.content}
          </p>
          
          {currentNotification.interaction_type === 'TEXTAREA' && (
            <textarea
              className="w-full mt-2 p-2 text-sm border border-neutral-300 rounded-md"
              rows={2}
              placeholder={t("Type your response...")}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex gap-2">
          {currentNotification.item_id && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleItemClick}
            >
              {t("View")}
            </Button>
          )}
          
          {currentNotification.interaction_type !== 'INFO' && (
            <Button 
              className="flex-1"
              onClick={handleAction}
              disabled={currentNotification.interaction_type === 'TEXTAREA' && !response.trim()}
            >
              {t("Submit")}
            </Button>
          )}
          
          {!currentNotification.item_id && currentNotification.interaction_type === 'INFO' && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              {t("Dismiss")}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
