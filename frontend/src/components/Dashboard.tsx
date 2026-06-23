'use client';

import { useState, useEffect } from 'react';

interface DashboardData {
  stats: {
    total_documents: number;
    flagged_documents: number;
    total_reminders: number;
    pending_reminders: number;
  };
  upcoming_reminders: Array<{
    id: number;
    title: string;
    due_date: string;
    amount: number | null;
  }>;
  recent_documents: Array<{
    id: number;
    filename: string;
    doc_type: string;
    pii_detected: boolean;
    created_at: string;
  }>;
  recent_flags: Array<{
    document_id: number;
    pii_type: string;
    severity: string;
    matched_text: string;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Failed to load dashboard</p>
        <button onClick={fetchDashboard} className="btn-secondary mt-4">Try Again</button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Documents',
      value: data.stats.total_documents,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      gradient: 'from-blue-500 to-indigo-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Protected Files',
      value: data.stats.flagged_documents,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      title: 'Reminders',
      value: data.stats.total_reminders,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-500',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Pending',
      value: data.stats.pending_reminders,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <h2 className="text-3xl font-bold mb-2">Welcome back to Privacy Guardian</h2>
          <p className="text-white/80 text-lg max-w-2xl">
            Your documents are protected. All sensitive data is automatically detected and redacted before any processing.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <span className="text-sm font-medium">PII Detection Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span className="text-sm font-medium">End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`glass-card p-6 stat-card slide-up slide-up-delay-${index + 1}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg`}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.gradient}`} />
              <span className="text-xs text-gray-500">
                {stat.title === 'Protected Files' ? 'Documents with PII' : 'Last 30 days'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <div className="lg:col-span-2 glass-card p-6 slide-up slide-up-delay-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Upcoming Deadlines</h3>
                <p className="text-sm text-gray-500">Next 7 days</p>
              </div>
            </div>
          </div>

          {data.upcoming_reminders.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">All clear!</p>
              <p className="text-sm text-gray-500">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcoming_reminders.map((reminder, i) => (
                <div
                  key={reminder.id}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl border border-orange-100 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{reminder.title}</p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(reminder.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {reminder.amount && (
                    <span className="px-4 py-2 bg-white rounded-xl font-bold text-indigo-600 shadow-sm">
                      ₹{reminder.amount.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PII Flags */}
        <div className="glass-card p-6 slide-up slide-up-delay-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Security Flags</h3>
              <p className="text-sm text-gray-500">Detected PII</p>
            </div>
          </div>

          {data.recent_flags.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">All secure!</p>
              <p className="text-sm text-gray-500">No PII detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recent_flags.slice(0, 5).map((flag, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl severity-${flag.severity} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase tracking-wide">{flag.pii_type}</p>
                      <p className="text-xs opacity-75 truncate max-w-[120px]">{flag.matched_text}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase px-2 py-1 bg-white/50 rounded-lg">
                    {flag.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Documents */}
      <div className="glass-card p-6 slide-up slide-up-delay-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recent Documents</h3>
            <p className="text-sm text-gray-500">Your uploaded files</p>
          </div>
        </div>

        {data.recent_documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">No documents yet</p>
            <p className="text-sm text-gray-500">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Security</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recent_documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-900">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                        {doc.doc_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {doc.pii_detected ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-rose-100 text-red-700">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          Protected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          Clean
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}