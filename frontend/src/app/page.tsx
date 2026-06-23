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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDocumentUploaded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      description: 'Overview & Stats',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      description: 'Add Documents',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      )
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      description: 'Your Files',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    { 
      id: 'chat', 
      label: 'Chat', 
      description: 'Ask Anything',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      )
    },
    { 
      id: 'digest', 
      label: 'Digest', 
      description: 'Daily Summary',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-gray-100" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Privacy Guardian</h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">Document Security Agent</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-700">Local Processing Active</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-xs font-medium text-gray-600">Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-16 z-40">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-lg border-b border-gray-100" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-3 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200/50'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-white' : 'text-gray-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="slide-up">
          {activeTab === 'dashboard' && <Dashboard key={refreshKey} />}
          {activeTab === 'upload' && <DocumentUpload onUploaded={handleDocumentUploaded} />}
          {activeTab === 'documents' && <DocumentList key={refreshKey} />}
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'digest' && <DailyDigest />}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative mt-auto">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-100 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Your data never leaves your device</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Built for the Concierge Track</span>
              <span>·</span>
              <span>Privacy by Design</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}