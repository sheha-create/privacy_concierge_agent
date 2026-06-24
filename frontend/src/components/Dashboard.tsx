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
          <p className="text-cyber-200/60 font-medium">Loading threat intelligence...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="text-white font-medium">Failed to load dashboard</p>
        <button onClick={fetchDashboard} className="btn-secondary mt-4">Retry</button>
      </div>
    );
  }

  const securityScore = Math.max(20, 100 - (data.stats.flagged_documents * 15));
  const scoreColor = securityScore >= 70 ? '#00E676' : securityScore >= 40 ? '#FFC107' : '#FF5252';

  const statCards = [
    {
      title: 'Documents Secured',
      value: data.stats.total_documents,
      change: '+2 this week',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      color: 'from-cyber-500 to-cyber-600',
      glow: 'shadow-glow',
    },
    {
      title: 'PII Detected',
      value: data.stats.flagged_documents,
      change: 'Auto-redacted',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
      glow: 'shadow-glow',
    },
    {
      title: 'Active Threats',
      value: data.stats.pending_reminders,
      change: 'Monitored',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      color: 'from-red-500 to-pink-500',
      glow: 'shadow-glow',
    },
    {
      title: 'Reminders',
      value: data.stats.total_reminders,
      change: 'Upcoming',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: 'from-cyan-400 to-blue-500',
      glow: 'shadow-glow',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Security Score Header */}
      <div className="glass-card p-6 slide-up">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Security Score Ring */}
          <div className="relative">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" className="security-ring-bg" />
              <circle
                cx="70"
                cy="70"
                r="60"
                className="security-ring-progress"
                stroke={scoreColor}
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - securityScore / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{securityScore}</span>
              <span className="text-xs text-cyber-200/60">Security Score</span>
            </div>
          </div>

          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">
              Security Status: <span style={{ color: scoreColor }}>{securityScore >= 70 ? 'Protected' : securityScore >= 40 ? 'Warning' : 'Critical'}</span>
            </h2>
            <p className="text-cyber-200/60 max-w-xl">
              Your documents are being monitored. {data.stats.flagged_documents} file{data.stats.flagged_documents !== 1 ? 's' : ''} with sensitive data detected and automatically redacted.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-cyber-500/10 border border-cyber-500/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyber-700 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-cyber-700">Live Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`glass-card p-5 stat-card slide-up slide-up-delay-${index + 1}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white ${stat.glow}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-cyber-200/60 text-sm mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
            <p className="text-xs text-cyber-200/40">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Monitoring Feed */}
        <div className="lg:col-span-2 glass-card p-6 slide-up slide-up-delay-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-cyber-700 flex items-center justify-center text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Threat Monitor</h3>
                <p className="text-xs text-cyber-200/60">Real-time activity feed</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-400">Active</span>
            </div>
          </div>

          {data.upcoming_reminders.length === 0 && data.recent_flags.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-white font-medium">All Clear</p>
              <p className="text-sm text-cyber-200/60">No active threats detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Upcoming Deadlines */}
              {data.upcoming_reminders.slice(0, 3).map((reminder, i) => (
                <div
                  key={`reminder-${reminder.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-navy-elevated/50 border border-cyber-500/10 hover:border-cyber-500/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate text-sm">{reminder.title}</p>
                    <p className="text-xs text-cyber-200/60">
                      Due: {new Date(reminder.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="tag severity-high">Deadline</span>
                </div>
              ))}

              {/* Security Flags */}
              {data.recent_flags.slice(0, 3).map((flag, i) => (
                <div
                  key={`flag-${i}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-navy-elevated/50 border border-cyber-500/10 hover:border-cyber-500/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate text-sm capitalize">{flag.pii_type.replace('_', ' ')}</p>
                    <p className="text-xs text-cyber-200/60 font-mono">{flag.matched_text}</p>
                  </div>
                  <span className={`tag severity-${flag.severity}`}>{flag.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights Panel */}
        <div className="glass-card p-6 slide-up slide-up-delay-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Insights</h3>
              <p className="text-xs text-cyber-200/60">Security recommendations</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyber-500/10 to-cyan-500/10 border border-cyber-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyber-500/20 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyber-700">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">PII Protection Active</p>
                  <p className="text-xs text-cyber-200/60 mt-1">All sensitive data is automatically detected and redacted before indexing.</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Local Processing</p>
                  <p className="text-xs text-cyber-200/60 mt-1">No raw data leaves your device. All scans run locally.</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Action Required</p>
                  <p className="text-xs text-cyber-200/60 mt-1">Review flagged documents for additional security measures.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="glass-card p-6 slide-up slide-up-delay-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-cyber-600 flex items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Secured Documents</h3>
            <p className="text-xs text-cyber-200/60">Recently processed files</p>
          </div>
        </div>

        {data.recent_documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyber-500/10 border border-cyber-500/30 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyber-500">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-white font-medium">No documents yet</p>
            <p className="text-sm text-cyber-200/60">Upload your first document to secure it</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-cyber-500/10">
            <table className="w-full">
              <thead>
                <tr className="bg-navy-elevated/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-cyber-200/60 uppercase tracking-wider">Document</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-cyber-200/60 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-cyber-200/60 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-cyber-200/60 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-500/10">
                {data.recent_documents.map((doc) => (
                  <tr key={doc.id} className="table-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyber-500">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <span className="font-medium text-white text-sm">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="tag bg-cyber-500/10 text-cyber-700 border border-cyber-500/20">
                        {doc.doc_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {doc.pii_detected ? (
                        <span className="tag severity-high">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          Protected
                        </span>
                      ) : (
                        <span className="tag severity-low">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          Clean
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-cyber-200/60">
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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