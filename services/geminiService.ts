import type { ProductionStatus, Project, Chapter, ProductionLogEntryStep, YItAnalysisResult, ContentBlock, ResearchPhase, ProjectConfig } from './types';
// In a real application, you would import from '@google/genai'
// import { GoogleGenAI } from "@google/genai";
// and initialize it like this:
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// This is a mock implementation to simulate the Gemini API and the production pipeline.
// No actual API calls will be made.

const MOCK_API_DELAY = 250; // ms, shortened for better UI testing

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomId = () => Math.random().toString(36).substring(2, 9);


// This class simulates the Python `YItBookFactory`
export class YItBookFactory {
    private project: Project;
    private onStatusUpdate: (status: ProductionStatus) => void;
    private onChunk: (chunk: { type: 'research' | 'manuscript'; content: string }) => void;

    constructor(project: Project) {
        this.project = project;
        this.onStatusUpdate = () => {};
        this.onChunk = () => {};
    }

    private updateStatus(phase: string, subTask: string, progress: number, chapterIndex?: number) {
        this.onStatusUpdate({
            topic: this.project.name,
            phase,
            subTask,
            progress,
            chapterIndex,
        });
    }

    private async _runStep(phase: string, subTask: string, progress: number, signal: AbortSignal, chapterIndex?: number): Promise<ProductionLogEntryStep> {
        const startTime = Date.now();
        if (signal.aborted) {
            const error = new Error('Cancelled by user');
            error.name = 'CancellationError';
            throw error;
        }
        if (Math.random() < 0.05) { // Lower failure rate for smoother testing
            throw new Error(`Critical API failure during: ${subTask}`);
        }
        this.updateStatus(phase, subTask, progress, chapterIndex);
        await sleep(MOCK_API_DELAY + Math.random() * 150);
        
        const duration = Date.now() - startTime;
        const name = chapterIndex !== undefined ? `Ch. ${chapterIndex + 1}: ${subTask}` : subTask;
        return { name, duration };
    }
    
    public async executeResearchPhase(
        onStatusUpdate: (status: ProductionStatus) => void,
        onChunk: (chunk: { type: 'research', content: string }) => void,
        signal: AbortSignal
    ): Promise<{ details: string[], steps: ProductionLogEntryStep[], tokensUsed: number }> {
        this.onStatusUpdate = onStatusUpdate;
        this.onChunk = onChunk;
        const steps: ProductionLogEntryStep[] = [];
        
        const allPrompts = this.project.config.researchPhases.flatMap(phase => 
            phase.prompts.map(prompt => ({ prompt, phaseTitle: phase.title }))
        );
        
        const totalPrompts = allPrompts.length;
        let tokensUsed = 0;

        this.updateStatus("Research", "Initializing research...", 0);
        
        for (let i = 0; i < totalPrompts; i++) {
            const { prompt, phaseTitle } = allPrompts[i];
            const progress = ((i + 1) / totalPrompts) * 100;
            const subTask = `(${phaseTitle}) Executing: "${prompt.substring(0, 40)}..."`;
            
            const step = await this._runStep("Research", subTask, progress, signal);
            steps.push(step);
            tokensUsed += 500 + Math.floor(Math.random() * 200); // Simulate token usage
            
            // Simulate generating a research finding
            const finding = `Finding for "${this.project.name}" (from ${phaseTitle}): The market is ${['saturated', 'growing', 'emerging'][i % 3]}. Key competitor is ${['GuruFlex', 'HustleCorp', 'SideGigz'][i % 3]}.`;
            this.onChunk({ type: 'research', content: finding });
            await sleep(50); // Simulate streaming gap
        }

        this.updateStatus("Research", "Research complete.", 100);
        return { details: steps.map(s => s.name), steps, tokensUsed };
    }

    public async executePhase1_TechnicalGeneration(onStatusUpdate: (s: ProductionStatus) => void, signal: AbortSignal): Promise<{ manuscript: ContentBlock[], steps: ProductionLogEntryStep[], tokensUsed: number }> {
        this.onStatusUpdate = onStatusUpdate;
        const steps: ProductionLogEntryStep[] = [];
        const manuscript: ContentBlock[] = [];
        const totalChapters = this.project.config.chapters.length;
        let tokensUsed = 0;

        for (let i = 0; i < totalChapters; i++) {
            const chapter = this.project.config.chapters[i];
            const progress = ((i + 1) / totalChapters) * 100;
            steps.push(await this._runStep("Production (1/3)", `Drafting Ch. ${i + 1}: ${chapter.title}`, progress, signal, i));
            tokensUsed += 1000 + Math.random() * 400;

            manuscript.push({ id: randomId(), type: 'text', content: `## ${chapter.title}\n\nThis is the technical introduction for the chapter about ${this.project.name}. It focuses on the raw data from the research phase.` });
            manuscript.push({ id: randomId(), type: 'text', content: `Based on the outline "${chapter.outline}", this section delves into the core mechanics. It is purely informational and avoids stylistic flourishes for now.` });
        }
        return { manuscript, steps, tokensUsed };
    }

    public async executePhase2_BrandRewrite(technicalManuscript: ContentBlock[], onStatusUpdate: (s: ProductionStatus) => void, signal: AbortSignal): Promise<{ manuscript: ContentBlock[], steps: ProductionLogEntryStep[], tokensUsed: number }> {
        this.onStatusUpdate = onStatusUpdate;
        const steps: ProductionLogEntryStep[] = [];
        const brandedManuscript: ContentBlock[] = [];
        let tokensUsed = 0;

        for (let i = 0; i < technicalManuscript.length; i++) {
            const block = technicalManuscript[i];
            const progress = ((i + 1) / technicalManuscript.length) * 100;

            steps.push(await this._runStep("Production (2/3)", `Applying brand voice to block ${i + 1}`, progress, signal));
            tokensUsed += 300 + Math.random() * 100;
            
            const rewrittenContent = `(Rewritten as ${this.project.config.toneAndSentimentGuide.persona}) ${block.content}`;
            brandedManuscript.push({ ...block, content: rewrittenContent });

            // Add an image prompt every 2 text blocks
            if ((i + 1) % 2 === 0) {
                steps.push(await this._runStep("Production (2/3)", `Generating image concept for block ${i + 1}`, progress, signal));
                tokensUsed += 150;
                brandedManuscript.push({
                    id: randomId(),
                    type: 'image',
                    content: `A conceptual image representing "${this.project.name}". Style: ${this.project.config.aiFeatures.visualsConfig.style}.`
                });
            }
        }
        return { manuscript: brandedManuscript, steps, tokensUsed };
    }

    public async executePhase3_ImageGeneration(brandedManuscript: ContentBlock[], onStatusUpdate: (s: ProductionStatus) => void, signal: AbortSignal): Promise<{ manuscript: ContentBlock[], steps: ProductionLogEntryStep[], tokensUsed: number }> {
        this.onStatusUpdate = onStatusUpdate;
        const steps: ProductionLogEntryStep[] = [];
        const finalManuscript = [...brandedManuscript]; // Work on a copy
        const imageBlocks = finalManuscript.filter(b => b.type === 'image');
        let tokensUsed = 0;

        for (let i = 0; i < imageBlocks.length; i++) {
            const block = imageBlocks[i];
            const progress = ((i + 1) / imageBlocks.length) * 100;

            steps.push(await this._runStep("Production (3/3)", `Generating image for prompt: "${block.content.substring(0, 30)}..."`, progress, signal));
            tokensUsed += 800;
            
            // Find the original block in the manuscript and update it
            const blockIndex = finalManuscript.findIndex(b => b.id === block.id);
            if (blockIndex !== -1) {
                // Simulate getting a base64 string
                const hue = Math.floor(Math.random() * 360);
                const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="hsl(${hue}, 50%, 30%)" /><text x="50" y="55" font-size="10" fill="white" text-anchor="middle">${this.project.name}</text></svg>`;
                finalManuscript[blockIndex].imageData = `data:image/svg+xml;base64,${btoa(svg)}`;
            }
        }
        return { manuscript: finalManuscript, steps, tokensUsed };
    }

    static async suggestChapterFramework(topic: string): Promise<Chapter[]> {
        await sleep(1000); // Simulate API call
        return [
            { title: `The Allure of ${topic}`, outline: "Why this side hustle is so popular and the promises it makes." },
            { title: `First Steps & Pitfalls`, outline: "A practical guide to getting started and what to watch out for." },
            { title: `The Economics of ${topic}`, outline: "A deep dive into the real costs, revenue potential, and profit margins." },
            { title: `Scaling Up (or Burning Out)`, outline: "Strategies for growth and the risks of expanding too quickly." },
            { title: `Case Study: A Realistic Journey`, outline: "A fictional but realistic story of someone's experience with ${topic}." },
        ];
    }

    static async parseManuscriptToChapters(fullText: string): Promise<Chapter[]> {
        await sleep(1500); // Simulate complex parsing
        // Mock logic: Split by "CHAPTER" or find large gaps (3+ newlines).
        const potentialChapters = fullText
            .split(/(?:^|\n)\s*CHAPTER\s+\d+\s*\n|(?:\n\s*){3,}/i)
            .map(p => p.trim())
            .filter(p => p.length > 100);

        if (potentialChapters.length === 0 && fullText.length > 0) {
            // Handle single block of text
            return [
                {
                    title: "Chapter 1: The Core Idea",
                    outline: `A summary of the main points covered in the provided document. The text starts with: "${fullText.substring(0, 50)}...".`
                }
            ];
        }
    
        return potentialChapters.map((text, index) => {
            // Generate a mock title from the first line.
            const firstLine = text.trim().split('\n')[0];
            const title = `Chapter ${index + 1}: ${firstLine.substring(0, 40)}${firstLine.length > 40 ? '...' : ''}`;
            
            // Generate a mock outline.
            const contentAfterTitle = text.substring(firstLine.length).trim();
            const outline = `This chapter discusses themes starting with "${contentAfterTitle.substring(0, 80).replace(/\s+/g, ' ')}...". It contains approximately ${text.split(' ').length} words.`;
            
            return { title, outline };
        });
    }

    static async parsePromptsByPhase(documentContent: string): Promise<Omit<ResearchPhase, 'id'>[]> {
        await sleep(1500); // Simulate AI parsing
        const lines = documentContent.split('\n');
        const phases: { [key: string]: string[] } = {};
        let currentPhaseTitle = 'General Prompts';
        let foundFirstPhase = false;

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.length === 0 || trimmedLine.startsWith('---')) {
                continue; // Skip empty lines and separators
            }

            const headerMatch = trimmedLine.match(/^#+\s+(.*)/);
            if (headerMatch) {
                currentPhaseTitle = headerMatch[1].trim();
                if (!phases[currentPhaseTitle]) phases[currentPhaseTitle] = [];
                if (!foundFirstPhase) foundFirstPhase = true;
                continue;
            }

            const listItemMatch = trimmedLine.match(/^[*-]\s+(.*)/);
            const promptText = listItemMatch ? listItemMatch[1].trim() : trimmedLine;

            if (promptText) {
                 if (!foundFirstPhase && !phases[currentPhaseTitle]) {
                    // Create the default phase only when the first prompt is found
                    phases[currentPhaseTitle] = [];
                }
                phases[currentPhaseTitle].push(promptText);
            }
        }

        return Object.entries(phases).map(([title, prompts]) => ({
            title,
            prompts
        }));
    }

    static async parsePrimerToConfig(primerText: string): Promise<Partial<ProjectConfig>> {
        await sleep(1500); // Simulate heavy AI parsing

        const parsedConfig: Partial<ProjectConfig> = {};

        const getSectionContent = (header: string, text: string): string => {
            const regex = new RegExp(`## SECTION [A-Z]: ${header}(.*?)(?=## SECTION|$)`, 'si');
            const match = text.match(regex);
            return match ? match[1].trim() : '';
        };

        const getSubSectionContent = (header: string, sectionText: string): string => {
            const regex = new RegExp(`### ${header}(.*?)(?=###|$)`, 'si');
            const match = sectionText.match(regex);
            return match ? match[1].trim() : '';
        };

        // Parse Tone & Sentiment
        const toneSection = getSectionContent('WRITTEN STYLE, TONE & VOICE', primerText);
        if (toneSection) {
            parsedConfig.toneAndSentimentGuide = {
                persona: getSubSectionContent('CORE IDENTITY', toneSection) || '',
                voice: getSubSectionContent('VOICE CHARACTERISTICS', toneSection) || '',
                constraints: `${getSubSectionContent('FORBIDDEN ELEMENTS', toneSection)}\n${getSubSectionContent('MANDATORY ELEMENTS', toneSection)}`,
                targetAudience: '', // Not in default primer, but parser could look for it.
            };
        }
        
        // Parse Visuals Guide
        const visualSection = getSectionContent('VISUAL STYLE, COMPOSITION & GENERATION SPECIFICATIONS', primerText);
        if (visualSection) {
            parsedConfig.visualsGuide = {
                artDirection: getSubSectionContent('CORE AESTHETIC IDENTITY', visualSection) || '',
                composition: getSubSectionContent('PAGE LAYOUT & GRID SYSTEM', visualSection) || '',
                subjectMatter: getSubSectionContent('COMIC PANEL STRUCTURE & COMPOSITION', visualSection) || '',
                colorPalette: getSubSectionContent('COLOR SYSTEM', visualSection) || '',
            };
        }

        // Parse Chapters
        const chapterSection = getSectionContent('CHAPTER FRAMEWORK', primerText);
        if (chapterSection) {
            const chapters: Chapter[] = [];
            const chapterRegex = /### Chapter \d+: (.*?)\n\*\*Outline\*\*: (.*?)\n/g;
            let match;
            while ((match = chapterRegex.exec(chapterSection)) !== null) {
                chapters.push({ title: match[1].trim(), outline: match[2].trim() });
            }
            parsedConfig.chapters = chapters;
        }

        // Parse Research Prompts
        const researchSection = getSectionContent('RESEARCH PROMPTS', primerText);
        if (researchSection) {
            const phases: ResearchPhase[] = [];
            const phaseBlocks = researchSection.split('### ').slice(1);
            phaseBlocks.forEach((block, index) => {
                const lines = block.split('\n');
                const title = lines[0].trim();
                const prompts = lines.slice(1).filter(l => l.startsWith('- ')).map(l => l.substring(2).trim());
                if (title && prompts.length > 0) {
                    phases.push({ id: `parsed_phase_${index}`, title, prompts });
                }
            });
            parsedConfig.researchPhases = phases;
        }

        return parsedConfig;
    }

    static async suggestSeoKeywords(topic: string): Promise<string[]> {
        await sleep(1200);
        return [
            `how to start ${topic}`,
            `${topic} for beginners`,
            `is ${topic} profitable`,
            `best ${topic} courses`,
            `${topic} tools 2024`,
            `common ${topic} mistakes`,
            `${topic} vs affiliate marketing`,
            `how much does it cost to start ${topic}`,
        ];
    }
    
    static async suggestImagePrompt(textContext: string): Promise<string> {
        await sleep(700);
        return `A new AI-suggested image prompt based on the text: "${textContext.substring(0, 50)}..."`;
    }

    static async suggestTextRewrite(text: string): Promise<string> {
        await sleep(800);
        return `(AI Suggested Rewrite): This is an alternative way to phrase the original content. It provides a different perspective while maintaining the core message. Original word count: ${text.split(' ').length}.`;
    }

    static async rephraseText(text: string): Promise<string> {
        await sleep(800);
        return `(AI Rephrased): ${text.split(' ').reverse().join(' ')}`;
    }
    
    static async performYItAnalysis(topic: string): Promise<YItAnalysisResult> {
        await sleep(1500); // Simulate a more complex API call
        const saturationLevels: ('Low' | 'Medium' | 'High' | 'Extreme')[] = ['Low', 'Medium', 'High', 'Extreme'];
        return {
            viabilityScore: Math.round((Math.random() * 7 + 2) * 10) / 10, // Score between 2.0 and 9.0
            potentialRisks: [
                "High market saturation from existing 'gurus'.",
                "Significant hidden costs in marketing and software.",
                "Algorithm changes on platforms like TikTok or YouTube can tank visibility overnight.",
                "Time investment is much higher than typically advertised.",
            ],
            effortRewardRatio: "High effort for potentially low-to-medium reward in the first 1-2 years.",
            guruSaturation: saturationLevels[Math.floor(Math.random() * saturationLevels.length)],
        };
    }
}
