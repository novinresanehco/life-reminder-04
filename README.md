Definitive Prototype & Implementation Guide: "Intelligent LifeOS"

(Version 4.0 - For lovable.dev Development Team)

1. Vision and Goal

To develop an "Intelligent Life Operating System" (LifeOS), a proactive, AI-driven platform designed for holistic personal productivity and life management. The system will organize user information (Tasks, Projects, Goals, Ideas, Notes – collectively "Items") and, more importantly, deeply process this information via a sophisticated AI Orchestrator. This orchestrator leverages multiple AI models, including all active user-configured local Ollama instances, to continuously analyze, refine, decompose, and generate actionable insights. The system features proactive user engagement, progress tracking, and task automation through Execution Modules (e.g., n8n, AgenticSeek). The ultimate goal is to provide users with a highly personalized, intelligent, and actionable "second brain."

2. Core Concepts

Item: The fundamental unit of information (Task, Project, Goal, Idea, Creative Thought, Note). Each Item possesses properties, status, relationships, and a defined Importance Level.

Importance Level: A critical, user-assignable (or AI-inferred) attribute for every Item, dictating the depth and nature of AI processing. Categories:

LOW: Routine info, minor tasks. Minimal AI processing.

MEDIUM: Standard tasks/notes. Requires basic organization, standard AI analysis (summary, simple breakdown). Default level.

HIGH: Significant goals, projects, ideas. Requires detailed AI analysis, planning, and validation using multiple models.

CRITICAL: Foundational life goals, core projects, transformative ideas. Demands the most intensive, multi-faceted, continuous AI scrutiny using all available resources.

AI Orchestrator: The central AI engine managing a pool of configured AI models (API-based and all active local Ollama models). It selects models and Processing Strategies based primarily on Item Importance Level, type, user requests, and context. It's responsible for deep analysis, task decomposition, continuous refinement, result synthesis, log generation, and AI-driven challenge resolution.

Processing Strategy: The methodology employed by the Orchestrator for AI tasks, determined mainly by Importance Level:

LOW: Single Basic: Uses one fast, cost-effective model (e.g., smallest local model). Basic tagging, keyword extraction.

MEDIUM: Single Best: Uses the most suitable single model (capability/cost balance). Standard summaries, basic task breakdowns.

HIGH: Multi-Model Selective: Uses Competitive, Consensus, or Sequential Pipeline strategies involving 2-3 carefully selected models (mix of API/local). Ensures deeper analysis, validation, robust planning.

CRITICAL: All-Encompassing Multi-Model Analysis: Utilizes all available and user-activated models (API + all active Ollama models). Employs advanced strategies (Competitive, Consensus, Sequential) iteratively and concurrently. Aims for maximum depth, diverse perspectives, rigorous cross-validation, and creative exploration. Processing is frequent and triggered by minor changes or on a schedule.

Ollama Integration Service: A dedicated backend service managing all interactions with the user's local Ollama setup. Responsible for discovering all installed Ollama models, checking their health, routing requests from AI Workers, and handling responses.

Processing Results (AI Insights): Curated, significant, user-facing outputs from AI analysis (e.g., actionable plans, key summaries, risk assessments, generated sub-tasks) stored structurally for clear presentation.

Deep Thought Logs (AI Reasoning Logs): Granular, step-by-step records of the AI's reasoning process, especially for HIGH and CRITICAL items. Includes prompts, intermediate thoughts, model selections, raw outputs (optional display), and decision points. Designed for traceability and understanding the AI's process, with user management features (filtering, deletion).

Proactive Engagement: System-initiated interactions (via in-app messages, browser notifications, Telegram) to provide updates, request user feedback/input, or follow up on Item status. Can be interactive (e.g., using checkboxes, text areas).

Execution Module Interface: A standardized internal API/protocol allowing the Orchestrator to delegate actionable tasks (e.g., content generation, research) to external tools (n8n, AgenticSeek, custom scripts).

3. Internationalization & Localization (i18n / l10n) - CRITICAL REQUIREMENT

Multi-Language Support:

Minimum Supported Languages: Persian (fa) and English (en).

Default Language: Persian (fa).

User Configuration: Users must be able to select their preferred language (en or fa) in their profile settings.

Implementation: All user-facing strings in the UI must be managed via standard i18n libraries and locale files (e.g., JSON, PO). Backend responses containing text may also need localization.

Multiple Calendar Support:

Supported Calendars: Jalali (Persian/Solar Hijri) and Gregorian.

Default Calendar: Jalali.

User Configuration: Users must be able to select their preferred calendar format in their profile settings.

Implementation: All date displays, date input components (Date Pickers), and backend date processing must respect the user's selected calendar. Requires using robust date/time libraries supporting both calendars on both frontend and backend.

User Preference Storage: A locale field (e.g., fa-IR, en-US) must be added to the users table to store the combined language and regional format preference.

4. System Architecture

Style: Service-Oriented Architecture (SOA) or Microservices strongly recommended for modularity, scalability, and technology flexibility.

Components:

API Gateway: Single entry point for frontend requests, routing to appropriate backend services.

Core Service: Manages Users (including locale), Items (including importance), Tags, Relations.

AI Orchestrator Service: Handles AI logic, strategy selection, job creation.

AI Worker Service(s): Processes jobs from the queue, interacts with AI models (via APIs or Ollama Service). Scalable horizontally.

Ollama Integration Service: Dedicated interface to local Ollama instance(s).

Engagement Service: Manages notifications across channels (In-App WS, Browser Push, Telegram).

Execution Interface Service: Manages communication with Execution Modules (n8n, AgenticSeek).

Frontend: Single Page Application (SPA) using React, Vue, or Svelte.

Technology Stack (Recommended):

Backend: Python (FastAPI) or Node.js (NestJS).

Database: PostgreSQL (Leverage JSONB heavily for AI data, consider extensions like pgvector if semantic search is needed).

Message Queue: RabbitMQ or Redis Streams (Essential for async AI tasks).

Real-time: WebSockets (for in-app notifications).

Caching: Redis.

AI APIs: SDKs/Clients for OpenAI, Anthropic, Google Gemini.

Ollama: Direct API calls via the dedicated service.

5. Detailed Module Breakdown & Implementation Specifics

5.1. Item Management
* Data Model: items table must include importance item_importance DEFAULT 'MEDIUM' NOT NULL. UI must allow users to easily view and set this level.
* Relationships: Implement item_relations table for robust linking (parent/child, related, depends_on). Visualize these relationships where useful.

5.2. AI Orchestrator Service
* Model Registry (ai_models table): Stores details of API models and discovered Ollama models. Includes model_name (e.g., ollama/llama3:latest), model_type ('API', 'OLLAMA_LOCAL'), capabilities (JSONB: {"text_analysis": true, "planning": true}), etc.
* Ollama Discovery: Periodically call Ollama Integration Service to refresh the list of available local models in ai_models.
* User Preferences (user_ai_model_preferences table): Links user_id to model_id with an is_active BOOLEAN. Users toggle this in Settings. Orchestrator only uses models where is_active = true for that user.
* Job Creation Logic:
1. Trigger: Item created/updated, user request ("Analyze Deeply"), scheduled task.
2. Read Item importance.
3. Select Processing Strategy based on importance.
4. Identify candidate ai_models (matching required capabilities and is_active=true for the user).
5. Construct task definition/prompt(s).
6. Create job message (incl. item_id, user_id, strategy, model_ids_to_consider, prompt, priority) and publish to the Message Queue.
* Continuous Refinement: Implement background scheduler (e.g., using Celery Beat, node-cron) to periodically queue processing jobs for HIGH (e.g., weekly) and CRITICAL (e.g., daily or on relevant updates) items.

5.3. AI Worker Service(s)
* Consume jobs from the queue.
* Execute the specified Processing Strategy:
* Fetch full Item details and related context.
* For strategies involving multiple models:
* Make concurrent calls to different models (via API clients or the Ollama Integration Service).
* Implement comparison/consensus logic (potentially using another AI call for semantic similarity or a simpler evaluation function).
* Logging: Generate detailed logs in ai_processing_logs for each step (model selected, prompt sent, raw response received, analysis/decision made). Tag logs with appropriate log_level (DEBUG, INFO, IMPORTANT, CRITICAL).
* Result Storage: Synthesize the final, user-facing outcomes and store them structurally in ai_analysis_results (JSONB is ideal here). Indicate if a result should be displayed in the Overview tab (is_visible_in_overview).
* Update job status (ai_processing_jobs) upon completion or failure.

5.4. Ollama Integration Service
* Endpoint: Configurable Ollama base URL (default http://localhost:11434).
* /discover_models endpoint (internal): Calls Ollama's /api/tags, parses the response, and returns a list of available model names/tags.
* /generate endpoint (internal): Receives requests from AI Workers (specifying model name, prompt, parameters), forwards them to the appropriate Ollama /api/generate endpoint, handles streaming responses if necessary, and returns the final result or errors.
* Health Check: Implement a simple endpoint (e.g., /health) that pings the Ollama base URL to confirm availability.

5.5. User Interface (UI) - Item Detail View
* Must be dynamic and clearly structured using tabs.
* Tab 1: Overview / Main
* Core Item details (title, description, status, Importance Level, dates, tags).
* AI-Generated Breakdown Section: Dynamically renders content based on ai_analysis_results marked is_visible_in_overview = true. Examples:
* Checklist: For generated sub-tasks (linking to actual Task Items if created).
* Timeline: For generated plans (using a simple CSS/JS component).
* FAQ/Accordion: For identified risks, key questions, or summaries of different analytical angles.
* Formatted Text: For summaries, explanations.
* Goal: Provide immediate, actionable AI insights without digging.
* Tab 2: Processing Results (AI Insights)
* Displays a historical list of curated, significant findings from ai_analysis_results for this Item.
* Show timestamp, summary of findings, perhaps strategy/models used. Focus on conclusions. Read-only.
* Tab 3: Deep Thought Logs (AI Reasoning Logs)
* Displays detailed step-by-step logs from ai_processing_logs.
* Filtering: Default view shows IMPORTANT and CRITICAL level logs. Provide controls to filter by level (show INFO, DEBUG) and possibly by model used.
* Display: Show timestamp, level, core message. Allow expansion to see full prompt/raw response if stored.
* Deletion: Include a mechanism (e.g., icon button per log entry, batch select) for users to soft-delete (is_deleted = true) non-critical logs to manage clutter and potentially database size. Protect CRITICAL logs from easy deletion.

5.6. Proactive Engagement & Notifications (Engagement Service)
* Monitor Item statuses (due dates), AI processing completion/failures, Execution Task statuses.
* Determine optimal channel based on user presence (user_sessions tracking last activity): In-App (WebSocket) -> Browser Push -> Telegram.
* Implement interactive notifications (requiring user_notifications table to store state):
* Info: Simple message.
* Checkbox: "Task X overdue. Mark as complete? [ ] Done [ ] Snooze".
* Textarea: "AI needs more context for Idea Y. Please elaborate on Z: [ Text Area ] [ Submit ]".

5.7. Execution Module Interface & Integrations
* Define internal REST API endpoints:
* POST /api/v1/execution/tasks: Trigger task (pass module_name like 'n8n' or 'agenticseek', item_id, task_definition JSON).
* GET /api/v1/execution/tasks/{task_id}: Get status/results.
* n8n/AgenticSeek Service: A separate small service (or part of Execution Interface Service) handles the actual communication with the local n8n/AgenticSeek APIs using user-provided credentials (stored securely).
* AI Orchestrator/Worker decides when to delegate a task (e.g., "Generate blog post for Idea X") and calls the internal API.

6. Data Model (PostgreSQL - Key Schema Elements)

-- Enums define allowed values for key fields
CREATE TYPE item_importance AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE log_level AS ENUM ('DEBUG', 'INFO', 'IMPORTANT', 'CRITICAL');
CREATE TYPE processing_strategy AS ENUM ('SINGLE_BASIC', 'SINGLE_BEST', 'MULTI_MODEL_SELECTIVE', 'ALL_ENCOMPASSING');
CREATE TYPE model_type AS ENUM ('API', 'OLLAMA_LOCAL');
CREATE TYPE notification_channel AS ENUM ('IN_APP', 'BROWSER', 'TELEGRAM');
CREATE TYPE notification_interaction AS ENUM ('INFO', 'CHECKBOX', 'TEXTAREA');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- CRITICAL: User preference for language and calendar/region
    locale VARCHAR(10) DEFAULT 'fa-IR' NOT NULL -- e.g., 'fa-IR', 'en-US'
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'Task', 'Project', 'Goal', 'Idea', 'Note'
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    priority INT DEFAULT 0,
    importance item_importance DEFAULT 'MEDIUM' NOT NULL, -- Core field driving AI
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    parent_item_id INT REFERENCES items(id) ON DELETE SET NULL,
    tags TEXT[] -- Simple array of text tags
);

CREATE TABLE item_relations (
    id SERIAL PRIMARY KEY,
    source_item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    target_item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL -- 'parent_of', 'child_of', 'related_to', 'blocks', 'depends_on'
);

CREATE TABLE ai_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) UNIQUE NOT NULL, -- e.g., 'ollama/llama3:8b', 'openai/gpt-4'
    model_type model_type NOT NULL,
    endpoint_url TEXT,
    api_key_ref TEXT, -- Reference to secure storage
    capabilities JSONB, -- {'text_analysis': true, 'planning': true}
    config JSONB, -- Default parameters
    is_globally_available BOOLEAN DEFAULT TRUE, -- For API models mainly
    discovered_at TIMESTAMPTZ -- For Ollama models
);

CREATE TABLE user_ai_model_preferences (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id INT NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- User toggle
    PRIMARY KEY (user_id, model_id)
);

CREATE TABLE ai_processing_jobs (
    id BIGSERIAL PRIMARY KEY,
    item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Denormalized for easier lookup
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'completed', 'failed'
    strategy processing_strategy NOT NULL,
    trigger_event VARCHAR(100),
    priority INT DEFAULT 0
);

CREATE TABLE ai_processing_logs (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES ai_processing_jobs(id) ON DELETE SET NULL,
    item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    model_id INT REFERENCES ai_models(id),
    log_level log_level NOT NULL, -- For filtering in UI
    prompt TEXT,
    raw_response TEXT,
    processed_message TEXT NOT NULL, -- Core log text
    metadata JSONB,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL -- Soft delete flag
);
CREATE INDEX idx_ai_logs_item_level ON ai_processing_logs (item_id, log_level); -- Index for UI filtering

CREATE TABLE ai_analysis_results (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES ai_processing_jobs(id) ON DELETE SET NULL,
    item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    strategy_used processing_strategy,
    models_involved_ids INT[],
    result_summary TEXT,
    structured_output JSONB, -- Key data for rendering plans, lists, etc.
    is_visible_in_overview BOOLEAN DEFAULT TRUE -- Flag for Overview tab rendering
);

CREATE TABLE user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INT REFERENCES items(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    channel notification_channel NOT NULL,
    interaction_type notification_interaction DEFAULT 'INFO',
    interaction_options JSONB, -- e.g., {'choices': ['Done', 'Snooze']}
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'acknowledged', 'answered'
    user_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- Plus tables for Execution Modules & Tasks as needed.


7. Implementation Considerations

Asynchronous Operations: All AI processing and external communications (Ollama, APIs, Execution Modules, Notifications) must be handled asynchronously via the message queue and background workers. UI must provide feedback on pending operations.

API Design: Use clear, well-documented RESTful or GraphQL APIs between frontend and backend services.

Error Handling & Resilience: Implement robust error handling in workers (e.g., retries for transient network issues), handle Ollama unavailability gracefully, manage API rate limits. Log errors effectively.

Security: Prioritize security: Secure API key storage (Vault, KMS, env variables), strong authentication/authorization (JWT), input sanitization, protection against common web vulnerabilities (OWASP Top 10).

Scalability: Design workers and services to be horizontally scalable. Optimize database queries (use EXPLAIN, add indices). Use caching (Redis) for frequently accessed data (user prefs, model capabilities).

Configuration: Make key parameters configurable (Ollama URL, API endpoints, default AI parameters, queue names).

Testing: Implement unit, integration, and end-to-end tests, especially covering the AI Orchestrator logic and different processing strategies.

8. Development Roadmap (Suggested Phasing)

Phase 1: Foundation & Core: Backend setup (framework, DB schema incl. users.locale, items.importance), User Auth, Basic Item CRUD, Basic Frontend structure, i18n/l10n framework setup.

Phase 2: Ollama & Basic AI: Ollama Integration Service, ai_models/user_ai_model_preferences mgmt & UI, Basic Orchestrator/Worker/Queue setup, SINGLE_BASIC/SINGLE_BEST strategy for LOW/MEDIUM items.

Phase 3: Advanced Orchestration & UI Tabs: Implement HIGH/CRITICAL strategies (MULTI_MODEL_SELECTIVE, ALL_ENCOMPASSING). Build the 3 Item Detail UI tabs (Overview with basic dynamic rendering, Processing Results, Deep Thought Logs with filtering/deletion). Implement ai_processing_logs & ai_analysis_results population.

Phase 4: Continuous Refinement & Engagement: Implement scheduled re-processing. Build Engagement Service and basic notification triggers/channels (In-App first). Enhance dynamic rendering in Overview tab.

Phase 5: Execution Modules (n8n): Build Execution Module Interface, integrate n8n, allow AI to trigger workflows.

Phase 6: Advanced Interaction & AgenticSeek: Implement interactive notifications (checkbox/textarea). Integrate AgenticSeek. Refine AI task delegation logic.

Phase 7: Optimization, Testing & Feedback: Performance tuning, cost analysis (API usage), comprehensive testing, incorporate user feedback for UI/UX and feature refinement.

9. Conclusion

This document (v4.0) provides a detailed and actionable blueprint for building the "Intelligent LifeOS". It emphasizes the core AI orchestration logic driven by Item Importance, deep integration with user-managed Ollama models, a structured approach to presenting AI insights, and essential internationalization features. This should equip the lovable.dev team with the necessary specifications to commence development on this sophisticated and potentially transformative application. Consistent communication and iterative feedback loops during development remain crucial for success.
