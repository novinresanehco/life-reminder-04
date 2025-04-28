import { AIOrchestrationConfig, OllamaModel, AIProcessingResult } from '@shared/types';
import fetch from 'node-fetch';
import { db } from './db';
import { aiModels, aiProcessingLogs, aiAnalysisResults } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Base URL for Ollama API
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export class OllamaService {
  private static instance: OllamaService;
  private models: OllamaModel[] = [];
  private discoveryInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  public async initialize() {
    // Start discovering Ollama models
    await this.discoverModels();
    
    // Set up regular discovery (every 5 minutes)
    this.discoveryInterval = setInterval(async () => {
      await this.discoverModels();
    }, 5 * 60 * 1000);
    
    return this.models;
  }

  public async discoverModels() {
    try {
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { 
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error("Failed to fetch Ollama models:", response.statusText);
        return this.models;
      }
      
      const data = await response.json() as { models: { name: string }[] };
      
      // Update models list
      this.models = data.models.map(model => ({
        name: model.name,
        isActive: true, // Default to active
        status: "online"
      }));
      
      // Sync with database
      await this.syncModelsWithDatabase();
      
      return this.models;
    } catch (error) {
      console.error("Error discovering Ollama models:", error);
      // Mark all models as offline if Ollama is unreachable
      this.models = this.models.map(model => ({
        ...model,
        status: "offline"
      }));
      return this.models;
    }
  }

  private async syncModelsWithDatabase() {
    try {
      // Get all existing Ollama models from DB
      const existingModels = await db.select().from(aiModels).where(eq(aiModels.model_type, "OLLAMA_LOCAL"));
      
      // Create a map for quick lookup
      const existingModelMap = new Map(existingModels.map(model => [model.name, model]));
      
      // Add new models to database
      for (const model of this.models) {
        if (!existingModelMap.has(model.name)) {
          // Insert new model
          await db.insert(aiModels).values({
            name: model.name,
            model_type: "OLLAMA_LOCAL",
            endpoint: `${OLLAMA_BASE_URL}/api/generate`,
            is_active: true,
            parameters: {}
          });
        }
      }
      
      // Update status for existing models
      const modelNames = this.models.map(m => m.name);
      for (const [name, model] of existingModelMap.entries()) {
        const isOnline = modelNames.includes(name);
        if (!isOnline && model.is_active) {
          // Update model to inactive if it's no longer available
          await db.update(aiModels)
            .set({ is_active: false })
            .where(eq(aiModels.id, model.id));
        } else if (isOnline && !model.is_active) {
          // Respect user preference - don't auto-activate
          // Models should only be activated explicitly by user
        }
      }
    } catch (error) {
      console.error("Error syncing models with database:", error);
    }
  }

  public async getModels(): Promise<OllamaModel[]> {
    return this.models;
  }

  public async generateCompletion(
    modelName: string,
    prompt: string,
    parameters: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Use AbortController for timeout (longer for generation)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
      
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          prompt,
          ...parameters,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
      }

      // Ollama returns streaming response, concatenate all parts
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to get response reader");
      
      let result = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        try {
          // Each line is a JSON object with a 'response' field
          const lines = chunk.split('\n').filter(Boolean);
          for (const line of lines) {
            const data = JSON.parse(line);
            result += data.response || '';
          }
        } catch (e) {
          console.error("Error parsing Ollama response:", e);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error generating completion with ${modelName}:`, error);
      throw error;
    }
  }

  public async processItem(
    itemId: number,
    config: AIOrchestrationConfig
  ): Promise<AIProcessingResult> {
    // Get active models based on configuration
    const activeModels = await db.select().from(aiModels)
      .where(and(
        eq(aiModels.is_active, true),
        eq(aiModels.model_type, "OLLAMA_LOCAL")
      ));
    
    // Filter models based on config
    const selectedModels = activeModels.filter(model => 
      config.models.includes(model.name) || 
      config.models.length === 0 // If no models specified, use all active
    );
    
    if (selectedModels.length === 0) {
      throw new Error("No active Ollama models available for processing");
    }
    
    const result: AIProcessingResult = {
      insights: [],
      logs: []
    };
    
    // Implementation depends on strategy
    // For demonstration, we'll use a simplified approach
    for (const model of selectedModels) {
      try {
        // Log processing start
        const startLog = await db.insert(aiProcessingLogs).values({
          item_id: itemId,
          model_id: model.id,
          log_level: "INFO",
          message: `Started processing with ${model.name}`,
          details: { strategy: config.strategy }
        }).returning();
        
        result.logs.push(startLog[0]);
        
        // Generate completion - simplified prompt for demonstration
        const prompt = `Analyze the following item with ID ${itemId}. 
                        Provide insights, risks, and actionable steps.
                        Format your response as JSON with the following structure:
                        {
                          "summary": "brief summary",
                          "risks": [{"level": "HIGH/MEDIUM/LOW", "description": "..."}],
                          "actionItems": [{"title": "...", "description": "..."}]
                        }`;
        
        const completion = await this.generateCompletion(model.name, prompt, config.parameters);
        
        // Parse completion and store insights
        try {
          const parsedResult = JSON.parse(completion);
          
          // Create analysis result
          const insight = await db.insert(aiAnalysisResults).values({
            item_id: itemId,
            title: `Analysis by ${model.name}`,
            content: parsedResult,
            processing_strategy: config.strategy,
            is_visible_in_overview: true
          }).returning();
          
          result.insights.push(insight[0]);
          
          // Log success
          const successLog = await db.insert(aiProcessingLogs).values({
            item_id: itemId,
            model_id: model.id,
            log_level: "IMPORTANT",
            message: `Successfully processed with ${model.name}`,
            details: { 
              summary: parsedResult.summary,
              riskCount: parsedResult.risks?.length,
              actionItemCount: parsedResult.actionItems?.length
            }
          }).returning();
          
          result.logs.push(successLog[0]);
        } catch (parseError) {
          // Handle JSON parsing error
          const errorLog = await db.insert(aiProcessingLogs).values({
            item_id: itemId,
            model_id: model.id,
            log_level: "CRITICAL",
            message: `Failed to parse response from ${model.name}`,
            details: { error: parseError.message, rawResponse: completion }
          }).returning();
          
          result.logs.push(errorLog[0]);
        }
      } catch (error) {
        // Log processing error
        const errorLog = await db.insert(aiProcessingLogs).values({
          item_id: itemId,
          model_id: model.id,
          log_level: "CRITICAL",
          message: `Error processing with ${model.name}: ${error.message}`,
          details: { error: error.stack }
        }).returning();
        
        result.logs.push(errorLog[0]);
      }
    }
    
    return result;
  }
  
  public shutdown() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }
  }
}

// Export singleton instance
export const ollamaService = OllamaService.getInstance();
