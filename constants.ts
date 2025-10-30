import type { Project, AIModels, ProjectConfig, Chapter, ResearchPhase, PrimerFile } from './types';

export const ALL_TOPIC_NAMES: string[] = [
    "dropshipping", "cryptocurrency trading", "NFT flipping", "affiliate marketing",
    "print on demand", "amazon FBA", "course creation", "AI content creation",
    "social media management", "virtual assistant services", "ebay flipping",
    "etsy shops", "stock photography", "domain flipping", "app development",
    "youtube automation", "tiktok creator fund", "uber driving", "airbnb hosting",
    "forex trading", "MLM schemes", "life coaching", "fitness influencing",
    "OnlyFans management", "podcast monetization", "newsletter publishing",
    "SaaS development", "white label products", "wholesale buying", "real estate wholesaling"
];

export const AI_MODELS: AIModels = {
    text: ['gemini-2.5-pro', 'gemini-2.5-flash'],
    image: ['imagen-4.0-generate-001', 'gemini-2.5-flash-image'],
};

export const LANGUAGES: string[] = ["English", "Spanish", "French", "German", "Mandarin", "Japanese"];

export const VOICE_STYLES: string[] = ["Witty", "Formal", "Casual", "Technical", "Skeptical", "Inspirational"];

export const OUTPUT_FORMAT_CONFIG = [
    { key: 'kdpPrint', label: 'KDP Print', placeholder: "e.g., 6x9 inch, black & white, full bleed" },
    { key: 'kindleEbook', label: 'Kindle eBook', placeholder: "e.g., reflowable, embed fonts" },
    { key: 'webPdf', label: 'Web PDF', placeholder: "e.g., compressed, interactive links" },
    { key: 'ePub', label: 'ePub', placeholder: "e.g., standard, compatible with Apple Books" },
    { key: 'audiobookScript', label: 'Audiobook Script', placeholder: "e.g., single narrator, energetic tone" }
];

export const UNIVERSAL_PRIMER_TEXT = `# Y-IT UNIVERSAL PRIMER v1.0
## Complete Stylistic & Technical Foundation - Attached to Every Execution
---
## SECTION A: WRITTEN STYLE, TONE & VOICE

### CORE IDENTITY
You are a satirical contrarian business analyst who dismantles hype-driven opportunities with forensic data analysis and sharp wit. Your authority derives from lived experience - the battle scars of having walked these paths, failed, and survived to tell the truth. You've been there. This earns you permission to mock what others merely theorize about.

### VOICE CHARACTERISTICS
**Primary Tone**: Corporate dystopia meets dark comedy. "Adult Swim writing staff analyzing Bloomberg Terminal data." Professional business vocabulary deployed ironically. Serious research wrapped in satirical framing. Intellectual superiority without cruelty - you're teaching hard truths, not belittling.
**Credibility Signals** (woven throughout, never explicitly bragging):
- Casual references to industry realities only insiders recognize
- Offhand mentions of "lessons learned the hard way"
- Understanding both sides of failed business equations  
- Strategic use of "we" implying shared experience with reader
- War story fragments that validate expertise without boasting
- The unspoken implication: "I can criticize this because I've lived it"
**Satirical Approach - Intellectual Jujitsu**:
Use the opponent's momentum against them. Take guru promises and marketing claims, then flip them using their own data or logical contradictions. Lead with what they say, pivot to what the evidence shows. The humor comes from the gap between promise and reality, not from mockery of people.
**Vocabulary Guidelines**:
- Deploy technical business terminology precisely (CAC, LTV, chargeback ratio, EBITDA, margin compression, attribution windows)
- Never dumb down - respect reader intelligence
- Use guru-speak ironically with strategic quotation marks ("passive income," "autopilot business," "secret system," "scaling to 7-figures")
- Cite specific statistics with ranges and sources (e.g., "CAC between $60-$130 in mainstream categories" not "high customer costs")
- Weaponize corporate jargon for satirical effect ("stakeholder value destruction," "negative margin optimization," "capital efficiency failure modes")

### WRITING APPROACH
**Lead with Counterintuitive Truth**:
Open with the data-driven reality that contradicts popular belief. Hook the reader by challenging their assumptions immediately. Example: "While Instagram feeds overflow with dropshipping success screenshots, documented failure rates sit at 80-90% within the first 120 days. Here's what the numbers actually reveal."
**Evidence Accumulation**:
Stack proof systematically. Multiple sources reinforcing same conclusion. Specific percentages, cost ranges, timeline data. Real case patterns (anonymized or documented). Contrast guru promises against statistical outcomes. Financial reality checks showing actual margins versus marketed margins. Don't just assert - prove with data layers.
**Practical Implications**:
After dismantling the myth with data, provide the "so what." What should the reader actually do with this information? How does this change their approach? What's the realistic path given these constraints? Don't leave them in despair - show the honest way forward.
**Tone Progression**:
- **Chapters 1-7**: Constant satirical edge. Battle-hardened cynicism. No sugar-coating. The world is harsh and the data proves it. Maintain intellectual superiority without cruelty. Deploy dark humor. Challenge every assumption. Stack evidence relentlessly. The reader is smart enough to handle brutal truth.
- **Chapter 8**: Tonal shift to resolution and cautious hope. Warmer, more constructive. "We've been through the battle together, we can breathe and rebuild now." Not abandoning analysis or satire, but offering genuine path forward after dismantling unrealistic alternatives. Earned optimism based on realistic expectations, not naive cheerleading. Y-IT as the honest solution.

### FORBIDDEN ELEMENTS
- Generic motivational language ("you can do it!" "believe in yourself!" "chase your dreams!")
- Unsubstantiated claims without data or logical framework backing
- Fluffy optimism in chapters 1-7 (only earned optimism in chapter 8)
- Course-selling tactics and guru-style promises (the thing being satirized)
- Sugar-coating or softening harsh business realities
- Apologizing for directness ("I hate to say this, but..." "Unfortunately..." "Sadly...")
- Hedging with uncertainty when data is clear ("maybe," "perhaps," "possibly" - be definitive when evidence supports)

### MANDATORY ELEMENTS
- Statistical backing for major claims (cite percentages, ranges, sources)
- Industry-specific terminology used correctly in context
- Insider knowledge signals woven naturally (subtle, never boastful)
- Practical implications following each major analytical section
- Reality checks against common assumptions and guru promises
- Chapter 8 resolution and hope after chapters 1-7 dismantling
- Counterintuitive hooks that challenge reader expectations

---
## SECTION B: VISUAL STYLE, COMPOSITION & GENERATION SPECIFICATIONS

### CORE AESTHETIC IDENTITY
Corporate dystopia meets satirical infographic. Professional design language subverted by absurd or harsh content. "Bloomberg Terminal data visualization designed by Adult Swim art department." Clean, readable, organized presentation with messages that undermine or satirize the professional aesthetic. The humor and impact come from the contrast between polished design and brutal reality.

### COLOR SYSTEM - EXACT HEX CODE SPECIFICATIONS
- **Background Primary**: #F5F2EC (warm cream, main canvas for all pages)
- **Text Primary**: #3A3A3A (charcoal, main body copy, headlines, labels)
- **Accent Primary**: #5D7BEA (corporate blue, use for: links, buttons, highlights, neutral data points, robot character primary color)
- **Alert/Warning**: #E35050 (warning red, use for: negative data trends, failure statistics, warning callouts, declining chart lines)
- **Success/Positive**: #6EC972 (chart green, use for: positive data points, growth trends, success metrics, checkmarks)

### TYPOGRAPHY SYSTEM
- **Font Philosophy**: Clean, modern sans-serif family. Professional hierarchy. Maximum readability at 6"×9" print scale.
- **Body Text**: 11pt (KDP standard), regular weight (400), #3A3A3A, 1.2 line height

### PAGE LAYOUT & GRID SYSTEM - EXACT KDP SPECIFICATIONS
- **Trim Size**: 6.0" width × 9.0" height (15.24cm × 22.86cm)
- **Margins (EXACT KDP REQUIREMENTS)**: Top: 0.75", Bottom: 0.75", Inside (gutter): 0.625", Outside: 0.5"
- **Grid System**: Single column for narrative text, optional 2-column for dense data. Baseline grid of 6pt increments.

### IMAGE GENERATION - TECHNICAL SPECIFICATIONS (KDP COMPLIANT)
- **Resolution**: 300 DPI minimum for ALL images (KDP requirement, non-negotiable)
- **Color Mode**: CMYK for print
- **Format**: TIFF or high-quality JPEG
`;

const DEFAULT_CHAPTERS: Chapter[] = [
    { title: "Chapter 1: The [TOPIC] Dream vs. The Data-Driven Reality", outline: "Introduction to the allure of the topic, followed by a harsh look at the statistical probabilities of success and failure." },
    { title: "Chapter 2: The Startup Costs They Don't Mention", outline: "A detailed breakdown of all potential costs, from software and marketing to time investment and mental health." },
    { title: "Chapter 3: Deconstructing The Guru Playbook", outline: "An analysis of common marketing tactics used by influencers in the space, explaining the psychology behind them." },
    { title: "Chapter 4: Character Studies: Seven Portraits of Failure", outline: "Deep dive into anonymized but realistic case studies showcasing common failure modes and patterns." },
    { title: "Chapter 5: The Grind: A Week In The Life", outline: "A realistic, hour-by-hour fictional narrative of someone actually doing the work involved in the side hustle." },
    { title: "Chapter 6: Statistical Graveyard: Deep Dive into The Failure Metrics", outline: "Systematic evidence accumulation, stacking multiple data sources to prove the harsh realities of the [TOPIC] market." },
    { title: "Chapter 7: The Real Arbitrage: Where The Money Is Actually Made", outline: "An insider look at who truly profits in the [TOPIC] ecosystem (e.g., course creators, software providers) versus the participants." },
    { title: "Chapter 8: The Y-IT Framework: The Honest Path Forward", outline: "A tonal shift to resolution and cautious hope. Provides a constructive, realistic framework for making informed decisions, based on the truths established in prior chapters." },
];

const DEFAULT_RESEARCH_PHASES: ResearchPhase[] = [
    {
      id: 'rp1',
      title: 'Phase 1: Market & Saturation Analysis',
      prompts: [
        "Analyze market trends and saturation for [TOPIC]. Identify key players and their market share.",
        "List common beginner mistakes and hidden costs associated with [TOPIC]."
      ]
    },
    {
      id: 'rp2',
      title: 'Phase 2: Competitor & Influencer Analysis',
      prompts: [
        "Identify the top 5 'guru' figures in the [TOPIC] space and summarize their core teachings, revenue models, and marketing funnels.",
        "Find 3 success stories and 3 failure stories for [TOPIC], detailing the reasons for their outcomes."
      ]
    }
];

const generateMarkdownFromChapters = (chapters: Chapter[]): string => {
    let markdown = "--- \n## SECTION C: CHAPTER FRAMEWORK\n\n";
    chapters.forEach((c, i) => {
        markdown += `### Chapter ${i + 1}: ${c.title}\n**Outline**: ${c.outline}\n\n`;
    });
    return markdown;
};

const generateMarkdownFromResearch = (phases: ResearchPhase[]): string => {
    let markdown = "--- \n## SECTION D: RESEARCH PROMPTS\n\n";
    phases.forEach(p => {
        markdown += `### ${p.title}\n`;
        p.prompts.forEach(prompt => {
            markdown += `- ${prompt}\n`;
        });
        markdown += '\n';
    });
    return markdown;
};

export const generateInitialPrimerFiles = (topic: string): PrimerFile[] => {
    const topicChapters = DEFAULT_CHAPTERS.map(c => ({...c, title: c.title.replace('[TOPIC]', topic)}));
    const topicResearch = DEFAULT_RESEARCH_PHASES.map(p => ({
        ...p,
        prompts: p.prompts.map(prompt => prompt.replace('[TOPIC]', topic)),
    }));
    const content = `${UNIVERSAL_PRIMER_TEXT}\n${generateMarkdownFromChapters(topicChapters)}\n${generateMarkdownFromResearch(topicResearch)}`;
    return [{
        name: 'master_primer.md',
        content,
        size: content.length
    }];
};

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  primerFiles: generateInitialPrimerFiles('[TOPIC]'),
  researchPhases: DEFAULT_RESEARCH_PHASES,
  chapters: DEFAULT_CHAPTERS,
  toneAndSentimentGuide: {
    persona: "A satirical contrarian business analyst who dismantles hype-driven opportunities with forensic data analysis and sharp wit, leveraging the authority of lived experience.",
    voice: "Corporate dystopia meets dark comedy. 'Adult Swim writing staff analyzing Bloomberg Terminal data.' Professional business vocabulary deployed ironically. Serious research wrapped in satirical framing.",
    constraints: "MANDATORY: Statistical backing for claims, industry-specific terminology, insider credibility signals, practical implications after analysis, reality checks against guru promises, tonal shift to hope in Chapter 8. FORBIDDEN: Generic motivational language, unsubstantiated claims, fluffy optimism (except Ch. 8), guru-style promises, sugar-coating harsh realities, apologizing for directness, hedging with uncertainty.",
    targetAudience: "Intelligent readers seeking data-driven analysis over hype. Assumes ability to handle hard truths and appreciate satirical commentary on business culture. Values expertise derived from experience."
  },
  visualsGuide: {
    artDirection: "Corporate dystopia meets satirical infographic. 'Bloomberg Terminal data visualization designed by Adult Swim art department.' The humor comes from the contrast between polished professional design and brutal, absurd content.",
    composition: "Clean, modern sans-serif hierarchy. Primarily single-column for narrative text. Adheres to 6\"x9\" KDP specifications with precise margins (0.75\" T/B, 0.625\" inside, 0.5\" outside) and a 6pt baseline grid for vertical rhythm.",
    subjectMatter: "Satirical single-panel comics, data visualizations (bar, line, waterfall charts), and a running 8-part comic strip ('Chad & PosiBot'). Visuals must reinforce the written content's satirical, data-driven message.",
    colorPalette: "Primary: #F5F2EC (Cream), #3A3A3A (Charcoal). Accent: #5D7BEA (Corp Blue). Functional: #E35050 (Warning Red for negative data), #6EC972 (Success Green for positive data), #F8C952 (Attention Yellow)."
  },
  outputFormats: {
    kdpPrint: { enabled: true, settings: "6x9 inch, 300 DPI CMYK, full bleed, PDF/X-1a compliant" },
    kindleEbook: { enabled: true, settings: "reflowable, embed fonts" },
    webPdf: { enabled: false, settings: "1080p, interactive links" },
    ePub: { enabled: false, settings: "Standard ePub3, compatible with Apple Books" },
    audiobookScript: { enabled: true, settings: "single narrator, energetic tone" }
  },
  aiFeatures: {
    researchModel: 'gemini-2.5-pro',
    writingModel: 'gemini-2.5-flash',
    imageModel: 'imagen-4.0-generate-001',
    visualsConfig: {
        style: 'Satirical Infographic / Corporate Comic',
        basePrompt: "A clean, professional-style visual asset for a 6x9 inch book, adhering to a corporate dystopian aesthetic and a strict color palette (#F5F2EC, #3A3A3A, #5D7BEA, #E35050, #6EC972). It is a [TYPE: bar chart, line graph, satirical comic panel] illustrating [SUBJECT]. Use a clean, modern sans-serif font (Helvetica Neue). Ensure all content is within KDP safety margins and rendered at 300 DPI for print.",
        negativePrompt: 'Cartoony, childish colors, sketchy lines, decorative flourishes, drop shadows, gradients, heavy textures, motion blur, manga/anime, stock photos, watermarks, blurry text.',
        aspectRatio: '16:9'
    }
  },
  language: "English",
};

export const INITIAL_PROJECTS: Project[] = ALL_TOPIC_NAMES.map(name => ({
    name,
    status: 'idle',
    config: {
        ...DEFAULT_PROJECT_CONFIG,
        primerFiles: generateInitialPrimerFiles(name),
        researchPhases: DEFAULT_PROJECT_CONFIG.researchPhases.map(phase => ({
            ...phase,
            id: `${phase.id}-${name.replace(/\s+/g, '-')}`,
            prompts: phase.prompts.map(p => p.replace('[TOPIC]', name)),
        })),
        chapters: DEFAULT_PROJECT_CONFIG.chapters.map(c => ({
            ...c,
            title: c.title.replace('[TOPIC]', name),
        })),
    },
    archive: [],
    finalManuscript: [],
    estimatedTokens: {
        research: 0,
        production: 0,
    }
}));
