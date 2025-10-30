import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ProductionStatus, Project, Chapter, AIFeaturesConfig, VisualsGuideConfig, ProjectConfig, ToneAndSentimentGuide, ProjectTemplate, ProjectConfigSnapshot, ContentBlock, ResearchPhase, PrimerFile } from '../types';
import { BookOpenIcon, XMarkIcon, PlayIcon, Cog6ToothIcon, ArchiveBoxIcon, PlusIcon, TrashIcon, SparklesIcon, BeakerIcon, ArrowUturnLeftIcon, CpuChipIcon, ChevronDownIcon, DocumentDuplicateIcon, ArrowUpIcon, ArrowDownIcon, LanguageIcon, MagnifyingGlassIcon, EyeIcon, PencilSquareIcon, ArrowDownTrayIcon, TicketIcon, DocumentTextIcon, CheckIcon, ArrowUpOnSquareIcon } from './icons/Icons';
import { YItBookFactory } from '../services/geminiService';
import { AI_MODELS, OUTPUT_FORMAT_CONFIG, LANGUAGES, VOICE_STYLES } from '../constants';
import { useAppContext, useToasts } from '../App';

interface ProjectWorkspaceProps {
    selectedProject: Project | null;
}

const commonInputClass = "w-full bg-yit-bg border border-yit-border rounded-lg px-4 py-2.5 text-sm text-yit-text-lightest placeholder-yit-text-dark focus:ring-2 focus:ring-yit-accent/50 focus:outline-none transition";
const commonButtonClass = "px-5 py-2.5 text-sm font-semibold text-white bg-yit-accent rounded-lg hover:bg-yit-accent-hover disabled:bg-yit-bg-tertiary disabled:text-yit-text-dark disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yit-bg-secondary focus:ring-yit-accent";
const commonSecondaryButtonClass = "flex items-center gap-2 px-4 py-2 text-sm font-medium text-yit-text-light bg-yit-bg-tertiary rounded-lg hover:bg-yit-border transition-colors";

// --- SHARED COMPONENTS ---
const Accordion: React.FC<{ title: string, children: React.ReactNode, icon: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, icon, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-yit-border rounded-lg bg-yit-bg overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-yit-bg-secondary hover:bg-yit-bg-tertiary transition-colors">
                <div className="flex items-center gap-3">
                    <span className="text-yit-accent">{icon}</span>
                    <h3 className="font-semibold text-yit-text-lightest">{title}</h3>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-yit-text-dark transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4">{children}</div>}
        </div>
    );
}

const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string }> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-yit-bg-secondary rounded-lg border border-yit-border max-w-md w-full shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-yit-text-lightest">{title}</h3>
                <p className="text-yit-text-dark mt-2 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className={commonSecondaryButtonClass}>Cancel</button>
                    <button onClick={onConfirm} className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
};

const SaveChangesBar: React.FC<{ onSave: () => void, onDiscard: () => void }> = ({ onSave, onDiscard }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleConfirmDiscard = () => { onDiscard(); setIsModalOpen(false); };
    return (
        <>
            <div className="sticky bottom-4 z-10 w-full flex justify-center">
                <div className="bg-yit-bg-tertiary/80 backdrop-blur-md border border-yit-border rounded-lg shadow-2xl p-3 flex items-center gap-4">
                    <p className="text-sm font-medium text-yit-text-light">You have unsaved changes.</p>
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-sm font-medium text-yit-text-light rounded-md hover:bg-yit-border transition-colors">Discard</button>
                    <button onClick={onSave} className={commonButtonClass}>Save (Ctrl+S)</button>
                </div>
            </div>
            <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmDiscard} title="Discard Changes?" message="Are you sure you want to discard your unsaved changes? This action cannot be undone." />
        </>
    );
};

// --- EDITOR COMPONENTS ---

const PrimerFileManager: React.FC<{
    files: PrimerFile[];
    onFilesChange: (newFiles: PrimerFile[]) => void;
    onReparse: () => Promise<void>;
}> = ({ files, onFilesChange, onReparse }) => {
    const { addToast } = useToasts();
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
        const addedFiles = event.target.files;
        if (!addedFiles) return;

        let newPrimerFiles: PrimerFile[] = [...files];
        const promises = Array.from(addedFiles).map(file => {
            return new Promise<void>((resolve, reject) => {
                if (files.some(f => f.name === file.name)) {
                    addToast(`File "${file.name}" already exists and was skipped.`, 'info');
                    resolve();
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    newPrimerFiles.push({
                        name: file.name,
                        content: e.target?.result as string,
                        size: file.size
                    });
                    resolve();
                };
                reader.onerror = (err) => {
                    addToast(`Error reading file "${file.name}".`, 'error');
                    reject(err);
                }
                reader.readAsText(file);
            });
        });

        Promise.all(promises).then(() => {
            onFilesChange(newPrimerFiles);
        }).catch(err => {
            addToast('An error occurred while adding files.', 'error');
        });

        if(event.target) event.target.value = '';
    };

    const handleFileRemove = (fileName: string) => {
        onFilesChange(files.filter(f => f.name !== fileName));
    };
    
    const handleParseClick = async () => {
        setIsParsing(true);
        await onReparse();
        setIsParsing(false);
    };

    return (
        <div className="space-y-4 p-4 border border-yit-border rounded-lg bg-yit-bg">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                    <h3 className="font-semibold text-yit-text-lightest text-lg">Project Master Document</h3>
                    <p className="text-sm text-yit-text-dark">Upload .txt or .md files. The combined content will be parsed.</p>
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileAdd} multiple accept=".txt,.md,text/plain,text/markdown" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className={`${commonSecondaryButtonClass}`}>
                        <ArrowUpOnSquareIcon className="w-5 h-5"/> Upload Files
                    </button>
                    <button onClick={handleParseClick} disabled={isParsing || !files || files.length === 0} className={`${commonButtonClass} flex items-center gap-2`}>
                        <SparklesIcon className="w-5 h-5"/>
                        {isParsing ? 'Parsing...' : 'Reparse Document'}
                    </button>
                </div>
            </div>

            {files && files.length > 0 ? (
                <ul className="border border-yit-border rounded-lg divide-y divide-yit-border max-h-60 overflow-y-auto">
                    {files.map(file => (
                        <li key={file.name} className="p-3 flex justify-between items-center bg-yit-bg-secondary group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <DocumentTextIcon className="w-5 h-5 text-yit-text-dark flex-shrink-0"/>
                                <div className="overflow-hidden">
                                    <p className="font-medium text-sm text-yit-text-lightest truncate" title={file.name}>{file.name}</p>
                                    <p className="text-xs text-yit-text-dark">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                            <button onClick={() => handleFileRemove(file.name)} className="p-1 text-yit-red/70 hover:text-yit-red hover:bg-yit-bg rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center py-8 border-2 border-dashed border-yit-border rounded-lg">
                    <DocumentDuplicateIcon className="w-10 h-10 mx-auto text-yit-text-dark mb-2"/>
                    <p className="text-sm text-yit-text-dark">No primer files uploaded.</p>
                    <p className="text-xs text-yit-text-dark/70">Click 'Upload Files' to add your project documents.</p>
                </div>
            )}
        </div>
    );
};

const ParsedDataViewer: React.FC<{ config: ProjectConfig }> = ({ config }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-yit-text-lightest mt-6 px-1">Parsing Results</h3>
            <Accordion title="Research Prompts" icon={<BeakerIcon className="w-5 h-5"/>} defaultOpen={false}>
                <ul className="space-y-3">
                    {config.researchPhases.map(phase => (
                        <li key={phase.id}>
                            <p className="font-semibold text-yit-text-light mb-1">{phase.title}</p>
                            <ul className="pl-4 space-y-1 text-sm list-disc list-inside text-yit-text-dark">
                                {phase.prompts.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        </li>
                    ))}
                </ul>
            </Accordion>
             <Accordion title="Chapter Framework" icon={<BookOpenIcon className="w-5 h-5"/>} defaultOpen={false}>
                 <ul className="space-y-3">
                    {config.chapters.map((chapter, i) => (
                        <li key={i} className="p-2 bg-yit-bg-secondary rounded-md">
                            <p className="font-semibold text-yit-text-light">{chapter.title}</p>
                            <p className="text-sm text-yit-text-dark pl-2 border-l-2 border-yit-border ml-1 mt-1">{chapter.outline}</p>
                        </li>
                    ))}
                 </ul>
            </Accordion>
            <Accordion title="Tone & Persona Guide" icon={<SparklesIcon className="w-5 h-5"/>} defaultOpen={false}>
                <div className="space-y-2 text-sm">
                    <p><strong className="text-yit-text-light">Persona:</strong> <span className="text-yit-text-dark">{config.toneAndSentimentGuide.persona}</span></p>
                    <p><strong className="text-yit-text-light">Voice:</strong> <span className="text-yit-text-dark">{config.toneAndSentimentGuide.voice}</span></p>
                </div>
            </Accordion>
        </div>
    );
};

// --- VIEWS ---

const ConfigurationView: React.FC<{ project: Project; onConfigChange: (newConfig: ProjectConfig) => void }> = ({ project, onConfigChange }) => {
    const { addToast } = useToasts();
    
    const handleReparse = async () => {
        addToast("Parsing master document...", "info");
        try {
            const combinedPrimerText = project.config.primerFiles.map(f => f.content).join('\n\n---\n\n');
             if (!combinedPrimerText.trim()) {
                addToast("No content to parse. Upload files with content.", "error");
                return;
            }
            const parsedData = await YItBookFactory.parsePrimerToConfig(combinedPrimerText);
            
            const newConfig = { ...project.config, ...parsedData, };
            onConfigChange(newConfig);
            addToast("Document parsed successfully.", "success");
        } catch (error: any) {
            addToast(`Failed to parse document: ${error.message}`, "error");
            console.error(error);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <PrimerFileManager
                files={project.config.primerFiles || []}
                onFilesChange={newFiles => onConfigChange({ ...project.config, primerFiles: newFiles })}
                onReparse={handleReparse}
            />
            <ParsedDataViewer config={project.config} />
        </div>
    );
};

const AIFeaturesView: React.FC<{ project: Project; onConfigChange: (newConfig: ProjectConfig) => void }> = ({ project, onConfigChange }) => {
    const { updateUserPreferences } = useAppContext();
    const { aiFeatures } = project.config;
    const handleAIConfigChange = (updates: Partial<AIFeaturesConfig>) => {
        const newAIFeatures = { ...aiFeatures, ...updates };
        onConfigChange({ ...project.config, aiFeatures: newAIFeatures });
        updateUserPreferences('aiFeatures', newAIFeatures);
    };
    const imageStyles = ["Technical Diagram", "Photorealistic", "Cartoon", "Satirical Meme", "Anime", "Data Visualization"];
    const aspectRatios = ["16:9", "1:1", "4:3", "3:4", "9:16"];
    return (
        <div className="space-y-4 p-4">
            <div className="p-4 border border-yit-border rounded-lg bg-yit-bg">
                <h4 className="font-bold text-yit-text-lightest mb-4">Model Selection</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-yit-text-dark mb-1">Research Model</label>
                        <select value={aiFeatures.researchModel} onChange={e => handleAIConfigChange({ researchModel: e.target.value })} className={commonInputClass}>{AI_MODELS.text.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-yit-text-dark mb-1">Content Writing Model</label>
                        <select value={aiFeatures.writingModel} onChange={e => handleAIConfigChange({ writingModel: e.target.value })} className={commonInputClass}>{AI_MODELS.text.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-yit-text-dark mb-1">Image Generation Model</label>
                        <select value={aiFeatures.imageModel} onChange={e => handleAIConfigChange({ imageModel: e.target.value })} className={commonInputClass}>{AI_MODELS.image.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    </div>
                </div>
            </div>
            <div className="p-4 border border-yit-border rounded-lg bg-yit-bg">
                <h4 className="font-bold text-yit-text-lightest mb-4">Advanced Imagery</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-yit-text-dark mb-1">Artistic Style</label>
                        <select value={aiFeatures.visualsConfig.style} onChange={e => handleAIConfigChange({ visualsConfig: { ...aiFeatures.visualsConfig, style: e.target.value }})} className={commonInputClass}>{imageStyles.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-yit-text-dark mb-1">Aspect Ratio</label>
                         <select value={aiFeatures.visualsConfig.aspectRatio} onChange={e => handleAIConfigChange({ visualsConfig: { ...aiFeatures.visualsConfig, aspectRatio: e.target.value }})} className={commonInputClass}>{aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}</select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-yit-text-dark mb-1">Base Prompt</label>
                        <textarea value={aiFeatures.visualsConfig.basePrompt} onChange={e => handleAIConfigChange({ visualsConfig: { ...aiFeatures.visualsConfig, basePrompt: e.target.value }})} className={`${commonInputClass} h-20 resize-y`} placeholder="e.g., A clean diagram illustrating [SUBJECT]..."></textarea>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-yit-text-dark mb-1">Negative Prompt</label>
                        <textarea value={aiFeatures.visualsConfig.negativePrompt} onChange={e => handleAIConfigChange({ visualsConfig: { ...aiFeatures.visualsConfig, negativePrompt: e.target.value }})} className={`${commonInputClass} h-20 resize-y`} placeholder="e.g., text, watermarks, blurry..."></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GenericStateView: React.FC<{ icon: React.ReactNode, title: string, message: string }> = ({ icon, title, message }) => (
    <div className="text-center py-16 text-yit-text-dark">
        {icon}
        <p className="font-semibold text-yit-text-light">{title}</p>
        <p className="text-sm">{message}</p>
    </div>
);

const ResearchView: React.FC<{ project: Project }> = ({ project }) => {
    return (
        <div className="p-4">
            {project.researchData && project.researchData.length > 0 ? (
                <div className="space-y-4">
                    <h4 className="font-bold text-yit-text-lightest">Research Findings</h4>
                    <ul className="space-y-2 bg-yit-bg p-4 rounded-lg border border-yit-border whitespace-pre-wrap">
                        {project.researchData.map((finding, index) => ( <li key={index} className="text-sm text-yit-text-light relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-yit-accent">{finding}</li> ))}
                    </ul>
                </div>
            ) : <GenericStateView icon={<BeakerIcon className="w-12 h-12 mx-auto mb-2" />} title="No Research Data" message="Run the research phase to generate findings for this project." />}
        </div>
    );
};

const ArchiveView: React.FC<{ project: Project; onRestore: (timestamp: string) => void }> = ({ project, onRestore }) => {
    const [compareA, setCompareA] = useState<ProjectConfigSnapshot | null>(null);
    const [compareB, setCompareB] = useState<ProjectConfigSnapshot | null>(null);
    const isComparing = compareA && compareB;

    const getDiff = useCallback(() => {
        if (!isComparing) return {};
        const diff: Record<string, { a: any, b: any }> = {};
        const allKeys = new Set([...Object.keys(compareA), ...Object.keys(compareB)]) as Set<keyof ProjectConfigSnapshot>;
        allKeys.forEach(key => {
            if (key === 'timestamp') return;
            const valA = JSON.stringify(compareA[key]);
            const valB = JSON.stringify(compareB[key]);
            if (valA !== valB) diff[key] = { a: compareA[key], b: compareB[key] };
        });
        return diff;
    }, [compareA, compareB, isComparing]);


    return (
        <div className="p-1">
            {project.archive && project.archive.length > 0 ? (
                <div className="space-y-3 p-3">
                    {isComparing && (
                        <div className="p-4 border border-yit-accent/50 rounded-lg bg-yit-accent/10 mb-4">
                            <h4 className="font-bold text-yit-text-lightest mb-2">Comparison</h4>
                            <div className="bg-yit-bg p-2 rounded text-xs font-mono max-h-60 overflow-auto">
                                {Object.entries(getDiff()).map(([key, {a, b}]) => (
                                    <div key={key}>
                                        <p className="text-yit-yellow font-bold">{key}:</p>
                                        <p><span className="text-red-400">- </span>{JSON.stringify(a)}</p>
                                        <p><span className="text-green-400">+ </span>{JSON.stringify(b)}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { setCompareA(null); setCompareB(null); }} className="text-xs mt-2 p-1 bg-yit-bg-tertiary rounded">Clear Comparison</button>
                        </div>
                    )}
                    {project.archive.map((snapshot) => (
                        <div key={snapshot.timestamp} className="flex justify-between items-center bg-yit-bg p-3 rounded-lg border border-yit-border hover:border-yit-border-light transition-colors">
                            <div>
                                <p className="font-semibold text-yit-text-light">Version from:</p>
                                <p className="text-sm text-yit-text-dark">{new Date(snapshot.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCompareA(snapshot)} className={`p-1 rounded text-xs ${compareA?.timestamp === snapshot.timestamp ? 'bg-yit-blue text-white' : 'bg-yit-bg-tertiary'}`}>A</button>
                                <button onClick={() => setCompareB(snapshot)} className={`p-1 rounded text-xs ${compareB?.timestamp === snapshot.timestamp ? 'bg-yit-blue text-white' : 'bg-yit-bg-tertiary'}`}>B</button>
                                <button onClick={() => onRestore(snapshot.timestamp)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-yit-bg-tertiary rounded-md hover:bg-yit-border transition-colors"><ArrowUturnLeftIcon className="w-4 h-4" /> Restore</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <GenericStateView icon={<ArchiveBoxIcon className="w-12 h-12 mx-auto mb-2" />} title="No Archived Versions" message="Project configurations will be archived here automatically when you save changes." />}
        </div>
    );
};

const SeoView: React.FC<{ project: Project }> = ({ project }) => {
    const [keywords, setKeywords] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const handleAnalyze = async () => {
        setIsLoading(true);
        const result = await YItBookFactory.suggestSeoKeywords(project.name);
        setKeywords(result);
        setIsLoading(false);
    };
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
                <input type="text" value={project.name} readOnly className={`${commonInputClass} bg-yit-bg-secondary`} />
                <button onClick={handleAnalyze} disabled={isLoading} className={commonButtonClass}>{isLoading ? 'Analyzing...' : 'Analyze Topic'}</button>
            </div>
            {keywords.length > 0 && <ul className="space-y-2 bg-yit-bg p-4 rounded-lg border border-yit-border">{keywords.map((k, i) => <li key={i} className="text-sm text-yit-text-light">{k}</li>)}</ul>}
        </div>
    );
};

const TextBlockEditor: React.FC<{ block: ContentBlock; onUpdate: (newContent: string) => void; onDelete: () => void; }> = ({ block, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(block.content);
    const [suggestion, setSuggestion] = useState<string | null>(null);

    const handleSave = () => { onUpdate(content); setIsEditing(false); };
    const handleRegenerate = async () => { const newContent = await YItBookFactory.suggestTextRewrite(block.content); onUpdate(newContent); };
    const handleSuggest = async () => { const newSuggestion = await YItBookFactory.suggestTextRewrite(block.content); setSuggestion(newSuggestion); };
    
    return (
        <div className="p-3 bg-yit-bg rounded-md border border-yit-border group relative">
            {isEditing ? (
                <textarea value={content} onChange={e => setContent(e.target.value)} className={`${commonInputClass} h-32 resize-y mb-2`} />
            ) : (
                <p className="text-sm text-yit-text-light whitespace-pre-wrap">{block.content}</p>
            )}
            {suggestion && (
                <div className="my-2 p-2 border-l-2 border-yit-blue bg-yit-blue/10 text-xs">
                    <p className="font-bold text-yit-text-light">Suggestion:</p>
                    <p>{suggestion}</p>
                    <button onClick={() => { onUpdate(suggestion); setSuggestion(null); }} className="text-yit-blue font-semibold mt-1">Accept</button>
                </div>
            )}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-yit-bg-tertiary p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                {isEditing ? (
                    <button onClick={handleSave} className="p-1.5 text-yit-green hover:bg-yit-bg"><CheckIcon className="w-4 h-4"/></button>
                ) : (
                    <>
                        <button title="Edit" onClick={() => setIsEditing(true)} className="p-1.5 text-yit-text-dark hover:bg-yit-bg"><PencilSquareIcon className="w-4 h-4"/></button>
                        <button title="Suggest Rewrite" onClick={handleSuggest} className="p-1.5 text-yit-text-dark hover:bg-yit-bg"><SparklesIcon className="w-4 h-4"/></button>
                        <button title="Regenerate" onClick={handleRegenerate} className="p-1.5 text-yit-text-dark hover:bg-yit-bg"><ArrowUturnLeftIcon className="w-4 h-4"/></button>
                        <button title="Delete" onClick={onDelete} className="p-1.5 text-yit-red/80 hover:bg-yit-bg"><TrashIcon className="w-4 h-4"/></button>
                    </>
                )}
            </div>
        </div>
    );
};

const ImageBlockEditor: React.FC<{ block: ContentBlock; onUpdate: (newPrompt: string, newImageData: string) => void; onDelete: () => void; }> = ({ block, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [prompt, setPrompt] = useState(block.content);
    
    const handleSave = async () => {
        const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="hsl(210, 50%, 30%)" /><text x="50" y="55" font-size="8" fill="white" text-anchor="middle">REFINED</text></svg>`;
        const newImageData = `data:image/svg+xml;base64,${btoa(svg)}`;
        onUpdate(prompt, newImageData);
        setIsEditing(false);
    };

    return (
        <div className="p-3 bg-yit-bg rounded-md border border-yit-border group relative">
            {block.imageData && <img src={block.imageData} alt={block.content} className="rounded-md mb-2 max-h-60 mx-auto" />}
            {isEditing ? (
                 <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className={`${commonInputClass} h-20 resize-y text-xs font-mono`} />
            ) : (
                <p className="text-xs text-yit-text-dark font-mono bg-yit-bg-secondary p-2 rounded-md">{block.content}</p>
            )}
             <div className="absolute top-2 right-2 flex items-center gap-1 bg-yit-bg-tertiary p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                 {isEditing ? (
                    <button onClick={handleSave} className="p-1.5 text-yit-green hover:bg-yit-bg"><CheckIcon className="w-4 h-4"/></button>
                ) : (
                    <>
                        <button title="Edit Prompt" onClick={() => setIsEditing(true)} className="p-1.5 text-yit-text-dark hover:bg-yit-bg"><PencilSquareIcon className="w-4 h-4"/></button>
                        <button title="Regenerate" onClick={handleSave} className="p-1.5 text-yit-text-dark hover:bg-yit-bg"><ArrowUturnLeftIcon className="w-4 h-4"/></button>
                        <button title="Delete" onClick={onDelete} className="p-1.5 text-yit-red/80 hover:bg-yit-bg"><TrashIcon className="w-4 h-4"/></button>
                    </>
                )}
            </div>
        </div>
    );
};

const ManuscriptView: React.FC<{ project: Project }> = ({ project }) => {
    const { addToast } = useToasts();
    const { updateProject, importTechnicalManuscript, importAndReplaceBrandedManuscript } = useAppContext();
    const [manuscript, setManuscript] = useState<ContentBlock[]>(project.finalManuscript || []);

    useEffect(() => {
        setManuscript(project.finalManuscript || []);
    }, [project.finalManuscript]);

    const handleFileImport = (callback: (projectName: string, manuscript: ContentBlock[]) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedManuscript = JSON.parse(content);
                // Basic validation
                if (Array.isArray(parsedManuscript) && parsedManuscript.every(b => b.id && b.type && b.content)) {
                    callback(project.name, parsedManuscript);
                } else {
                    throw new Error("Invalid manuscript file structure.");
                }
            } catch (error) {
                addToast("Failed to import file. Make sure it's a valid JSON manuscript.", 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    const handleExport = (content: ContentBlock[], defaultFilename: string) => {
        const jsonString = JSON.stringify(content, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}-${defaultFilename}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSaveEdits = () => {
        updateProject(project.name, { finalManuscript: manuscript });
        addToast("Manuscript changes saved.", "success");
    };

    const handleUpdateBlock = (index: number, newBlockData: Partial<ContentBlock>) => {
        const newManuscript = [...manuscript];
        newManuscript[index] = { ...newManuscript[index], ...newBlockData };
        setManuscript(newManuscript);
    };
    
    const handleDeleteBlock = (index: number) => setManuscript(manuscript.filter((_, i) => i !== index));

    if (project.status === 'production_phase1_complete') {
        const draft = project.technicalManuscript || [];
        return (
            <div className="p-4 space-y-6">
                <div className="p-4 bg-yit-bg rounded-lg border border-yit-border">
                    <h3 className="text-lg font-bold text-yit-text-lightest">Phase 1 Complete: Technical Manuscript</h3>
                    <p className="text-sm text-yit-text-dark mt-1 mb-4">The initial technical draft is complete. You can now edit it offline before proceeding to the brand rewrite phase.</p>
                    <div className="flex gap-2">
                        <button onClick={() => handleExport(draft, 'technical-draft')} className={commonSecondaryButtonClass}><ArrowDownTrayIcon className="w-4 h-4"/> Export Technical Draft</button>
                        <label className={`${commonSecondaryButtonClass} cursor-pointer`}>
                            <ArrowUpOnSquareIcon className="w-4 h-4"/> Import & Replace
                            <input type="file" accept=".json" className="hidden" onChange={handleFileImport(importTechnicalManuscript)} />
                        </label>
                    </div>
                </div>
                 <div className="p-4 bg-yit-bg rounded-lg border border-yit-border">
                    <h3 className="text-lg font-bold text-yit-text-lightest">Or, Skip Phase 2 AI Rewrite</h3>
                    <p className="text-sm text-yit-text-dark mt-1 mb-4">If you've prepared your own branded manuscript, you can import it here to bypass the AI rewrite and go directly to Phase 3 (Image Generation).</p>
                    <label className={`${commonButtonClass} cursor-pointer inline-flex items-center gap-2`}>
                        <ArrowUpOnSquareIcon className="w-4 h-4"/> Import Branded Draft
                        <input type="file" accept=".json" className="hidden" onChange={handleFileImport(importAndReplaceBrandedManuscript)} />
                    </label>
                </div>
                <article className="prose prose-invert prose-sm max-w-none bg-yit-bg p-4 rounded-lg border border-yit-border/50 whitespace-pre-wrap">{draft.map(b => b.content).join('\n\n')}</article>
            </div>
        )
    }

    if (project.status === 'completed') {
         return (
            <div className="p-4 space-y-4">
                <div className="sticky top-0 bg-yit-bg-secondary/80 backdrop-blur-md z-10 p-2 rounded-md border-b border-yit-border">
                    <button onClick={handleSaveEdits} className={commonButtonClass}><CheckIcon className="w-4 h-4"/> Save Manuscript</button>
                </div>
                <div className="space-y-3">
                    {manuscript.map((block, index) => (
                        block.type === 'text' ? (
                            <TextBlockEditor key={block.id} block={block} onUpdate={(content) => handleUpdateBlock(index, { content })} onDelete={() => handleDeleteBlock(index)} />
                        ) : (
                            <ImageBlockEditor key={block.id} block={block} onUpdate={(content, imageData) => handleUpdateBlock(index, { content, imageData })} onDelete={() => handleDeleteBlock(index)} />
                        )
                    ))}
                </div>
            </div>
        );
    }
    
    const manuscriptToShow = project.brandedManuscript || project.technicalManuscript || [];
    const title = project.status.startsWith('production_phase2') || project.status.startsWith('producing_phase2') ? 'Branded Manuscript Preview' : 'Manuscript Preview';
    if (manuscriptToShow.length > 0) {
        return (
             <div className="p-4">
                 <h3 className="text-lg font-bold text-yit-text-lightest mb-2">{title}</h3>
                <article className="prose prose-invert prose-sm max-w-none bg-yit-bg p-4 rounded-lg border border-yit-border whitespace-pre-wrap">{manuscriptToShow.map(block => block.content).join('\n\n')}</article>
            </div>
        )
    }
    
    return <GenericStateView icon={<DocumentTextIcon className="w-12 h-12 mx-auto mb-2" />} title="Manuscript Not Yet Available" message="Complete production phases to view the manuscript here." />;
};


const DownloadsView: React.FC<{ project: Project }> = ({ project }) => {
    if (project.status !== 'completed') return <GenericStateView icon={<ArrowDownTrayIcon className="w-12 h-12 mx-auto mb-2" />} title="No Files to Download" message="Complete the production phase to generate downloadable files." />;
    
    const manuscriptText = (project.finalManuscript || []).map(block => block.type === 'text' ? block.content : `\n[IMAGE: ${block.content}]\n`).join('\n\n');

    const handleDownload = (format: string, content: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(project.config.outputFormats).filter(([,v]) => v.enabled).map(([key, { settings }]) => (
                <div key={key} className="p-4 bg-yit-bg rounded-lg border border-yit-border">
                    <h4 className="font-bold text-yit-text-lightest capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                    <p className="text-xs text-yit-text-dark mb-3">{settings}</p>
                    <button onClick={() => handleDownload('txt', manuscriptText)} className={commonSecondaryButtonClass}>Download .txt</button>
                </div>
            ))}
        </div>
    );
};

const ProgressBar: React.FC<{ project: Project | null }> = ({ project }) => {
    const { currentResearch, currentProduction } = useAppContext();
    const status = project?.name === currentResearch?.topic ? currentResearch : project?.name === currentProduction?.topic ? currentProduction : null;
    if (!status) return null;
    return (
        <div className="mt-4">
            <div className="flex justify-between text-xs mb-1 text-yit-text-dark">
                <span className="font-semibold capitalize text-yit-text-light">{status.phase}: {status.subTask}</span>
                <span>{Math.round(project.progress || 0)}%</span>
            </div>
            <div className="w-full bg-yit-bg rounded-full h-2"><div className="bg-yit-accent h-2 rounded-full transition-all duration-500" style={{ width: `${project.progress || 0}%` }}></div></div>
        </div>
    );
};

const CostEstimationModal: React.FC<{ project: Project; isOpen: boolean; onClose: () => void; }> = ({ project, isOpen, onClose }) => {
    if (!isOpen) return null;
    const researchCost = project.config.researchPhases.reduce((acc, phase) => acc + phase.prompts.length, 0) * 0.05;
    const writingCost = project.config.chapters.length * 0.25;
    const totalCost = researchCost + writingCost;
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-yit-bg-secondary rounded-lg border border-yit-border max-w-md w-full shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                 <h3 className="text-lg font-bold text-yit-text-lightest">Cost Estimation (Mock)</h3>
                 <p className="text-yit-text-dark mt-2 mb-6">This is a mock estimation based on your project configuration.</p>
                 <ul className="space-y-2 text-sm border-t border-b border-yit-border py-4">
                    <li className="flex justify-between"><span>Research Prompts ({project.config.researchPhases.reduce((acc, p) => acc + p.prompts.length, 0)})</span> <span className="font-mono">${researchCost.toFixed(2)}</span></li>
                    <li className="flex justify-between"><span>Chapters ({project.config.chapters.length})</span> <span className="font-mono">${writingCost.toFixed(2)}</span></li>
                    <li className="flex justify-between font-bold text-yit-text-lightest mt-2 pt-2 border-t border-yit-border/50"><span>Total Estimated Cost</span> <span className="font-mono">${totalCost.toFixed(2)}</span></li>
                 </ul>
                 <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className={commonButtonClass}>Close</button>
                </div>
            </div>
        </div>
    );
};


export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ selectedProject }) => {
    type Tab = 'config' | 'ai_features' | 'research' | 'archive' | 'seo' | 'manuscript' | 'downloads';
    const [activeTab, setActiveTab] = useState<Tab>('config');
    const { 
        handleQueueResearch,
        queueNextProductionPhase,
        handleRestoreProjectVersion,
        isWorkspaceDirty, 
        editingConfig, 
        setEditingConfig, 
        saveChanges, 
        discardChanges 
    } = useAppContext();
    const [isCostModalOpen, setIsCostModalOpen] = useState(false);

    useEffect(() => {
        if (selectedProject) {
             if (activeTab !== 'config' && activeTab !== 'ai_features') {
               setActiveTab('config');
            }
        }
    }, [selectedProject?.name]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                saveChanges();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveChanges]);

    if (!selectedProject || !editingConfig) {
        return <div className="bg-yit-bg-secondary rounded-lg border border-yit-border flex items-center justify-center h-full min-h-[400px] shadow-lg"><GenericStateView icon={<BookOpenIcon className="w-16 h-16 mx-auto mb-4" />} title="Select a Project" message="Choose a project from the list to view its details and start production." /></div>;
    }

    const getAction = () => {
        const { status, name } = selectedProject;
        if (['idle', 'research_failed', 'cancelled', 'completed'].some(s => s === status) || status.endsWith('_failed')) {
            return <button onClick={() => handleQueueResearch(name)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 text-base font-semibold text-white bg-yit-cyan rounded-lg hover:bg-cyan-700 transition-colors shadow-md"><BeakerIcon className="w-5 h-5" /> Start Research</button>;
        }
        if (status === 'research_complete') {
            return <button onClick={() => queueNextProductionPhase(name)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 text-base font-semibold text-white bg-yit-accent rounded-lg hover:bg-yit-accent-hover transition-colors shadow-md"><PlayIcon className="w-5 h-5" /> Start Phase 1</button>;
        }
        if (status === 'production_phase1_complete') {
            return <button onClick={() => queueNextProductionPhase(name)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 text-base font-semibold text-white bg-yit-accent rounded-lg hover:bg-yit-accent-hover transition-colors shadow-md"><PlayIcon className="w-5 h-5" /> Start Phase 2</button>;
        }
         if (status === 'production_phase2_complete') {
            return <button onClick={() => queueNextProductionPhase(name)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 text-base font-semibold text-white bg-yit-accent rounded-lg hover:bg-yit-accent-hover transition-colors shadow-md"><PlayIcon className="w-5 h-5" /> Start Phase 3</button>;
        }
        if (status === 'research_queued') return <p className="text-sm text-yit-yellow font-medium">Research Queued...</p>;
        if (status.endsWith('_queued')) return <p className="text-sm text-yit-yellow font-medium">Production Queued...</p>;
        if (status === 'researching') return <p className="text-sm text-yit-cyan animate-pulse font-medium">Researching...</p>;
        if (status.startsWith('producing_')) {
            const phase = status.match(/phase(\d)/)?.[1];
            return <p className="text-sm text-yit-blue animate-pulse font-medium">{`Producing (Phase ${phase}/3)...`}</p>;
        }
        return null;
    };

    const TabButton: React.FC<{ tab: Tab, label: string, icon: React.ReactNode }> = ({ tab, label, icon }) => (
        <button onClick={() => setActiveTab(tab)} className={`flex items-center gap-2.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === tab ? 'border-yit-accent text-yit-text-lightest' : 'border-transparent text-yit-text-dark hover:border-yit-border hover:text-yit-text-light'}`}>{icon}{label}</button>
    );

    return (
        <div className="bg-yit-bg-secondary rounded-lg border border-yit-border flex flex-col shadow-lg">
            <div className="p-4 border-b border-yit-border">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="text-2xl font-bold capitalize truncate text-yit-text-lightest">{selectedProject.name}</h2>
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <button onClick={() => setIsCostModalOpen(true)} className="p-2 text-yit-text-dark hover:bg-yit-bg-tertiary rounded-md" title="Estimate Cost"><TicketIcon className="w-5 h-5" /></button>
                        {getAction()}
                    </div>
                </div>
                <ProgressBar project={selectedProject} />
            </div>
            <div className="border-b border-yit-border flex flex-wrap px-2 overflow-x-auto">
                <TabButton tab="config" label="Config" icon={<Cog6ToothIcon className="w-5 h-5" />} />
                <TabButton tab="ai_features" label="AI" icon={<CpuChipIcon className="w-5 h-5" />} />
                <TabButton tab="manuscript" label="Manuscript" icon={<PencilSquareIcon className="w-5 h-5" />} />
                <TabButton tab="research" label="Research" icon={<BeakerIcon className="w-5 h-5" />} />
                <TabButton tab="seo" label="SEO" icon={<MagnifyingGlassIcon className="w-5 h-5" />} />
                <TabButton tab="downloads" label="Downloads" icon={<ArrowDownTrayIcon className="w-5 h-5" />} />
                <TabButton tab="archive" label="Archive" icon={<ArchiveBoxIcon className="w-5 h-5" />} />
            </div>
            <div className="flex-grow overflow-y-auto max-h-[calc(100vh-22rem)] relative">
                {activeTab === 'config' && <ConfigurationView project={{...selectedProject, config: editingConfig}} onConfigChange={setEditingConfig} />}
                {activeTab === 'ai_features' && <AIFeaturesView project={{...selectedProject, config: editingConfig}} onConfigChange={setEditingConfig} />}
                {activeTab === 'research' && <ResearchView project={selectedProject} />}
                {activeTab === 'archive' && <ArchiveView project={selectedProject} onRestore={(t) => handleRestoreProjectVersion(selectedProject.name, t)} />}
                {activeTab === 'seo' && <SeoView project={selectedProject} />}
                {activeTab === 'manuscript' && <ManuscriptView project={selectedProject} />}
                {activeTab === 'downloads' && <DownloadsView project={selectedProject} />}
                {isWorkspaceDirty && (activeTab === 'config' || activeTab === 'ai_features') && <SaveChangesBar onSave={saveChanges} onDiscard={discardChanges} />}
            </div>
            <CostEstimationModal project={selectedProject} isOpen={isCostModalOpen} onClose={() => setIsCostModalOpen(false)} />
        </div>
    );
};
