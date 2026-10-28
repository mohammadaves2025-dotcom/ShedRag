import React from 'react';
import { Sparkles } from 'lucide-react';
import avatarImg from '../assets/rag_avatar.jpg';

export default function FloatingLauncher({ isOpen, onClick, backendStatus }) {
  if (isOpen) return null;

  return (
    <button 
      className="floating-launcher-pill animate-fade-in"
      onClick={onClick}
      title="Open ShED AI Assistant"
      aria-label="Open Chatbot"
    >
      <img src={avatarImg} alt="ShED Avatar" className="launcher-avatar" />
      <span>Chat with ShED AI</span>
      <span className="launcher-pulse-dot" title="Knowledge Base Active"></span>
      <Sparkles size={14} style={{ color: '#f59e0b', marginLeft: 2 }} />
    </button>
  );
}
