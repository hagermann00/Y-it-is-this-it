#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🚀 AI Knowledge Survey System - Setup\n');
console.log('═'.repeat(50) + '\n');

// Create necessary directories
const directories = [
  './data',
  './data/backups',
  './logs'
];

console.log('📁 Creating directories...');
for (const dir of directories) {
  const fullPath = join(__dirname, dir);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
    console.log(`  ✓ Created: ${dir}`);
  } else {
    console.log(`  ✓ Exists: ${dir}`);
  }
}

// Create .env.example file
console.log('\n🔧 Creating configuration files...');

const envExample = `# AI Knowledge Survey System - Environment Variables

# YouTube API Key (optional, but recommended for YouTube surveys)
# Get one at: https://console.cloud.google.com/apis/credentials
YOUTUBE_API_KEY=your_youtube_api_key_here

# GitHub API Token (optional, increases rate limits)
# Create at: https://github.com/settings/tokens
GITHUB_TOKEN=your_github_token_here

# API Server Port
PORT=3001

# Database Path (optional, defaults to ./data/ai_knowledge.db)
DATABASE_PATH=./data/ai_knowledge.db

# Survey Schedule (optional, defaults from config.json)
# Format: HH:MM,HH:MM,HH:MM (24-hour format)
SURVEY_TIMES=06:00,14:00,22:00
`;

const envPath = join(__dirname, '.env.example');
writeFileSync(envPath, envExample);
console.log('  ✓ Created: .env.example');

// Create .env file if it doesn't exist
const envFilePath = join(__dirname, '.env');
if (!existsSync(envFilePath)) {
  writeFileSync(envFilePath, envExample);
  console.log('  ✓ Created: .env (please update with your API keys)');
} else {
  console.log('  ✓ Exists: .env');
}

// Create README
const readme = `# AI Knowledge Survey System

🤖 An intelligent agent system that actively surveys the internet 3 times daily to catalog AI tools, interfaces, and applications.

## Features

- **Automated Surveys**: Runs 3 times daily (06:00, 14:00, 22:00 UTC)
- **Multi-Source**: Surveys HuggingFace, GitHub, YouTube, arXiv, Papers with Code, Reddit
- **Smart Categorization**: Automatically categorizes tools by capabilities
- **Personalization**: Analyzes your projects and recommends relevant AI tools
- **Interactive Interface**: Both CLI and web-based dashboards
- **Full-Text Search**: Powerful search across all collected data
- **User Override**: Full control to customize behavior

## Quick Start

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure API Keys (Optional)

Edit \`.env\` file with your API keys:
- YouTube API key (for YouTube surveys)
- GitHub token (for higher rate limits)

### 3. Run Initial Survey

\`\`\`bash
npm run test
\`\`\`

This will run a single survey cycle to populate the database.

### 4. Start the System

**Option A: Interactive CLI**
\`\`\`bash
npm run cli
\`\`\`

**Option B: Automated Agent (3x daily surveys)**
\`\`\`bash
npm start
\`\`\`

**Option C: API Server (for web interface)**
\`\`\`bash
npm run api
\`\`\`

## Usage Examples

### Search for AI Tools

\`\`\`bash
# Interactive CLI
npm run cli

# In CLI, type:
> search LLM agents
> category Computer Vision
> tool GPT-4
\`\`\`

### Analyze Your Project

\`\`\`bash
# In CLI:
> analyze /path/to/your/project
> recommend 1
\`\`\`

### Manual Survey

\`\`\`bash
# Survey all sources
npm run survey

# Survey specific source
npm run survey huggingface
\`\`\`

### View Statistics

\`\`\`bash
npm run stats
\`\`\`

## Configuration

Edit \`config.json\` to customize:

- Survey schedule and times
- Enable/disable specific data sources
- Personalization settings
- Database path
- Auto-backup settings

## CLI Commands

- \`search <query>\` - Search for AI tools
- \`category <name>\` - List tools by category
- \`survey [source]\` - Run manual survey
- \`analyze <path>\` - Analyze a project
- \`recommend [id]\` - Get recommendations
- \`stats\` - View system statistics
- \`profile\` - Manage user profile
- \`start\` - Start automated surveys
- \`stop\` - Stop automated surveys

## Web Interface

The web interface provides:
- Search and browse AI tools
- Category exploration
- Project analysis
- Personalized recommendations
- System statistics

Access at: http://localhost:3001 (when API server is running)

## Architecture

\`\`\`
┌─────────────────────────────────────────┐
│         Agent Orchestrator              │
│  (Schedules 3x daily survey runs)       │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
┌─────▼──────┐         ┌──────▼──────┐
│  Surveyors │         │ Personali-  │
│            │         │   zation    │
│ • HuggingFace        │   Engine    │
│ • GitHub    │        └──────┬──────┘
│ • YouTube   │               │
│ • arXiv     │        ┌──────▼──────┐
│ • Reddit    │        │  Database   │
└─────┬──────┘         │  (SQLite)   │
      │                └──────┬──────┘
      └────────┬──────────────┘
               │
        ┌──────▼──────┐
        │  API Server │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │ Web/CLI UI  │
        └─────────────┘
\`\`\`

## Database Schema

The system uses SQLite with:
- \`ai_tools\` - Catalog of AI tools
- \`capabilities\` - Capability taxonomy
- \`user_projects\` - Your analyzed projects
- \`recommendations\` - Personalized recommendations
- \`survey_runs\` - Survey execution logs
- Full-text search support

## Data Sources

1. **HuggingFace**: Models, datasets, and spaces
2. **GitHub**: Trending AI repositories
3. **YouTube**: AI tool tutorials and releases
4. **arXiv**: Latest AI research papers
5. **Papers with Code**: Research with implementations
6. **Reddit**: Community discussions and new tools

## Personalization

The system can:
- Analyze your project codebases
- Detect tech stack automatically
- Infer AI needs from code and docs
- Generate relevance-scored recommendations
- Learn from your preferences

## Advanced Usage

### Custom Survey Schedule

Edit \`config.json\`:

\`\`\`json
{
  "survey_schedule": {
    "runs_per_day": 3,
    "times": ["06:00", "14:00", "22:00"]
  }
}
\`\`\`

### Enable/Disable Sources

\`\`\`json
{
  "data_sources": {
    "youtube": { "enabled": false },
    "github": { "enabled": true }
  }
}
\`\`\`

### User Override

All automatic features can be overridden via CLI or API.

## Troubleshooting

**Issue**: YouTube survey fails
- Solution: Add YOUTUBE_API_KEY to .env file

**Issue**: GitHub rate limit
- Solution: Add GITHUB_TOKEN to .env file

**Issue**: Database locked
- Solution: Close other connections or wait for current operation

## Contributing

Feel free to add new surveyors or improve existing ones!

## License

MIT
`;

const readmePath = join(__dirname, 'README.md');
writeFileSync(readmePath, readme);
console.log('  ✓ Created: README.md');

// Check if database needs initialization
console.log('\n💾 Checking database...');
const dbPath = join(__dirname, './data/ai_knowledge.db');
if (!existsSync(dbPath)) {
  console.log('  ℹ  Database will be created on first run');
} else {
  console.log('  ✓ Database exists');
}

console.log('\n✅ Setup complete!\n');
console.log('Next steps:');
console.log('  1. Edit .env with your API keys (optional)');
console.log('  2. Run: npm run test (to test with a single survey run)');
console.log('  3. Run: npm run cli (for interactive interface)');
console.log('  4. Run: npm start (to start automated 3x daily surveys)\n');
console.log('For more information, see README.md\n');
