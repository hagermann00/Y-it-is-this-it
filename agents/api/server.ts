import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { DatabaseManager } from '../database/manager.js';
import { AgentOrchestrator } from '../orchestrator.js';
import { PersonalizationEngine } from '../personalization/engine.js';

const PORT = process.env.PORT || 3001;

export class APIServer {
  private db: DatabaseManager;
  private orchestrator: AgentOrchestrator;
  private personalization: PersonalizationEngine;
  private server: any;

  constructor() {
    this.db = new DatabaseManager('./data/ai_knowledge.db');
    this.orchestrator = new AgentOrchestrator();
    this.personalization = new PersonalizationEngine(this.db);
  }

  async start(): Promise<void> {
    this.server = createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(PORT, () => {
      console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
      console.log('📡 Endpoints:');
      console.log(`   GET  /api/agents/stats`);
      console.log(`   GET  /api/agents/search?q=query`);
      console.log(`   GET  /api/agents/category/:name`);
      console.log(`   GET  /api/agents/tools`);
      console.log(`   GET  /api/agents/projects`);
      console.log(`   POST /api/agents/projects/analyze`);
      console.log(`   GET  /api/agents/recommendations/:projectId`);
      console.log(`   POST /api/agents/survey`);
      console.log(`   POST /api/agents/profile`);
      console.log('');
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const parsedUrl = parse(req.url || '', true);
    const pathname = parsedUrl.pathname || '';
    const method = req.method || 'GET';

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      // Route handling
      if (pathname === '/api/agents/stats' && method === 'GET') {
        await this.handleStats(req, res);
      } else if (pathname === '/api/agents/search' && method === 'GET') {
        await this.handleSearch(req, res, parsedUrl.query);
      } else if (pathname.startsWith('/api/agents/category/') && method === 'GET') {
        const category = decodeURIComponent(pathname.split('/').pop() || '');
        await this.handleCategory(req, res, category);
      } else if (pathname === '/api/agents/tools' && method === 'GET') {
        await this.handleTools(req, res, parsedUrl.query);
      } else if (pathname === '/api/agents/projects' && method === 'GET') {
        await this.handleProjects(req, res);
      } else if (pathname === '/api/agents/projects/analyze' && method === 'POST') {
        await this.handleAnalyzeProject(req, res);
      } else if (pathname.startsWith('/api/agents/recommendations/') && method === 'GET') {
        const projectId = parseInt(pathname.split('/').pop() || '0');
        await this.handleRecommendations(req, res, projectId);
      } else if (pathname === '/api/agents/survey' && method === 'POST') {
        await this.handleSurvey(req, res);
      } else if (pathname === '/api/agents/profile' && method === 'GET') {
        await this.handleGetProfile(req, res);
      } else if (pathname === '/api/agents/profile' && method === 'POST') {
        await this.handleSetProfile(req, res);
      } else {
        this.sendResponse(res, 404, { error: 'Endpoint not found' });
      }
    } catch (error) {
      console.error('API Error:', error);
      this.sendResponse(res, 500, {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleStats(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const stats = this.db.getStats();
    this.sendResponse(res, 200, stats);
  }

  private async handleSearch(
    req: IncomingMessage,
    res: ServerResponse,
    query: any
  ): Promise<void> {
    const searchQuery = query.q as string;

    if (!searchQuery) {
      this.sendResponse(res, 400, { error: 'Query parameter "q" is required' });
      return;
    }

    const filters: any = {};
    if (query.category) filters.category = query.category;
    if (query.source) filters.source = query.source;
    if (query.open_source) filters.open_source = query.open_source === 'true';

    const results = this.db.searchTools(searchQuery, filters);
    this.sendResponse(res, 200, results);
  }

  private async handleCategory(
    req: IncomingMessage,
    res: ServerResponse,
    category: string
  ): Promise<void> {
    const tools = this.db.getToolsByCategory(category);
    this.sendResponse(res, 200, tools);
  }

  private async handleTools(
    req: IncomingMessage,
    res: ServerResponse,
    query: any
  ): Promise<void> {
    const limit = parseInt(query.limit as string) || 100;
    const offset = parseInt(query.offset as string) || 0;

    const tools = this.db.getAllTools(limit, offset);
    this.sendResponse(res, 200, tools);
  }

  private async handleProjects(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const projects = this.db.getAllProjects();
    this.sendResponse(res, 200, projects);
  }

  private async handleAnalyzeProject(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await this.readRequestBody(req);

    if (!body.path) {
      this.sendResponse(res, 400, { error: 'Project path is required' });
      return;
    }

    try {
      const project = await this.personalization.analyzeProject(body.path, body.name);
      this.sendResponse(res, 200, project);
    } catch (error) {
      this.sendResponse(res, 500, {
        error: 'Failed to analyze project',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleRecommendations(
    req: IncomingMessage,
    res: ServerResponse,
    projectId: number
  ): Promise<void> {
    if (!projectId) {
      // Get personalized recommendations based on user profile
      const tools = this.personalization.getPersonalizedRecommendations();
      this.sendResponse(res, 200, tools);
      return;
    }

    try {
      const recommendations = await this.personalization.generateRecommendations(projectId);
      this.sendResponse(res, 200, recommendations);
    } catch (error) {
      this.sendResponse(res, 500, {
        error: 'Failed to generate recommendations',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleSurvey(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await this.readRequestBody(req);
    const source = body.source;

    try {
      if (source) {
        await this.orchestrator.runOnDemand(source);
      } else {
        await this.orchestrator.runSurvey();
      }
      this.sendResponse(res, 200, { success: true, message: 'Survey completed' });
    } catch (error) {
      this.sendResponse(res, 500, {
        error: 'Survey failed',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleGetProfile(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const profile = this.db.getUserProfile();
    this.sendResponse(res, 200, profile);
  }

  private async handleSetProfile(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await this.readRequestBody(req);

    if (!body.preferences) {
      this.sendResponse(res, 400, { error: 'Preferences are required' });
      return;
    }

    try {
      this.personalization.setUserPreferences(body.preferences);
      this.sendResponse(res, 200, { success: true, message: 'Profile updated' });
    } catch (error) {
      this.sendResponse(res, 500, {
        error: 'Failed to update profile',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async readRequestBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => (body += chunk.toString()));
      req.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'));
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  }

  private sendResponse(res: ServerResponse, status: number, data: any): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    await this.orchestrator.shutdown();
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new APIServer();

  server.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Shutting down API server...');
    await server.stop();
    process.exit(0);
  });
}
