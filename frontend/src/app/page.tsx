'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';
import ChatInterface from '@/components/ChatInterface';
import DailyDigest from '@/components/DailyDigest';

type Tab = 'dashboard' | 'upload' | 'documents' | 'chat' | 'digest';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDocumentUploaded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    },
    { 
      id: 'upload', 
      label: 'Upload', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      )
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
    },
    { 
      id: 'chat', 
      label: 'AI Assistant', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      )
    },
    { 
      id: 'digest', 
      label: 'Threat Center', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
  ];

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex flex-col z-10">
      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-cyber-700 flex items-center justify-center shadow-glow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-700 rounded-full border-2 border-navy animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Privacy Guardian</h1>
                <p className="text-[10px] text-cyber-700 font-semibold tracking-wider uppercase">AI Security</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-cyber-500/20 text-cyber-700 border border-cyber-500/30'
                      : 'text-cyber-200/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-cyber-700' : 'text-cyber-200/40'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Status */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-cyber-500/30 bg-cyber-500/10">
                <div className="w-2 h-2 bg-cyber-700 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-cyber-700">Protected</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass border-t border-cyber-500/20">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'text-cyber-700'
                  : 'text-cyber-200/40'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-cyber-700' : ''}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-8 lg:pb-8 mb-16 lg:mb-0">
        <div className="slide-up">
          {activeTab === 'dashboard' && <Dashboard key={refreshKey} />}
          {activeTab === 'upload' && <DocumentUpload onUploaded={handleDocumentUploaded} />}
          {activeTab === 'documents' && <DocumentList key={refreshKey} />}
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'digest' && <DailyDigest />}
        </div>
      </main>

      {/* Footer - Desktop Only */}
      <footer className="hidden lg:block border-t border-cyber-500/10 py-6 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-cyber-200/40">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyber-500">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>All data processed locally</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-cyber-200/30">
              <span>Enterprise Security</span>
              <span className="text-cyber-500">|</span>
              <span>GDPR Compliant</span>
              <span className="text-cyber-500">|</span>
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}