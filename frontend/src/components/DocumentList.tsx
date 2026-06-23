'use client';

import { useState, useEffect } from 'react';

interface Document {
  id: number;
  filename: string;
  doc_type: string;
  pii_detected: boolean;
  pii_severity: string;
  key_dates: string[];
  key_amounts: string[];
  chunk_count: number;
  created_at: string;
}

const docTypeIcons: Record<string, { gradient: string; icon: React.ReactNode }> = {
  bill: {
    gradient: 'from-orange-400 to-pink-500',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  id_document: {
    gradient: 'from-blue-400 to-indigo-500',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20v-2a5 5 0 0 1 10 0v2" />
      </svg>
    ),
  },
  certificate: {
    gradient: 'from-green-400 to-emerald-500',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  },
  offer_letter: {
    gradient: 'from-purple-400 to-pink-500',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  bank_statement: {
    gradient: 'from-teal-400 to-cyan-500',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  contract: {
    gradient: 'from-indigo-400 to-blue-500',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  receipt: {
    gradient: 'from-amber-400 to-orange-500',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  other: {
    gradient: 'from-gray-400 to-slate-500',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
};

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docDetails, setDocDetails] = useState<any>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      setDocDetails(data);
    } catch (err) {
      console.error('Failed to fetch document details:', err);
    }
  };

  const deleteDocument = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocuments(documents.filter(d => d.id !== id));
      setSelectedDoc(null);
      setDocDetails(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="text-gray-500 font-medium">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between slide-up">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Your Documents</h2>
          <p className="text-gray-500 mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''} uploaded</p>
        </div>
      </div>

      {/* Empty State */}
      {documents.length === 0 ? (
        <div className="glass-card-static p-16 text-center slide-up slide-up-delay-1">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center float-animation">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Upload your first document to start protecting your sensitive data
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc, index) => {
            const docStyle = docTypeIcons[doc.doc_type] || docTypeIcons.other;
            return (
              <div
                key={doc.id}
                className={`glass-card p-6 cursor-pointer group slide-up slide-up-delay-${(index % 4) + 1} ${
                  selectedDoc?.id === doc.id ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-100' : ''
                }`}
                onClick={() => {
                  setSelectedDoc(doc);
                  fetchDocDetails(doc.id);
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${docStyle.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {docStyle.icon}
                  </div>
                  {doc.pii_detected && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 rounded-full">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span className="text-xs font-bold text-red-600">Protected</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="font-bold text-gray-900 text-lg mb-1 truncate group-hover:text-indigo-600 transition-colors">
                  {doc.filename}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {doc.chunk_count} chunk{doc.chunk_count !== 1 ? 's' : ''} indexed
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 capitalize">
                    {doc.doc_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDoc && docDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setSelectedDoc(null); setDocDetails(null); }}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl scale-in">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-gray-100 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${docTypeIcons[docDetails.doc_type]?.gradient || docTypeIcons.other.gradient} flex items-center justify-center text-white`}>
                    {docTypeIcons[docDetails.doc_type]?.icon || docTypeIcons.other.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{docDetails.filename}</h3>
                    <p className="text-sm text-gray-500 capitalize">{docDetails.doc_type?.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedDoc(null); setDocDetails(null); }}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-1">Chunks</p>
                  <p className="text-2xl font-bold text-gray-900">{docDetails.chunk_count}</p>
                </div>
                <div className={`p-4 rounded-2xl ${docDetails.pii_detected ? 'bg-gradient-to-br from-red-50 to-rose-50' : 'bg-gradient-to-br from-green-50 to-emerald-50'}`}>
                  <p className="text-sm text-gray-500 mb-1">Security</p>
                  <p className={`text-2xl font-bold ${docDetails.pii_detected ? 'text-red-600' : 'text-green-600'}`}>
                    {docDetails.pii_detected ? 'Protected' : 'Clean'}
                  </p>
                </div>
              </div>

              {/* PII Flags */}
              {docDetails.pii_detected && docDetails.pii_flags?.length > 0 && (
                <div className="p-5 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100">
                  <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Sensitive Data Detected ({docDetails.pii_flags.length} items)
                  </h4>
                  <div className="space-y-2">
                    {docDetails.pii_flags.map((flag: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase severity-${flag.severity}`}>
                            {flag.type}
                          </span>
                          <span className="text-sm text-gray-600 font-mono">{flag.matched_text}</span>
                        </div>
                        <span className="text-xs text-gray-400">{(flag.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Dates */}
              {docDetails.key_dates?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                    Key Dates
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {docDetails.key_dates.map((d: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-medium rounded-lg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        </svg>
                        {typeof d === 'string' ? d : d.raw || JSON.stringify(d)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Amounts */}
              {docDetails.key_amounts?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Amounts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {docDetails.key_amounts.map((a: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium rounded-lg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        {typeof a === 'string' ? a : a.raw || JSON.stringify(a)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => deleteDocument(docDetails.id)}
                  className="btn-danger flex-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete Document
                </button>
                <button
                  onClick={() => { setSelectedDoc(null); setDocDetails(null); }}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}