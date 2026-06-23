'use client';

import { useState, useRef } from 'react';

interface UploadResult {
  id: number;
  filename: string;
  doc_type: string;
  pii_detected: boolean;
  pii_severity: string;
  chunk_count: number;
  key_dates: string[];
  key_amounts: string[];
  summary: string;
}

export default function DocumentUpload({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await res.json();
      setResult(data);
      onUploaded();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setUploadProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-sm font-semibold text-indigo-700">Privacy-First Processing</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          Drag and drop your files or click to browse. PII is detected and redacted locally before any processing.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="glass-card-static p-8 slide-up slide-up-delay-1">
        <div
          className={`drop-zone relative overflow-hidden ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl" />
          </div>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
            onChange={handleChange}
          />

          {!file ? (
            <div className="relative py-12 text-center">
              {/* Upload Icon */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center float-animation">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-500">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Drop your documents here
              </h3>
              <p className="text-gray-500 mb-6">
                or click to browse from your computer
              </p>

              <button
                onClick={() => inputRef.current?.click()}
                className="btn-primary text-base px-8 py-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Choose Files
              </button>

              <div className="flex items-center justify-center gap-6 mt-8">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  PDF
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Images
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Text
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">Maximum file size: 50MB</p>
            </div>
          ) : (
            <div className="relative py-8">
              {/* File Selected */}
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Processing document...</span>
                    <span className="text-sm font-bold text-indigo-600">{uploadProgress}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    <span className="text-xs text-gray-500">
                      {uploadProgress < 30 ? 'Uploading...' : 
                       uploadProgress < 60 ? 'Extracting text...' :
                       uploadProgress < 90 ? 'Scanning for PII...' : 'Finalizing...'}
                    </span>
                  </div>
                </div>
              )}

              {!uploading && (
                <div className="flex gap-3">
                  <button onClick={reset} className="btn-secondary flex-1">
                    Change File
                  </button>
                  <button onClick={handleUpload} className="btn-primary flex-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Upload & Protect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card-static p-6 border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 slide-up">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-700">Upload Failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="space-y-6 scale-in">
          {/* Success Header */}
          <div className="glass-card-static p-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-200">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Document Processed Successfully</h3>
                <p className="text-gray-600">{result.filename}</p>
              </div>
              <button onClick={reset} className="btn-primary">
                Upload Another
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Info */}
            <div className="glass-card-static p-6 slide-up slide-up-delay-1">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Document Details
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="font-semibold capitalize">{result.doc_type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Chunks Indexed</span>
                  <span className="font-semibold">{result.chunk_count}</span>
                </div>
              </div>
            </div>

            {/* Security Status */}
            <div className={`glass-card-static p-6 slide-up slide-up-delay-2 ${result.pii_detected ? 'border-2 border-red-200' : 'border-2 border-green-200'}`}>
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={result.pii_detected ? 'text-red-500' : 'text-green-500'}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Security Analysis
              </h4>
              {result.pii_detected ? (
                <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-red-700">Sensitive Data Detected</p>
                      <p className="text-sm text-red-600">Auto-redacted before indexing</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold severity-${result.pii_severity}`}>
                      Severity: {result.pii_severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-green-700">All Clear</p>
                      <p className="text-sm text-green-600">No sensitive data detected</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Key Dates & Amounts */}
          {(result.key_dates.length > 0 || result.key_amounts.length > 0) && (
            <div className="glass-card-static p-6 slide-up slide-up-delay-3">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Extracted Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.key_dates.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Key Dates</p>
                    <div className="flex flex-wrap gap-2">
                      {result.key_dates.map((date, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-medium rounded-lg">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                          </svg>
                          {typeof date === 'string' ? date : JSON.stringify(date)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.key_amounts.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Amounts</p>
                    <div className="flex flex-wrap gap-2">
                      {result.key_amounts.map((amount, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium rounded-lg">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          {typeof amount === 'string' ? amount : JSON.stringify(amount)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {result.summary && (
            <div className="glass-card-static p-6 slide-up slide-up-delay-4">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Document Preview
              </h4>
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 leading-relaxed">
                {result.summary}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Privacy Guarantee */}
      <div className="glass-card-static p-6 slide-up">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-1">Privacy Guarantee</h4>
            <p className="text-gray-600 leading-relaxed">
              PII detection runs entirely on your device using local regex patterns and NER models. 
              Only sanitized text (with sensitive data replaced by tags like <code className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono">[AADHAAR_REDACTED]</code>) 
              is stored or sent to any external API. Your Aadhaar, PAN, bank details never leave your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}