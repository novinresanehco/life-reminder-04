import { Item, ItemRelation, AIAnalysisResult, AIProcessingLog, Comment, User } from "./schema";

// Extended types with relationships included
export type ItemWithRelations = Item & {
  relations?: {
    parents: (ItemRelation & { item: Item })[];
    children: (ItemRelation & { item: Item })[];
    related: (ItemRelation & { item: Item })[];
    blockedBy: (ItemRelation & { item: Item })[];
    blocks: (ItemRelation & { item: Item })[];
  };
  aiInsights?: AIAnalysisResult[];
  aiLogs?: AIProcessingLog[];
  comments?: (Comment & { user: User })[];
};

// AI Orchestrator types
export interface OllamaModel {
  name: string;
  isActive: boolean;
  status: "online" | "offline" | "loading";
}

export interface AIOrchestrationConfig {
  strategy: "SINGLE_BASIC" | "SINGLE_BEST" | "MULTI_MODEL_SELECTIVE" | "ALL_ENCOMPASSING";
  models: string[];
  parameters?: Record<string, any>;
}

export interface AIProcessingResult {
  insights: AIAnalysisResult[];
  logs: AIProcessingLog[];
}

// Notification types
export interface NotificationPayload {
  title: string;
  content: string;
  itemId?: number;
  interactionType: "INFO" | "CHECKBOX" | "TEXTAREA";
  interactionData?: Record<string, any>;
  channels: ("IN_APP" | "BROWSER" | "TELEGRAM")[];
}

// Socket message types
export interface WSMessage {
  type: "notification" | "aiUpdate" | "itemUpdate";
  payload: any;
}
