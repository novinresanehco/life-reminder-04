import { db } from "./db";
import { users, items, itemRelations, comments, notifications, aiModels, aiProcessingLogs, aiAnalysisResults, userSettings } from "@shared/schema";
import type { User, InsertUser, Item, InsertItem, ItemRelation, InsertItemRelation, Comment, InsertComment, Notification, InsertNotification, UserSettings, InsertUserSettings } from "@shared/schema";
import session from "express-session";
import { eq, and, or, desc, asc, like, ilike } from "drizzle-orm";
import { ItemWithRelations } from "@shared/types";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLocale(id: number, locale: string): Promise<User>;
  
  // Item management
  getItemById(id: number): Promise<Item | undefined>;
  getItemWithRelations(id: number): Promise<ItemWithRelations | undefined>;
  getItemsByUserId(userId: number, filters?: any): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  
  // Item relations
  createItemRelation(relation: InsertItemRelation): Promise<ItemRelation>;
  deleteItemRelation(id: number): Promise<boolean>;
  
  // Comments
  getCommentsByItemId(itemId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Notifications
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // AI Models
  getAIModels(): Promise<any[]>;
  updateAIModelStatus(id: number, isActive: boolean): Promise<boolean>;
  
  // User Settings
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  // AI Processing
  getAIInsightsByItemId(itemId: number): Promise<any[]>;
  getAILogsByItemId(itemId: number, logLevel?: string): Promise<any[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUserLocale(id: number, locale: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ locale })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Item Management
  async getItemById(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }
  
  async getItemWithRelations(id: number): Promise<ItemWithRelations | undefined> {
    // Get the base item
    const [item] = await db.select().from(items).where(eq(items.id, id));
    if (!item) return undefined;
    
    // Get all relations where this item is either source or target
    const relations = await db.select().from(itemRelations).where(
      or(
        eq(itemRelations.from_item_id, id),
        eq(itemRelations.to_item_id, id)
      )
    );
    
    // Get related item details
    const relatedItemIds = [...new Set([
      ...relations.map(r => r.from_item_id),
      ...relations.map(r => r.to_item_id)
    ])].filter(itemId => itemId !== id);
    
    const relatedItems = relatedItemIds.length > 0
      ? await db.select().from(items).where(
          eq(items.id, relatedItemIds as any) 
        )
      : [];
    
    // Create a map for quick lookup
    const itemMap = new Map(relatedItems.map(item => [item.id, item]));
    
    // Get comments with user information
    const itemComments = await this.getCommentsByItemId(id);
    
    // Get AI insights
    const insights = await this.getAIInsightsByItemId(id);
    
    // Get AI logs
    const logs = await this.getAILogsByItemId(id);
    
    // Organize relations by type
    const itemWithRelations: ItemWithRelations = {
      ...item,
      relations: {
        parents: [],
        children: [],
        related: [],
        blockedBy: [],
        blocks: []
      },
      comments: itemComments,
      aiInsights: insights,
      aiLogs: logs
    };
    
    // Populate relations
    for (const relation of relations) {
      const relatedItemId = relation.from_item_id === id ? relation.to_item_id : relation.from_item_id;
      const relatedItem = itemMap.get(relatedItemId);
      
      if (!relatedItem) continue;
      
      const relWithItem = { ...relation, item: relatedItem };
      
      switch (relation.relation_type) {
        case "PARENT_OF":
          if (relation.from_item_id === id) {
            itemWithRelations.relations!.children.push(relWithItem);
          } else {
            itemWithRelations.relations!.parents.push(relWithItem);
          }
          break;
        case "CHILD_OF":
          if (relation.from_item_id === id) {
            itemWithRelations.relations!.parents.push(relWithItem);
          } else {
            itemWithRelations.relations!.children.push(relWithItem);
          }
          break;
        case "RELATED_TO":
          itemWithRelations.relations!.related.push(relWithItem);
          break;
        case "BLOCKS":
          if (relation.from_item_id === id) {
            itemWithRelations.relations!.blocks.push(relWithItem);
          } else {
            itemWithRelations.relations!.blockedBy.push(relWithItem);
          }
          break;
        case "DEPENDS_ON":
          if (relation.from_item_id === id) {
            itemWithRelations.relations!.blockedBy.push(relWithItem);
          } else {
            itemWithRelations.relations!.blocks.push(relWithItem);
          }
          break;
      }
    }
    
    return itemWithRelations;
  }
  
  async getItemsByUserId(userId: number, filters: any = {}): Promise<Item[]> {
    let query = db.select().from(items).where(eq(items.user_id, userId));
    
    // Apply filters
    if (filters.type && filters.type !== 'ALL') {
      query = query.where(eq(items.type, filters.type));
    }
    
    if (filters.status && filters.status !== 'ALL') {
      query = query.where(eq(items.status, filters.status));
    }
    
    if (filters.importance && filters.importance !== 'ALL') {
      query = query.where(eq(items.importance, filters.importance));
    }
    
    if (filters.search) {
      query = query.where(
        or(
          ilike(items.title, `%${filters.search}%`),
          ilike(items.description || '', `%${filters.search}%`)
        )
      );
    }
    
    // Apply sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? asc : desc;
      query = query.orderBy(sortOrder(items[filters.sortBy as keyof typeof items]));
    } else {
      // Default sort by updated_at desc
      query = query.orderBy(desc(items.updated_at));
    }
    
    return await query;
  }
  
  async createItem(item: InsertItem): Promise<Item> {
    const [createdItem] = await db.insert(items).values(item).returning();
    return createdItem;
  }
  
  async updateItem(id: number, itemUpdate: Partial<Item>): Promise<Item | undefined> {
    const [updatedItem] = await db.update(items)
      .set({ ...itemUpdate, updated_at: new Date() })
      .where(eq(items.id, id))
      .returning();
    return updatedItem;
  }
  
  async deleteItem(id: number): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id));
    return true; // Drizzle doesn't return count, assume success if no error
  }
  
  // Item Relations
  async createItemRelation(relation: InsertItemRelation): Promise<ItemRelation> {
    const [createdRelation] = await db.insert(itemRelations).values(relation).returning();
    return createdRelation;
  }
  
  async deleteItemRelation(id: number): Promise<boolean> {
    await db.delete(itemRelations).where(eq(itemRelations.id, id));
    return true;
  }
  
  // Comments
  async getCommentsByItemId(itemId: number): Promise<Comment[]> {
    return await db.select()
      .from(comments)
      .where(eq(comments.item_id, itemId))
      .orderBy(desc(comments.created_at));
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const [createdComment] = await db.insert(comments).values(comment).returning();
    return createdComment;
  }
  
  // Notifications
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.user_id, userId))
      .orderBy(desc(notifications.created_at));
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [createdNotification] = await db.insert(notifications).values(notification).returning();
    return createdNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    await db.update(notifications)
      .set({ is_read: true })
      .where(eq(notifications.id, id));
    return true;
  }
  
  // AI Models
  async getAIModels(): Promise<any[]> {
    return await db.select().from(aiModels);
  }
  
  async updateAIModelStatus(id: number, isActive: boolean): Promise<boolean> {
    await db.update(aiModels)
      .set({ is_active: isActive })
      .where(eq(aiModels.id, id));
    return true;
  }
  
  // User Settings
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select()
      .from(userSettings)
      .where(eq(userSettings.user_id, userId));
    return settings;
  }
  
  async updateUserSettings(userId: number, settingsUpdate: Partial<InsertUserSettings>): Promise<UserSettings> {
    // Check if settings exist
    const existingSettings = await this.getUserSettings(userId);
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db.update(userSettings)
        .set({ ...settingsUpdate, updated_at: new Date() })
        .where(eq(userSettings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db.insert(userSettings)
        .values({ user_id: userId, ...settingsUpdate })
        .returning();
      return newSettings;
    }
  }
  
  // AI Processing
  async getAIInsightsByItemId(itemId: number): Promise<any[]> {
    return await db.select()
      .from(aiAnalysisResults)
      .where(eq(aiAnalysisResults.item_id, itemId))
      .orderBy(desc(aiAnalysisResults.created_at));
  }
  
  async getAILogsByItemId(itemId: number, logLevel?: string): Promise<any[]> {
    let query = db.select()
      .from(aiProcessingLogs)
      .where(eq(aiProcessingLogs.item_id, itemId));
    
    if (logLevel) {
      query = query.where(eq(aiProcessingLogs.log_level, logLevel as any));
    }
    
    return await query.orderBy(desc(aiProcessingLogs.timestamp));
  }
}

export const storage = new DatabaseStorage();
