import React, { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from 'react';
import { Header } from './components/Header';
import { TopicSelector } from './components/TopicSelector';
import { ProjectWorkspace } from './components/ProductionMonitor';
import { ProductionLog } from './components/ProductionLog';
import { Dashboard } from './components/Dashboard';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { YItAnalysisModal } from './components/YItAnalysisModal';
import { BatchEditModal } from './components/BatchEditModal';
import type { Project, ProductionStatus, ProductionLogEntry, ProjectConfigSnapshot, Toast, ProjectTemplate, ProjectConfig, ContentBlock, ProjectStatus, ResearchPhase, Chapter, ToneAndSentimentGuide, VisualsGuideConfig, PrimerFile } from './types';
import { INITIAL_PROJECTS, DEFAULT_PROJECT_CONFIG, generateInitialPrimerFiles } from './constants';
import { YItBookFactory } from './services/geminiService';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from './components/icons/Icons';

const PROJECTS_STORAGE_KEY = 'yit-book-projects';
const LOGS_STORAGE_KEY = 'yit-book-logs';
const TEMPLATES_STORAGE_KEY = 'yit-book-templates';
const THEME_STORAGE_KEY = 'yit-book-theme';
const PREFERENCES_STORAGE_KEY = 'yit-book-preferences';

// --- TOAST NOTIFICATION SYSTEM ---
const ToastContext = createContext<{ addToast: (message: string, type?: Toast['type']) => void }>({ addToast: () => {} });
export const useToasts = () => useContext(ToastContext);

const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastId = useRef(0);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = toastId.current++;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };
    
    const toastIcons = {
        success: <CheckCircleIcon className="w-6 h-6 text-yit-green" />,
        error: <ExclamationCircleIcon className="w-6 h-6 text-yit-red" />,
        info: <InformationCircleIcon className="w-6 h-6 text-yit-blue" />,
    }

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div aria-live="assertive" className="fixed top-4 right-4 z-[100] w-full max-w-xs space-y-3">
                {toasts.map(toast => (
                     <div key={toast.id} className="bg-yit-bg-secondary border border-yit-border rounded-lg shadow-2xl p-4 flex items-start gap-3 animate-fade-in-right">
                         <div className="flex-shrink-0">{toastIcons[toast.type]}</div>
                         <p className="flex-grow text-sm text-yit-text-light">{toast.message}</p>
                         <button onClick={() => removeToast(toast.id)} className="p-1 rounded-full text-yit-text-dark hover:bg-yit-bg-tertiary transition-colors -mr-2 -mt-1 flex-shrink-0">
                            <XMarkIcon className="w-5 h-5" />
                         </button>
                     </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// --- APP CONTEXT ---

export interface AppContextType {
    projects: Project[];
    productionLogs: ProductionLogEntry[];
    researchQueue: string[];
    currentResearch: ProductionStatus | null;
    currentProduction: ProductionStatus | null;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    addProject: (projectName: string) => void;
    updateProject: (projectName: string, updates: Partial<Project>) => void;
    handleQueueResearch: (projectName: string) => void;
    bulkQueueResearch: (projectNames: string[]) => void;
    bulkQueueProduction: (projectNames: string[]) => void;
    queueNextProductionPhase: (projectName: string) => void;
    handleRestoreProjectVersion: (projectName: string, timestamp: string) => void;
    bulkUpdateProjects: (projectNames: string[], configChanges: Partial<ProjectConfig>) => void;
    importTechnicalManuscript: (projectName: string, manuscript: ContentBlock[]) => void;
    importAndReplaceBrandedManuscript: (projectName: string, manuscript: ContentBlock[]) => void;
    updateUserPreferences: (key: keyof ProjectConfig, value: any) => void;
    
    // For workspace state management
    editingConfig: ProjectConfig | null;
    setEditingConfig: React.Dispatch<React.SetStateAction<ProjectConfig | null>>;
    isWorkspaceDirty: boolean;
    saveChanges: () => void;
    discardChanges: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
};

// --- MAIN APP COMPONENT ---

const Root: React.FC = () => {
    const { addToast } = useToasts();
    const [projects, setProjects] = useState<Project[]>([]);
    const [productionLogs, setProductionLogs] = useState<ProductionLogEntry[]>([]);
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [view, setView] = useState<'dashboard' | 'workspace'>('workspace');
    const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);

    // Workspace state
    const [editingConfig, setEditingConfig] = useState<ProjectConfig | null>(null);
    const [isWorkspaceDirty, setIsWorkspaceDirty] = useState(false);

    // Production Queues & Status
    const [researchQueue, setResearchQueue] = useState<string[]>([]);
    const [productionQueue, setProductionQueue] = useState<string[]>([]);
    const [currentResearch, setCurrentResearch] = useState<ProductionStatus | null>(null);
    const [currentProduction, setCurrentProduction] = useState<ProductionStatus | null>(null);
    const researchAbortController = useRef<AbortController | null>(null);
    const productionAbortController = useRef<AbortController | null>(null);

    // Modals
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isYItModalOpen, setIsYItModalOpen] = useState(false);
    const [yitModalTopic, setYItModalTopic] = useState<string | undefined>();
    const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
    const [batchEditProjectNames, setBatchEditProjectNames] = useState<string[]>([]);

    const selectedProject = useMemo(() => projects.find(p => p.name === selectedProjectName) || null, [projects, selectedProjectName]);

    // --- DATA PERSISTENCE & MIGRATION ---
    useEffect(() => {
        const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (storedProjects) {
            try {
                 const parsedProjects: Project[] = JSON.parse(storedProjects).map((p: any) => {
                    // MIGRATION: from primerText string to primerFiles array
                    if (p.config && p.config.primerText && (!p.config.primerFiles || p.config.primerFiles.length === 0)) {
                        p.config.primerFiles = [{
                            name: 'master_primer.md',
                            content: p.config.primerText,
                            size: p.config.primerText.length
                        }];
                        delete p.config.primerText;
                    }
                     // Ensure primerFiles is always an array for older versions that might not have it
                    if (p.config && !p.config.primerFiles) {
                         p.config.primerFiles = generateInitialPrimerFiles(p.name);
                    }
                    return { ...p, status: p.status || 'idle', archive: p.archive || [] };
                });
                setProjects(parsedProjects);
            } catch (error) {
                console.error("Failed to parse projects from localStorage", error);
                setProjects(INITIAL_PROJECTS);
            }
        } else {
            setProjects(INITIAL_PROJECTS);
        }
        
        const storedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
        if (storedLogs) setProductionLogs(JSON.parse(storedLogs).map((l: any) => ({...l, timestamp: new Date(l.timestamp)})));
        
        const storedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
        if (storedTemplates) setTemplates(JSON.parse(storedTemplates));
        
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
        if (storedTheme) setTheme(storedTheme);
        else if (window.matchMedia?.('(prefers-color-scheme: light)').matches) setTheme('light');
    }, []);

    useEffect(() => { localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects)); }, [projects]);
    useEffect(() => { localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(productionLogs)); }, [productionLogs]);
    useEffect(() => { localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates)); }, [templates]);
    useEffect(() => { 
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        document.getElementById('theme-container')?.classList.remove('light', 'dark');
        document.getElementById('theme-container')?.classList.add(theme);
    }, [theme]);
    
    // --- WORKSPACE STATE MANAGEMENT ---
    useEffect(() => {
        if (selectedProject) {
            setEditingConfig(JSON.parse(JSON.stringify(selectedProject.config)));
            setIsWorkspaceDirty(false);
        } else {
            setEditingConfig(null);
        }
    }, [selectedProject]);

    useEffect(() => {
        if (!selectedProject || !editingConfig) return;
        const originalConfig = JSON.stringify(selectedProject.config);
        const currentConfig = JSON.stringify(editingConfig);
        setIsWorkspaceDirty(originalConfig !== currentConfig);
    }, [editingConfig, selectedProject]);


    const saveChanges = useCallback(() => {
        if (selectedProject && editingConfig) {
            updateProject(selectedProject.name, {
                config: editingConfig,
                archive: [
                    { ...selectedProject.config, timestamp: new Date().toISOString() },
                    ...(selectedProject.archive || [])
                ].slice(0, 10) // Limit archive to 10 entries
            });
            addToast(`Configuration for "${selectedProject.name}" saved.`, 'success');
        }
    }, [selectedProject, editingConfig, addToast]);

    const discardChanges = useCallback(() => {
        if (selectedProject) {
            setEditingConfig(JSON.parse(JSON.stringify(selectedProject.config)));
            addToast(`Changes for "${selectedProject.name}" discarded.`, 'info');
        }
    }, [selectedProject, addToast]);

    // --- PROJECT & QUEUE MANAGEMENT ---
    const updateProject = useCallback((projectName: string, updates: Partial<Project>) => {
        setProjects(prev => prev.map(p => p.name === projectName ? { ...p, ...updates } : p));
    }, []);
    
    const addProject = (projectName: string) => {
        if (projects.some(p => p.name.toLowerCase() === projectName.toLowerCase())) {
            addToast(`Project "${projectName}" already exists.`, 'error');
            return;
        }
        const newProject: Project = {
            name: projectName,
            status: 'idle',
            config: {
                ...DEFAULT_PROJECT_CONFIG,
                primerFiles: generateInitialPrimerFiles(projectName),
                researchPhases: DEFAULT_PROJECT_CONFIG.researchPhases.map(phase => ({
                    ...phase,
                    id: `${phase.id}-${projectName.replace(/\s+/g, '-')}`,
                    prompts: phase.prompts.map(p => p.replace('[TOPIC]', projectName)),
                })),
                chapters: DEFAULT_PROJECT_CONFIG.chapters.map(c => ({
                    ...c,
                    title: c.title.replace('[TOPIC]', projectName),
                })),
            },
            archive: [],
            finalManuscript: [],
             estimatedTokens: { research: 0, production: 0 }
        };
        setProjects(prev => [newProject, ...prev]);
        setSelectedProjectName(projectName);
        addToast(`Project "${projectName}" created successfully.`, 'success');
    };

    const handleQueueResearch = (projectName: string) => {
        setResearchQueue(prev => [...prev, projectName]);
        updateProject(projectName, { status: 'research_queued' });
    };
    
    const bulkQueueResearch = (projectNames: string[]) => {
        projectNames.forEach(name => {
            updateProject(name, { status: 'research_queued' });
        });
        setResearchQueue(prev => [...new Set([...prev, ...projectNames])]);
        addToast(`Queued ${projectNames.length} projects for research.`, 'info');
    };
    
    const queueNextProductionPhase = (projectName: string) => {
        const project = projects.find(p => p.name === projectName);
        if (!project) return;
        
        let nextStatus: ProjectStatus | null = null;
        if(project.status === 'research_complete') nextStatus = 'production_phase1_queued';
        else if(project.status === 'production_phase1_complete') nextStatus = 'production_phase2_queued';
        else if(project.status === 'production_phase2_complete') nextStatus = 'production_phase3_queued';
        
        if (nextStatus) {
            updateProject(projectName, { status: nextStatus });
        }
    };
    
    const bulkQueueProduction = (projectNames: string[]) => {
        let count = 0;
        projectNames.forEach(name => {
             const project = projects.find(p => p.name === name);
             if (project && project.status === 'research_complete') {
                updateProject(name, { status: 'production_phase1_queued' });
                count++;
             }
        });
        addToast(`Queued ${count} projects for production.`, 'info');
    };

    const handleRestoreProjectVersion = (projectName: string, timestamp: string) => {
        const project = projects.find(p => p.name === projectName);
        const versionToRestore = project?.archive?.find(v => v.timestamp === timestamp);
        if (project && versionToRestore) {
            updateProject(projectName, { 
                config: { ...versionToRestore, primerFiles: versionToRestore.primerFiles || [] },
            });
            addToast(`Restored configuration for "${projectName}".`, 'success');
        }
    };
    
    const bulkUpdateProjects = (projectNames: string[], configChanges: Partial<ProjectConfig>) => {
        let updatedCount = 0;
        setProjects(prev => prev.map(p => {
            if (projectNames.includes(p.name)) {
                updatedCount++;
                return {
                    ...p,
                    config: {
                        ...p.config,
                        ...configChanges,
                        aiFeatures: { // Deep merge for aiFeatures
                            ...p.config.aiFeatures,
                            ...(configChanges.aiFeatures || {})
                        }
                    }
                };
            }
            return p;
        }));
        addToast(`Updated ${updatedCount} projects.`, 'success');
    };

    const importTechnicalManuscript = (projectName: string, manuscript: ContentBlock[]) => {
        updateProject(projectName, { technicalManuscript: manuscript });
        addToast("Technical manuscript imported successfully.", "success");
    };

    const importAndReplaceBrandedManuscript = (projectName: string, manuscript: ContentBlock[]) => {
        updateProject(projectName, { 
            brandedManuscript: manuscript,
            status: 'production_phase2_complete' // Mark phase 2 as complete
        });
        addToast("Branded manuscript imported. Ready for Phase 3.", "success");
    };
    
    const updateUserPreferences = (key: keyof ProjectConfig, value: any) => {
        // In a real app, this would save to a user-specific store. Here we just update all projects.
        // This is primarily for things like AI model preferences.
        setProjects(prev => prev.map(p => ({
            ...p,
            config: {
                ...p.config,
                [key]: value
            }
        })));
        addToast(`Default ${key} preference updated.`, 'info');
    };


    const selectProject = (projectName: string) => {
        setSelectedProjectName(projectName);
        setView('workspace');
    };

    const openYItModal = (topic: string) => {
        setYItModalTopic(topic);
        setIsYItModalOpen(true);
    };
    
    const openBatchEditModal = (projectNames: string[]) => {
        if (projectNames.length === 0) {
            addToast("Select at least one project to batch edit.", "error");
            return;
        }
        setBatchEditProjectNames(projectNames);
        setIsBatchEditModalOpen(true);
    };

    const appContextValue: AppContextType = {
        projects,
        productionLogs,
        researchQueue,
        currentResearch,
        currentProduction,
        theme, setTheme,
        addProject,
        updateProject,
        handleQueueResearch,
        bulkQueueResearch,
        bulkQueueProduction,
        queueNextProductionPhase,
        handleRestoreProjectVersion,
        bulkUpdateProjects,
        importTechnicalManuscript,
        importAndReplaceBrandedManuscript,
        updateUserPreferences,
        editingConfig,
        setEditingConfig,
        isWorkspaceDirty,
        saveChanges,
        discardChanges
    };

    return (
        <AppContext.Provider value={appContextValue}>
            <div className="flex flex-col h-screen font-sans text-yit-text-light">
                <Header onSetView={setView} onOpenSearch={() => setIsSearchOpen(true)} />
                <main className="flex-grow p-4 sm:p-6 lg:p-8 flex gap-8 overflow-hidden max-w-screen-2xl mx-auto w-full">
                    {view === 'workspace' && (
                        <>
                            <div className="w-full max-w-sm flex-shrink-0">
                                <TopicSelector
                                    selectedProjectName={selectedProjectName}
                                    onSelectProject={selectProject}
                                    onAddProject={addProject}
                                    onOpenYItModal={openYItModal}
                                    onOpenBatchEditModal={openBatchEditModal}
                                />
                            </div>
                            <div className="flex-grow overflow-hidden">
                                <ProjectWorkspace selectedProject={selectedProject} />
                            </div>
                        </>
                    )}
                    {view === 'dashboard' && <Dashboard onSelectProject={selectProject} />}
                </main>
                 <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectProject={selectProject} />
                 <YItAnalysisModal isOpen={isYItModalOpen} onClose={() => setIsYItModalOpen(false)} initialTopic={yitModalTopic} />
                 <BatchEditModal isOpen={isBatchEditModalOpen} onClose={() => setIsBatchEditModalOpen(false)} projectNames={batchEditProjectNames} />
            </div>
        </AppContext.Provider>
    );
}

const AppWrapper: React.FC = () => (
    <ToastContainer>
        <Root />
    </ToastContainer>
);

export default AppWrapper;
