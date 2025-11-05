-- AI Knowledge Survey Database Schema

-- Main AI Tools/Interfaces Table
CREATE TABLE IF NOT EXISTS ai_tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT,
    source TEXT NOT NULL, -- youtube, huggingface, github, etc.
    category TEXT, -- LLM, CV, NLP, Agent, etc.
    subcategory TEXT,
    capabilities TEXT, -- JSON array of capabilities
    api_available BOOLEAN DEFAULT 0,
    open_source BOOLEAN DEFAULT 0,
    pricing_model TEXT, -- free, freemium, paid, enterprise
    first_discovered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    popularity_score REAL DEFAULT 0,
    relevance_score REAL DEFAULT 0,
    metadata TEXT -- JSON for additional flexible data
);

-- Functions/Capabilities Catalog
CREATE TABLE IF NOT EXISTS capabilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    use_cases TEXT -- JSON array
);

-- Tool-Capability Relationships
CREATE TABLE IF NOT EXISTS tool_capabilities (
    tool_id INTEGER,
    capability_id INTEGER,
    proficiency_level TEXT, -- basic, intermediate, advanced
    FOREIGN KEY (tool_id) REFERENCES ai_tools(id) ON DELETE CASCADE,
    FOREIGN KEY (capability_id) REFERENCES capabilities(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, capability_id)
);

-- Survey Runs Log
CREATE TABLE IF NOT EXISTS survey_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source TEXT NOT NULL,
    items_discovered INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    status TEXT, -- success, partial, failed
    error_log TEXT,
    duration_seconds REAL
);

-- User Profile
CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    category TEXT, -- skills, interests, projects, preferences
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Projects
CREATE TABLE IF NOT EXISTS user_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT,
    description TEXT,
    tech_stack TEXT, -- JSON array
    ai_needs TEXT, -- JSON array of needed capabilities
    last_analyzed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tool Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER,
    user_project_id INTEGER,
    relevance_score REAL,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, dismissed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES ai_tools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_project_id) REFERENCES user_projects(id) ON DELETE CASCADE
);

-- Learning Resources
CREATE TABLE IF NOT EXISTS learning_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER,
    title TEXT NOT NULL,
    url TEXT,
    type TEXT, -- tutorial, documentation, video, article, course
    difficulty TEXT, -- beginner, intermediate, advanced
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES ai_tools(id) ON DELETE CASCADE
);

-- Search History and Analytics
CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    results_count INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filters TEXT -- JSON
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tools_category ON ai_tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_source ON ai_tools(source);
CREATE INDEX IF NOT EXISTS idx_tools_popularity ON ai_tools(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_tools_updated ON ai_tools(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_capabilities_category ON capabilities(category);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON recommendations(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_survey_runs_time ON survey_runs(run_time DESC);

-- Full-text search virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS ai_tools_fts USING fts5(
    name,
    description,
    capabilities,
    content=ai_tools,
    content_rowid=id
);

-- Triggers to keep FTS table in sync
CREATE TRIGGER IF NOT EXISTS ai_tools_ai AFTER INSERT ON ai_tools BEGIN
    INSERT INTO ai_tools_fts(rowid, name, description, capabilities)
    VALUES (new.id, new.name, new.description, new.capabilities);
END;

CREATE TRIGGER IF NOT EXISTS ai_tools_ad AFTER DELETE ON ai_tools BEGIN
    DELETE FROM ai_tools_fts WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS ai_tools_au AFTER UPDATE ON ai_tools BEGIN
    UPDATE ai_tools_fts
    SET name = new.name, description = new.description, capabilities = new.capabilities
    WHERE rowid = new.id;
END;
