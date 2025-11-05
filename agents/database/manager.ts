import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AITool {
  id?: number;
  name: string;
  description?: string;
  url?: string;
  source: string;
  category?: string;
  subcategory?: string;
  capabilities?: string[];
  api_available?: boolean;
  open_source?: boolean;
  pricing_model?: string;
  first_discovered?: string;
  last_updated?: string;
  popularity_score?: number;
  relevance_score?: number;
  metadata?: Record<string, any>;
}

export interface Capability {
  id?: number;
  name: string;
  description?: string;
  category?: string;
  use_cases?: string[];
}

export interface SurveyRun {
  id?: number;
  run_time?: string;
  source: string;
  items_discovered?: number;
  items_updated?: number;
  status: 'success' | 'partial' | 'failed';
  error_log?: string;
  duration_seconds?: number;
}

export interface UserProject {
  id?: number;
  name: string;
  path?: string;
  description?: string;
  tech_stack?: string[];
  ai_needs?: string[];
  last_analyzed?: string;
}

export interface Recommendation {
  id?: number;
  tool_id: number;
  user_project_id?: number;
  relevance_score: number;
  reason: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'dismissed';
  created_at?: string;
  tool?: AITool;
}

export class DatabaseManager {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath: string = './data/ai_knowledge.db') {
    this.dbPath = dbPath;

    // Ensure data directory exists
    const dataDir = dirname(dbPath);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema statements
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        this.db.exec(statement);
      }
    }
  }

  // AI Tools Methods
  insertTool(tool: AITool): number {
    const stmt = this.db.prepare(`
      INSERT INTO ai_tools (
        name, description, url, source, category, subcategory,
        capabilities, api_available, open_source, pricing_model,
        popularity_score, relevance_score, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      tool.name,
      tool.description,
      tool.url,
      tool.source,
      tool.category,
      tool.subcategory,
      JSON.stringify(tool.capabilities || []),
      tool.api_available ? 1 : 0,
      tool.open_source ? 1 : 0,
      tool.pricing_model,
      tool.popularity_score || 0,
      tool.relevance_score || 0,
      JSON.stringify(tool.metadata || {})
    );

    return result.lastInsertRowid as number;
  }

  updateTool(id: number, tool: Partial<AITool>): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (tool.name !== undefined) {
      updates.push('name = ?');
      values.push(tool.name);
    }
    if (tool.description !== undefined) {
      updates.push('description = ?');
      values.push(tool.description);
    }
    if (tool.url !== undefined) {
      updates.push('url = ?');
      values.push(tool.url);
    }
    if (tool.category !== undefined) {
      updates.push('category = ?');
      values.push(tool.category);
    }
    if (tool.capabilities !== undefined) {
      updates.push('capabilities = ?');
      values.push(JSON.stringify(tool.capabilities));
    }
    if (tool.popularity_score !== undefined) {
      updates.push('popularity_score = ?');
      values.push(tool.popularity_score);
    }

    updates.push('last_updated = CURRENT_TIMESTAMP');
    values.push(id);

    if (updates.length > 0) {
      const stmt = this.db.prepare(`
        UPDATE ai_tools SET ${updates.join(', ')} WHERE id = ?
      `);
      stmt.run(...values);
    }
  }

  getToolByUrl(url: string): AITool | undefined {
    const stmt = this.db.prepare('SELECT * FROM ai_tools WHERE url = ?');
    const row = stmt.get(url) as any;
    return row ? this.parseToolRow(row) : undefined;
  }

  getAllTools(limit: number = 100, offset: number = 0): AITool[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_tools
      ORDER BY popularity_score DESC, last_updated DESC
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(limit, offset) as any[];
    return rows.map(row => this.parseToolRow(row));
  }

  searchTools(query: string, filters?: {
    category?: string;
    source?: string;
    open_source?: boolean;
  }): AITool[] {
    let sql = `
      SELECT ai_tools.* FROM ai_tools_fts
      JOIN ai_tools ON ai_tools.id = ai_tools_fts.rowid
      WHERE ai_tools_fts MATCH ?
    `;
    const params: any[] = [query];

    if (filters?.category) {
      sql += ' AND ai_tools.category = ?';
      params.push(filters.category);
    }
    if (filters?.source) {
      sql += ' AND ai_tools.source = ?';
      params.push(filters.source);
    }
    if (filters?.open_source !== undefined) {
      sql += ' AND ai_tools.open_source = ?';
      params.push(filters.open_source ? 1 : 0);
    }

    sql += ' ORDER BY ai_tools.popularity_score DESC LIMIT 50';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.parseToolRow(row));
  }

  getToolsByCategory(category: string): AITool[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_tools WHERE category = ?
      ORDER BY popularity_score DESC
    `);
    const rows = stmt.all(category) as any[];
    return rows.map(row => this.parseToolRow(row));
  }

  // Capabilities Methods
  insertCapability(capability: Capability): number {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO capabilities (name, description, category, use_cases)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      capability.name,
      capability.description,
      capability.category,
      JSON.stringify(capability.use_cases || [])
    );
    return result.lastInsertRowid as number;
  }

  linkToolCapability(toolId: number, capabilityId: number, proficiency: string = 'intermediate'): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tool_capabilities (tool_id, capability_id, proficiency_level)
      VALUES (?, ?, ?)
    `);
    stmt.run(toolId, capabilityId, proficiency);
  }

  // Survey Runs Methods
  logSurveyRun(run: SurveyRun): number {
    const stmt = this.db.prepare(`
      INSERT INTO survey_runs (source, items_discovered, items_updated, status, error_log, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      run.source,
      run.items_discovered || 0,
      run.items_updated || 0,
      run.status,
      run.error_log,
      run.duration_seconds
    );
    return result.lastInsertRowid as number;
  }

  getRecentSurveyRuns(limit: number = 10): SurveyRun[] {
    const stmt = this.db.prepare(`
      SELECT * FROM survey_runs ORDER BY run_time DESC LIMIT ?
    `);
    return stmt.all(limit) as SurveyRun[];
  }

  // User Profile Methods
  setUserProfile(key: string, value: any, category: string = 'general'): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_profile (key, value, category, last_updated)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(key, typeof value === 'string' ? value : JSON.stringify(value), category);
  }

  getUserProfile(key?: string): Record<string, any> {
    if (key) {
      const stmt = this.db.prepare('SELECT value FROM user_profile WHERE key = ?');
      const row = stmt.get(key) as any;
      if (!row) return {};
      try {
        return JSON.parse(row.value);
      } catch {
        return { value: row.value };
      }
    }

    const stmt = this.db.prepare('SELECT * FROM user_profile');
    const rows = stmt.all() as any[];
    const profile: Record<string, any> = {};
    for (const row of rows) {
      try {
        profile[row.key] = JSON.parse(row.value);
      } catch {
        profile[row.key] = row.value;
      }
    }
    return profile;
  }

  // User Projects Methods
  insertProject(project: UserProject): number {
    const stmt = this.db.prepare(`
      INSERT INTO user_projects (name, path, description, tech_stack, ai_needs)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      project.name,
      project.path,
      project.description,
      JSON.stringify(project.tech_stack || []),
      JSON.stringify(project.ai_needs || [])
    );
    return result.lastInsertRowid as number;
  }

  getAllProjects(): UserProject[] {
    const stmt = this.db.prepare('SELECT * FROM user_projects ORDER BY last_analyzed DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      tech_stack: JSON.parse(row.tech_stack || '[]'),
      ai_needs: JSON.parse(row.ai_needs || '[]')
    }));
  }

  // Recommendations Methods
  insertRecommendation(rec: Recommendation): number {
    const stmt = this.db.prepare(`
      INSERT INTO recommendations (tool_id, user_project_id, relevance_score, reason, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      rec.tool_id,
      rec.user_project_id,
      rec.relevance_score,
      rec.reason,
      rec.status || 'pending'
    );
    return result.lastInsertRowid as number;
  }

  getRecommendations(projectId?: number, status: string = 'pending'): Recommendation[] {
    let sql = `
      SELECT r.*, t.* FROM recommendations r
      JOIN ai_tools t ON r.tool_id = t.id
      WHERE r.status = ?
    `;
    const params: any[] = [status];

    if (projectId) {
      sql += ' AND r.user_project_id = ?';
      params.push(projectId);
    }

    sql += ' ORDER BY r.relevance_score DESC';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => ({
      id: row.id,
      tool_id: row.tool_id,
      user_project_id: row.user_project_id,
      relevance_score: row.relevance_score,
      reason: row.reason,
      status: row.status,
      created_at: row.created_at,
      tool: this.parseToolRow(row)
    }));
  }

  // Statistics Methods
  getStats(): Record<string, any> {
    const toolCount = this.db.prepare('SELECT COUNT(*) as count FROM ai_tools').get() as any;
    const capCount = this.db.prepare('SELECT COUNT(*) as count FROM capabilities').get() as any;
    const surveyCount = this.db.prepare('SELECT COUNT(*) as count FROM survey_runs WHERE status = "success"').get() as any;
    const lastSurvey = this.db.prepare('SELECT MAX(run_time) as last_run FROM survey_runs').get() as any;

    const categoryCounts = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM ai_tools
      WHERE category IS NOT NULL
      GROUP BY category
    `).all() as any[];

    return {
      total_tools: toolCount.count,
      total_capabilities: capCount.count,
      successful_surveys: surveyCount.count,
      last_survey_run: lastSurvey.last_run,
      tools_by_category: categoryCounts.reduce((acc, row) => {
        acc[row.category] = row.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Helper method to parse tool rows
  private parseToolRow(row: any): AITool {
    return {
      ...row,
      capabilities: JSON.parse(row.capabilities || '[]'),
      metadata: JSON.parse(row.metadata || '{}'),
      api_available: Boolean(row.api_available),
      open_source: Boolean(row.open_source)
    };
  }

  close(): void {
    this.db.close();
  }
}
