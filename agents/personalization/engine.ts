import { DatabaseManager, AITool, UserProject, Recommendation } from '../database/manager.js';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, extname } from 'path';

export interface UserPreferences {
  interests: string[];
  skills: string[];
  preferred_categories: string[];
  learning_style?: 'visual' | 'hands-on' | 'reading' | 'mixed';
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  use_cases: string[];
}

export class PersonalizationEngine {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Analyze a project directory to extract tech stack and AI needs
   */
  async analyzeProject(projectPath: string, projectName?: string): Promise<UserProject> {
    console.log(`\n🔍 Analyzing project: ${projectPath}`);

    const name = projectName || projectPath.split('/').pop() || 'Unknown Project';
    const techStack = this.detectTechStack(projectPath);
    const aiNeeds = this.inferAINeeds(techStack, projectPath);
    const description = this.generateProjectDescription(techStack, projectPath);

    const project: UserProject = {
      name,
      path: projectPath,
      description,
      tech_stack: techStack,
      ai_needs: aiNeeds
    };

    const projectId = this.db.insertProject(project);
    console.log(`✅ Project analyzed and saved (ID: ${projectId})`);
    console.log(`   Tech Stack: ${techStack.join(', ')}`);
    console.log(`   AI Needs: ${aiNeeds.join(', ')}`);

    return { ...project, id: projectId };
  }

  /**
   * Detect tech stack from project files
   */
  private detectTechStack(projectPath: string): string[] {
    const stack = new Set<string>();

    try {
      const files = this.walkDirectory(projectPath, 3); // Max depth 3

      // Check for package.json (Node.js/JavaScript)
      if (files.some(f => f.endsWith('package.json'))) {
        stack.add('JavaScript/TypeScript');
        try {
          const packageJson = JSON.parse(readFileSync(
            files.find(f => f.endsWith('package.json'))!, 'utf-8'
          ));
          if (packageJson.dependencies) {
            if (packageJson.dependencies.react) stack.add('React');
            if (packageJson.dependencies.vue) stack.add('Vue');
            if (packageJson.dependencies.angular) stack.add('Angular');
            if (packageJson.dependencies.express) stack.add('Express');
            if (packageJson.dependencies.next) stack.add('Next.js');
          }
        } catch {}
      }

      // Check for requirements.txt or pyproject.toml (Python)
      if (files.some(f => f.endsWith('requirements.txt') || f.endsWith('pyproject.toml'))) {
        stack.add('Python');
      }

      // Check for go.mod (Go)
      if (files.some(f => f.endsWith('go.mod'))) {
        stack.add('Go');
      }

      // Check for Cargo.toml (Rust)
      if (files.some(f => f.endsWith('Cargo.toml'))) {
        stack.add('Rust');
      }

      // Check for pom.xml or build.gradle (Java)
      if (files.some(f => f.endsWith('pom.xml') || f.endsWith('build.gradle'))) {
        stack.add('Java');
      }

      // Check file extensions
      const extensions = files.map(f => extname(f).toLowerCase());
      if (extensions.includes('.ts') || extensions.includes('.tsx')) stack.add('TypeScript');
      if (extensions.includes('.py')) stack.add('Python');
      if (extensions.includes('.java')) stack.add('Java');
      if (extensions.includes('.go')) stack.add('Go');
      if (extensions.includes('.rs')) stack.add('Rust');
      if (extensions.includes('.cpp') || extensions.includes('.cc')) stack.add('C++');

    } catch (error) {
      console.warn(`Warning: Could not fully analyze project: ${error}`);
    }

    return Array.from(stack);
  }

  /**
   * Infer AI needs based on tech stack and project content
   */
  private inferAINeeds(techStack: string[], projectPath: string): string[] {
    const needs = new Set<string>();

    // Check README and other docs for AI-related keywords
    try {
      const files = this.walkDirectory(projectPath, 2);
      const readmeFile = files.find(f =>
        f.toLowerCase().includes('readme') && f.endsWith('.md')
      );

      if (readmeFile) {
        const content = readFileSync(readmeFile, 'utf-8').toLowerCase();

        if (content.includes('chat') || content.includes('conversation')) {
          needs.add('LLM integration');
          needs.add('natural language processing');
        }
        if (content.includes('image') || content.includes('vision')) {
          needs.add('computer vision');
          needs.add('image processing');
        }
        if (content.includes('recommendation')) {
          needs.add('recommendation system');
          needs.add('personalization');
        }
        if (content.includes('search')) {
          needs.add('semantic search');
          needs.add('embeddings');
        }
        if (content.includes('analysis') || content.includes('analytics')) {
          needs.add('data analysis');
          needs.add('machine learning');
        }
        if (content.includes('translation')) {
          needs.add('language translation');
        }
        if (content.includes('sentiment')) {
          needs.add('sentiment analysis');
        }
      }
    } catch {}

    // Infer based on tech stack
    if (techStack.includes('React') || techStack.includes('Vue')) {
      needs.add('frontend AI components');
    }
    if (techStack.includes('Python')) {
      needs.add('ML framework integration');
    }

    // Default needs if nothing specific found
    if (needs.size === 0) {
      needs.add('general AI capabilities');
      needs.add('automation');
    }

    return Array.from(needs);
  }

  /**
   * Generate recommendations for a project
   */
  async generateRecommendations(projectId: number): Promise<Recommendation[]> {
    const projects = this.db.getAllProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    console.log(`\n🎯 Generating recommendations for: ${project.name}`);

    const recommendations: Recommendation[] = [];
    const allTools = this.db.getAllTools(1000);

    for (const tool of allTools) {
      const relevance = this.calculateRelevance(project, tool);

      if (relevance > 0.3) { // Threshold for relevance
        const reason = this.generateRecommendationReason(project, tool, relevance);

        const rec: Recommendation = {
          tool_id: tool.id!,
          user_project_id: projectId,
          relevance_score: relevance,
          reason,
          status: 'pending',
          tool
        };

        const recId = this.db.insertRecommendation(rec);
        recommendations.push({ ...rec, id: recId });
      }
    }

    // Sort by relevance
    recommendations.sort((a, b) => b.relevance_score - a.relevance_score);

    console.log(`✅ Generated ${recommendations.length} recommendations`);
    return recommendations.slice(0, 20); // Top 20
  }

  /**
   * Calculate relevance score between project and tool
   */
  private calculateRelevance(project: UserProject, tool: AITool): number {
    let score = 0;
    const weights = {
      ai_needs: 0.4,
      tech_stack: 0.3,
      category: 0.2,
      popularity: 0.1
    };

    // Match AI needs with tool capabilities
    if (project.ai_needs && tool.capabilities) {
      const needsLower = project.ai_needs.map(n => n.toLowerCase());
      const capsLower = tool.capabilities.map(c => c.toLowerCase());

      const matches = needsLower.filter(need =>
        capsLower.some(cap => cap.includes(need) || need.includes(cap))
      );

      score += (matches.length / Math.max(needsLower.length, 1)) * weights.ai_needs;
    }

    // Match tech stack
    if (project.tech_stack && tool.metadata?.language) {
      const stackLower = project.tech_stack.map(s => s.toLowerCase());
      const toolLang = tool.metadata.language.toLowerCase();

      if (stackLower.some(s => toolLang.includes(s) || s.includes(toolLang))) {
        score += weights.tech_stack;
      }
    }

    // Boost based on tool popularity
    if (tool.popularity_score) {
      score += (tool.popularity_score / 100) * weights.popularity;
    }

    // Category relevance
    if (tool.category && project.ai_needs) {
      const categoryLower = tool.category.toLowerCase();
      const needsLower = project.ai_needs.map(n => n.toLowerCase()).join(' ');

      if (needsLower.includes(categoryLower) || categoryLower.includes('general')) {
        score += weights.category;
      }
    }

    return Math.min(1, score);
  }

  /**
   * Generate human-readable recommendation reason
   */
  private generateRecommendationReason(
    project: UserProject,
    tool: AITool,
    relevance: number
  ): string {
    const reasons: string[] = [];

    if (relevance > 0.8) {
      reasons.push('Highly relevant to your project needs');
    } else if (relevance > 0.5) {
      reasons.push('Good match for your project');
    } else {
      reasons.push('May be useful for your project');
    }

    if (tool.capabilities && project.ai_needs) {
      const matchedNeeds = project.ai_needs.filter(need =>
        tool.capabilities!.some(cap =>
          cap.toLowerCase().includes(need.toLowerCase()) ||
          need.toLowerCase().includes(cap.toLowerCase())
        )
      );

      if (matchedNeeds.length > 0) {
        reasons.push(`Supports: ${matchedNeeds.slice(0, 2).join(', ')}`);
      }
    }

    if (tool.open_source) {
      reasons.push('Open source');
    }

    if (tool.api_available) {
      reasons.push('API available');
    }

    if (tool.popularity_score && tool.popularity_score > 50) {
      reasons.push('Popular tool');
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Set user preferences
   */
  setUserPreferences(prefs: UserPreferences): void {
    this.db.setUserProfile('interests', prefs.interests, 'preferences');
    this.db.setUserProfile('skills', prefs.skills, 'preferences');
    this.db.setUserProfile('preferred_categories', prefs.preferred_categories, 'preferences');

    if (prefs.learning_style) {
      this.db.setUserProfile('learning_style', prefs.learning_style, 'preferences');
    }
    if (prefs.experience_level) {
      this.db.setUserProfile('experience_level', prefs.experience_level, 'preferences');
    }
    if (prefs.use_cases) {
      this.db.setUserProfile('use_cases', prefs.use_cases, 'preferences');
    }

    console.log('✅ User preferences saved');
  }

  /**
   * Get personalized tool recommendations
   */
  getPersonalizedRecommendations(): AITool[] {
    const profile = this.db.getUserProfile();
    const allTools = this.db.getAllTools(1000);

    const interests = profile.interests || [];
    const skills = profile.skills || [];
    const preferredCategories = profile.preferred_categories || [];

    // Score tools based on user profile
    const scored = allTools.map(tool => {
      let score = tool.popularity_score || 0;

      // Boost based on interests
      if (interests.length > 0) {
        const toolText = `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();
        const matchedInterests = interests.filter((interest: string) =>
          toolText.includes(interest.toLowerCase())
        );
        score += matchedInterests.length * 10;
      }

      // Boost based on preferred categories
      if (preferredCategories.length > 0 && tool.category) {
        if (preferredCategories.includes(tool.category)) {
          score += 15;
        }
      }

      return { tool, score };
    });

    // Sort by score and return top tools
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 50).map(s => s.tool);
  }

  // Helper methods
  private walkDirectory(dir: string, maxDepth: number, currentDepth: number = 0): string[] {
    if (currentDepth >= maxDepth) return [];

    const files: string[] = [];

    try {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        // Skip node_modules, .git, etc.
        if (entry.startsWith('.') || entry === 'node_modules' || entry === 'vendor') {
          continue;
        }

        const fullPath = join(dir, entry);

        try {
          const stat = statSync(fullPath);

          if (stat.isFile()) {
            files.push(fullPath);
          } else if (stat.isDirectory()) {
            files.push(...this.walkDirectory(fullPath, maxDepth, currentDepth + 1));
          }
        } catch {
          // Skip files we can't access
        }
      }
    } catch {
      // Skip directories we can't read
    }

    return files;
  }

  private generateProjectDescription(techStack: string[], projectPath: string): string {
    const stack = techStack.join(', ') || 'Unknown stack';
    const projectName = projectPath.split('/').pop();
    return `${projectName} project using ${stack}`;
  }
}
