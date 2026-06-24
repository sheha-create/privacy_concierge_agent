'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ document_id: number; score: number }>;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'Sorry, I could not find an answer.',
        citations: data.citations,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    { text: 'What bills are due this month?', icon: '📅' },
    { text: 'Show me documents with sensitive data', icon: '🔒' },
    { text: 'What are the key dates?', icon: '📆' },
    { text: 'Summarize my documents', icon: '📝' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card-static overflow-hidden slide-up">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-cyber-500 via-cyan-500/80 to-blue-500 p-6">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Security AI Assistant</h3>
              <p className="text-white/80 text-sm">
                Ask questions about your protected documents
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white">Secure</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-[500px] overflow-y-auto p-6 bg-navy-dark">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              {/* Empty State Illustration */}
              <div className="relative mb-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyber-500/20 via-cyan-500/10 to-blue-500/20 border border-cyber-500/20 flex items-center justify-center float-animation">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyber-700">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-500/20 to-cyan-500/20 border border-cyber-500/20 flex items-center justify-center text-cyber-700 shadow-lg float-animation" style={{ animationDelay: '1s' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center text-green-400 shadow-lg float-animation" style={{ animationDelay: '2s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">How can I help you?</h3>
              <p className="text-cyber-200/60 mb-8 max-w-md">
                Ask me anything about your uploaded documents. I'll find the relevant information and cite my sources.
              </p>

              {/* Suggested Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q.text)}
                    className="flex items-center gap-3 p-4 bg-navy-elevated/50 border border-cyber-500/10 hover:border-cyber-500/30 hover:bg-navy-elevated rounded-2xl transition-all text-left group"
                  >
                    <span className="text-xl">{q.icon}</span>
                    <span className="text-sm font-medium text-cyber-200/80 group-hover:text-white transition-colors">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} slide-up`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-cyan-500 flex items-center justify-center text-white flex-shrink-0 mr-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-4 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyber-500 to-cyan-500 text-white shadow-lg shadow-cyber-500/20'
                        : 'bg-navy-elevated border border-cyber-500/10 text-white shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className={`mt-3 pt-3 border-t ${msg.role === 'user' ? 'border-white/20' : 'border-cyber-500/10'}`}>
                        <div className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={msg.role === 'user' ? 'text-white/70' : 'text-cyber-200/40'}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-white/70' : 'text-cyber-200/40'}`}>
                            {msg.citations.length} source{msg.citations.length !== 1 ? 's' : ''} cited
                          </span>
                        </div>
                      </div>
                    )}
                    <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/60' : 'text-cyber-200/40'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-elevated to-navy-surface border border-cyber-500/20 flex items-center justify-center text-cyber-700 flex-shrink-0 ml-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex justify-start slide-up">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-cyan-500 flex items-center justify-center text-white flex-shrink-0 mr-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="bg-navy-elevated border border-cyber-500/10 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="dots-loading">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="text-sm text-cyber-200/60 ml-2">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-cyber-500/10 p-4 bg-navy-surface">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your documents..."
                disabled={loading}
                className="w-full px-5 py-4 bg-navy-elevated border border-cyber-500/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyber-500 focus:border-transparent disabled:opacity-50 transition-all text-white placeholder-cyber-200/40"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-14 h-14 rounded-2xl bg-gradient-to-r from-cyber-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyber-500/20 hover:shadow-xl hover:shadow-cyber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span className="text-xs text-cyber-200/40">
              Queries run against locally-indexed, sanitized document chunks only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}