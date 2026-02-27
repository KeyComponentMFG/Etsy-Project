import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../../lib/analyticsApi';

// Simple markdown-like text formatter (safe — no dangerouslySetInnerHTML)
function formatMessage(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];

  const hasTableData = lines.some(line =>
    (line.match(/\$/g) || []).length >= 3 ||
    (line.match(/\s{2,}/g) || []).length >= 2
  );

  lines.forEach((line, i) => {
    const isListItem = line.trim().startsWith('- ');
    const lineContent = isListItem ? line.substring(line.indexOf('- ') + 2) : line;
    const isDataLine = (line.match(/\$/g) || []).length >= 2;

    // Parse **bold** segments into safe React elements
    const parts = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = boldRegex.exec(lineContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`${i}-${lastIndex}`}>{lineContent.slice(lastIndex, match.index)}</span>);
      }
      parts.push(
        <strong key={`${i}-b-${match.index}`} style={{ color: '#60a5fa', fontWeight: 600 }}>
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < lineContent.length) {
      parts.push(<span key={`${i}-${lastIndex}`}>{lineContent.slice(lastIndex)}</span>);
    }
    if (parts.length === 0) {
      parts.push(<span key={`${i}-empty`}>{'\u00A0'}</span>);
    }

    elements.push(
      <div
        key={i}
        style={{
          paddingLeft: isListItem ? '8px' : '0',
          minHeight: line.trim() === '' ? '8px' : 'auto',
          fontFamily: isDataLine || hasTableData ? "'JetBrains Mono', 'Courier New', monospace" : 'inherit',
          fontSize: isDataLine ? '12px' : 'inherit',
          whiteSpace: isDataLine ? 'pre' : 'normal',
          overflowX: isDataLine ? 'auto' : 'visible',
        }}
      >
        {isListItem && <span style={{ color: '#60a5fa', marginRight: '6px' }}>•</span>}
        {parts}
      </div>
    );
  });

  return elements;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your business assistant. Ask me anything about your Etsy shop - profits, shipping, products, trends, and more!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userMessage, messages);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "How's my business doing?",
    "What's my profit?",
    "Best selling products?",
    "Monthly breakdown",
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const styles = {
    floatingButton: {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      transition: 'all 0.3s ease',
    },
    chatWindow: {
      position: 'fixed',
      bottom: '96px',
      right: '24px',
      width: '380px',
      maxWidth: 'calc(100vw - 48px)',
      height: '500px',
      maxHeight: 'calc(100vh - 128px)',
      backgroundColor: '#0f172a',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      border: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      overflow: 'hidden',
    },
    header: {
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    headerIcon: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      margin: 0,
    },
    headerSubtitle: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '12px',
      margin: 0,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    messageRow: (isUser) => ({
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }),
    messageBubble: (isUser) => ({
      maxWidth: '85%',
      padding: '10px 14px',
      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      backgroundColor: isUser ? '#2563eb' : '#1e293b',
      color: isUser ? 'white' : '#e2e8f0',
      fontSize: '14px',
      lineHeight: '1.5',
    }),
    loadingDots: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 0',
    },
    dot: (delay) => ({
      width: '8px',
      height: '8px',
      backgroundColor: '#60a5fa',
      borderRadius: '50%',
      animation: 'bounce 1s infinite',
      animationDelay: delay,
    }),
    quickQuestionsContainer: {
      padding: '0 16px 8px 16px',
    },
    quickQuestionsWrapper: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    },
    quickQuestionButton: {
      fontSize: '12px',
      padding: '6px 12px',
      borderRadius: '16px',
      backgroundColor: '#1e293b',
      color: '#94a3b8',
      border: '1px solid #334155',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    inputContainer: {
      padding: '16px',
      borderTop: '1px solid #334155',
    },
    inputWrapper: {
      display: 'flex',
      gap: '8px',
    },
    input: {
      flex: 1,
      backgroundColor: '#1e293b',
      color: 'white',
      padding: '10px 14px',
      borderRadius: '12px',
      border: '1px solid #334155',
      fontSize: '14px',
      outline: 'none',
    },
    sendButton: {
      padding: '10px 14px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s ease',
    },
  };

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .chat-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(59, 130, 246, 0.5);
        }
        .quick-q:hover {
          background-color: #334155 !important;
          color: white !important;
        }
        .send-btn:hover:not(:disabled) {
          background-color: #1d4ed8 !important;
        }
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .chat-input:focus {
          border-color: #3b82f6 !important;
        }
      `}</style>

      {/* Floating Chat Button */}
      <button
        className="chat-button"
        onClick={() => setIsOpen(!isOpen)}
        style={styles.floatingButton}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.headerIcon}>
                <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 style={styles.headerTitle}>Business Assistant</h3>
                <p style={styles.headerSubtitle}>Ask me anything</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={styles.closeButton}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messagesContainer}>
            {messages.map((message, index) => (
              <div key={index} style={styles.messageRow(message.role === 'user')}>
                <div style={styles.messageBubble(message.role === 'user')}>
                  {message.role === 'assistant' ? (
                    <div>{formatMessage(message.content)}</div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={styles.messageRow(false)}>
                <div style={styles.messageBubble(false)}>
                  <div style={styles.loadingDots}>
                    <div style={styles.dot('0ms')} />
                    <div style={styles.dot('150ms')} />
                    <div style={styles.dot('300ms')} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div style={styles.quickQuestionsContainer}>
              <div style={styles.quickQuestionsWrapper}>
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="quick-q"
                    onClick={() => handleQuickQuestion(question)}
                    style={styles.quickQuestionButton}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} style={styles.inputContainer}>
            <div style={styles.inputWrapper}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your business..."
                className="chat-input"
                style={styles.input}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="send-btn"
                style={styles.sendButton}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
