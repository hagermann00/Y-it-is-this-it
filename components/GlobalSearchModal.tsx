import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import { Project } from '../types';
import { MagnifyingGlassIcon, XMarkIcon } from './icons/Icons';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectProject: (projectName: string) => void;
}

const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
    if (!query) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-yit-accent text-yit-bg rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onSelectProject }) => {
    const { projects } = useAppContext();
    const [query, setQuery] = useState('');

    const searchResults = useMemo(() => {
        if (query.length < 2) return [];

        const lowerCaseQuery = query.toLowerCase();
        const results: { project: Project; matches: { type: string; content: string }[] }[] = [];

        projects.forEach(project => {
            const matches: { type: string; content: string }[] = [];
            const configString = JSON.stringify(project.config);
            const researchString = (project.researchData || []).join(' ');
            
            // FIX: Property 'manuscript' does not exist on type 'Project'.
            // Combining all manuscript stages for a comprehensive search.
            const manuscriptString = [
                ...(project.technicalManuscript || []),
                ...(project.brandedManuscript || []),
                ...(project.finalManuscript || []),
            ].map(block => block.content).join(' ');

            if (project.name.toLowerCase().includes(lowerCaseQuery)) {
                matches.push({ type: 'Project Name', content: project.name });
            }
            if (configString.toLowerCase().includes(lowerCaseQuery)) {
                matches.push({ type: 'Configuration', content: 'Matching value found in config JSON.' });
            }
            if (researchString.toLowerCase().includes(lowerCaseQuery)) {
                matches.push({ type: 'Research Data', content: researchString.substring(0, 200) + '...' });
            }
            if (manuscriptString.toLowerCase().includes(lowerCaseQuery)) {
                matches.push({ type: 'Manuscript', content: manuscriptString.substring(0, 200) + '...' });
            }

            if (matches.length > 0) {
                results.push({ project, matches });
            }
        });

        return results;
    }, [query, projects]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center p-4 pt-[10vh] z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-yit-bg-secondary rounded-lg border border-yit-border max-w-2xl w-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-yit-border flex justify-between items-center gap-4">
                    <div className="relative flex-grow">
                        <MagnifyingGlassIcon className="w-5 h-5 text-yit-text-dark absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search across all projects, configs, and content..."
                            className="w-full bg-yit-bg border border-yit-border rounded-lg pl-11 pr-4 py-2.5 text-sm text-yit-text-lightest placeholder-yit-text-dark focus:ring-2 focus:ring-yit-accent/50 focus:outline-none transition"
                            autoFocus
                        />
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-yit-text-dark hover:bg-yit-bg-tertiary transition-colors"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-2 overflow-y-auto max-h-[60vh]">
                    {searchResults.length > 0 ? (
                        <ul className="space-y-2">
                            {searchResults.map(({ project, matches }) => (
                                <li key={project.name} className="p-3 bg-yit-bg border border-yit-border rounded-md">
                                    <button onClick={() => onSelectProject(project.name)} className="w-full text-left font-bold capitalize text-yit-accent hover:underline mb-2">
                                        {project.name}
                                    </button>
                                    <ul className="space-y-1 text-xs pl-2 border-l-2 border-yit-border">
                                        {matches.map((match, index) => (
                                            <li key={index} className="p-1">
                                                <p className="font-semibold text-yit-text-light">{match.type}</p>
                                                <p className="text-yit-text-dark truncate">
                                                    <Highlight text={match.content} query={query} />
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-sm text-yit-text-dark p-8">{query.length < 2 ? 'Type at least 2 characters to search.' : 'No results found.'}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
