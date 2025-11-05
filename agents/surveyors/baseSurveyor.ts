import { DatabaseManager, AITool, SurveyRun } from '../database/manager.js';

export interface SurveyResult {
  tools: AITool[];
  stats: {
    discovered: number;
    updated: number;
    errors: number;
  };
  errors: string[];
}

export abstract class BaseSurveyor {
  protected db: DatabaseManager;
  protected sourceName: string;

  constructor(db: DatabaseManager, sourceName: string) {
    this.db = db;
    this.sourceName = sourceName;
  }

  abstract survey(): Promise<SurveyResult>;

  async run(): Promise<void> {
    const startTime = Date.now();
    console.log(`[${this.sourceName}] Starting survey...`);

    try {
      const result = await this.survey();
      const duration = (Date.now() - startTime) / 1000;

      // Log survey run
      this.db.logSurveyRun({
        source: this.sourceName,
        items_discovered: result.stats.discovered,
        items_updated: result.stats.updated,
        status: result.stats.errors > 0 ? 'partial' : 'success',
        error_log: result.errors.length > 0 ? result.errors.join('\n') : undefined,
        duration_seconds: duration
      });

      console.log(`[${this.sourceName}] Survey completed in ${duration.toFixed(2)}s`);
      console.log(`  - Discovered: ${result.stats.discovered}`);
      console.log(`  - Updated: ${result.stats.updated}`);
      console.log(`  - Errors: ${result.stats.errors}`);

    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.db.logSurveyRun({
        source: this.sourceName,
        items_discovered: 0,
        items_updated: 0,
        status: 'failed',
        error_log: errorMessage,
        duration_seconds: duration
      });

      console.error(`[${this.sourceName}] Survey failed:`, errorMessage);
      throw error;
    }
  }

  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': 'AI-Survey-Agent/1.0',
            ...options.headers
          }
        });

        if (response.ok) {
          return response;
        }

        if (response.status === 429) {
          // Rate limited, wait before retry
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;
          console.log(`[${this.sourceName}] Rate limited, waiting ${waitTime}ms...`);
          await this.sleep(waitTime);
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < maxRetries - 1) {
          const waitTime = Math.pow(2, i) * 1000;
          console.log(`[${this.sourceName}] Retry ${i + 1}/${maxRetries} after ${waitTime}ms...`);
          await this.sleep(waitTime);
        }
      }
    }

    throw lastError || new Error('Unknown error during fetch');
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected calculatePopularityScore(metrics: {
    stars?: number;
    downloads?: number;
    views?: number;
    likes?: number;
  }): number {
    let score = 0;

    if (metrics.stars) score += Math.log10(metrics.stars + 1) * 10;
    if (metrics.downloads) score += Math.log10(metrics.downloads + 1) * 5;
    if (metrics.views) score += Math.log10(metrics.views + 1) * 2;
    if (metrics.likes) score += Math.log10(metrics.likes + 1) * 3;

    return Math.min(100, score);
  }

  protected categorizeByKeywords(text: string): string {
    const categories: Record<string, string[]> = {
      'LLM': ['llm', 'language model', 'gpt', 'claude', 'llama', 'mistral', 'gemini'],
      'Computer Vision': ['vision', 'image', 'video', 'cv', 'object detection', 'segmentation'],
      'NLP': ['nlp', 'natural language', 'text', 'translation', 'sentiment'],
      'Agent': ['agent', 'autonomous', 'rag', 'retrieval'],
      'Audio': ['audio', 'speech', 'voice', 'sound', 'music'],
      'Robotics': ['robot', 'robotics', 'control', 'motion'],
      'ML Framework': ['framework', 'pytorch', 'tensorflow', 'jax', 'training'],
      'Data Science': ['data', 'analysis', 'visualization', 'pandas', 'numpy'],
      'MLOps': ['mlops', 'deployment', 'monitoring', 'serving', 'inference']
    };

    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }

    return 'General AI';
  }

  protected extractCapabilities(text: string): string[] {
    const capabilityPatterns = [
      /\b(text generation|generation)\b/i,
      /\b(image generation|image creation)\b/i,
      /\b(classification|categorization)\b/i,
      /\b(detection|recognition)\b/i,
      /\b(translation)\b/i,
      /\b(summarization)\b/i,
      /\b(question answering|qa)\b/i,
      /\b(embedding|vector)\b/i,
      /\b(fine-tuning|training)\b/i,
      /\b(inference|prediction)\b/i
    ];

    const capabilities = new Set<string>();
    for (const pattern of capabilityPatterns) {
      const match = text.match(pattern);
      if (match) {
        capabilities.add(match[1].toLowerCase());
      }
    }

    return Array.from(capabilities);
  }
}
