import React, { useState, useEffect } from 'react';
import HostPage from './components/HostPage';
import ChatbotWidget from './components/ChatbotWidget';
import FloatingLauncher from './components/FloatingLauncher';
import { checkBackendHealth } from './services/ragService';
import './App.css';

function App() {
  const [theme, setTheme] = useState('obsidian'); // 'obsidian' | 'pratham' | 'cyber'
  const [isChatbotOpen, setIsChatbotOpen] = useState(true);
  const [viewMode, setViewMode] = useState('floating'); // 'floating' | 'docked' | 'expanded'
  const [initialQuery, setInitialQuery] = useState('');
  const [backendStatus, setBackendStatus] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Apply theme data attribute to root html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Check health of backend on mount
  useEffect(() => {
    checkBackendHealth().then(status => {
      setBackendStatus(status);
    });
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => {
      if (prev === 'obsidian') return 'pratham';
      if (prev === 'pratham') return 'cyber';
      return 'obsidian';
    });
  };

  const handleSelectPrompt = (promptText) => {
    setIsChatbotOpen(true);
    setInitialQuery(promptText);
  };

  const handleToggleViewMode = () => {
    setViewMode(prev => {
      if (prev === 'floating') return 'expanded';
      if (prev === 'expanded') return 'docked';
      return 'floating';
    });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  return (
    <>
      <HostPage 
        onOpenChatbot={() => setIsChatbotOpen(true)}
        onSelectPrompt={handleSelectPrompt}
        currentTheme={theme}
        onToggleTheme={handleToggleTheme}
        backendStatus={backendStatus}
      />

      <ChatbotWidget 
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        backendStatus={backendStatus}
        initialQuery={initialQuery}
        onShowToast={showToast}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
      />

      <FloatingLauncher 
        isOpen={isChatbotOpen}
        onClick={() => setIsChatbotOpen(true)}
        backendStatus={backendStatus}
      />

      {/* Floating feedback toast */}
      {toastMessage && (
        <div className="toast-feedback animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}

export default App;
