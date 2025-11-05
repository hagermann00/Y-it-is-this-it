import { BaseSurveyor, SurveyResult } from './baseSurveyor.js';
import { AITool } from '../database/manager.js';

export class ArXivSurveyor extends BaseSurveyor {
  private apiBase = 'http://export.arxiv.org/api/query';
  private categories = ['cs.AI', 'cs.LG', 'cs.CL', 'cs.CV', 'cs.RO'];

  async survey(): Promise<SurveyResult> {
    const tools: AITool[] = [];
    const errors: string[] = [];
    let discovered = 0;
    let updated = 0;

    for (const category of this.categories) {
      try {
        await this.sleep(3000); // arXiv API rate limit: 1 request per 3 seconds
        const papers = await this.searchPapers(category);

        for (const paper of papers) {
          const existing = this.db.getToolByUrl(paper.url!);
          if (existing) {
            this.db.updateTool(existing.id!, paper);
            updated++;
          } else {
            this.db.insertTool(paper);
            discovered++;
          }
          tools.push(paper);
        }
      } catch (error) {
        errors.push(`${category}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      tools,
      stats: { discovered, updated, errors: errors.length },
      errors
    };
  }

  private async searchPapers(category: string): Promise<AITool[]> {
    const tools: AITool[] = [];

    try {
      // Get papers from the last 7 days
      const response = await this.fetchWithRetry(
        `${this.apiBase}?` +
        `search_query=cat:${category}&` +
        `sortBy=submittedDate&` +
        `sortOrder=descending&` +
        `max_results=20`
      );

      const xmlText = await response.text();
      const papers = this.parseArXivXML(xmlText);

      // Filter for papers mentioning tools, implementations, or frameworks
      const toolPapers = papers.filter(paper => {
        const text = (paper.title + ' ' + paper.summary).toLowerCase();
        return text.includes('tool') ||
               text.includes('framework') ||
               text.includes('implementation') ||
               text.includes('library') ||
               text.includes('system') ||
               text.includes('application') ||
               text.includes('benchmark');
      });

      for (const paper of toolPapers) {
        const fullText = `${paper.title} ${paper.summary}`;

        const tool: AITool = {
          name: `arXiv: ${paper.title}`,
          description: paper.summary,
          url: paper.id,
          source: 'arxiv',
          category: this.mapCategory(category),
          subcategory: category,
          capabilities: this.extractCapabilities(fullText),
          api_available: false,
          open_source: this.mentionsCode(fullText),
          pricing_model: 'free',
          popularity_score: 0, // arXiv doesn't provide metrics
          metadata: {
            authors: paper.authors,
            published: paper.published,
            arxiv_id: paper.id,
            categories: paper.categories
          }
        };
        tools.push(tool);
      }
    } catch (error) {
      console.error(`[arXiv] Error searching category ${category}:`, error);
      throw error;
    }

    return tools;
  }

  private parseArXivXML(xml: string): any[] {
    const papers: any[] = [];

    // Simple XML parsing (in production, use a proper XML parser like 'fast-xml-parser')
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const entries = xml.match(entryRegex);

    if (!entries) return papers;

    for (const entry of entries) {
      const title = this.extractXMLTag(entry, 'title')?.replace(/\n/g, ' ').trim();
      const summary = this.extractXMLTag(entry, 'summary')?.replace(/\n/g, ' ').trim();
      const id = this.extractXMLTag(entry, 'id');
      const published = this.extractXMLTag(entry, 'published');

      // Extract authors
      const authors: string[] = [];
      const authorRegex = /<author>[\s\S]*?<name>(.*?)<\/name>/g;
      let authorMatch;
      while ((authorMatch = authorRegex.exec(entry)) !== null) {
        authors.push(authorMatch[1]);
      }

      // Extract categories
      const categories: string[] = [];
      const categoryRegex = /<category term="(.*?)"/g;
      let categoryMatch;
      while ((categoryMatch = categoryRegex.exec(entry)) !== null) {
        categories.push(categoryMatch[1]);
      }

      if (title && summary && id) {
        papers.push({
          title,
          summary,
          id,
          published,
          authors,
          categories
        });
      }
    }

    return papers;
  }

  private extractXMLTag(xml: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private mapCategory(arxivCategory: string): string {
    const mapping: Record<string, string> = {
      'cs.AI': 'General AI',
      'cs.LG': 'ML Framework',
      'cs.CL': 'NLP',
      'cs.CV': 'Computer Vision',
      'cs.RO': 'Robotics'
    };
    return mapping[arxivCategory] || 'General AI';
  }

  private mentionsCode(text: string): boolean {
    const codeKeywords = [
      'code available',
      'github',
      'implementation',
      'open source',
      'repository',
      'source code'
    ];
    const lowerText = text.toLowerCase();
    return codeKeywords.some(keyword => lowerText.includes(keyword));
  }
}
