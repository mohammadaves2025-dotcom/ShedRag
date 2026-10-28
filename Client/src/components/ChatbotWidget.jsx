import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Database, 
  Layers, 
  Mic, 
  FileText,
  ChevronDown,
  ChevronUp,
  Sliders,
  ExternalLink,
  Search,
  Plus
} from 'lucide-react';
import avatarImg from '../assets/rag_avatar.jpg';
import ChunkInspectorDrawer from './ChunkInspectorDrawer';
import { queryRAG } from '../services/ragService';

const STORAGE_KEY = 'shed_rag_conversational_history';

export default function ChatbotWidget({ 
  isOpen, 
  onClose, 
  backendStatus, 
  initialQuery = '', 
  onShowToast,
  viewMode = 'floating', // 'floating' | 'docked' | 'expanded'
  onToggleViewMode
}) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'welcome-msg',
        sender: 'bot',
        text: "Hello! I am your **ShED Intelligence Assistant** with conversational memory. Ask me anything about our educational mission, university units, history, or mentorship programs, and ask natural follow-up questions!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: [],
        chunks: [],
        latencyMs: 140
      }
    ];
  });

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'booklet' | 'web'
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [expandedMetaIds, setExpandedMetaIds] = useState({});
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [currentInspectorChunks, setCurrentInspectorChunks] = useState([]);
  const [selectedChunkId, setSelectedChunkId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle external query triggers (e.g. from hero chips)
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
    }
  }, [initialQuery]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async (queryText = null) => {
    const textToSend = typeof queryText === 'string' ? queryText : inputVal;
    if (!textToSend.trim() || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    // Extract recent conversational turns for history-aware condensation
    const chatHistory = messages
      .filter(m => m.id !== 'welcome-msg' && !m.id.startsWith('bot-err'))
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

    try {
      const response = await queryRAG(textToSend, {
        chatHistory,
        sourceType: sourceFilter === 'all' ? undefined : sourceFilter
      });

      const botMessageId = `bot-${Date.now()}`;
      const botMsg = {
        id: botMessageId,
        sender: 'bot',
        text: response.answer || "I don't have that in my sources.",
        sources: response.sources || [],
        chunks: response.chunks || [],
        reformulatedQuery: response.reformulatedQuery || null,
        latencyMs: response.latencyMs || 180,
        isLive: response.isLive,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setCurrentInspectorChunks(response.chunks || []);
    } catch {
      const botMsg = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: "I encountered an error querying the knowledge base. Please check backend status or retry.",
        sources: [],
        chunks: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast?.("Copied answer to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id, text) => {
    if (!('speechSynthesis' in window)) {
      onShowToast?.("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (id, type) => {
    setFeedbackGiven(prev => ({ ...prev, [id]: type }));
    onShowToast?.(type === 'up' ? "Thank you for the positive feedback!" : "Feedback recorded. We'll refine citations.");
  };

  const toggleMetaExpand = (id) => {
    setExpandedMetaIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCitation = (source, chunks) => {
    setCurrentInspectorChunks(chunks);
    setSelectedChunkId(source.ref || source.name);
    setInspectorOpen(true);
  };

  const handleNewChat = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'bot',
        text: "Started a fresh conversation thread. What would you like to explore about the ShED Forum?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: [],
        chunks: [],
        latencyMs: 120
      }
    ]);
    onShowToast?.("Started new conversation thread.");
  };

  const handleClearChat = () => {
    if (window.confirm("Clear conversation history?")) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'bot',
          text: "Chat cleared. What else can I answer from the ShED Forum Knowledge Base?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: [],
          chunks: []
        }
      ]);
      onShowToast?.("Conversation history reset.");
    }
  };

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      onShowToast?.("Voice recognition not available. Please type your query.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    if (!isRecording) {
      setIsRecording(true);
      onShowToast?.("Listening... speak your question now");
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputVal(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        onShowToast?.("Voice input cancelled or not recognized");
      };

      recognition.onend = () => setIsRecording(false);
    } else {
      setIsRecording(false);
    }
  };

  const starterQuestions = [
    "When was the ShED Forum established?",
    "Free CUET 2026 entrance coaching",
    "Which 7 university campus units exist?",
    "What is the SCG Centre in New Delhi?",
    "About how many students in the Jamia unit?",
    "Why was Women's Day chosen as Foundation Day?",
    "What is the admission fee?"
  ];

  if (!isOpen) return null;

  return (
    <div className={`chatbot-widget-container glass-panel animate-slide-up mode-${viewMode}`}>
      {/* Header Bar */}
      <div className="widget-header">
        <div className="widget-identity">
          <div className="widget-avatar-wrapper">
            <img src={avatarImg} alt="ShED AI Avatar" className="widget-avatar-img" />
            <span className="avatar-online-dot"></span>
          </div>
          <div className="widget-titles">
            <h3>
              ShED AI Assistant
              <Sparkles size={14} style={{ color: '#f59e0b', display: 'inline' }} />
            </h3>
            <p>
              <span>{backendStatus?.isLive ? '🟢 Gemini 3.5 Flash' : '🟣 Local Vector RAG'}</span>
              <span>•</span>
              <span>Atlas Index</span>
            </p>
          </div>
        </div>

        <div className="widget-header-actions">
          <button 
            className="header-icon-btn" 
            onClick={handleNewChat}
            title="Start Fresh Conversation Thread"
            aria-label="New Thread"
          >
            <Plus size={16} />
          </button>

          <button 
            className={`header-icon-btn ${inspectorOpen ? 'active' : ''}`}
            onClick={() => setInspectorOpen(!inspectorOpen)}
            title="Inspect Retrieved Vector Chunks"
            aria-label="Toggle Chunk Inspector"
          >
            <Database size={16} />
          </button>

          <button 
            className="header-icon-btn" 
            onClick={handleClearChat}
            title="Reset Chat"
            aria-label="Clear Chat"
          >
            <RotateCcw size={15} />
          </button>

          <button 
            className="header-icon-btn" 
            onClick={onToggleViewMode}
            title={viewMode === 'floating' ? 'Switch to Studio Mode' : 'Switch to Pratham Floating Mode'}
            aria-label="Toggle Widget Dimensions"
          >
            {viewMode === 'floating' ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
          </button>

          <button 
            className="header-close-btn" 
            onClick={onClose}
            title="Close Assistant"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Secondary Filter Sub-Bar */}
      <div className="widget-subbar">
        <div className="source-filter-selector">
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Source:</span>
          <button 
            className={`filter-pill ${sourceFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSourceFilter('all')}
          >
            All Docs
          </button>
          <button 
            className={`filter-pill ${sourceFilter === 'booklet' ? 'active' : ''}`}
            onClick={() => setSourceFilter('booklet')}
          >
            PDF Booklet
          </button>
          <button 
            className={`filter-pill ${sourceFilter === 'web' ? 'active' : ''}`}
            onClick={() => setSourceFilter('web')}
          >
            Web Portal
          </button>
        </div>

        <div className="rag-health-pill">
          <span className={`rag-health-dot ${backendStatus?.isLive ? 'live' : 'local'}`}></span>
          <span>{backendStatus?.isLive ? 'Atlas Live' : 'Booklet Cache'}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="widget-body">
        <div className="chat-viewport">
          {/* Greeting Card (Pratham Dimension & Dribbble Card Style) */}
          <div className="greeting-card">
            <div className="greeting-header">
              <Sparkles size={16} style={{ color: 'var(--accent-amber)' }} />
              <span>How can I help you today?</span>
            </div>
            <p className="greeting-text">
              Ask any question about the ShED Forum's foundation, university units (AMU, Jamia, DU, JNU), academic mentorship, or community initiatives.
            </p>
            <div className="quick-chips-list">
              {starterQuestions.slice(0, 4).map((q, idx) => (
                <button 
                  key={idx} 
                  className="quick-chip-btn"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Feed */}
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <img src={avatarImg} alt="AI" className="bot-msg-avatar" />
              )}
              
              <div className="message-bubble-wrapper">
                <div className="message-bubble">
                  {/* Bot RAG Metadata Accordion */}
                  {msg.sender === 'bot' && msg.chunks && msg.chunks.length > 0 && (
                    <div>
                      <div 
                        className="rag-meta-bar"
                        onClick={() => toggleMetaExpand(msg.id)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Database size={11} />
                          Retrieved {msg.chunks.length} chunks ({msg.latencyMs || 150}ms)
                        </span>
                        {expandedMetaIds[msg.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </div>

                      {expandedMetaIds[msg.id] && (
                        <div style={{
                          fontSize: '11.5px',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          <div style={{ color: 'var(--text-dim)', marginBottom: 4 }}>
                            Top Match: {msg.chunks[0].sourceName} (Score: {Math.round((msg.chunks[0].score || 0.88) * 100)}%)
                          </div>
                          <button
                            onClick={() => {
                              setCurrentInspectorChunks(msg.chunks);
                              setInspectorOpen(true);
                            }}
                            style={{
                              color: 'var(--accent-primary)',
                              fontSize: '11px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <ExternalLink size={10} /> View All in Chunk Inspector
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conversational Query Reformulation Transparency */}
                  {msg.sender === 'bot' && msg.reformulatedQuery && (
                    <div className="reformulated-query-badge">
                      <Search size={11} style={{ flexShrink: 0 }} />
                      <span>Contextual Query: <em>"{msg.reformulatedQuery}"</em></span>
                    </div>
                  )}

                  {/* Message Body Content */}
                  <div dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n\n/g, '<br/><br/>')
                      .replace(/\n- /g, '<br/>• ')
                  }} />

                  {/* Grounded Citation Chips */}
                  {msg.sender === 'bot' && msg.sources && msg.sources.length > 0 && (
                    <div className="citations-container">
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, alignSelf: 'center' }}>
                        Sources:
                      </span>
                      {msg.sources.map((src, sIdx) => {
                        const isWeb = String(src.ref).startsWith('http');
                        const webPath = isWeb ? (String(src.ref).replace('https://theshedforum.vercel.app', '') || '/') : '';

                        return (
                          <button
                            key={sIdx}
                            className="citation-pill"
                            onClick={() => handleOpenCitation(src, msg.chunks)}
                            title={isWeb ? `Inspect Scraped Web Page: ${src.ref}` : `Inspect Booklet Page ${src.ref}`}
                          >
                            {isWeb ? <ExternalLink size={11} /> : <FileText size={11} />}
                            [{sIdx + 1}] {isWeb ? `Web: ${webPath}` : `${src.name} (p. ${src.ref})`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Message Actions Toolbar */}
                {msg.sender === 'bot' && (
                  <div className="msg-actions-bar">
                    <button 
                      className="msg-action-btn"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      title="Copy Answer"
                    >
                      {copiedId === msg.id ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>

                    <button 
                      className={`msg-action-btn ${speakingId === msg.id ? 'active' : ''}`}
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      title="Read Aloud"
                    >
                      {speakingId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>

                    {speakingId === msg.id && (
                      <div className="audio-waves-container">
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                      </div>
                    )}

                    <button 
                      className={`msg-action-btn ${feedbackGiven[msg.id] === 'up' ? 'active' : ''}`}
                      onClick={() => handleFeedback(msg.id, 'up')}
                      title="Helpful"
                    >
                      <ThumbsUp size={12} />
                    </button>

                    <button 
                      className={`msg-action-btn ${feedbackGiven[msg.id] === 'down' ? 'active' : ''}`}
                      onClick={() => handleFeedback(msg.id, 'down')}
                      title="Not helpful"
                    >
                      <ThumbsDown size={12} />
                    </button>

                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-dim)' }}>
                      {msg.timestamp}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="chat-message-row bot">
              <img src={avatarImg} alt="AI" className="bot-msg-avatar" />
              <div className="typing-bubble">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: 6 }}>
                  Retrieving vectors...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chunk Inspector Overlay */}
        <ChunkInspectorDrawer 
          isOpen={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
          chunks={currentInspectorChunks}
          activeChunkId={selectedChunkId}
        />
      </div>

      {/* Input Area (Pratham Layout with Ultra-Premium Glass Polish) */}
      <div className="widget-input-area">
        <div className="input-box-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isLoading}
          />
          <div className="input-action-buttons">
            <button 
              type="button" 
              className={`input-tool-btn ${isRecording ? 'text-red-500' : ''}`}
              onClick={toggleMic}
              title="Voice Input"
              aria-label="Voice Input"
            >
              <Mic size={15} style={{ color: isRecording ? '#f43f5e' : 'inherit' }} />
            </button>

            <button 
              type="button" 
              className="input-send-btn"
              onClick={() => handleSend()}
              disabled={isLoading || !inputVal.trim()}
              title="Send Message"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Footer Attribution (matches Pratham Zapier subtext, but ultra-premium RAG branded) */}
        <div className="widget-footer-attribution">
          <span>
            ⚡ Powered by <strong>MongoDB Atlas Vector RAG</strong>
          </span>
          <span>Google Gemini Flash</span>
        </div>
      </div>
    </div>
  );
}
