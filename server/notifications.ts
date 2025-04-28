import { NotificationPayload } from '@shared/types';
import { db } from './db';
import { notifications } from '@shared/schema';
import { wsManager } from './websocket';

class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {
    // Private constructor for singleton
  }
  
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  public async sendNotification(userId: number, payload: NotificationPayload): Promise<boolean> {
    try {
      // Store notification in database
      const [notification] = await db.insert(notifications).values({
        user_id: userId,
        title: payload.title,
        content: payload.content,
        item_id: payload.itemId,
        interaction_type: payload.interactionType,
        interaction_data: payload.interactionData || {},
        channels: payload.channels,
        is_read: false
      }).returning();
      
      // Send to WebSocket if IN_APP channel is included
      if (payload.channels.includes("IN_APP")) {
        wsManager.sendToUser(userId, {
          type: 'notification',
          payload: {
            ...notification,
            id: notification.id
          }
        });
      }
      
      // Send browser notification if that channel is included
      if (payload.channels.includes("BROWSER")) {
        // Browser notifications are sent through the WebSocket,
        // and the client decides whether to show them
        wsManager.sendToUser(userId, {
          type: 'browserNotification',
          payload: {
            id: notification.id,
            title: payload.title,
            body: payload.content,
            itemId: payload.itemId
          }
        });
      }
      
      // Send Telegram notification if that channel is included
      if (payload.channels.includes("TELEGRAM")) {
        await this.sendTelegramNotification(userId, payload);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
  
  private async sendTelegramNotification(userId: number, payload: NotificationPayload): Promise<void> {
    // Implementation would depend on how you've set up Telegram integration
    // This is a placeholder for the actual implementation
    console.log(`[Telegram Notification] Would send to user ${userId}: ${payload.title}`);
  }
  
  public async markAsRead(notificationId: number): Promise<boolean> {
    try {
      await db.update(notifications)
        .set({ is_read: true })
        .where({ id: notificationId });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  public async getUnreadNotifications(userId: number): Promise<any[]> {
    try {
      return await db.select()
        .from(notifications)
        .where({ user_id: userId, is_read: false })
        .orderBy({ created_at: 'desc' });
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  }
}

export const notificationService = NotificationService.getInstance();
