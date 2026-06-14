import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';

export const ChatPanel = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hello! I'm your AI assistant for the IDEMI Dashboard. You can ask me questions about the applications, courses, or demographics." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'model', content: "Error: `VITE_GEMINI_API_KEY` is not set in your environment variables. Please add it to a `.env` file to enable chat." }]);
        setLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      // Prepare context from data
      const dataContext = JSON.stringify(data.map(d => ({
        name: d.name,
        gender: d.gender,
        course: d.course,
        date: d.timestamp,
        caste: d.caste
      })));

      const systemInstruction = `You are a helpful data assistant for the IDEMI AICTE Diploma Dashboard.
Here is the current application data in JSON format: ${dataContext}
Answer the user's questions based ONLY on this data. Be concise and helpful.`;

      // Construct history for multi-turn
      const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.1
        }
      });

      setMessages(prev => [...prev, { role: 'model', content: response.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error while processing your request." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)} title="Ask AI">
          <MessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className="chat-panel glass-panel">
          <div className="chat-header">
            <div className="chat-title">
              <MessageSquare size={18} />
              <h3>Gemini Analytics</h3>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="message-bubble">
                  {msg.role === 'model' ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message model">
                <div className="message-bubble loading-bubble">
                  <Loader2 className="spinner" size={16} /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the data..."
              disabled={loading}
              className="chat-input"
            />
            <button type="submit" disabled={!input.trim() || loading} className="chat-send-btn">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
