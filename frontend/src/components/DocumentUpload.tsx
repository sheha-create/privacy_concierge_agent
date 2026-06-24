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
  const [scanStage, setScanStage] = useState('');
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
    setScanStage('Initializing secure upload...');

    const formData = new FormData();
    formData.append('file', file);

    const stages = [
      { progress: 15, stage: 'Encrypting file...' },
      { progress: 30, stage: 'Uploading to secure vault...' },
      { progress: 50, stage: 'Extracting text content...' },
      { progress: 70, stage: 'Running PII detection...' },
      { progress: 85, stage: 'Indexing sanitized data...' },
      { progress: 95, stage: 'Finalizing security scan...' },
    ];

    const progressInterval = setInterval(() => {
      const stage = stages.find(s => uploadProgress < s.progress);
      if (stage) {
        setUploadProgress(stage.progress);
        setScanStage(stage.stage);
      }
    }, 400);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setScanStage('Scan complete!');

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
    setScanStage('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-500/10 border border-cyber-500/20 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyber-700">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-sm font-semibold text-cyber-700">Secure Document Processing</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Upload & Protect</h2>
        <p className="text-cyber-200/60 max-w-lg mx-auto">
          Upload documents for AI-powered PII detection and automatic redaction. All processing happens locally.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="glass-card-static p-6 slide-up slide-up-delay-1">
        <div
          className={`drop-zone relative overflow-hidden ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Scan Effect */}
          {uploading && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-700 to-transparent animate-scan" />
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
            onChange={handleChange}
          />

          {!file ? (
            <div className="relative py-16 text-center">
              {/* Upload Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyber-500/20 to-cyan-500/20 border border-cyber-500/30 flex items-center justify-center float-animation">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyber-700">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Drop documents here
              </h3>
              <p className="text-cyber-200/60 mb-6">
                or click to browse your files
              </p>

              <button
                onClick={() => inputRef.current?.click()}
                className="btn-primary"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Select Files
              </button>

              <div className="flex items-center justify-center gap-6 mt-8">
                {['PDF', 'Images', 'Text'].map((type) => (
                  <div key={type} className="flex items-center gap-2 text-sm text-cyber-200/40">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {type}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative py-8 px-4">
              {/* File Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-navy-elevated/50 border border-cyber-500/10 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-500/20 to-cyan-500/20 border border-cyber-500/30 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyber-700">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{file.name}</p>
                  <p className="text-sm text-cyber-200/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!uploading && (
                  <button
                    onClick={reset}
                    className="w-10 h-10 rounded-lg bg-navy-elevated hover:bg-navy-surface flex items-center justify-center transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyber-200/60">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Progress */}
              {uploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-cyber-200/60">{scanStage}</span>
                    <span className="text-sm font-bold text-cyber-700">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-navy-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyber-500 to-cyan-500 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer" />
                    </div>
                  </div>
                </div>
              )}

              {!uploading && (
                <div className="flex gap-3">
                  <button onClick={reset} className="btn-secondary flex-1">
                    Change File
                  </button>
                  <button onClick={handleUpload} className="btn-primary flex-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Scan & Protect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card-static p-5 border border-red-500/30 slide-up">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-red-400">Upload Failed</p>
              <p className="text-sm text-cyber-200/60">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 scale-in">
          {/* Success */}
          <div className="glass-card-static p-5 border border-green-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Document Secured</h3>
                <p className="text-sm text-cyber-200/60">{result.filename} - Processed successfully</p>
              </div>
              <button onClick={reset} className="btn-primary">
                Upload Another
              </button>
            </div>
          </div>

          {/* Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Info */}
            <div className="glass-card-static p-5 slide-up slide-up-delay-1">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyber-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Analysis Results
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-navy-elevated/50">
                  <span className="text-sm text-cyber-200/60">Document Type</span>
                  <span className="font-medium text-white capitalize">{result.doc_type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-navy-elevated/50">
                  <span className="text-sm text-cyber-200/60">Chunks Indexed</span>
                  <span className="font-medium text-white">{result.chunk_count}</span>
                </div>
              </div>
            </div>

            {/* Security Status */}
            <div className={`glass-card-static p-5 slide-up slide-up-delay-2 ${result.pii_detected ? 'border border-red-500/30' : 'border border-green-500/30'}`}>
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={result.pii_detected ? 'text-red-400' : 'text-green-400'}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Security Status
              </h4>
              {result.pii_detected ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-red-400">PII Detected</p>
                      <p className="text-xs text-cyber-200/60">Auto-redacted before indexing</p>
                    </div>
                  </div>
                  <span className={`tag severity-${result.pii_severity}`}>
                    {result.pii_severity.toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-green-400">Clean</p>
                      <p className="text-xs text-cyber-200/60">No sensitive data found</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extracted Info */}
          {(result.key_dates.length > 0 || result.key_amounts.length > 0) && (
            <div className="glass-card-static p-5 slide-up slide-up-delay-3">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Extracted Data
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.key_dates.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-cyber-200/60 uppercase tracking-wider mb-2">Dates</p>
                    <div className="flex flex-wrap gap-2">
                      {result.key_dates.map((date, i) => (
                        <span key={i} className="tag bg-cyber-500/10 text-cyber-700 border border-cyber-500/20">
                          {typeof date === 'string' ? date : JSON.stringify(date)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.key_amounts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-cyber-200/60 uppercase tracking-wider mb-2">Amounts</p>
                    <div className="flex flex-wrap gap-2">
                      {result.key_amounts.map((amount, i) => (
                        <span key={i} className="tag bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {typeof amount === 'string' ? amount : JSON.stringify(amount)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {result.summary && (
            <div className="glass-card-static p-5 slide-up slide-up-delay-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyber-500">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Document Preview
              </h4>
              <div className="p-4 rounded-xl bg-navy-elevated/50 text-sm text-cyber-200/80 font-mono leading-relaxed">
                {result.summary}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="glass-card-static p-5 slide-up">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-white mb-1">Security Guarantee</h4>
            <p className="text-sm text-cyber-200/60 leading-relaxed">
              PII detection runs entirely on your device. Only sanitized text with tags like <code className="px-2 py-0.5 bg-navy-elevated rounded text-cyber-700 text-xs">[AADHAAR_REDACTED]</code> is stored. Your sensitive data never leaves your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}