import React, { memo } from 'react';
import type { ProductionLogEntry } from '../types';
import { useAppContext } from '../App';
import { DocumentDuplicateIcon, CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from './icons/Icons';

interface ProductionLogProps {
    onSelectLog: (log: ProductionLogEntry) => void;
}

const LogStatus: React.FC<{ status: ProductionLogEntry['status'] }> = ({ status }) => {
    switch (status) {
        case 'complete':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yit-green/10 text-yit-green">
                    <CheckCircleIcon className="w-4 h-4" />
                    Complete
                </span>
            );
        case 'failed':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yit-red/10 text-yit-red">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    Failed
                </span>
            );
        case 'cancelled':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yit-border/20 text-yit-text-dark">
                    <XMarkIcon className="w-4 h-4" />
                    Cancelled
                </span>
            );
        default:
            return null;
    }
}

const LogRow: React.FC<{ log: ProductionLogEntry, onSelect: () => void }> = ({ log, onSelect }) => (
    <tr
        className="hover:bg-yit-bg-tertiary/50 transition-colors duration-150 cursor-pointer border-b border-yit-border"
        onClick={onSelect}
        tabIndex={0}
        onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
    >
        <td className="px-6 py-4 font-semibold capitalize whitespace-nowrap text-yit-text-lightest">{log.topic}</td>
        <td className="px-6 py-4 text-yit-text-dark">{log.timestamp.toLocaleString()}</td>
        <td className="px-6 py-4">
            <LogStatus status={log.status} />
        </td>
        <td className="px-6 py-4 text-yit-text-dark">{log.phase}</td>
        <td className="px-6 py-4 text-yit-text-dark">{log.formatsCreated.length > 0 ? `${log.formatsCreated.length} files` : 'N/A'}</td>
    </tr>
);

const MemoizedLogRow = memo(LogRow);

export const ProductionLog: React.FC<ProductionLogProps> = ({ onSelectLog }) => {
    const { productionLogs: logs } = useAppContext();
    return (
        <div className="bg-yit-bg-secondary rounded-lg border border-yit-border shadow-lg">
            <div className="p-4 border-b border-yit-border">
                <h2 className="text-lg font-bold text-yit-text-lightest">Production Log</h2>
                <p className="text-sm text-yit-text-dark">History of all book generations. Click a row for details.</p>
            </div>
            <div className="overflow-x-auto">
                {logs.length === 0 ? (
                     <div className="text-center py-16 text-yit-text-dark">
                        <DocumentDuplicateIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-semibold text-yit-text-light">No Production History</p>
                        <p className="text-sm">Completed production runs will appear here.</p>
                    </div>
                ) : (
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-yit-bg text-xs text-yit-text-dark uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-3 font-medium">Project</th>
                                <th scope="col" className="px-6 py-3 font-medium">Timestamp</th>
                                <th scope="col" className="px-6 py-3 font-medium">Status</th>
                                <th scope="col" className="px-6 py-3 font-medium">Phase</th>
                                <th scope="col" className="px-6 py-3 font-medium">Formats</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                               <MemoizedLogRow key={`${log.topic}-${log.timestamp.toISOString()}`} log={log} onSelect={() => onSelectLog(log)} />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};