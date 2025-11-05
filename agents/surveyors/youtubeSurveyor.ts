import { BaseSurveyor, SurveyResult } from './baseSurveyor.js';
import { AITool } from '../database/manager.js';

export class YouTubeSurveyor extends BaseSurveyor {
  private apiBase = 'https://www.googleapis.com/youtube/v3';
  private searchQueries = [
    'AI tools new',
    'machine learning tools',
    'LLM applications',
    'AI agents tutorial',
    'latest AI developments'
  ];

  async survey(): Promise<SurveyResult> {
    const tools: AITool[] = [];
    const errors: string[] = [];
    let discovered = 0;
    let updated = 0;

    // Note: YouTube API requires API key. For now, we'll scrape or use RSS
    // In production, set YOUTUBE_API_KEY environment variable

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn('[YouTube] API key not set, skipping YouTube survey');
      return {
        tools,
        stats: { discovered, updated, errors: 1 },
        errors: ['YouTube API key not configured']
      };
    }

    for (const query of this.searchQueries) {
      try {
        await this.sleep(1000);
        const videos = await this.searchVideos(query, apiKey);

        for (const video of videos) {
          const existing = this.db.getToolByUrl(video.url!);
          if (existing) {
            this.db.updateTool(existing.id!, video);
            updated++;
          } else {
            this.db.insertTool(video);
            discovered++;
          }
          tools.push(video);
        }
      } catch (error) {
        errors.push(`${query}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      tools,
      stats: { discovered, updated, errors: errors.length },
      errors
    };
  }

  private async searchVideos(query: string, apiKey: string): Promise<AITool[]> {
    const tools: AITool[] = [];

    try {
      // Search for recent videos (last 7 days)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const response = await this.fetchWithRetry(
        `${this.apiBase}/search?` +
        `part=snippet&` +
        `q=${encodeURIComponent(query)}&` +
        `type=video&` +
        `publishedAfter=${oneWeekAgo}&` +
        `order=relevance&` +
        `maxResults=10&` +
        `key=${apiKey}`
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      for (const item of data.items || []) {
        const videoId = item.id.videoId;
        const snippet = item.snippet;

        // Extract tool mentions from title and description
        const tools_mentioned = this.extractToolMentions(
          `${snippet.title} ${snippet.description}`
        );

        if (tools_mentioned.length > 0) {
          const tool: AITool = {
            name: `YouTube: ${snippet.title}`,
            description: snippet.description,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            source: 'youtube',
            category: this.categorizeByKeywords(snippet.title + ' ' + snippet.description),
            subcategory: 'Video Tutorial',
            capabilities: this.extractCapabilities(snippet.title + ' ' + snippet.description),
            api_available: false,
            open_source: false,
            pricing_model: 'free',
            popularity_score: this.calculatePopularityScore({}),
            metadata: {
              channel: snippet.channelTitle,
              published_at: snippet.publishedAt,
              thumbnail: snippet.thumbnails?.medium?.url,
              tools_mentioned
            }
          };
          tools.push(tool);
        }
      }
    } catch (error) {
      console.error(`[YouTube] Error searching videos for "${query}":`, error);
      throw error;
    }

    return tools;
  }

  private extractToolMentions(text: string): string[] {
    const toolPatterns = [
      /\b(ChatGPT|GPT-4|Claude|Gemini|LLaMA|Mistral)\b/gi,
      /\b(Stable Diffusion|DALL-E|Midjourney)\b/gi,
      /\b(LangChain|AutoGPT|BabyAGI)\b/gi,
      /\b(PyTorch|TensorFlow|JAX|Hugging Face)\b/gi
    ];

    const tools = new Set<string>();
    for (const pattern of toolPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        tools.add(match[0]);
      }
    }

    return Array.from(tools);
  }
}
