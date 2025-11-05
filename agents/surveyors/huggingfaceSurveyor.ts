import { BaseSurveyor, SurveyResult } from './baseSurveyor.js';
import { AITool } from '../database/manager.js';

export class HuggingFaceSurveyor extends BaseSurveyor {
  private apiBase = 'https://huggingface.co/api';

  async survey(): Promise<SurveyResult> {
    const tools: AITool[] = [];
    const errors: string[] = [];
    let discovered = 0;
    let updated = 0;

    try {
      // Survey trending models
      const models = await this.surveyModels();
      for (const model of models) {
        const existing = this.db.getToolByUrl(model.url!);
        if (existing) {
          this.db.updateTool(existing.id!, model);
          updated++;
        } else {
          this.db.insertTool(model);
          discovered++;
        }
        tools.push(model);
      }

      // Survey trending spaces (demos/applications)
      const spaces = await this.surveySpaces();
      for (const space of spaces) {
        const existing = this.db.getToolByUrl(space.url!);
        if (existing) {
          this.db.updateTool(existing.id!, space);
          updated++;
        } else {
          this.db.insertTool(space);
          discovered++;
        }
        tools.push(space);
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      tools,
      stats: { discovered, updated, errors: errors.length },
      errors
    };
  }

  private async surveyModels(): Promise<AITool[]> {
    const tools: AITool[] = [];

    try {
      const response = await this.fetchWithRetry(
        `${this.apiBase}/models?sort=trending&limit=50`
      );
      const models = await response.json();

      for (const model of models) {
        const tool: AITool = {
          name: model.modelId || model.id,
          description: model.description || `AI model: ${model.modelId}`,
          url: `https://huggingface.co/${model.modelId || model.id}`,
          source: 'huggingface',
          category: this.mapPipelineTag(model.pipeline_tag),
          subcategory: model.pipeline_tag,
          capabilities: this.extractCapabilitiesFromTags(model),
          api_available: true,
          open_source: true,
          pricing_model: 'free',
          popularity_score: this.calculatePopularityScore({
            likes: model.likes,
            downloads: model.downloads
          }),
          metadata: {
            pipeline_tag: model.pipeline_tag,
            library_name: model.library_name,
            tags: model.tags,
            created_at: model.createdAt,
            last_modified: model.lastModified
          }
        };
        tools.push(tool);
      }
    } catch (error) {
      console.error('[HuggingFace] Error surveying models:', error);
      throw error;
    }

    return tools;
  }

  private async surveySpaces(): Promise<AITool[]> {
    const tools: AITool[] = [];

    try {
      const response = await this.fetchWithRetry(
        `${this.apiBase}/spaces?sort=trending&limit=30`
      );
      const spaces = await response.json();

      for (const space of spaces) {
        const tool: AITool = {
          name: space.id,
          description: space.description || `AI Space: ${space.id}`,
          url: `https://huggingface.co/spaces/${space.id}`,
          source: 'huggingface',
          category: 'Application',
          subcategory: space.sdk,
          capabilities: this.extractCapabilitiesFromTags(space),
          api_available: true,
          open_source: true,
          pricing_model: 'free',
          popularity_score: this.calculatePopularityScore({
            likes: space.likes
          }),
          metadata: {
            sdk: space.sdk,
            tags: space.tags,
            created_at: space.createdAt,
            last_modified: space.lastModified
          }
        };
        tools.push(tool);
      }
    } catch (error) {
      console.error('[HuggingFace] Error surveying spaces:', error);
      throw error;
    }

    return tools;
  }

  private mapPipelineTag(tag?: string): string {
    if (!tag) return 'General AI';

    const mapping: Record<string, string> = {
      'text-generation': 'LLM',
      'text2text-generation': 'LLM',
      'text-classification': 'NLP',
      'token-classification': 'NLP',
      'question-answering': 'NLP',
      'translation': 'NLP',
      'summarization': 'NLP',
      'image-classification': 'Computer Vision',
      'object-detection': 'Computer Vision',
      'image-segmentation': 'Computer Vision',
      'image-to-image': 'Computer Vision',
      'text-to-image': 'Computer Vision',
      'automatic-speech-recognition': 'Audio',
      'audio-classification': 'Audio',
      'text-to-speech': 'Audio',
      'reinforcement-learning': 'RL',
      'robotics': 'Robotics'
    };

    return mapping[tag] || 'General AI';
  }

  private extractCapabilitiesFromTags(item: any): string[] {
    const capabilities = new Set<string>();

    if (item.pipeline_tag) {
      capabilities.add(item.pipeline_tag.replace(/-/g, ' '));
    }

    if (item.tags && Array.isArray(item.tags)) {
      for (const tag of item.tags) {
        if (typeof tag === 'string') {
          // Extract meaningful capability tags
          if (tag.includes('generation') || tag.includes('classification') ||
              tag.includes('detection') || tag.includes('translation')) {
            capabilities.add(tag);
          }
        }
      }
    }

    return Array.from(capabilities);
  }
}
