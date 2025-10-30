import React, { useState } from 'react';
import { useAppContext, useToasts } from '../App';
import type { ProjectConfig } from '../types';
import { XMarkIcon, WrenchScrewdriverIcon, CheckIcon } from './icons/Icons';
import { AI_MODELS } from '../constants';

interface BatchEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectNames: string[];
}

const commonInputClass = "w-full bg-yit-bg border border-yit-border rounded-lg px-4 py-2.5 text-sm text-yit-text-lightest placeholder-yit-text-dark focus:ring-2 focus:ring-yit-accent/50 focus:outline-none transition";
const commonButtonClass = "px-5 py-2.5 text-sm font-semibold text-white bg-yit-accent rounded-lg hover:bg-yit-accent-hover disabled:bg-yit-bg-tertiary disabled:text-yit-text-dark disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yit-bg-secondary focus:ring-yit-accent";

export const BatchEditModal: React.FC<BatchEditModalProps> = ({ isOpen, onClose, projectNames }) => {
    const { bulkUpdateProjects } = useAppContext();
    const { addToast } = useToasts();
    const [enabledFields, setEnabledFields] = useState<Set<keyof ProjectConfig['aiFeatures']>>(new Set());
    const [configChanges, setConfigChanges] = useState<Partial<ProjectConfig['aiFeatures']>>({});

    const handleToggleField = (field: keyof ProjectConfig['aiFeatures']) => {
        setEnabledFields(prev => {
            const newSet = new Set(prev);
            if (newSet.has(field)) {
                newSet.delete(field);
                const newChanges = { ...configChanges };
                delete newChanges[field];
                setConfigChanges(newChanges);
            } else {
                newSet.add(field);
            }
            return newSet;
        });
    };

    const handleApplyChanges = () => {
        if (Object.keys(configChanges).length === 0) {
            addToast('No changes to apply.', 'info');
            return;
        }
        
        // We wrap it in aiFeatures to match the structure of ProjectConfig
        const finalChanges = { aiFeatures: configChanges };
        // FIX: Cast to `any` to bypass strict type check for partial nested object.
        // The `bulkUpdateProjects` function has been updated to handle this correctly.
        bulkUpdateProjects(projectNames, finalChanges as any);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-yit-bg-secondary rounded-lg border border-yit-border max-w-lg w-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-yit-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <WrenchScrewdriverIcon className="w-6 h-6 text-yit-blue" />
                        <div>
                            <h2 className="text-lg font-bold text-yit-text-lightest">Batch Edit Projects</h2>
                            <p className="text-xs text-yit-text-dark">Applying changes to {projectNames.length} projects.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-yit-text-dark hover:bg-yit-bg-tertiary transition-colors"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-yit-text-dark">Select a field to enable it, then set the value you want to apply to all selected projects.</p>
                    
                    {/* Research Model */}
                    <div className="flex items-center gap-3 p-3 bg-yit-bg rounded-md">
                        <input type="checkbox" id="researchModelCheck" checked={enabledFields.has('researchModel')} onChange={() => handleToggleField('researchModel')} className="form-checkbox h-4 w-4 rounded bg-yit-bg-tertiary border-yit-border text-yit-accent focus:ring-yit-accent" />
                        <label htmlFor="researchModelCheck" className="font-semibold text-yit-text-light flex-grow cursor-pointer">Research Model</label>
                        {enabledFields.has('researchModel') && (
                            <select value={configChanges.researchModel || ''} onChange={e => setConfigChanges(c => ({...c, researchModel: e.target.value}))} className={`${commonInputClass} max-w-xs`}>
                                {AI_MODELS.text.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Writing Model */}
                    <div className="flex items-center gap-3 p-3 bg-yit-bg rounded-md">
                        <input type="checkbox" id="writingModelCheck" checked={enabledFields.has('writingModel')} onChange={() => handleToggleField('writingModel')} className="form-checkbox h-4 w-4 rounded bg-yit-bg-tertiary border-yit-border text-yit-accent focus:ring-yit-accent" />
                        <label htmlFor="writingModelCheck" className="font-semibold text-yit-text-light flex-grow cursor-pointer">Writing Model</label>
                        {enabledFields.has('writingModel') && (
                            <select value={configChanges.writingModel || ''} onChange={e => setConfigChanges(c => ({...c, writingModel: e.target.value}))} className={`${commonInputClass} max-w-xs`}>
                                {AI_MODELS.text.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        )}
                    </div>
                    
                    {/* Image Model */}
                    <div className="flex items-center gap-3 p-3 bg-yit-bg rounded-md">
                        <input type="checkbox" id="imageModelCheck" checked={enabledFields.has('imageModel')} onChange={() => handleToggleField('imageModel')} className="form-checkbox h-4 w-4 rounded bg-yit-bg-tertiary border-yit-border text-yit-accent focus:ring-yit-accent" />
                        <label htmlFor="imageModelCheck" className="font-semibold text-yit-text-light flex-grow cursor-pointer">Image Model</label>
                        {enabledFields.has('imageModel') && (
                            <select value={configChanges.imageModel || ''} onChange={e => setConfigChanges(c => ({...c, imageModel: e.target.value}))} className={`${commonInputClass} max-w-xs`}>
                                {AI_MODELS.image.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        )}
                    </div>

                </div>

                <div className="p-4 border-t border-yit-border flex justify-end">
                    <button onClick={handleApplyChanges} className={`${commonButtonClass} flex items-center gap-2`} disabled={Object.keys(configChanges).length === 0}>
                       <CheckIcon className="w-5 h-5"/> Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
};