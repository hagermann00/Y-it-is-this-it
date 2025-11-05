# 🤖 AI Knowledge Survey System - Complete Guide

## Overview

The AI Knowledge Survey System is an intelligent agent-based platform that automatically surveys the entire internet 3 times daily to discover, catalog, and recommend AI tools, interfaces, and applications. It maintains a comprehensive, searchable database of the AI landscape and provides personalized recommendations based on your projects and preferences.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Personalization](#personalization)
7. [API Reference](#api-reference)
8. [Advanced Topics](#advanced-topics)

## Features

### Core Features

- **Automated Surveys (3x Daily)**
  - Scheduled runs at 06:00, 14:00, and 22:00 UTC
  - Parallel execution across multiple data sources
  - Intelligent rate limiting and retry logic
  - Comprehensive error handling and logging

- **Multi-Source Data Collection**
  - **HuggingFace**: Models, datasets, spaces
  - **GitHub**: Trending AI repositories
  - **YouTube**: Tutorials, tool demos, releases
  - **arXiv**: Latest research papers
  - **Papers with Code**: Research + implementations
  - **Reddit**: Community discussions (planned)

- **Smart Categorization**
  - Automatic category detection (LLM, CV, NLP, etc.)
  - Capability extraction from descriptions
  - Subcategory classification
  - Popularity scoring

- **Personalization Engine**
  - Project analysis (auto-detect tech stack)
  - AI needs inference
  - Relevance-scored recommendations
  - User preference learning

- **Powerful Search**
  - Full-text search with SQLite FTS5
  - Category filtering
  - Source filtering
  - Open-source filtering
  - Multi-criteria ranking

- **Flexible Interfaces**
  - Interactive CLI
  - Web dashboard (React-based)
  - REST API
  - Programmatic access

- **User Override System**
  - Full configuration control
  - Manual survey triggers
  - Custom schedules
  - Source enable/disable

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Orchestrator                     │
│  • Schedules surveys (3x daily configurable)            │
│  • Manages surveyor lifecycle                           │
│  • Handles errors and retries                           │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼────────┐ ┌───▼─────────┐ ┌──▼─────────────┐
│   Surveyors    │ │Personalization│Database Manager│
│                │ │    Engine     │                │
│ • HuggingFace  │ │               │ • SQLite DB    │
│ • GitHub       │ │ • Project     │ • FTS Search   │
│ • YouTube      │ │   Analysis    │ • Indexes      │
│ • arXiv        │ │ • Recommend-  │ • Migrations   │
│ • PapersWCode  │ │   ations      │                │
└────────┬───────┘ └───────┬───────┘ └───────┬────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼──────┐
                    │  API Server │
                    │  (REST API) │
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                │                     │
         ┌──────▼──────┐      ┌──────▼──────┐
         │     CLI     │      │  Web UI     │
         │ Interactive │      │  Dashboard  │
         └─────────────┘      └─────────────┘
```

### Component Details

#### 1. Agent Orchestrator
- Central controller for all survey operations
- Manages scheduling using Node.js timers
- Coordinates surveyor execution (staggered starts)
- Logs all operations to database
- Provides statistics and monitoring

#### 2. Surveyors (Base + Implementations)
- **BaseSurveyor**: Abstract class with common functionality
  - Retry logic with exponential backoff
  - Rate limiting
  - Popularity scoring algorithms
  - Category detection
  - Capability extraction

- **HuggingFaceSurveyor**:
  - API: `/api/models`, `/api/spaces`
  - Fetches trending models and applications
  - Maps pipeline tags to categories

- **GitHubSurveyor**:
  - GitHub REST API v3
  - Searches by topics and recency
  - Extracts README for better context

- **YouTubeSurveyor**:
  - YouTube Data API v3
  - Searches by keywords
  - Extracts tool mentions

- **ArXivSurveyor**:
  - arXiv API with XML parsing
  - Filters for tool/framework papers
  - Detects code availability

#### 3. Database Manager
- SQLite with WAL mode for concurrency
- Full-text search (FTS5)
- Automatic schema migration
- Backup support
- CRUD operations for all entities

#### 4. Personalization Engine
- Project directory scanning
- Tech stack detection (package.json, requirements.txt, etc.)
- AI needs inference from README/docs
- Relevance scoring algorithm
- Recommendation generation

#### 5. API Server
- HTTP server with CORS support
- RESTful endpoints
- JSON responses
- Error handling

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Steps

1. **Navigate to agents directory**
   ```bash
   cd agents
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run setup script**
   ```bash
   npm run setup
   ```

4. **Configure API keys (optional)**
   ```bash
   # Edit .env file
   nano .env
   ```

5. **Build TypeScript**
   ```bash
   npm run build
   ```

6. **Run initial survey**
   ```bash
   npm run test
   ```

## Configuration

### Main Configuration (`config.json`)

```json
{
  "survey_schedule": {
    "runs_per_day": 3,
    "times": ["06:00", "14:00", "22:00"],
    "timezone": "UTC"
  },
  "data_sources": {
    "youtube": { "enabled": true },
    "huggingface": { "enabled": true },
    "github": { "enabled": true },
    "arxiv": { "enabled": true }
  },
  "personalization": {
    "enabled": true,
    "auto_analyze_projects": true,
    "require_user_approval": false,
    "user_override_enabled": true
  },
  "database": {
    "path": "./data/ai_knowledge.db",
    "backup_enabled": true,
    "backup_frequency": "daily"
  }
}
```

### Environment Variables (`.env`)

```bash
# API Keys
YOUTUBE_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here

# Server
PORT=3001

# Database
DATABASE_PATH=./data/ai_knowledge.db

# Scheduling (overrides config.json)
SURVEY_TIMES=06:00,14:00,22:00
```

## Usage

### CLI Interface

```bash
npm run cli
```

#### Available Commands

```
🔍 SEARCH & DISCOVERY
  search <query>           - Search for AI tools
  category <name>          - List tools by category
  tool <name>              - Show tool details
  list <type>              - List tools/categories/projects

🤖 SURVEY OPERATIONS
  survey [source]          - Run survey
  start                    - Start automated surveys
  stop                     - Stop automated surveys
  stats                    - Show statistics

👤 PERSONALIZATION
  analyze <path>           - Analyze project
  recommend [project_id]   - Get recommendations
  profile <action>         - Manage profile

📤 DATA MANAGEMENT
  export <format>          - Export data
```

#### Example Session

```bash
> search LLM agents
Found 15 results:

1. AutoGPT
   An experimental open-source attempt to make GPT-4 fully autonomous
   Category: Agent | Source: github
   URL: https://github.com/Significant-Gravitas/AutoGPT

2. LangChain
   Building applications with LLMs through composability
   Category: LLM | Source: github
   URL: https://github.com/hwchase17/langchain

> category Computer Vision
📁 Computer Vision (42 tools):

1. Stable Diffusion
   ...

> analyze ./my-project
🔍 Analyzing project: ./my-project
✅ Project Analysis Complete

  Tech Stack: TypeScript, React, Node.js
  AI Needs: LLM integration, natural language processing
  Project ID: 1

> recommend 1
🎯 Generating recommendations for project 1...

Top 10 Recommendations:

1. OpenAI API (95% match)
   Official OpenAI API client for Node.js
   Reason: Highly relevant. Supports: LLM integration, NLP. API available.
   https://github.com/openai/openai-node
```

### Automated Agent Mode

```bash
# Start continuous operation with 3x daily surveys
npm start

# Output:
🤖 Agent Orchestrator initialized
📊 Database: ./data/ai_knowledge.db
🔄 Survey schedule: 3x per day
⏰ Times: 06:00, 14:00, 22:00

🚀 Starting Agent Orchestrator...

⏰ Survey scheduled for 2025-11-05 06:00:00
⏰ Survey scheduled for 2025-11-05 14:00:00
⏰ Survey scheduled for 2025-11-05 22:00:00

✅ Orchestrator is now running
   Press Ctrl+C to stop
```

### API Server Mode

```bash
npm run api

# Access at http://localhost:3001
```

### Web Interface

```bash
# Start API server
cd agents && npm run api

# In another terminal, start React app
cd .. && npm run dev

# Open http://localhost:5173
# Navigate to AI Survey Dashboard
```

## Personalization

### Analyzing Projects

The system can automatically analyze your projects:

```bash
> analyze /path/to/project
```

**What it detects:**
- Programming languages (from file extensions)
- Frameworks (from package.json, requirements.txt, etc.)
- Tech stack (React, Django, Express, etc.)
- AI needs (from README, docs, code comments)

**Example Output:**
```
Tech Stack: Python, FastAPI, PostgreSQL
AI Needs: text generation, semantic search, embeddings
```

### Getting Recommendations

Based on project analysis:

```bash
> recommend 1
```

**Relevance Scoring:**
- AI needs match (40%)
- Tech stack compatibility (30%)
- Category relevance (20%)
- Popularity boost (10%)

**Example Recommendation:**
```
1. LangChain (88% match)
   Reason: Highly relevant. Supports: text generation, semantic search.
          Open source. API available. Popular tool.
```

### User Preferences

Set your preferences for personalized results:

```javascript
{
  interests: ['natural language processing', 'computer vision'],
  skills: ['Python', 'JavaScript', 'ML'],
  preferred_categories: ['LLM', 'NLP', 'Agent'],
  learning_style: 'hands-on',
  experience_level: 'intermediate',
  use_cases: ['chatbots', 'content generation', 'automation']
}
```

## API Reference

### Base URL
```
http://localhost:3001/api/agents
```

### Endpoints

#### GET `/stats`
Get system statistics

**Response:**
```json
{
  "total_tools": 1523,
  "total_capabilities": 87,
  "successful_surveys": 45,
  "last_survey_run": "2025-11-05T14:00:00Z",
  "tools_by_category": {
    "LLM": 234,
    "Computer Vision": 189,
    "NLP": 156
  }
}
```

#### GET `/search?q=<query>&category=<cat>&source=<src>&open_source=<bool>`
Search tools

**Parameters:**
- `q` (required): Search query
- `category` (optional): Filter by category
- `source` (optional): Filter by source
- `open_source` (optional): true/false

**Response:**
```json
[
  {
    "id": 1,
    "name": "GPT-4",
    "description": "...",
    "url": "...",
    "source": "openai",
    "category": "LLM",
    "capabilities": ["text generation", "reasoning"],
    "popularity_score": 95.5
  }
]
```

#### GET `/category/:name`
Get tools by category

#### GET `/tools?limit=<n>&offset=<m>`
List all tools (paginated)

#### GET `/projects`
List user projects

#### POST `/projects/analyze`
Analyze a project

**Request Body:**
```json
{
  "path": "/path/to/project",
  "name": "My Project"
}
```

#### GET `/recommendations/:projectId`
Get recommendations for project

#### POST `/survey`
Trigger manual survey

**Request Body:**
```json
{
  "source": "huggingface"  // optional
}
```

#### GET/POST `/profile`
Get or set user profile

## Advanced Topics

### Custom Surveyor

Create a new surveyor:

```typescript
import { BaseSurveyor, SurveyResult } from './baseSurveyor.js';
import { AITool } from '../database/manager.js';

export class MyCustomSurveyor extends BaseSurveyor {
  async survey(): Promise<SurveyResult> {
    const tools: AITool[] = [];
    const errors: string[] = [];
    let discovered = 0;
    let updated = 0;

    try {
      // Fetch data from your source
      const data = await this.fetchWithRetry('https://api.example.com/tools');

      // Process and store
      for (const item of data) {
        const tool: AITool = {
          name: item.name,
          description: item.description,
          url: item.url,
          source: 'my-source',
          category: this.categorizeByKeywords(item.description),
          // ... more fields
        };

        const existing = this.db.getToolByUrl(tool.url!);
        if (existing) {
          this.db.updateTool(existing.id!, tool);
          updated++;
        } else {
          this.db.insertTool(tool);
          discovered++;
        }
        tools.push(tool);
      }
    } catch (error) {
      errors.push(error.message);
    }

    return {
      tools,
      stats: { discovered, updated, errors: errors.length },
      errors
    };
  }
}
```

### Database Queries

Direct database access:

```typescript
import { DatabaseManager } from './database/manager.js';

const db = new DatabaseManager('./data/ai_knowledge.db');

// Full-text search
const results = db.searchTools('machine learning framework', {
  category: 'ML Framework',
  open_source: true
});

// Get by category
const cvTools = db.getToolsByCategory('Computer Vision');

// Statistics
const stats = db.getStats();

// Custom queries
const stmt = db.db.prepare('SELECT * FROM ai_tools WHERE popularity_score > ?');
const popular = stmt.all(80);
```

### Backup and Export

```bash
# Backup database
cp ./data/ai_knowledge.db ./data/backups/backup_$(date +%Y%m%d).db

# Export to JSON
sqlite3 ./data/ai_knowledge.db ".output tools.json" "SELECT json_group_array(json_object('name', name, 'url', url)) FROM ai_tools"

# Export to CSV
sqlite3 ./data/ai_knowledge.db -header -csv "SELECT * FROM ai_tools" > tools.csv
```

### Monitoring

```bash
# Watch survey logs
tail -f ./logs/surveys.log

# Monitor database size
watch -n 60 'du -h ./data/ai_knowledge.db'

# Check survey status
npm run stats
```

## Troubleshooting

**Problem**: YouTube surveys failing
- **Solution**: Add `YOUTUBE_API_KEY` to `.env`

**Problem**: GitHub rate limit exceeded
- **Solution**: Add `GITHUB_TOKEN` to `.env`

**Problem**: Database is locked
- **Solution**: Ensure only one process accesses DB, or use WAL mode (default)

**Problem**: Surveys take too long
- **Solution**: Disable some sources in `config.json` or increase stagger time

**Problem**: No recommendations
- **Solution**: Run surveys first to populate database

## Best Practices

1. **API Keys**: Always use API keys for better rate limits
2. **Backups**: Enable automatic backups in config
3. **Monitoring**: Check stats regularly
4. **Customization**: Adjust survey times to your timezone
5. **Disk Space**: Monitor database growth (typical: 10-50MB after full survey)
6. **Updates**: Run surveys manually after updates to get latest data

## Roadmap

- [ ] More data sources (Product Hunt, Hacker News)
- [ ] Email notifications for new relevant tools
- [ ] Slack/Discord integration
- [ ] ML-based relevance scoring
- [ ] Collaborative filtering recommendations
- [ ] Browser extension
- [ ] Mobile app

## Support

For issues, questions, or contributions, please refer to the project repository.

---

Built with ❤️ using TypeScript, Node.js, SQLite, and React
