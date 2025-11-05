import { BaseSurveyor, SurveyResult } from './baseSurveyor.js';
import { AITool } from '../database/manager.js';

export class GitHubSurveyor extends BaseSurveyor {
  private apiBase = 'https://api.github.com';
  private topics = [
    'artificial-intelligence',
    'machine-learning',
    'deep-learning',
    'llm',
    'large-language-model',
    'ai-agents',
    'computer-vision',
    'nlp',
    'natural-language-processing'
  ];

  async survey(): Promise<SurveyResult> {
    const tools: AITool[] = [];
    const errors: string[] = [];
    let discovered = 0;
    let updated = 0;

    for (const topic of this.topics) {
      try {
        await this.sleep(1000); // Rate limiting
        const repos = await this.searchRepositories(topic);

        for (const repo of repos) {
          const existing = this.db.getToolByUrl(repo.url!);
          if (existing) {
            this.db.updateTool(existing.id!, repo);
            updated++;
          } else {
            this.db.insertTool(repo);
            discovered++;
          }
          tools.push(repo);
        }
      } catch (error) {
        errors.push(`${topic}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      tools,
      stats: { discovered, updated, errors: errors.length },
      errors
    };
  }

  private async searchRepositories(topic: string): Promise<AITool[]> {
    const tools: AITool[] = [];

    try {
      // Search for trending repos in the last week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const query = `topic:${topic} created:>${oneWeekAgo} stars:>50`;

      const response = await this.fetchWithRetry(
        `${this.apiBase}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`
      );

      const data = await response.json();

      for (const repo of data.items || []) {
        // Get README for better categorization
        let description = repo.description || '';
        try {
          const readmeResponse = await this.fetchWithRetry(
            `${this.apiBase}/repos/${repo.full_name}/readme`,
            { headers: { 'Accept': 'application/vnd.github.v3.raw' } }
          );
          const readme = await readmeResponse.text();
          description += ' ' + readme.substring(0, 500);
        } catch {
          // README not available or error
        }

        const tool: AITool = {
          name: repo.full_name,
          description: repo.description || `GitHub repository: ${repo.full_name}`,
          url: repo.html_url,
          source: 'github',
          category: this.categorizeByKeywords(description),
          subcategory: repo.language,
          capabilities: this.extractCapabilities(description),
          api_available: this.hasAPI(description),
          open_source: !repo.private,
          pricing_model: 'free',
          popularity_score: this.calculatePopularityScore({
            stars: repo.stargazers_count,
            views: repo.watchers_count
          }),
          metadata: {
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            open_issues: repo.open_issues_count,
            topics: repo.topics,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            license: repo.license?.name
          }
        };
        tools.push(tool);

        await this.sleep(100); // Be nice to API
      }
    } catch (error) {
      console.error(`[GitHub] Error searching topic ${topic}:`, error);
      throw error;
    }

    return tools;
  }

  private hasAPI(text: string): boolean {
    const apiKeywords = ['api', 'rest', 'graphql', 'endpoint', 'sdk'];
    const lowerText = text.toLowerCase();
    return apiKeywords.some(keyword => lowerText.includes(keyword));
  }
}
