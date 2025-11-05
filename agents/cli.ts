#!/usr/bin/env node

import { DatabaseManager } from './database/manager.js';
import { AgentOrchestrator } from './orchestrator.js';
import { PersonalizationEngine } from './personalization/engine.js';
import { createInterface } from 'readline';
import { stdin as input, stdout as output } from 'process';

const rl = createInterface({ input, output });

class InteractiveCLI {
  private db: DatabaseManager;
  private orchestrator: AgentOrchestrator;
  private personalization: PersonalizationEngine;
  private isRunning: boolean = false;

  constructor() {
    console.log('\n🤖 AI Knowledge Survey System');
    console.log('═'.repeat(50) + '\n');

    this.db = new DatabaseManager('./data/ai_knowledge.db');
    this.orchestrator = new AgentOrchestrator();
    this.personalization = new PersonalizationEngine(this.db);
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.printHelp();
    this.promptUser();
  }

  private promptUser(): void {
    if (!this.isRunning) return;

    rl.question('\n> ', async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        this.promptUser();
        return;
      }

      await this.handleCommand(trimmed);
      this.promptUser();
    });
  }

  private async handleCommand(input: string): Promise<void> {
    const [command, ...args] = input.split(' ');

    try {
      switch (command.toLowerCase()) {
        case 'help':
          this.printHelp();
          break;

        case 'search':
          await this.handleSearch(args.join(' '));
          break;

        case 'category':
          await this.handleCategory(args[0]);
          break;

        case 'survey':
          await this.handleSurvey(args[0]);
          break;

        case 'stats':
          await this.handleStats();
          break;

        case 'analyze':
          await this.handleAnalyzeProject(args.join(' '));
          break;

        case 'recommend':
          await this.handleRecommendations(args[0] ? parseInt(args[0]) : undefined);
          break;

        case 'profile':
          await this.handleProfile(args);
          break;

        case 'list':
          await this.handleList(args[0]);
          break;

        case 'tool':
          await this.handleToolDetails(args.join(' '));
          break;

        case 'export':
          await this.handleExport(args[0]);
          break;

        case 'start':
          await this.orchestrator.start();
          break;

        case 'stop':
          this.orchestrator.stop();
          break;

        case 'clear':
          console.clear();
          break;

        case 'exit':
        case 'quit':
          await this.handleExit();
          break;

        default:
          console.log(`❌ Unknown command: ${command}`);
          console.log('Type "help" for available commands');
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    }
  }

  private printHelp(): void {
    console.log('📚 Available Commands:\n');
    console.log('  🔍 SEARCH & DISCOVERY');
    console.log('    search <query>           Search for AI tools');
    console.log('    category <name>          List tools by category');
    console.log('    tool <name>              Show detailed tool information');
    console.log('    list <type>              List tools, categories, or projects');
    console.log('');
    console.log('  🤖 SURVEY OPERATIONS');
    console.log('    survey [source]          Run survey (all or specific source)');
    console.log('    start                    Start automated 3x daily surveys');
    console.log('    stop                     Stop automated surveys');
    console.log('    stats                    Show database statistics');
    console.log('');
    console.log('  👤 PERSONALIZATION');
    console.log('    analyze <path>           Analyze a project directory');
    console.log('    recommend [project_id]   Get personalized recommendations');
    console.log('    profile <action> [data]  Manage user profile');
    console.log('');
    console.log('  📤 DATA MANAGEMENT');
    console.log('    export <format>          Export data (json, csv, md)');
    console.log('');
    console.log('  ⚙️  SYSTEM');
    console.log('    help                     Show this help message');
    console.log('    clear                    Clear screen');
    console.log('    exit/quit                Exit the program');
    console.log('');
  }

  private async handleSearch(query: string): Promise<void> {
    if (!query) {
      console.log('❌ Please provide a search query');
      return;
    }

    console.log(`\n🔍 Searching for: "${query}"\n`);

    const results = this.db.searchTools(query);

    if (results.length === 0) {
      console.log('No results found');
      return;
    }

    console.log(`Found ${results.length} results:\n`);

    for (let i = 0; i < Math.min(results.length, 10); i++) {
      const tool = results[i];
      console.log(`${i + 1}. ${tool.name}`);
      console.log(`   ${tool.description?.substring(0, 100)}...`);
      console.log(`   Category: ${tool.category} | Source: ${tool.source}`);
      console.log(`   URL: ${tool.url}`);
      console.log('');
    }

    if (results.length > 10) {
      console.log(`... and ${results.length - 10} more results`);
    }
  }

  private async handleCategory(category: string): Promise<void> {
    if (!category) {
      // List all categories
      const stats = this.db.getStats();
      console.log('\n📊 Available Categories:\n');

      for (const [cat, count] of Object.entries(stats.tools_by_category)) {
        console.log(`  ${cat}: ${count} tools`);
      }
      return;
    }

    const tools = this.db.getToolsByCategory(category);

    if (tools.length === 0) {
      console.log(`No tools found in category: ${category}`);
      return;
    }

    console.log(`\n📁 ${category} (${tools.length} tools):\n`);

    for (let i = 0; i < Math.min(tools.length, 15); i++) {
      const tool = tools[i];
      console.log(`${i + 1}. ${tool.name}`);
      console.log(`   ${tool.description?.substring(0, 80)}...`);
      console.log(`   Popularity: ${tool.popularity_score?.toFixed(1)} | ${tool.url}`);
      console.log('');
    }
  }

  private async handleSurvey(source?: string): Promise<void> {
    if (source) {
      console.log(`\n🔍 Running ${source} survey...\n`);
      await this.orchestrator.runOnDemand(source);
    } else {
      console.log('\n🔍 Running full survey...\n');
      await this.orchestrator.runSurvey();
    }
  }

  private async handleStats(): Promise<void> {
    const stats = this.db.getStats();

    console.log('\n📊 System Statistics:\n');
    console.log(`  Total AI Tools: ${stats.total_tools}`);
    console.log(`  Total Capabilities: ${stats.total_capabilities}`);
    console.log(`  Successful Surveys: ${stats.successful_surveys}`);
    console.log(`  Last Survey: ${stats.last_survey_run || 'Never'}`);

    console.log('\n  Tools by Category:');
    for (const [category, count] of Object.entries(stats.tools_by_category)) {
      console.log(`    ${category}: ${count}`);
    }

    const recentSurveys = this.db.getRecentSurveyRuns(5);
    if (recentSurveys.length > 0) {
      console.log('\n  Recent Survey Runs:');
      for (const run of recentSurveys) {
        const status = run.status === 'success' ? '✅' : '❌';
        console.log(`    ${status} ${run.source} - ${run.run_time} (${run.items_discovered} discovered)`);
      }
    }

    console.log('');
  }

  private async handleAnalyzeProject(path: string): Promise<void> {
    if (!path) {
      console.log('❌ Please provide a project path');
      return;
    }

    try {
      const project = await this.personalization.analyzeProject(path);
      console.log('\n✅ Project Analysis Complete\n');
      console.log(`  Name: ${project.name}`);
      console.log(`  Tech Stack: ${project.tech_stack?.join(', ')}`);
      console.log(`  AI Needs: ${project.ai_needs?.join(', ')}`);
      console.log(`  Project ID: ${project.id}`);
      console.log('\nUse "recommend <project_id>" to get tool recommendations');
    } catch (error) {
      console.error('❌ Error analyzing project:', error);
    }
  }

  private async handleRecommendations(projectId?: number): Promise<void> {
    if (!projectId) {
      // Get personalized recommendations based on user profile
      console.log('\n🎯 Personalized Recommendations:\n');
      const tools = this.personalization.getPersonalizedRecommendations();

      for (let i = 0; i < Math.min(tools.length, 10); i++) {
        const tool = tools[i];
        console.log(`${i + 1}. ${tool.name}`);
        console.log(`   ${tool.description?.substring(0, 100)}...`);
        console.log(`   Category: ${tool.category} | Popularity: ${tool.popularity_score?.toFixed(1)}`);
        console.log(`   ${tool.url}`);
        console.log('');
      }
      return;
    }

    // Get recommendations for specific project
    console.log(`\n🎯 Generating recommendations for project ${projectId}...\n`);

    try {
      const recommendations = await this.personalization.generateRecommendations(projectId);

      if (recommendations.length === 0) {
        console.log('No recommendations found');
        return;
      }

      console.log(`Top ${Math.min(recommendations.length, 10)} Recommendations:\n`);

      for (let i = 0; i < Math.min(recommendations.length, 10); i++) {
        const rec = recommendations[i];
        const tool = rec.tool!;

        console.log(`${i + 1}. ${tool.name} (${(rec.relevance_score * 100).toFixed(0)}% match)`);
        console.log(`   ${tool.description?.substring(0, 100)}...`);
        console.log(`   Reason: ${rec.reason}`);
        console.log(`   ${tool.url}`);
        console.log('');
      }
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
    }
  }

  private async handleProfile(args: string[]): Promise<void> {
    const action = args[0];

    if (!action || action === 'show') {
      const profile = this.db.getUserProfile();
      console.log('\n👤 User Profile:\n');
      console.log(JSON.stringify(profile, null, 2));
      console.log('');
      return;
    }

    if (action === 'set') {
      console.log('\n👤 Set User Preferences:\n');
      console.log('This is an interactive setup. Follow the prompts.');
      // In a real implementation, this would be interactive
      console.log('(Use the web interface for easier profile setup)');
      return;
    }

    console.log('Usage: profile [show|set]');
  }

  private async handleList(type: string): Promise<void> {
    if (!type || type === 'tools') {
      const tools = this.db.getAllTools(20);
      console.log(`\n📋 Recent AI Tools (${tools.length} shown):\n`);

      for (let i = 0; i < tools.length; i++) {
        console.log(`${i + 1}. ${tools[i].name} (${tools[i].category})`);
      }
    } else if (type === 'projects') {
      const projects = this.db.getAllProjects();
      console.log(`\n📋 Your Projects (${projects.length}):\n`);

      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        console.log(`${i + 1}. ${p.name} (ID: ${p.id})`);
        console.log(`   Path: ${p.path}`);
        console.log(`   Tech: ${p.tech_stack?.join(', ')}`);
        console.log('');
      }
    } else if (type === 'categories') {
      await this.handleCategory('');
    } else {
      console.log('Usage: list [tools|projects|categories]');
    }

    console.log('');
  }

  private async handleToolDetails(name: string): Promise<void> {
    if (!name) {
      console.log('❌ Please provide a tool name');
      return;
    }

    const results = this.db.searchTools(name);

    if (results.length === 0) {
      console.log('Tool not found');
      return;
    }

    const tool = results[0];

    console.log('\n' + '═'.repeat(60));
    console.log(`📦 ${tool.name}`);
    console.log('═'.repeat(60) + '\n');
    console.log(`Description: ${tool.description}\n`);
    console.log(`URL: ${tool.url}`);
    console.log(`Source: ${tool.source}`);
    console.log(`Category: ${tool.category} / ${tool.subcategory || 'N/A'}`);
    console.log(`Open Source: ${tool.open_source ? 'Yes' : 'No'}`);
    console.log(`API Available: ${tool.api_available ? 'Yes' : 'No'}`);
    console.log(`Pricing: ${tool.pricing_model || 'Unknown'}`);
    console.log(`Popularity Score: ${tool.popularity_score?.toFixed(1) || 'N/A'}`);

    if (tool.capabilities && tool.capabilities.length > 0) {
      console.log(`\nCapabilities: ${tool.capabilities.join(', ')}`);
    }

    if (tool.metadata) {
      console.log('\nAdditional Info:');
      console.log(JSON.stringify(tool.metadata, null, 2));
    }

    console.log('');
  }

  private async handleExport(format: string): Promise<void> {
    console.log(`\n📤 Export feature coming soon! (Format: ${format || 'json'})`);
    console.log('   Will support: JSON, CSV, Markdown\n');
  }

  private async handleExit(): Promise<void> {
    console.log('\n👋 Shutting down...');
    this.isRunning = false;
    await this.orchestrator.shutdown();
    rl.close();
    process.exit(0);
  }
}

// Start the CLI
const cli = new InteractiveCLI();
cli.start();

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Received interrupt signal');
  process.exit(0);
});
