export interface Chapter {
    title: string;
    outline: string;
}

export interface PrimerFile {
    name: string;
    content: string;
    size: number;
}

export interface AIModels {
    text: string[];
    image: string[];
}

export interface VisualsConfig {
    style: string;
    basePrompt: string;
    negativePrompt: string;
    aspectRatio: string;
}

export interface AIFeaturesConfig {
    researchModel: string;
    writingModel: string;
    imageModel: string;
    visualsConfig: VisualsConfig;
}

export interface VisualsGuideConfig {
    artDirection: string;
    composition: string;
    subjectMatter: string;
    colorPalette: string;
}

export interface ToneAndSentimentGuide {
    persona: string;
    voice: string;
    constraints: string;
    targetAudience: string;
}

export interface ResearchPhase {
    id: string;
    title: string;
    prompts: string[];
}

export interface ProjectConfig {
    primerFiles: PrimerFile[];
    researchPhases: ResearchPhase[];
    chapters: Chapter[];
    toneAndSentimentGuide: ToneAndSentimentGuide;
    visualsGuide: VisualsGuideConfig;
    outputFormats: Record<string, { enabled: boolean; settings: string }>;
    aiFeatures: AIFeaturesConfig;
    language: string;
}

export type ProjectConfigSnapshot = ProjectConfig & { timestamp: string };

export type ProjectStatus =
    | 'idle'
    | 'research_queued'
    | 'researching'
    | 'research_failed'
    | 'research_complete'
    | 'production_phase1_queued'
    | 'producing_phase1'
    | 'production_phase1_failed'
    | 'production_phase1_complete'
    | 'production_phase2_queued'
    | 'producing_phase2'
    | 'production_phase2_failed'
    | 'production_phase2_complete'
    | 'production_phase3_queued'
    | 'producing_phase3'
    | 'production_phase3_failed'
    | 'completed'
    | 'cancelled';

export interface ContentBlock {
    id: string;
    type: 'text' | 'image';
    content: string; // Text content or image prompt
    imageData?: string; // Base64 image data
}

export interface Project {
    name: string;
    status: ProjectStatus;
    config: ProjectConfig;
    researchData?: string[];
    archive?: ProjectConfigSnapshot[];
    technicalManuscript?: ContentBlock[];
    brandedManuscript?: ContentBlock[];
    finalManuscript?: ContentBlock[];
    progress?: number; // For live progress bar
    estimatedTokens?: { // For cost/token tracking
        research: number;
        production: number;
    };
}

export interface ProjectTemplate {
    name: string;
    config: ProjectConfig;
}

export interface ProductionStatus {
    topic: string;
    phase: string;
    subTask: string;
    progress: number; // 0 to 100
    chapterIndex?: number;
}

export interface ProductionLogEntryStep {
    name: string;
    duration: number; // in milliseconds
}

export interface ProductionLogEntry {
    topic: string;
    phase: 'Research' | 'Production';
    timestamp: Date;
    formatsCreated: string[];
    status: 'complete' | 'failed' | 'cancelled';
    details: string[]; // For detailed log view
    error?: string; // Optional error message
    steps: ProductionLogEntryStep[];
}

export type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
};

export interface YItAnalysisResult {
    viabilityScore: number;
    potentialRisks: string[];
    effortRewardRatio: string;
    guruSaturation: 'Low' | 'Medium' | 'High' | 'Extreme';
}

// Added to AppContextType for the new workflow
declare module './App' {
    interface AppContextType {
        queueNextProductionPhase: (projectName: string) => void;
        importTechnicalManuscript: (projectName: string, manuscript: ContentBlock[]) => void;
        importAndReplaceBrandedManuscript: (projectName: string, manuscript: ContentBlock[]) => void;
        updateUserPreferences: (key: keyof ProjectConfig, value: any) => void;
    }
}
