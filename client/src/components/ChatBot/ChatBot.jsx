import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatBot.module.css';

// Simple lightweight custom markdown to HTML parser to support bold, list items, headings, code, and links
function parseMarkdown(text) {
  if (!text) return '';

  let html = text;

  // Clean HTML tags first to avoid injection
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings: ### Title -> <h4>Title</h4>
  html = html.replace(/^### (.*?)$/gm, '<h4 style="margin: 12px 0 6px 0; color: #fff; font-size: 13px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 4px;">$1</h4>');
  html = html.replace(/^## (.*?)$/gm, '<h3 style="margin: 16px 0 8px 0; color: #fff; font-size: 14px; font-weight: 800;">$1</h3>');
  html = html.replace(/^# (.*?)$/gm, '<h2 style="margin: 20px 0 10px 0; color: #fff; font-size: 15px; font-weight: 800;">$1</h2>');

  // Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Inline code: `text` -> <code>text</code>
  html = html.replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #00f2fe;">$1</code>');

  // Bullet items: * item -> <li>item</li>
  const lines = html.split('\n');
  let inList = false;
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const itemContent = trimmed.substring(2);
      if (!inList) {
        inList = true;
        return `<ul style="margin: 6px 0 10px 18px; padding: 0; list-style-type: disc;"><li style="margin-bottom: 4px;">${itemContent}</li>`;
      }
      return `<li style="margin-bottom: 4px;">${itemContent}</li>`;
    } else if (trimmed.match(/^\d+\.\s/)) {
      const itemContent = trimmed.replace(/^\d+\.\s/, '');
      if (!inList) {
        inList = true;
        return `<ol style="margin: 6px 0 10px 18px; padding: 0;"><li style="margin-bottom: 4px;">${itemContent}</li>`;
      }
      return `<li style="margin-bottom: 4px;">${itemContent}</li>`;
    } else {
      if (inList) {
        inList = false;
        return `</ul>${line}`;
      }
      return line;
    }
  });

  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');

  // Links: [text](url) -> <a href="url" target="_blank" rel="noopener noreferrer">text</a>
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #00f2fe; text-decoration: underline;">$1</a>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p style="margin-bottom: 8px;">');
  html = html.replace(/\n/g, '<br />');

  return `<p style="margin: 0; padding: 0;">${html}</p>`;
}

function getDeviceMeta() {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // Device determination
  const width = window.innerWidth;
  if (width < 768) {
    device = 'Mobile';
  } else if (width >= 768 && width <= 1024) {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }

  // OS detection
  if (userAgent.indexOf('Win') !== -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') !== -1) os = 'MacOS';
  else if (userAgent.indexOf('X11') !== -1) os = 'UNIX';
  else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';

  // Browser detection
  if (userAgent.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (userAgent.indexOf('Safari') !== -1) browser = 'Safari';
  else if (userAgent.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (userAgent.indexOf('MSIE') !== -1 || !!document.documentMode === true) browser = 'IE';
  else if (userAgent.indexOf('Edge') !== -1) browser = 'Edge';

  return { 
    device, 
    browser, 
    os,
    screenResolution: `${window.screen.width || 0}x${window.screen.height || 0}`,
    locale: navigator.language || navigator.userLanguage || 'Unknown',
    referrer: document.referrer || 'Direct',
    currentPage: window.location.pathname || '/',
    userAgent: navigator.userAgent
  };
}

// Restores state from sessionStorage or initializes fresh values if expired (after 30 mins)
function getInitialSessionData() {
  try {
    const stored = sessionStorage.getItem('portfolio_chatbot_session');
    if (stored) {
      const { sessionId, messages, lastActive } = JSON.parse(stored);
      // 30 minutes session expiration limit
      if (Date.now() - lastActive < 1800000) {
        return { sessionId, messages };
      }
    }
  } catch (e) {
    console.error('Failed to parse chatbot session:', e);
  }

  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const defaultMessages = [
    {
      role: 'bot',
      content: "Hello! 👋 I'm Dhruv's AI Portfolio Assistant.\n\nAsk me anything about his skills, experience, projects, or how to download his resume!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];
  return { sessionId: newSessionId, messages: defaultMessages };
}

export default function ChatBot({ aboutData }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use state initializer function to avoid race conditions or empty IDs on mount
  const [initialSession] = useState(() => getInitialSessionData());
  const [messages, setMessages] = useState(initialSession.messages);
  const [sessionId, setSessionId] = useState(initialSession.sessionId);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "What are Dhruv's skills?",
    "Tell me about his projects",
    "How can I contact him?"
  ]);

  const messagesEndRef = useRef(null);

  // Synchronize changes to sessionStorage and cleanup legacy localStorage key
  useEffect(() => {
    localStorage.removeItem('portfolio_chatbot_session_id');
  }, []);

  useEffect(() => {
    if (sessionId) {
      try {
        sessionStorage.setItem('portfolio_chatbot_session', JSON.stringify({
          sessionId,
          messages,
          lastActive: Date.now()
        }));
      } catch (e) {
        console.error('Failed to write chatbot session state:', e);
      }
    }
  }, [messages, sessionId]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  // Toggle chat widget
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Download resume trigger
  const handleDownloadResume = () => {
    const link = document.createElement('a');
    const cvUrl = aboutData?.resumeUrl || '/resume/DhruvPatel_Resume.pdf';
    link.href = cvUrl;
    link.download = cvUrl.split('/').pop() || 'DhruvPatel_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send message
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSuggestions([]);
    setIsTyping(true);

    try {
      // Gather chat history (excluding welcome message if wanted, or pass all)
      const history = messages
        .filter(m => m.role !== 'bot' || m.content.indexOf("Hello!") === -1)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Call Express backend endpoint /api/chat
      let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      apiBaseUrl = apiBaseUrl.trim().replace(/\/$/, '');
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history,
          sessionId,
          deviceMeta: getDeviceMeta()
        })
      });


      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();

      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setSuggestions(data.suggestions || []);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Oops! I had trouble connecting to the backend. Please check if the backend server is running on port 3001, or try again later.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setSuggestions(["What are Dhruv's skills?", "Tell me about his projects"]);
    }
  };

  // Handle key press (Enter)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle suggestion chip click
  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        className={`${styles.chatToggle} ${isOpen ? styles.chatToggleActive : ''}`} 
        onClick={toggleChat}
        title="Chat with Dhruv's AI Assistant"
      >
        {isOpen ? (
          <span className={styles.toggleIcon}>
            <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        ) : (
          <span className={styles.toggleIcon}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="26" width="26" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
        )}
      </button>

      {/* Chat Widget Window */}
      {isOpen && (
        <div className={styles.chatContainer} data-lenis-prevent>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.botAvatar}>DP</div>
              <div className={styles.botTitle}>
                <span className={styles.botName}>AI Portfolio Assistant</span>
                <span className={styles.botStatus}>
                  <span className={styles.statusDot}></span> Online
                </span>
              </div>
            </div>
            
            <div className={styles.headerActions}>
              {/* Download Resume Button */}
              <button 
                className={styles.actionBtn} 
                onClick={handleDownloadResume} 
                title="Download Resume PDF"
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
              
              {/* Close Button */}
              <button 
                className={styles.actionBtn} 
                onClick={toggleChat} 
                title="Minimize Chat"
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className={styles.messagesArea}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageBot}`}
              >
                <div 
                  className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot}`}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                />
                <span className={styles.messageTime}>{msg.timestamp}</span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className={`${styles.message} ${styles.messageBot}`}>
                <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                  <div className={styles.typingIndicator}>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Chips */}
          {suggestions.length > 0 && (
            <div className={styles.suggestionsContainer}>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className={styles.suggestionChip}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className={styles.chatInputContainer}>
            <div className={styles.chatForm}>
              <input
                type="text"
                className={styles.chatInput}
                placeholder="Ask something about Dhruv..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isTyping}
              />
              <button 
                className={styles.sendBtn} 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping}
                title="Send Message"
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
