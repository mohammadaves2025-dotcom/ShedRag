import React from 'react';
import { X, Database, FileText, CheckCircle2, ExternalLink } from 'lucide-react';

export default function ChunkInspectorDrawer({ isOpen, onClose, chunks, activeChunkId }) {
  if (!isOpen) return null;

  return (
    <div className="chunk-inspector-drawer animate-slide-up">
      <div className="chunk-inspector-header">
        <h4>
          <Database size={16} className="text-indigo-400" />
          Retrieved Context Chunks ({chunks?.length || 0})
        </h4>
        <button 
          className="header-icon-btn" 
          onClick={onClose}
          aria-label="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>

      <div className="chunk-inspector-content">
        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Real-time vector search results retrieved from MongoDB Atlas / ShED Knowledge Base.
        </p>

        {(!chunks || chunks.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '13px' }}>
            No retrieved chunks for this query yet. Ask a question to view vector context.
          </div>
        ) : (
          chunks.map((chunk, index) => {
            const scorePercent = Math.min(Math.round((chunk.score || 0.85) * 100), 100);
            const isTarget = activeChunkId && (activeChunkId === index || activeChunkId === chunk.pageOrUrl);

            return (
              <div 
                key={index} 
                className="chunk-detail-card"
                style={{
                  borderColor: isTarget ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: isTarget ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface-secondary)'
                }}
              >
                <div className="chunk-detail-top">
                  <span className="chunk-source-tag">
                    <FileText size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {chunk.sourceName || 'Source'} {typeof chunk.pageOrUrl === 'number' || !String(chunk.pageOrUrl).startsWith('http') ? `(p. ${chunk.pageOrUrl})` : '(Web)'}
                  </span>
                  <span className="chunk-score-badge">
                    {scorePercent}% Match
                  </span>
                </div>

                <div className="chunk-text-body">
                  {chunk.text}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-dim)', flexWrap: 'wrap', gap: 6 }}>
                  <span>Source: {chunk.sourceType === 'website' ? 'Scraped Web Portal' : 'Official PDF Booklet'}</span>
                  {String(chunk.pageOrUrl).startsWith('http') && (
                    <a 
                      href={chunk.pageOrUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'underline' }}
                    >
                      <ExternalLink size={11} /> Visit URL
                    </a>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#10b981' }}>
                    <CheckCircle2 size={11} /> Grounded
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
