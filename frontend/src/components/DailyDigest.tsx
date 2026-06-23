'use client';

import { useState, useEffect } from 'react';

interface DigestData {
  summary: string;
  reminders_count: number;
  flagged_count: number;
  reminders: Array<{ title: string; due_date: string }>;
  flagged_docs: Array<{ filename: string; severity: string }>;
}

export default function DailyDigest() {
  const [data, setData] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDigest();
  }, []);

  const fetchDigest = async () => {
    try {
      const res = await fetch('/api/digest');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch digest:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="text-gray-500 font-medium">Loading digest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-sm font-semibold text-amber-700">Daily Summary</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Digest</h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          Overview of deadlines, flagged documents, and important updates for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 slide-up slide-up-delay-1">
        <div className="glass-card p-6 stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Upcoming Deadlines</p>
              <p className="text-4xl font-bold text-gray-900">{data?.reminders_count || 0}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-pink-500" />
            <span className="text-xs text-gray-500">Next 7 days</span>
          </div>
        </div>

        <div className="glass-card p-6 stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Flagged Documents</p>
              <p className="text-4xl font-bold text-gray-900">{data?.flagged_count || 0}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-400 to-rose-500" />
            <span className="text-xs text-gray-500">Require attention</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="glass-card-static p-8 slide-up slide-up-delay-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Summary</h3>
              <p className="text-sm text-gray-500">Your daily overview</p>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{data.summary}</div>
          </div>
        </div>
      )}

      {/* Reminders */}
      {data?.reminders && data.reminders.length > 0 && (
        <div className="glass-card-static p-6 slide-up slide-up-delay-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Upcoming Deadlines</h3>
              <p className="text-sm text-gray-500">{data.reminders.length} reminder{data.reminders.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.reminders.map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl border border-orange-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                  <p className="text-sm text-gray-500">
                    {r.due_date ? new Date(r.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'No date set'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flagged Documents */}
      {data?.flagged_docs && data.flagged_docs.length > 0 && (
        <div className="glass-card-static p-6 slide-up slide-up-delay-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Flagged Documents</h3>
              <p className="text-sm text-gray-500">{data.flagged_docs.length} document{data.flagged_docs.length !== 1 ? 's' : ''} with PII</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.flagged_docs.map((d, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{d.filename}</p>
                  <p className="text-sm text-gray-500">Contains sensitive data</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase severity-${d.severity}`}>
                  {d.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!data?.reminders?.length && !data?.flagged_docs?.length && (
        <div className="glass-card-static p-12 text-center slide-up slide-up-delay-2">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center float-animation">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-500">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No urgent items right now. Your documents are safe and no deadlines are approaching.
          </p>
        </div>
      )}

      {/* Privacy Note */}
      <div className="glass-card-static p-6 slide-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-200">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Privacy Guarantee</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              This digest is generated entirely from locally-indexed, sanitized data. 
              No sensitive information is shared, transmitted, or stored in plain text.
            </p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center slide-up">
        <button onClick={fetchDigest} className="btn-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh Digest
        </button>
      </div>
    </div>
  );
}