import { DatabaseManager } from './database/manager.js';
import { HuggingFaceSurveyor } from './surveyors/huggingfaceSurveyor.js';
import { GitHubSurveyor } from './surveyors/githubSurveyor.js';
import { YouTubeSurveyor } from './surveyors/youtubeSurveyor.js';
import { ArXivSurveyor } from './surveyors/arxivSurveyor.js';
import { BaseSurveyor } from './surveyors/baseSurveyor.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Config {
  survey_schedule: {
    runs_per_day: number;
    times: string[];
    timezone: string;
  };
  data_sources: Record<string, { enabled: boolean; [key: string]: any }>;
  personalization: {
    enabled: boolean;
    auto_analyze_projects: boolean;
    require_user_approval: boolean;
    user_override_enabled: boolean;
  };
  database: {
    path: string;
    backup_enabled: boolean;
    backup_frequency: string;
  };
}

export class AgentOrchestrator {
  private db: DatabaseManager;
  private config: Config;
  private surveyors: Map<string, BaseSurveyor>;
  private isRunning: boolean = false;
  private scheduledTasks: NodeJS.Timeout[] = [];

  constructor(configPath: string = './config.json') {
    // Load configuration
    const configFile = readFileSync(join(__dirname, configPath), 'utf-8');
    this.config = JSON.parse(configFile);

    // Initialize database
    this.db = new DatabaseManager(this.config.database.path);

    // Initialize surveyors
    this.surveyors = new Map();
    this.initializeSurveyors();

    console.log('🤖 Agent Orchestrator initialized');
    console.log(`📊 Database: ${this.config.database.path}`);
    console.log(`🔄 Survey schedule: ${this.config.survey_schedule.runs_per_day}x per day`);
    console.log(`⏰ Times: ${this.config.survey_schedule.times.join(', ')}`);
  }

  private initializeSurveyors(): void {
    if (this.config.data_sources.huggingface?.enabled) {
      this.surveyors.set('huggingface', new HuggingFaceSurveyor(this.db, 'huggingface'));
      console.log('  ✓ HuggingFace surveyor enabled');
    }

    if (this.config.data_sources.github?.enabled) {
      this.surveyors.set('github', new GitHubSurveyor(this.db, 'github'));
      console.log('  ✓ GitHub surveyor enabled');
    }

    if (this.config.data_sources.youtube?.enabled) {
      this.surveyors.set('youtube', new YouTubeSurveyor(this.db, 'youtube'));
      console.log('  ✓ YouTube surveyor enabled');
    }

    if (this.config.data_sources.arxiv?.enabled) {
      this.surveyors.set('arxiv', new ArXivSurveyor(this.db, 'arxiv'));
      console.log('  ✓ arXiv surveyor enabled');
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Orchestrator is already running');
      return;
    }

    this.isRunning = true;
    console.log('\n🚀 Starting Agent Orchestrator...\n');

    // Run initial survey immediately
    await this.runSurvey();

    // Schedule future surveys
    this.scheduleSurveys();

    console.log('\n✅ Orchestrator is now running');
    console.log('   Press Ctrl+C to stop\n');
  }

  private scheduleSurveys(): void {
    for (const time of this.config.survey_schedule.times) {
      const [hours, minutes] = time.split(':').map(Number);

      // Schedule daily at specified times
      const scheduleDaily = () => {
        const now = new Date();
        const scheduled = new Date();
        scheduled.setHours(hours, minutes, 0, 0);

        // If time has passed today, schedule for tomorrow
        if (scheduled <= now) {
          scheduled.setDate(scheduled.getDate() + 1);
        }

        const delay = scheduled.getTime() - now.getTime();

        const timeout = setTimeout(async () => {
          await this.runSurvey();
          scheduleDaily(); // Reschedule for next day
        }, delay);

        this.scheduledTasks.push(timeout);

        console.log(`⏰ Survey scheduled for ${scheduled.toLocaleString()}`);
      };

      scheduleDaily();
    }
  }

  async runSurvey(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log(`🔍 Starting survey run at ${new Date().toLocaleString()}`);
    console.log('='.repeat(60) + '\n');

    const startTime = Date.now();
    const results: Record<string, any> = {};

    // Run all surveyors in parallel (with some staggering to avoid overwhelming)
    const surveyorNames = Array.from(this.surveyors.keys());

    for (let i = 0; i < surveyorNames.length; i++) {
      const name = surveyorNames[i];
      const surveyor = this.surveyors.get(name)!;

      try {
        // Stagger starts by 5 seconds
        if (i > 0) {
          await this.sleep(5000);
        }

        await surveyor.run();
        results[name] = 'success';
      } catch (error) {
        console.error(`❌ ${name} surveyor failed:`, error);
        results[name] = 'failed';
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Survey run completed in ${duration.toFixed(2)}s`);
    console.log('='.repeat(60));

    // Print statistics
    const stats = this.db.getStats();
    console.log('\n📊 Database Statistics:');
    console.log(`   Total AI Tools: ${stats.total_tools}`);
    console.log(`   Total Capabilities: ${stats.total_capabilities}`);
    console.log(`   Successful Surveys: ${stats.successful_surveys}`);
    console.log(`   Last Survey: ${stats.last_survey_run}`);

    if (stats.tools_by_category) {
      console.log('\n   Tools by Category:');
      for (const [category, count] of Object.entries(stats.tools_by_category)) {
        console.log(`     - ${category}: ${count}`);
      }
    }
    console.log('');
  }

  async runOnDemand(surveyorName?: string): Promise<void> {
    if (surveyorName) {
      const surveyor = this.surveyors.get(surveyorName);
      if (!surveyor) {
        throw new Error(`Surveyor '${surveyorName}' not found`);
      }
      console.log(`\n🔍 Running ${surveyorName} surveyor on-demand...\n`);
      await surveyor.run();
    } else {
      await this.runSurvey();
    }
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️  Orchestrator is not running');
      return;
    }

    console.log('\n🛑 Stopping Agent Orchestrator...');

    // Clear all scheduled tasks
    for (const task of this.scheduledTasks) {
      clearTimeout(task);
    }
    this.scheduledTasks = [];

    this.isRunning = false;
    console.log('✅ Orchestrator stopped\n');
  }

  getStats(): Record<string, any> {
    return this.db.getStats();
  }

  getDatabase(): DatabaseManager {
    return this.db;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown(): Promise<void> {
    this.stop();
    this.db.close();
    console.log('👋 Shutdown complete');
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new AgentOrchestrator();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Received interrupt signal');
    await orchestrator.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n⚠️  Received termination signal');
    await orchestrator.shutdown();
    process.exit(0);
  });

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'run-once' || command === 'test') {
    // Run survey once and exit
    await orchestrator.runSurvey();
    console.log('\n✅ Test run complete');
    await orchestrator.shutdown();
    process.exit(0);
  } else if (command === 'survey') {
    // Run specific surveyor
    const surveyorName = args[1];
    await orchestrator.runOnDemand(surveyorName);
    await orchestrator.shutdown();
    process.exit(0);
  } else if (command === 'stats') {
    // Show statistics
    const stats = orchestrator.getStats();
    console.log('\n📊 Database Statistics:');
    console.log(JSON.stringify(stats, null, 2));
    await orchestrator.shutdown();
    process.exit(0);
  } else {
    // Start continuous operation
    await orchestrator.start();
  }
}
