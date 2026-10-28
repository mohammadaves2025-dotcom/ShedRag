import React from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Sun, 
  Moon, 
  Zap, 
  Database, 
  ShieldCheck, 
  BookOpen, 
  Users, 
  Layers, 
  ArrowRight,
  GraduationCap,
  ExternalLink
} from 'lucide-react';
import heroBanner from '../assets/hero_banner.jpg';

export default function HostPage({ 
  onOpenChatbot, 
  onSelectPrompt, 
  currentTheme, 
  onToggleTheme,
  backendStatus 
}) {
  const samplePrompts = [
    { text: "When was the ShED Forum established?", label: "History" },
    { text: "Tell me about free CUET 2026 coaching", label: "Scraped Web" },
    { text: "What are the 7 university campus units?", label: "Scraped Web" },
    { text: "What is the SCG Centre in Delhi?", label: "Scraped Web" },
    { text: "About how many students are in the Jamia unit?", label: "Statistics" },
    { text: "Why was International Women's Day chosen as Foundation Day?", label: "Philosophy" },
    { text: "What is the admission fee?", label: "Grounding Test" }
  ];

  return (
    <div className="host-container">
      {/* Top Navbar */}
      <header className="host-navbar">
        <a href="#home" className="nav-brand">
          <div className="nav-logo-icon">
            <GraduationCap size={22} />
          </div>
          <div className="nav-brand-text">
            <h1>
              ShED Forum
              <span className="badge-tag badge-rag-online">
                <span className="rag-health-dot live" style={{ display: 'inline-block' }}></span>
                {backendStatus?.isLive ? 'Atlas Live' : 'RAG Grounded'}
              </span>
            </h1>
            <p>Educational Dialogue & Higher Learning</p>
          </div>
        </a>

        <ul className="nav-links">
          <li><a href="#about" className="nav-link-item">About Us</a></li>
          <li><a href="#programs" className="nav-link-item">Programs</a></li>
          <li><a href="#units" className="nav-link-item">University Units</a></li>
          <li><a href="#architecture" className="nav-link-item">Vector Pipeline</a></li>
          <li><a href="#contact" className="nav-link-item">Contact</a></li>
        </ul>

        <div className="nav-actions">
          <button 
            className="theme-selector-btn"
            onClick={onToggleTheme}
            title="Switch Theme (Obsidian / Pratham Warm / Cyber)"
          >
            {currentTheme === 'pratham' ? <Sun size={15} style={{ color: '#d97706' }} /> : <Moon size={15} />}
            <span style={{ textTransform: 'capitalize' }}>{currentTheme}</span>
          </button>

          <button 
            className="btn-open-chatbot"
            onClick={() => onOpenChatbot()}
          >
            <MessageSquare size={16} />
            <span>Open AI Assistant</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-left">
          <div className="hero-badge-pill">
            <Sparkles size={14} />
            <span>Ultra-Premium RAG • Pratham Dimension Dock</span>
          </div>

          <h1 className="hero-title">
            Empowering Communities Through <span className="hero-title-highlight">Higher Education</span> & Guided Dialogue
          </h1>

          <p className="hero-description">
            The ShED Forum (Shershahbadi Educational Dialogue Forum) bridges educational inequality through university guidance, student mentorship, and community-led initiatives across major institutions.
          </p>

          <div className="hero-stats-row">
            <div className="hero-stat-card">
              <div className="stat-number">2018</div>
              <div className="stat-label">Foundation Year</div>
            </div>
            <div className="hero-stat-card">
              <div className="stat-number">120+</div>
              <div className="stat-label">Jamia Unit Students</div>
            </div>
            <div className="hero-stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">Vector Grounded</div>
            </div>
          </div>

          {/* Interactive Prompt Starter Strip */}
          <div className="prompt-chips-container">
            <div className="prompt-chips-title">
              <Zap size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>Ask the Grounded Assistant (Instant Retrieval):</span>
            </div>
            <div className="prompt-chips-grid">
              {samplePrompts.map((p, i) => (
                <button 
                  key={i} 
                  className="prompt-starter-chip"
                  onClick={() => onSelectPrompt(p.text)}
                  title={`Test query: ${p.text}`}
                >
                  <span>{p.text}</span>
                  <ArrowRight size={12} style={{ opacity: 0.6 }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Right Visual Banner */}
        <div className="hero-media-wrapper">
          <img src={heroBanner} alt="Students studying with holographic knowledge graphs" className="hero-banner-img" />
          <div className="hero-overlay-card">
            <div className="hero-overlay-text">
              <h4>Official ShED Knowledge Base</h4>
              <p>Indexed via LangChain, MongoDB Atlas & Gemini Flash</p>
            </div>
            <button 
              className="btn-open-chatbot"
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => onOpenChatbot()}
            >
              <span>Ask AI</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* RAG Vector Architecture Showcase */}
      <section className="architecture-section" id="architecture">
        <div className="section-header">
          <h2>State-Of-The-Art Vector RAG Architecture</h2>
          <p>Every answer is rigorously grounded with source citations, page numbers, and similarity metrics.</p>
        </div>

        <div className="pipeline-cards-grid">
          <div className="pipeline-step-card glass-card">
            <span className="pipeline-step-number">01</span>
            <div className="pipeline-icon-box">
              <BookOpen size={20} />
            </div>
            <h3>Knowledge Ingestion</h3>
            <p>PDF booklets and web pages parsed, cleaned, and split into contextual token chunks with metadata preservation.</p>
          </div>

          <div className="pipeline-step-card glass-card">
            <span className="pipeline-step-number">02</span>
            <div className="pipeline-icon-box">
              <Layers size={20} />
            </div>
            <h3>Dense Embeddings</h3>
            <p>768-dimensional embeddings generated with Google's <code>gemini-embedding-001</code> for deep semantic similarity.</p>
          </div>

          <div className="pipeline-step-card glass-card">
            <span className="pipeline-step-number">03</span>
            <div className="pipeline-icon-box">
              <Database size={20} />
            </div>
            <h3>MongoDB Vector Search</h3>
            <p>Cosine distance vector indexing in MongoDB Atlas with dynamic top-K candidates retrieval in &lt;150ms.</p>
          </div>

          <div className="pipeline-step-card glass-card">
            <span className="pipeline-step-number">04</span>
            <div className="pipeline-icon-box">
              <ShieldCheck size={20} />
            </div>
            <h3>Zero Hallucination LLM</h3>
            <p>Gemini 3.5 Flash synthesizes factual answers restricted strictly to retrieved context, with interactive source citations.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
