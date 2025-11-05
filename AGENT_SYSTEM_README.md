# 🤖 AI Agent Survey System

## Quick Start

An intelligent multi-agent system that surveys the internet **3 times daily** to discover and catalog AI tools, interfaces, and applications.

### Features

✅ **Automated Surveys** - Runs 3x daily (06:00, 14:00, 22:00 UTC)
✅ **Multi-Source** - HuggingFace, GitHub, YouTube, arXiv, Papers with Code
✅ **Smart Categorization** - Auto-categorizes by capabilities
✅ **Personalization** - Analyzes your projects and recommends tools
✅ **Full-Text Search** - Powerful search across all data
✅ **Interactive UI** - Both CLI and web dashboard
✅ **User Override** - Full control over all features

---

## Installation (5 minutes)

### Step 1: Setup Agents
```bash
npm run agents:setup
```

### Step 2: Configure (Optional)
```bash
cd agents
nano .env
```
Add your API keys:
- `YOUTUBE_API_KEY` - For YouTube surveys
- `GITHUB_TOKEN` - For higher GitHub rate limits

### Step 3: Run First Survey
```bash
npm run agents:test
```
This populates the database with initial data (~2-5 minutes)

---

## Usage

### Option 1: Interactive CLI (Recommended for First Use)
```bash
npm run agents:cli
```

Try these commands:
```
> search LLM agents
> category Computer Vision
> analyze /path/to/your/project
> recommend 1
> stats
```

### Option 2: Automated Agent (3x Daily Surveys)
```bash
npm run agents:start
```
Runs in the background and surveys automatically at:
- 06:00 UTC
- 14:00 UTC
- 22:00 UTC

### Option 3: Web Dashboard
```bash
# Terminal 1: Start API server
npm run agents:api

# Terminal 2: Start web app
npm run dev
```
Then open http://localhost:5173

---

## Common Tasks

### Search for AI Tools
```bash
npm run agents:cli

> search "text generation"
> search "computer vision framework"
> category LLM
```

### Analyze Your Project
```bash
> analyze /path/to/your/project
> recommend 1  # Get AI tool recommendations
```

### Manual Survey
```bash
npm run agents:survey        # Survey all sources
npm run agents:survey huggingface  # Specific source
```

### View Statistics
```bash
npm run agents:stats
```

---

## Project Structure

```
agents/
├── config.json              # Main configuration
├── orchestrator.ts          # Main agent controller (3x daily scheduler)
├── cli.ts                   # Interactive CLI
├── database/
│   ├── manager.ts          # Database operations
│   └── schema.sql          # Database schema
├── surveyors/
│   ├── baseSurveyor.ts    # Base surveyor class
│   ├── huggingfaceSurveyor.ts
│   ├── githubSurveyor.ts
│   ├── youtubeSurveyor.ts
│   └── arxivSurveyor.ts
├── personalization/
│   └── engine.ts           # Project analysis & recommendations
└── api/
    └── server.ts           # REST API server
```

---

## Configuration

### Survey Schedule

Edit `agents/config.json`:

```json
{
  "survey_schedule": {
    "runs_per_day": 3,
    "times": ["06:00", "14:00", "22:00"]
  }
}
```

### Enable/Disable Sources

```json
{
  "data_sources": {
    "youtube": { "enabled": true },
    "huggingface": { "enabled": true },
    "github": { "enabled": true },
    "arxiv": { "enabled": true }
  }
}
```

---

## Architecture

```
┌─────────────────────────────────┐
│    Agent Orchestrator           │
│  (3x daily scheduler)            │
└──────────┬──────────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼──────┐  ┌──▼──────────┐
│Surveyors │  │Personalization│
│          │  │   Engine     │
│HuggingFace│ └──┬──────────┘
│GitHub    │     │
│YouTube   │  ┌──▼──────┐
│arXiv     │  │Database │
└───┬──────┘  └──┬──────┘
    │            │
    └──────┬─────┘
           │
    ┌──────▼──────┐
    │  API Server │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Web UI    │
    └─────────────┘
```

---

## Data Sources

| Source | What It Surveys | Update Frequency |
|--------|----------------|------------------|
| **HuggingFace** | Models, datasets, spaces | 3x daily |
| **GitHub** | Trending AI repos | 3x daily |
| **YouTube** | AI tool tutorials, demos | 3x daily |
| **arXiv** | Latest research papers | 3x daily |
| **Papers with Code** | Research + implementations | Coming soon |
| **Reddit** | Community discussions | Coming soon |

---

## Examples

### Example 1: Find Tools for Your Project

```bash
$ npm run agents:cli

> analyze ./my-react-app
✅ Project analyzed (ID: 1)
   Tech Stack: React, TypeScript, Node.js
   AI Needs: chatbot, natural language

> recommend 1
🎯 Top 5 Recommendations:

1. LangChain (92% match)
   Build LLM applications with composability
   Open source | API available
   https://github.com/hwchase17/langchain

2. OpenAI GPT-4 (88% match)
   Most capable LLM for chat applications
   API available
   https://openai.com/gpt-4

...
```

### Example 2: Search by Category

```bash
> category Computer Vision
📁 Computer Vision (127 tools)

1. Stable Diffusion
   Text-to-image generation model
   ⭐ 95.2 | 🔓 Open Source

2. YOLO v8
   Real-time object detection
   ⭐ 88.3 | 🔓 Open Source
```

### Example 3: Automated Background Surveys

```bash
$ npm run agents:start

🤖 Agent Orchestrator initialized
🔄 Survey schedule: 3x per day
⏰ Times: 06:00, 14:00, 22:00

✅ Orchestrator is now running

[06:00 UTC]
🔍 Starting survey run...
[HuggingFace] Starting survey...
[HuggingFace] Survey completed (42 discovered, 18 updated)
[GitHub] Starting survey...
[GitHub] Survey completed (35 discovered, 12 updated)
...

📊 Database Statistics:
   Total AI Tools: 1,523
   Tools by Category:
     - LLM: 234
     - Computer Vision: 189
     - NLP: 156
```

---

## Personalization

The system learns from:
- Your project tech stacks
- Your search history
- Your preferences
- Tools you accept/reject

It provides:
- Relevance-scored recommendations
- Category suggestions
- Learning resources
- Use case examples

---

## API Reference

### Base URL
```
http://localhost:3001/api/agents
```

### Key Endpoints

- `GET /stats` - System statistics
- `GET /search?q=query` - Search tools
- `GET /category/:name` - Tools by category
- `GET /tools` - List all tools
- `GET /projects` - Your projects
- `POST /projects/analyze` - Analyze project
- `GET /recommendations/:id` - Get recommendations
- `POST /survey` - Manual survey

Full API docs: See `AI_SURVEY_SYSTEM_GUIDE.md`

---

## Troubleshooting

**Q: YouTube surveys failing?**
A: Add `YOUTUBE_API_KEY` to `agents/.env`

**Q: GitHub rate limit errors?**
A: Add `GITHUB_TOKEN` to `agents/.env`

**Q: No search results?**
A: Run `npm run agents:test` to populate database

**Q: How much disk space?**
A: ~10-50MB for database after full survey

**Q: Can I change survey times?**
A: Yes! Edit `agents/config.json`

---

## Advanced

### Create Custom Surveyor

```typescript
// agents/surveyors/myCustomSurveyor.ts
import { BaseSurveyor, SurveyResult } from './baseSurveyor.js';

export class MyCustomSurveyor extends BaseSurveyor {
  async survey(): Promise<SurveyResult> {
    // Implement your surveying logic
    // Return discovered tools
  }
}
```

### Database Queries

```typescript
import { DatabaseManager } from './database/manager.js';

const db = new DatabaseManager();
const tools = db.searchTools('machine learning');
const cvTools = db.getToolsByCategory('Computer Vision');
```

---

## Complete Documentation

For comprehensive documentation, see:
- **`AI_SURVEY_SYSTEM_GUIDE.md`** - Complete guide (15,000+ words)
- **`agents/README.md`** - Technical details

---

## Support & Contributing

- 🐛 Report issues
- 💡 Suggest features
- 🤝 Contribute surveyors
- 📖 Improve docs

---

## License

MIT

---

**Built with TypeScript, Node.js, SQLite, and React**

🚀 Start surveying: `npm run agents:start`
