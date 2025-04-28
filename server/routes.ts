import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { wsManager } from "./websocket";
import { ollamaService } from "./ollama";
import { notificationService } from "./notifications";
import { insertItemSchema, insertItemRelationSchema, insertCommentSchema } from "@shared/schema";
import { AIOrchestrationConfig } from "@shared/types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server for both Express and WebSockets
  const httpServer = createServer(app);
  
  // Initialize WebSocket manager
  wsManager.initialize(httpServer);
  
  // Initialize Ollama service
  await ollamaService.initialize();

  // API Routes
  // Items
  app.get("/api/items", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const items = await storage.getItemsByUserId(req.user.id, req.query);
      res.json(items);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/items/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItemWithRelations(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Ensure user can only access their own items
      if (item.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(item);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/items", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertItemSchema.parse(req.body);
      
      // Ensure user_id is set to the authenticated user
      const item = await storage.createItem({
        ...validatedData,
        user_id: req.user.id
      });
      
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/items/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Ensure user can only update their own items
      if (item.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedItem = await storage.updateItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/items/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Ensure user can only delete their own items
      if (item.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteItem(itemId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // Item Relations
  app.post("/api/item-relations", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertItemRelationSchema.parse(req.body);
      
      // Verify ownership of both items
      const fromItem = await storage.getItemById(validatedData.from_item_id);
      const toItem = await storage.getItemById(validatedData.to_item_id);
      
      if (!fromItem || !toItem) {
        return res.status(404).json({ message: "One or both items not found" });
      }
      
      if (fromItem.user_id !== req.user.id || toItem.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const relation = await storage.createItemRelation(validatedData);
      res.status(201).json(relation);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/item-relations/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const relationId = parseInt(req.params.id);
      
      // Implement ownership check here if needed
      
      await storage.deleteItemRelation(relationId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // Comments
  app.get("/api/items/:id/comments", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Ensure user can only access comments on their own items
      if (item.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const comments = await storage.getCommentsByItemId(itemId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/items/:id/comments", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Ensure user can only comment on their own items
      if (item.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        item_id: itemId,
        user_id: req.user.id
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  });
  
  // Notifications
  app.get("/api/notifications", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/notifications/:id/read", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // AI Models
  app.get("/api/ai-models", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const models = await storage.getAIModels();
      res.json(models);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/ai-models/:id/status", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const modelId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      await storage.updateAIModelStatus(modelId, isActive);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // AI Processing
  app.post("/api/items/:id/process", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Ensure user can only process their own items
      if (item.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Determine processing strategy based on item importance
      let strategy: AIOrchestrationConfig["strategy"];
      
      switch (item.importance) {
        case "LOW":
          strategy = "SINGLE_BASIC";
          break;
        case "MEDIUM":
          strategy = "SINGLE_BEST";
          break;
        case "HIGH":
          strategy = "MULTI_MODEL_SELECTIVE";
          break;
        case "CRITICAL":
          strategy = "ALL_ENCOMPASSING";
          break;
        default:
          strategy = "SINGLE_BEST";
      }
      
      // Process with Ollama
      const result = await ollamaService.processItem(itemId, {
        strategy,
        models: req.body.models || [] // If specific models are requested
      });
      
      // Send notification about processing completion
      await notificationService.sendNotification(req.user.id, {
        title: "AI Analysis Complete",
        content: `The analysis of "${item.title}" has been completed.`,
        itemId: item.id,
        interactionType: "INFO",
        channels: ["IN_APP", "BROWSER"]
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/items/:id/ai-insights", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Ensure user can only access insights for their own items
      if (item.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const insights = await storage.getAIInsightsByItemId(itemId);
      res.json(insights);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/items/:id/ai-logs", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Ensure user can only access logs for their own items
      if (item.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const logLevel = req.query.level as string | undefined;
      const logs = await storage.getAILogsByItemId(itemId, logLevel);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });
  
  // User Settings
  app.get("/api/user/settings", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const settings = await storage.getUserSettings(req.user.id);
      res.json(settings || {});
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/user/settings", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const settings = await storage.updateUserSettings(req.user.id, req.body);
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
