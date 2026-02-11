'use client';
import { logger } from '@/lib/logger';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Window from './Window';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'ai' | 'database' | 'offline' | 'error';
}

interface ClippyChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClippyChat({ isOpen, onClose }: ClippyChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Cześć! Jestem Clippy, Twój asystent AI od KUPMAX! 📎\n\nMogę Ci pomóc z:\n• Informacjami o produktach\n• Nawigacją po stronie\n• Odpowiedziami na pytania\n• I wieloma innymi rzeczami!\n\nO co chcesz zapytać?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        source: data.source || 'ai',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      logger.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <Window
      title="Clippy Assistant - Microsoft Agent"
      icon="📎"
      width="500px"
      height="600px"
      x={window.innerWidth - 550}
      y={100}
      onClose={onClose}
    >
      <div className="flex flex-col h-full bg-white">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-2 flex items-center gap-2">
          <span className="text-2xl">📎</span>
          <div>
            <div className="font-bold text-sm">Clippy Assistant</div>
            <div className="text-xs opacity-90">KUPMAX Helper</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                  📎
                </div>
              )}
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-black border-2 border-gray-400'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                <div
                  className={`text-xs mt-1 flex items-center gap-2 ${
                    msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  <span>{msg.timestamp.toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</span>
                  {msg.role === 'assistant' && msg.source && (
                    <span className={`px-1 rounded text-[10px] ${
                      msg.source === 'ai' ? 'bg-green-200 text-green-800' :
                      msg.source === 'database' ? 'bg-blue-200 text-blue-800' :
                      msg.source === 'offline' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {msg.source === 'ai' ? '🤖 AI' :
                       msg.source === 'database' ? '💾 DB' :
                       msg.source === 'offline' ? '📎 Offline' : '⚠️'}
                    </span>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                  U
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              className="flex gap-2 justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                📎
              </div>
              <div className="bg-gray-200 text-black border-2 border-gray-400 p-3 rounded-lg">
                <div className="flex gap-1">
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  >
                    •
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  >
                    •
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  >
                    •
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-gray-400 p-3 bg-[#c0c0c0]">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Wpisz wiadomość..."
              className="flex-1 border-2 border-gray-400 px-2 py-1 text-sm"
              disabled={isLoading}
            />
            <button
              className="win95-button px-4"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              Wyślij
            </button>
          </div>
          <div className="text-xs text-gray-600 mt-2 text-center">
            💡 Tip: Naciśnij Enter żeby wysłać wiadomość
          </div>
        </div>
      </div>
    </Window>
  );
}
