import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const itemTypeEnum = pgEnum("item_type", ["TASK", "PROJECT", "GOAL", "IDEA", "NOTE"]);
export const itemStatusEnum = pgEnum("item_status", ["TODO", "IN_PROGRESS", "DONE", "ARCHIVED", "BACKLOG"]);
export const relationTypeEnum = pgEnum("relation_type", ["PARENT_OF", "CHILD_OF", "RELATED_TO", "BLOCKS", "DEPENDS_ON"]);
export const itemImportanceEnum = pgEnum("item_importance", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const logLevelEnum = pgEnum("log_level", ["DEBUG", "INFO", "IMPORTANT", "CRITICAL"]);
export const processingStrategyEnum = pgEnum("processing_strategy", ["SINGLE_BASIC", "SINGLE_BEST", "MULTI_MODEL_SELECTIVE", "ALL_ENCOMPASSING"]);
export const modelTypeEnum = pgEnum("model_type", ["API", "OLLAMA_LOCAL"]);
export const notificationChannelEnum = pgEnum("notification_channel", ["IN_APP", "BROWSER", "TELEGRAM"]);
export const notificationInteractionEnum = pgEnum("notification_interaction", ["INFO", "CHECKBOX", "TEXTAREA"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  locale: text("locale").notNull().default("fa-IR"), // Stores user's language AND region preference
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Items table (core entity for all item types)
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: itemTypeEnum("type").notNull().default("TASK"),
  status: itemStatusEnum("status").notNull().default("TODO"),
  importance: itemImportanceEnum("importance").notNull().default("MEDIUM"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  due_date: timestamp("due_date"),
  tags: text("tags").array(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

// Item relationships
export const itemRelations = pgTable("item_relations", {
  id: serial("id").primaryKey(),
  from_item_id: integer("from_item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  to_item_id: integer("to_item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  relation_type: relationTypeEnum("relation_type").notNull(),
});

// AI Models
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model_type: modelTypeEnum("model_type").notNull(),
  endpoint: text("endpoint"),
  is_active: boolean("is_active").notNull().default(true),
  parameters: jsonb("parameters").default({}),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// AI Processing Logs
export const aiProcessingLogs = pgTable("ai_processing_logs", {
  id: serial("id").primaryKey(),
  item_id: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  model_id: integer("model_id").references(() => aiModels.id),
  log_level: logLevelEnum("log_level").notNull().default("INFO"),
  message: text("message").notNull(),
  details: jsonb("details").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
  is_deleted: boolean("is_deleted").notNull().default(false),
});

// AI Analysis Results
export const aiAnalysisResults = pgTable("ai_analysis_results", {
  id: serial("id").primaryKey(),
  item_id: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  processing_strategy: processingStrategyEnum("processing_strategy").notNull(),
  is_visible_in_overview: boolean("is_visible_in_overview").notNull().default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// Comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  item_id: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  item_id: integer("item_id").references(() => items.id, { onDelete: "cascade" }),
  interaction_type: notificationInteractionEnum("interaction_type").notNull().default("INFO"),
  interaction_data: jsonb("interaction_data").default({}),
  channels: notificationChannelEnum("channels").array(),
  is_read: boolean("is_read").notNull().default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// User Settings
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  telegram_chat_id: text("telegram_chat_id"),
  execution_module_settings: jsonb("execution_module_settings").default({}),
  notification_settings: jsonb("notification_settings").default({}),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Define relationships
export const itemsRelations = relations(items, ({ one, many }) => ({
  user: one(users, {
    fields: [items.user_id],
    references: [users.id],
  }),
  outgoingRelations: many(itemRelations, {
    relationName: "outgoingRelations",
    fields: [items.id],
    references: [itemRelations.from_item_id],
  }),
  incomingRelations: many(itemRelations, {
    relationName: "incomingRelations",
    fields: [items.id],
    references: [itemRelations.to_item_id],
  }),
  aiProcessingLogs: many(aiProcessingLogs),
  aiAnalysisResults: many(aiAnalysisResults),
  comments: many(comments),
}));

export const itemRelationsRelations = relations(itemRelations, ({ one }) => ({
  fromItem: one(items, {
    relationName: "outgoingRelations",
    fields: [itemRelations.from_item_id],
    references: [items.id],
  }),
  toItem: one(items, {
    relationName: "incomingRelations",
    fields: [itemRelations.to_item_id],
    references: [items.id],
  }),
}));

export const aiProcessingLogsRelations = relations(aiProcessingLogs, ({ one }) => ({
  item: one(items, {
    fields: [aiProcessingLogs.item_id],
    references: [items.id],
  }),
  model: one(aiModels, {
    fields: [aiProcessingLogs.model_id],
    references: [aiModels.id],
  }),
}));

export const aiAnalysisResultsRelations = relations(aiAnalysisResults, ({ one }) => ({
  item: one(items, {
    fields: [aiAnalysisResults.item_id],
    references: [items.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  item: one(items, {
    fields: [comments.item_id],
    references: [items.id],
  }),
  user: one(users, {
    fields: [comments.user_id],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
  item: one(items, {
    fields: [notifications.item_id],
    references: [items.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.user_id],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertItemRelationSchema = createInsertSchema(itemRelations).omit({
  id: true,
});

export const insertAIModelSchema = createInsertSchema(aiModels).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  created_at: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  created_at: true,
  is_read: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type ItemRelation = typeof itemRelations.$inferSelect;
export type InsertItemRelation = z.infer<typeof insertItemRelationSchema>;

export type AIModel = typeof aiModels.$inferSelect;
export type InsertAIModel = z.infer<typeof insertAIModelSchema>;

export type AIProcessingLog = typeof aiProcessingLogs.$inferSelect;
export type AIAnalysisResult = typeof aiAnalysisResults.$inferSelect;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
