import React from 'react';
import { useAppContext } from '../App';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, BookOpenIcon, CpuChipIcon, ChartBarIcon, ArrowRightIcon } from './icons/Icons';
import type { ProductionLogEntry } from '../types';

interface DashboardProps {
    onSelectProject: (projectName: string) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-yit-bg-secondary p-4 rounded-lg border border-yit-border flex items-center gap-4">
        <div className="bg-yit-bg p-3 rounded-full text-yit-accent">{icon}</div>
        <div>
            <p className="text-sm text-yit-text-dark">{title}</p>
            <p className="text-2xl font-bold text-yit-text-lightest">{value}</p>
        </div>
    </div>
);

const RecentActivityItem: React.FC<{ log: ProductionLogEntry }> = ({ log }) => {
    const statusMap = {
        complete: { icon: <CheckCircleIcon className="w-5 h-5 text-yit-green" />, text: 'completed' },
        failed: { icon: <ExclamationCircleIcon className="w-5 h-5 text-yit-red" />, text: 'failed' },
        cancelled: { icon: <ExclamationCircleIcon className="w-5 h-5 text-yit-text-dark" />, text: 'was cancelled' },
    };
    const status = statusMap[log.status];

    return (
        <li className="flex items-center gap-4 p-3 rounded-md hover:bg-yit-bg-tertiary/50">
            <div className="flex-shrink-0">{status.icon}</div>
            <div className="flex-grow text-sm">
                <span className="font-semibold capitalize text-yit-text-lightest">{log.topic}</span>
                <span className="text-yit-text-dark"> {log.phase} run {status.text}.</span>
            </div>
            <div className="text-xs text-yit-text-dark">{log.timestamp.toLocaleTimeString()}</div>
        </li>
    );
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectProject }) => {
    // FIX: 'productionQueue' is not available in AppContext. It should be derived from the projects list.
    const { projects, productionLogs, researchQueue, currentResearch, currentProduction } = useAppContext();
    const productionQueueCount = projects.filter(p => p.status.startsWith('production_') && p.status.endsWith('_queued')).length;
    
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const totalTokens = projects.reduce((acc, p) => acc + (p.estimatedTokens?.research || 0) + (p.estimatedTokens?.production || 0), 0);
    const recentLogs = productionLogs.slice(0, 5);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-yit-text-lightest">Dashboard</h1>
                <p className="text-yit-text-dark mt-1">An overview of your book production system.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Projects" value={projects.length} icon={<BookOpenIcon className="w-6 h-6"/>} />
                <StatCard title="Projects Completed" value={completedProjects} icon={<CheckCircleIcon className="w-6 h-6"/>} />
                <StatCard title="Tokens Consumed (est.)" value={totalTokens.toLocaleString()} icon={<CpuChipIcon className="w-6 h-6"/>} />
                <StatCard title="Total Log Entries" value={productionLogs.length} icon={<ChartBarIcon className="w-6 h-6"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-yit-bg-secondary rounded-lg border border-yit-border">
                    <h2 className="text-lg font-semibold p-4 border-b border-yit-border text-yit-text-lightest">Active Queues</h2>
                    <div className="p-4 space-y-4">
                        <div>
                            <h3 className="text-yit-text-dark mb-2">Research Queue ({researchQueue.length} waiting)</h3>
                            {currentResearch ? (
                                <p className="p-3 bg-yit-bg rounded-md text-sm text-yit-cyan animate-pulse">Processing: {currentResearch.topic}</p>
                            ) : (
                                <p className="p-3 bg-yit-bg rounded-md text-sm text-yit-text-dark italic">Idle</p>
                            )}
                        </div>
                         <div>
                            <h3 className="text-yit-text-dark mb-2">Production Queue ({productionQueueCount} waiting)</h3>
                            {currentProduction ? (
                                <p className="p-3 bg-yit-bg rounded-md text-sm text-yit-blue animate-pulse">Processing: {currentProduction.topic}</p>
                            ) : (
                                <p className="p-3 bg-yit-bg rounded-md text-sm text-yit-text-dark italic">Idle</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-yit-bg-secondary rounded-lg border border-yit-border">
                    <h2 className="text-lg font-semibold p-4 border-b border-yit-border text-yit-text-lightest">Recent Activity</h2>
                    {recentLogs.length > 0 ? (
                        <ul className="p-2">{recentLogs.map(log => <RecentActivityItem key={log.timestamp.toISOString()} log={log}/>)}</ul>
                    ) : (
                        <p className="p-4 text-sm text-yit-text-dark italic">No recent activity.</p>
                    )}
                </div>
            </div>
            
            <div className="bg-yit-bg-secondary rounded-lg border border-yit-border">
                 <h2 className="text-lg font-semibold p-4 border-b border-yit-border text-yit-text-lightest">Quick Access</h2>
                 <div className="p-4 max-h-60 overflow-y-auto">
                    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {projects.slice(0, 12).map(p => (
                            <li key={p.name}>
                                <button onClick={() => onSelectProject(p.name)} className="w-full text-left p-3 rounded-md bg-yit-bg hover:bg-yit-bg-tertiary transition-colors flex items-center justify-between text-sm">
                                    <span className="font-medium capitalize truncate text-yit-text-light">{p.name}</span>
                                    <ArrowRightIcon className="w-4 h-4 text-yit-text-dark flex-shrink-0"/>
                                </button>
                            </li>
                        ))}
                    </ul>
                 </div>
            </div>
        </div>
    );
};