import React, { useState, useMemo, memo } from 'react';
import type { Project, ProjectStatus } from '../types';
import { useAppContext } from '../App';
import { CheckCircleIcon, PlayIcon, ExclamationCircleIcon, ClockIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon, BeakerIcon, LightBulbIcon, WrenchScrewdriverIcon, CpuChipIcon } from './icons/Icons';

interface ProjectListProps {
    selectedProjectName: string | null;
    onSelectProject: (projectName: string) => void;
    onAddProject: (projectName:string) => void;
    onOpenYItModal: (topic: string) => void;
    onOpenBatchEditModal: (projectNames: string[]) => void;
}

type StatusFilter = 'all' | 'inProgress' | 'ready' | 'done';

const statusStyles: { [key in ProjectStatus]: { icon: React.ReactNode, text: string, color: string, pulse: boolean } } = {
    idle: { icon: <div className="w-2.5 h-2.5 rounded-full bg-yit-border-light" />, text: 'Idle', color: 'text-yit-text-dark', pulse: false },
    research_queued: { icon: <ClockIcon className="w-4 h-4 text-yit-yellow" />, text: 'Research Queued', color: 'text-yit-yellow', pulse: false },
    researching: { icon: <BeakerIcon className="w-4 h-4 text-yit-cyan" />, text: 'Researching', color: 'text-yit-cyan', pulse: true },
    research_failed: { icon: <ExclamationCircleIcon className="w-4 h-4 text-yit-red" />, text: 'Research Failed', color: 'text-yit-red', pulse: false },
    research_complete: { icon: <BeakerIcon className="w-4 h-4 text-yit-cyan" />, text: 'Research Done', color: 'text-yit-cyan', pulse: false },
    
    production_phase1_queued: { icon: <ClockIcon className="w-4 h-4 text-yit-yellow" />, text: 'Prod. Queued', color: 'text-yit-yellow', pulse: false },
    producing_phase1: { icon: <PlayIcon className="w-4 h-4 text-yit-blue" />, text: 'Producing (1/3)', color: 'text-yit-blue', pulse: true },
    production_phase1_failed: { icon: <ExclamationCircleIcon className="w-4 h-4 text-yit-red" />, text: 'Prod. (1/3) Failed', color: 'text-yit-red', pulse: false },
    production_phase1_complete: { icon: <PlayIcon className="w-4 h-4 text-yit-blue" />, text: 'Phase 1 Done', color: 'text-yit-blue', pulse: false },

    production_phase2_queued: { icon: <ClockIcon className="w-4 h-4 text-yit-yellow" />, text: 'Prod. Queued', color: 'text-yit-yellow', pulse: false },
    producing_phase2: { icon: <PlayIcon className="w-4 h-4 text-yit-blue" />, text: 'Producing (2/3)', color: 'text-yit-blue', pulse: true },
    production_phase2_failed: { icon: <ExclamationCircleIcon className="w-4 h-4 text-yit-red" />, text: 'Prod. (2/3) Failed', color: 'text-yit-red', pulse: false },
    production_phase2_complete: { icon: <PlayIcon className="w-4 h-4 text-yit-blue" />, text: 'Phase 2 Done', color: 'text-yit-blue', pulse: false },

    production_phase3_queued: { icon: <ClockIcon className="w-4 h-4 text-yit-yellow" />, text: 'Prod. Queued', color: 'text-yit-yellow', pulse: false },
    producing_phase3: { icon: <PlayIcon className="w-4 h-4 text-yit-blue" />, text: 'Producing (3/3)', color: 'text-yit-blue', pulse: true },
    production_phase3_failed: { icon: <ExclamationCircleIcon className="w-4 h-4 text-yit-red" />, text: 'Prod. (3/3) Failed', color: 'text-yit-red', pulse: false },
    
    completed: { icon: <CheckCircleIcon className="w-4 h-4 text-yit-green" />, text: 'Completed', color: 'text-yit-green', pulse: false },
    cancelled: { icon: <XMarkIcon className="w-4 h-4 text-yit-text-dark" />, text: 'Cancelled', color: 'text-yit-text-dark', pulse: false },
    
    // FIX: Removed deprecated statuses that are no longer in the ProjectStatus type.
};

const ProjectListItem: React.FC<{
    project: Project;
    isSelected: boolean;
    onSelect: () => void;
    isChecked: boolean;
    onToggleCheck: (e: React.MouseEvent) => void;
}> = ({ project, isSelected, onSelect, isChecked, onToggleCheck }) => {
    const statusInfo = statusStyles[project.status];
    const isProcessing = project.status.startsWith('researching') || project.status.startsWith('producing');
    const totalTokens = (project.estimatedTokens?.research || 0) + (project.estimatedTokens?.production || 0);

    return (
         <li
            className={`p-3 transition-colors rounded-md group cursor-pointer relative ${isSelected ? 'bg-yit-accent/10' : 'hover:bg-yit-bg-tertiary/50'}`}
            onClick={onSelect}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onSelect()}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onClick={onToggleCheck}
                      onChange={() => {}} // Prevent React warning, logic is in onClick
                      className="form-checkbox h-4 w-4 rounded bg-yit-bg-tertiary border-yit-border text-yit-accent focus:ring-yit-accent mt-0.5"
                    />
                    <div>
                        <span className="capitalize font-semibold text-yit-text-lightest leading-tight" title={project.name}>{project.name}</span>
                        {totalTokens > 0 && 
                            <div className="flex items-center gap-1 text-xs text-yit-text-dark mt-1">
                                <CpuChipIcon className="w-3 h-3" />
                                <span>{totalTokens.toLocaleString()} tokens</span>
                            </div>
                        }
                    </div>
                </div>
                <div className={`flex items-center gap-2 text-xs flex-shrink-0 ${statusInfo.color} ${statusInfo.pulse ? 'animate-pulse' : ''}`}>
                    {statusInfo.icon}
                    <span className="hidden xl:inline">{statusInfo.text}</span>
                </div>
            </div>
            {isProcessing && project.progress != null && project.progress > 0 && (
                <div className="w-full bg-yit-bg rounded-full h-1 mt-2 ml-7">
                    <div className="bg-yit-accent h-1 rounded-full" style={{ width: `${project.progress}%` }}></div>
                </div>
            )}
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yit-accent rounded-l-md"></div>}
        </li>
    );
};

const MemoizedProjectListItem = memo(ProjectListItem);

export const TopicSelector: React.FC<ProjectListProps> = ({
    selectedProjectName,
    onSelectProject,
    onAddProject,
    onOpenYItModal,
    onOpenBatchEditModal,
}) => {
    const { projects, researchQueue, bulkQueueResearch, bulkQueueProduction } = useAppContext();
    const [customProject, setCustomProject] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    
    const productionQueueCount = projects.filter(p => p.status.startsWith('production_') && p.status.endsWith('_queued')).length;

    const projectExists = useMemo(() => customProject.trim().length > 0 && projects.some(p => p.name.toLowerCase() === customProject.trim().toLowerCase()), [customProject, projects]);
    
    const statusGroups: Record<StatusFilter, ProjectStatus[]> = useMemo(() => ({
        all: [], // Special case
        inProgress: ['research_queued', 'researching', 'production_phase1_queued', 'producing_phase1', 'production_phase2_queued', 'producing_phase2', 'production_phase3_queued', 'producing_phase3'],
        ready: ['idle', 'research_complete', 'production_phase1_complete', 'production_phase2_complete'],
        done: ['completed', 'research_failed', 'production_phase1_failed', 'production_phase2_failed', 'production_phase3_failed', 'cancelled'],
    }), []);

    const filterCounts = useMemo(() => {
        const counts = { all: projects.length, inProgress: 0, ready: 0, done: 0 };
        projects.forEach(p => {
            if (statusGroups.inProgress.includes(p.status)) counts.inProgress++;
            else if (statusGroups.ready.includes(p.status)) counts.ready++;
            else if (statusGroups.done.includes(p.status)) counts.done++;
        });
        return counts;
    }, [projects, statusGroups]);

    const filteredProjects = useMemo(() => {
        const searchFiltered = projects.filter(project => 
            project.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (statusFilter === 'all') return searchFiltered;
        return searchFiltered.filter(project => statusGroups[statusFilter].includes(project.status));
    }, [projects, searchTerm, statusFilter, statusGroups]);

    const handleAddCustomProject = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = customProject.trim();
        if (trimmedName && !projectExists) {
            onAddProject(trimmedName);
            setCustomProject('');
        }
    };
    
    const toggleBulkSelection = (projectName: string) => {
        setSelectedForBulk(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectName)) {
                newSet.delete(projectName);
            } else {
                newSet.add(projectName);
            }
            return newSet;
        });
    };

    const handleBulkResearch = () => {
        bulkQueueResearch(Array.from(selectedForBulk));
        setSelectedForBulk(new Set());
    };

    const handleBulkProduction = () => {
        bulkQueueProduction(Array.from(selectedForBulk));
        setSelectedForBulk(new Set());
    };
    
    const handleBatchEdit = () => {
        onOpenBatchEditModal(Array.from(selectedForBulk));
        setSelectedForBulk(new Set());
    };

    const FilterButton: React.FC<{ filter: StatusFilter, label: string, count: number }> = ({ filter, label, count }) => {
        const isActive = statusFilter === filter;
        return (
            <button
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                    isActive ? 'bg-yit-accent text-white shadow-sm' : 'bg-yit-bg text-yit-text-dark hover:bg-yit-bg-tertiary hover:text-yit-text-light'
                }`}
            >
                {label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-yit-bg-tertiary'}`}>{count}</span>
            </button>
        );
    };

    return (
        <div className="bg-yit-bg-secondary rounded-lg border border-yit-border h-full flex flex-col max-h-[calc(100vh-10rem)] shadow-lg">
            <div className="p-4 border-b border-yit-border flex-shrink-0">
                <h2 className="text-xl font-bold text-yit-text-lightest">Projects</h2>
                <p className="text-sm text-yit-text-dark">Select a project to manage.</p>
            </div>
            
            <div className="p-4 flex-shrink-0 space-y-4">
                <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 text-yit-text-dark absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full bg-yit-bg border border-yit-border rounded-lg pl-11 pr-4 py-2.5 text-sm text-yit-text-lightest placeholder-yit-text-dark focus:ring-2 focus:ring-yit-accent/50 focus:outline-none transition"
                    />
                </div>
                <form onSubmit={handleAddCustomProject} className="flex flex-col gap-2">
                    <input type="text" value={customProject} onChange={(e) => setCustomProject(e.target.value)} placeholder="Create a new project..." className="w-full bg-yit-bg border border-yit-border rounded-lg px-4 py-2.5 text-sm text-yit-text-lightest placeholder-yit-text-dark focus:ring-2 focus:ring-yit-accent/50 focus:outline-none transition" aria-label="New project name" />
                    {projectExists && <p className="text-xs text-red-400 -mt-1 mx-1">This project already exists.</p>}
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => onOpenYItModal(customProject)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-yit-blue hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yit-bg-secondary focus:ring-yit-accent">
                            <LightBulbIcon className="w-5 h-5" />
                            Analyze
                        </button>
                        <button type="submit" disabled={!customProject.trim() || projectExists} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-yit-accent hover:bg-yit-accent-hover disabled:bg-yit-bg-tertiary disabled:text-yit-text-dark disabled:cursor-not-allowed rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yit-bg-secondary focus:ring-yit-accent">
                            <PlusIcon className="w-5 h-5" />
                            Add Project
                        </button>
                    </div>
                </form>
            </div>

            <div className="px-4 pb-4 flex-shrink-0 border-b border-yit-border">
                <div className="flex items-center gap-2 bg-yit-bg-tertiary p-1 rounded-lg">
                    <FilterButton filter="all" label="All" count={filterCounts.all} />
                    <FilterButton filter="inProgress" label="In Progress" count={filterCounts.inProgress} />
                    <FilterButton filter="ready" label="Ready" count={filterCounts.ready} />
                    <FilterButton filter="done" label="Done" count={filterCounts.done} />
                </div>
            </div>
            
            {selectedForBulk.size > 0 && (
                <div className="px-4 pb-2 flex-shrink-0 flex items-center justify-between gap-2 bg-yit-bg-tertiary/50 py-2 border-b border-yit-border">
                    <p className="text-xs font-semibold text-yit-text-lightest">{selectedForBulk.size} selected</p>
                    <div className="flex gap-2">
                        <button onClick={handleBatchEdit} className="px-2 py-1 text-xs font-semibold text-white bg-yit-blue rounded-md hover:bg-blue-700 flex items-center gap-1"><WrenchScrewdriverIcon className="w-3 h-3"/> Edit</button>
                        <button onClick={handleBulkResearch} className="px-2 py-1 text-xs font-semibold text-white bg-yit-cyan rounded-md hover:bg-cyan-700">Research</button>
                        <button onClick={handleBulkProduction} className="px-2 py-1 text-xs font-semibold text-white bg-yit-accent rounded-md hover:bg-yit-accent-hover">Produce</button>
                    </div>
                </div>
            )}
            
            <div className="flex-grow overflow-y-auto px-4 pt-2">
                <ul className="space-y-1">
                    {filteredProjects.map(project => (
                        <MemoizedProjectListItem
                            key={project.name}
                            project={project}
                            isSelected={selectedProjectName === project.name}
                            onSelect={() => onSelectProject(project.name)}
                            isChecked={selectedForBulk.has(project.name)}
                            onToggleCheck={(e) => {
                                e.stopPropagation();
                                toggleBulkSelection(project.name);
                            }}
                        />
                    ))}
                </ul>
            </div>
            
            <div className="p-4 border-t border-yit-border flex-shrink-0 grid grid-cols-2 gap-2 text-center text-sm">
                <div className="bg-yit-bg rounded-lg p-2">
                    <p className="text-yit-text-dark">Research Queue</p>
                    <p className="text-2xl font-bold text-yit-text-lightest">{researchQueue.length}</p>
                </div>
                <div className="bg-yit-bg rounded-lg p-2">
                    <p className="text-yit-text-dark">Production Queue</p>
                    <p className="text-2xl font-bold text-yit-text-lightest">{productionQueueCount}</p>
                </div>
            </div>
        </div>
    );
};