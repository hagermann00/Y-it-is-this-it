import React, { useState, useEffect } from 'react';
// FIX: Replaced ExclamationTriangleIcon with ExclamationCircleIcon which is available.
import { LightBulbIcon, XMarkIcon, ExclamationCircleIcon } from './icons/Icons';
import { YItBookFactory } from '../services/geminiService';
import type { YItAnalysisResult } from '../types';

interface YItAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTopic?: string;
}

const commonInputClass = "w-full bg-yit-bg border border-yit-border rounded-lg px-4 py-2.5 text-sm text-yit-text-lightest placeholder-yit-text-dark focus:ring-2 focus:ring-yit-accent/50 focus:outline-none transition";
const commonButtonClass = "px-5 py-2.5 text-sm font-semibold text-white bg-yit-accent rounded-lg hover:bg-yit-accent-hover disabled:bg-yit-bg-tertiary disabled:text-yit-text-dark disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yit-bg-secondary focus:ring-yit-accent";

export const YItAnalysisModal: React.FC<YItAnalysisModalProps> = ({ isOpen, onClose, initialTopic }) => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<YItAnalysisResult | null>(null);

    const runAnalysis = async (topicToAnalyze: string) => {
        if (!topicToAnalyze.trim()) return;
        setIsLoading(true);
        setResult(null);
        const analysisResult = await YItBookFactory.performYItAnalysis(topicToAnalyze);
        setResult(analysisResult);
        setIsLoading(false);
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        runAnalysis(topic);
    };

    useEffect(() => {
        // Pre-fill and run analysis when modal opens with a topic
        if (isOpen && initialTopic) {
            setTopic(initialTopic);
            runAnalysis(initialTopic);
        }
    }, [isOpen, initialTopic]);
    
    const handleClose = () => {
        onClose();
        setTimeout(() => { // Delay reset to avoid flicker on close
            setTopic('');
            setResult(null);
            setIsLoading(false);
        }, 300);
    }

    if (!isOpen) return null;
    
    const scoreColor = result ? (result.viabilityScore > 7 ? 'text-yit-green' : result.viabilityScore > 4 ? 'text-yit-yellow' : 'text-yit-red') : '';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={handleClose}>
            <div className="bg-yit-bg-secondary rounded-lg border border-yit-border max-w-xl w-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-yit-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <LightBulbIcon className="w-6 h-6 text-yit-blue" />
                        <h2 className="text-lg font-bold text-yit-text-lightest">"Y-It?" Pre-flight Analysis</h2>
                    </div>
                    <button onClick={handleClose} className="p-1 rounded-full text-yit-text-dark hover:bg-yit-bg-tertiary transition-colors"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="p-6">
                    <form onSubmit={handleFormSubmit} className="flex items-center gap-3 mb-6">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Enter a side hustle topic to analyze..."
                            className={commonInputClass}
                            disabled={isLoading}
                        />
                        <button type="submit" className={commonButtonClass} disabled={isLoading || !topic.trim()}>
                            {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </form>

                    {isLoading && <div className="text-center p-8 text-yit-text-dark animate-pulse">Running analysis on "{topic}"...</div>}
                    
                    {result && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-yit-bg p-4 rounded-lg border border-yit-border text-center">
                                <p className="text-sm text-yit-text-dark">Market Viability Score</p>
                                <p className={`text-6xl font-black ${scoreColor}`}>{result.viabilityScore.toFixed(1)}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-yit-bg p-4 rounded-lg border border-yit-border">
                                    <p className="text-sm font-semibold text-yit-text-lightest mb-1">Guru Saturation</p>
                                    <p className="text-lg font-bold">{result.guruSaturation}</p>
                                </div>
                                <div className="bg-yit-bg p-4 rounded-lg border border-yit-border">
                                    <p className="text-sm font-semibold text-yit-text-lightest mb-1">Effort vs. Reward</p>
                                    <p className="text-sm">{result.effortRewardRatio}</p>
                                </div>
                            </div>
                            <div className="bg-yit-bg p-4 rounded-lg border border-yit-border">
                                {/* FIX: Replaced ExclamationTriangleIcon with ExclamationCircleIcon */}
                                <p className="font-semibold text-yit-text-lightest mb-2 flex items-center gap-2"><ExclamationCircleIcon className="w-5 h-5 text-yit-yellow"/> Potential Risks</p>
                                <ul className="space-y-1 list-disc list-inside text-sm text-yit-text-dark">
                                    {result.potentialRisks.map((risk, i) => <li key={i}>{risk}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};