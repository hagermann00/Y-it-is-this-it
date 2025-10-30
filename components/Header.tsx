import React from 'react';
import { useAppContext } from '../App';
import { SunIcon, MoonIcon, MagnifyingGlassIcon, HomeIcon } from './icons/Icons';

interface HeaderProps {
    onSetView: (view: 'dashboard' | 'workspace') => void;
    onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSetView, onOpenSearch }) => {
    const { theme, setTheme } = useAppContext();

    return (
        <header className="bg-yit-bg-secondary border-b border-yit-border px-4 sm:px-6 lg:p-8 relative">
            <div className="flex items-center justify-between h-16 max-w-screen-2xl mx-auto">
                <div className="flex items-center space-x-3">
                     <div className="w-9 h-9 bg-yit-bg rounded-lg flex items-center justify-center border border-yit-border">
                        <svg className="w-6 h-6 text-yit-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" />
                        </svg>
                     </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-yit-text-lightest tracking-tight">
                        Y-It<span className="text-yit-text-dark font-medium"> Book Production System</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onSetView('dashboard')}
                        className="p-2 rounded-full text-yit-text-dark hover:bg-yit-bg-tertiary hover:text-yit-accent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yit-bg-secondary focus:ring-yit-accent"
                        aria-label="Go to dashboard"
                    >
                       <HomeIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={onOpenSearch}
                        className="p-2 rounded-full text-yit-text-dark hover:bg-yit-bg-tertiary hover:text-yit-accent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yit-bg-secondary focus:ring-yit-accent"
                        aria-label="Global search"
                    >
                       <MagnifyingGlassIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full text-yit-text-dark hover:bg-yit-bg-tertiary hover:text-yit-accent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yit-bg-secondary focus:ring-yit-accent"
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yit-accent/50 to-transparent"></div>
        </header>
    );
};
