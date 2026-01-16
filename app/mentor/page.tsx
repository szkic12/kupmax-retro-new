'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface ValidationResult {
  status: 'outdated' | 'current' | 'warning';
  issues: Array<{
    type: string;
    description: string;
    oldCode: string;
    newCode: string;
    explanation: string;
  }>;
  updatedCode: string;
  summary: string;
  learningPoints: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function MentorPage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [framework, setFramework] = useState('react');
  const [courseSource, setCourseSource] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'input' | 'result' | 'learn'>('chat');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension for language detection
    const ext = file.name.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, { lang: string; fw: string }> = {
      'js': { lang: 'javascript', fw: 'none' },
      'jsx': { lang: 'javascript', fw: 'react' },
      'ts': { lang: 'typescript', fw: 'none' },
      'tsx': { lang: 'typescript', fw: 'react' },
      'py': { lang: 'python', fw: 'none' },
      'php': { lang: 'php', fw: 'none' },
      'java': { lang: 'java', fw: 'none' },
      'cs': { lang: 'csharp', fw: 'none' },
      'vue': { lang: 'javascript', fw: 'vue' },
    };

    if (ext && languageMap[ext]) {
      setLanguage(languageMap[ext].lang);
      setFramework(languageMap[ext].fw);
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
    };
    reader.readAsText(file);
  };

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `**Witaj w KUPMAX Mentor!**

Jestem Twoim asystentem do nauki programowania. Mogę pomóc Ci z:

- Wyjaśnieniem konceptów programistycznych
- React, Next.js, TypeScript
- Supabase, bazy danych
- Git i kontrola wersji
- I wiele więcej!

**Zadaj mi pytanie lub użyj zakładki "Walidator Kodu" aby sprawdzić kod z kursu!**`,
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          history: chatMessages
        })
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || 'Przepraszam, nie mogłem wygenerować odpowiedzi.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.',
        timestamp: new Date()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    setActiveTab('result');

    try {
      const response = await fetch('/api/mentor/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          framework,
          courseSource
        })
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error analyzing code:', error);
      setResult({
        status: 'warning',
        issues: [],
        updatedCode: code,
        summary: 'Nie udało się przeanalizować kodu. Spróbuj ponownie.',
        learningPoints: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'outdated': return '#dc2626';
      case 'current': return '#22c55e';
      case 'warning': return '#f59e0b';
      default: return '#808080';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'outdated': return 'PRZESTARZALY';
      case 'current': return 'AKTUALNY';
      case 'warning': return 'WYMAGA UWAGI';
      default: return 'NIEZNANY';
    }
  };

  // Simple markdown-like formatting
  const formatMessage = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        // Bold
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Code blocks
        line = line.replace(/`([^`]+)`/g, '<code style="background:#1e1e1e;color:#d4d4d4;padding:2px 4px;font-size:12px;">$1</code>');
        // Lists
        if (line.startsWith('- ')) {
          return `<div style="margin-left:16px;">• ${line.substring(2)}</div>`;
        }
        return line;
      })
      .join('<br/>');
  };

  return (
    <div className="min-h-screen" style={{ background: '#008080' }}>
      {/* Windows 98 Desktop */}
      <div className="p-4">
        {/* Main Window */}
        <div
          className="win95-window mx-auto"
          style={{ maxWidth: '1200px', minHeight: '80vh' }}
        >
          {/* Title Bar */}
          <div
            className="flex justify-between items-center px-2 py-1 text-white text-sm font-bold"
            style={{
              background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)'
            }}
          >
            <div className="flex items-center gap-2">
              <span>🎓</span>
              <span>Mentor.exe - Asystent Nauki Programowania</span>
            </div>
            <div className="flex gap-1">
              <Link href="/">
                <button
                  className="w-5 h-5 flex items-center justify-center text-black font-bold text-xs"
                  style={{
                    background: '#c0c0c0',
                    border: '2px solid',
                    borderColor: '#fff #000 #000 #fff'
                  }}
                >
                  x
                </button>
              </Link>
            </div>
          </div>

          {/* Menu Bar */}
          <div
            className="flex gap-4 px-2 py-1 text-sm"
            style={{ background: '#c0c0c0', borderBottom: '1px solid #808080' }}
          >
            <span className="cursor-pointer hover:underline">Plik</span>
            <span className="cursor-pointer hover:underline">Edycja</span>
            <span className="cursor-pointer hover:underline">Narzedzia</span>
            <span className="cursor-pointer hover:underline">Pomoc</span>
          </div>

          {/* Toolbar */}
          <div
            className="flex gap-2 px-2 py-2 flex-wrap"
            style={{ background: '#c0c0c0', borderBottom: '2px solid #808080' }}
          >
            <button
              onClick={() => setActiveTab('chat')}
              className="px-3 py-1 text-sm font-bold"
              style={{
                background: activeTab === 'chat' ? '#000080' : '#c0c0c0',
                color: activeTab === 'chat' ? '#fff' : '#000',
                border: '2px solid',
                borderColor: activeTab === 'chat' ? '#000 #fff #fff #000' : '#fff #000 #000 #fff'
              }}
            >
              💬 Chat z Mentorem
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className="px-3 py-1 text-sm font-bold"
              style={{
                background: activeTab === 'input' ? '#000080' : '#c0c0c0',
                color: activeTab === 'input' ? '#fff' : '#000',
                border: '2px solid',
                borderColor: activeTab === 'input' ? '#000 #fff #fff #000' : '#fff #000 #000 #fff'
              }}
            >
              📝 Walidator Kodu
            </button>
            <button
              onClick={() => setActiveTab('result')}
              className="px-3 py-1 text-sm font-bold"
              style={{
                background: activeTab === 'result' ? '#000080' : '#c0c0c0',
                color: activeTab === 'result' ? '#fff' : '#000',
                border: '2px solid',
                borderColor: activeTab === 'result' ? '#000 #fff #fff #000' : '#fff #000 #000 #fff'
              }}
            >
              🔍 Wyniki
            </button>
            <button
              onClick={() => setActiveTab('learn')}
              className="px-3 py-1 text-sm font-bold"
              style={{
                background: activeTab === 'learn' ? '#000080' : '#c0c0c0',
                color: activeTab === 'learn' ? '#fff' : '#000',
                border: '2px solid',
                borderColor: activeTab === 'learn' ? '#000 #fff #fff #000' : '#fff #000 #000 #fff'
              }}
            >
              📚 Nauka
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4" style={{ background: '#c0c0c0', minHeight: '60vh' }}>

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full" style={{ minHeight: '55vh' }}>
                {/* Chat Messages */}
                <div
                  className="flex-1 overflow-y-auto p-3 space-y-3"
                  style={{
                    background: '#fff',
                    border: '2px solid',
                    borderColor: '#808080 #fff #fff #808080',
                    maxHeight: '45vh'
                  }}
                >
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[80%] p-3"
                        style={{
                          background: msg.role === 'user' ? '#000080' : '#f0f0f0',
                          color: msg.role === 'user' ? '#fff' : '#000',
                          border: '2px solid',
                          borderColor: msg.role === 'user'
                            ? '#1084d0 #000050 #000050 #1084d0'
                            : '#fff #808080 #808080 #fff'
                        }}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-300">
                            <span>🎓</span>
                            <span className="font-bold text-sm">Mentor</span>
                          </div>
                        )}
                        <div
                          className="text-sm whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                        />
                        <div className="text-xs mt-2 opacity-60">
                          {msg.timestamp.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div
                        className="p-3"
                        style={{
                          background: '#f0f0f0',
                          border: '2px solid',
                          borderColor: '#fff #808080 #808080 #fff'
                        }}
                      >
                        <span className="animate-pulse">Mentor pisze...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Zadaj pytanie o programowanie..."
                    className="flex-1 px-3 py-2 text-sm"
                    style={{
                      background: '#fff',
                      border: '2px solid',
                      borderColor: '#808080 #fff #fff #808080'
                    }}
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isSending}
                    className="px-4 py-2 font-bold"
                    style={{
                      background: chatInput.trim() && !isSending ? '#000080' : '#808080',
                      color: '#fff',
                      border: '2px solid',
                      borderColor: '#fff #000 #000 #fff',
                      cursor: chatInput.trim() && !isSending ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Wyslij
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setChatInput('Jak dziala useEffect?')}
                    className="px-2 py-1 text-xs"
                    style={{
                      background: '#e0e0e0',
                      border: '1px solid #808080'
                    }}
                  >
                    useEffect
                  </button>
                  <button
                    onClick={() => setChatInput('Wyjasni App Router w Next.js')}
                    className="px-2 py-1 text-xs"
                    style={{
                      background: '#e0e0e0',
                      border: '1px solid #808080'
                    }}
                  >
                    Next.js App Router
                  </button>
                  <button
                    onClick={() => setChatInput('Jak uzywac async/await?')}
                    className="px-2 py-1 text-xs"
                    style={{
                      background: '#e0e0e0',
                      border: '1px solid #808080'
                    }}
                  >
                    async/await
                  </button>
                  <button
                    onClick={() => setChatInput('Podstawy TypeScript')}
                    className="px-2 py-1 text-xs"
                    style={{
                      background: '#e0e0e0',
                      border: '1px solid #808080'
                    }}
                  >
                    TypeScript
                  </button>
                  <button
                    onClick={() => setChatInput('Jak uzywac Supabase?')}
                    className="px-2 py-1 text-xs"
                    style={{
                      background: '#e0e0e0',
                      border: '1px solid #808080'
                    }}
                  >
                    Supabase
                  </button>
                </div>
              </div>
            )}

            {/* INPUT TAB */}
            {activeTab === 'input' && (
              <div className="space-y-4">
                {/* Header Info */}
                <div
                  className="p-3"
                  style={{
                    background: '#ffffcc',
                    border: '2px solid',
                    borderColor: '#808080 #fff #fff #808080'
                  }}
                >
                  <p className="text-sm">
                    <strong>💡 Walidator Kodu z Kursow</strong><br/>
                    Wklej kod z kursu/tutorialu, ktory nie dziala lub moze byc przestarzaly.
                    System przeanalizuje go i poda zaktualizowana wersje z wyjasnieniem zmian.
                  </p>
                </div>

                {/* Settings Row */}
                <div className="flex gap-4 flex-wrap">
                  {/* Language Select */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold">Jezyk:</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="px-2 py-1 text-sm"
                      style={{
                        background: '#fff',
                        border: '2px solid',
                        borderColor: '#808080 #fff #fff #808080'
                      }}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="csharp">C#</option>
                      <option value="php">PHP</option>
                    </select>
                  </div>

                  {/* Framework Select */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold">Framework:</label>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      className="px-2 py-1 text-sm"
                      style={{
                        background: '#fff',
                        border: '2px solid',
                        borderColor: '#808080 #fff #fff #808080'
                      }}
                    >
                      <option value="react">React</option>
                      <option value="nextjs">Next.js</option>
                      <option value="vue">Vue.js</option>
                      <option value="angular">Angular</option>
                      <option value="express">Express.js</option>
                      <option value="django">Django</option>
                      <option value="fastapi">FastAPI</option>
                      <option value="flask">Flask</option>
                      <option value="spring">Spring Boot</option>
                      <option value="laravel">Laravel</option>
                      <option value="none">Brak / Vanilla</option>
                    </select>
                  </div>
                </div>

                {/* Course Source */}
                <div>
                  <label className="text-sm font-bold block mb-1">
                    Zrodlo kursu (opcjonalne):
                  </label>
                  <input
                    type="text"
                    value={courseSource}
                    onChange={(e) => setCourseSource(e.target.value)}
                    placeholder="np. Udemy - React Complete Guide 2023, YouTube - Traversy Media"
                    className="w-full px-2 py-1 text-sm"
                    style={{
                      background: '#fff',
                      border: '2px solid',
                      borderColor: '#808080 #fff #fff #808080'
                    }}
                  />
                </div>

                {/* File Upload */}
                <div
                  className="p-4 text-center"
                  style={{
                    background: '#e0e0ff',
                    border: '2px dashed #000080',
                    borderRadius: '4px'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".js,.jsx,.ts,.tsx,.py,.php,.java,.cs,.vue,.html,.css"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 font-bold text-white"
                    style={{
                      background: '#000080',
                      border: '2px solid',
                      borderColor: '#fff #000 #000 #fff'
                    }}
                  >
                    📁 Wgraj plik z kodem
                  </button>
                  <p className="text-xs mt-2 text-gray-600">
                    Obsługiwane: .js, .jsx, .ts, .tsx, .py, .php, .java, .cs, .vue
                  </p>
                  {fileName && (
                    <div className="mt-2 text-sm font-bold text-green-700">
                      ✅ Wgrano: {fileName}
                    </div>
                  )}
                </div>

                <div className="text-center text-sm text-gray-600 font-bold">
                  — lub wklej kod recznie —
                </div>

                {/* Code Input */}
                <div>
                  <label className="text-sm font-bold block mb-1">
                    Kod z kursu/tutorialu:
                  </label>
                  <textarea
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setFileName(null); }}
                    placeholder={`// Wklej tutaj kod z kursu, ktory nie dziala lub moze byc przestarzaly
// Na przyklad:

import React from 'react';

class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  render() {
    return <div>{this.state.count}</div>;
  }
}`}
                    className="w-full px-3 py-2 font-mono text-sm"
                    style={{
                      background: '#fff',
                      border: '2px solid',
                      borderColor: '#808080 #fff #fff #808080',
                      minHeight: '250px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Analyze Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={!code.trim() || isAnalyzing}
                    className="px-6 py-2 text-white font-bold text-lg"
                    style={{
                      background: code.trim() && !isAnalyzing ? '#000080' : '#808080',
                      border: '2px solid',
                      borderColor: '#fff #000 #000 #fff',
                      cursor: code.trim() && !isAnalyzing ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {isAnalyzing ? '⏳ Analizuje...' : '🔍 Sprawdz i Zaktualizuj Kod'}
                  </button>
                </div>
              </div>
            )}

            {/* RESULT TAB */}
            {activeTab === 'result' && (
              <div className="space-y-4">
                {isAnalyzing ? (
                  <div
                    className="text-center py-12"
                    style={{
                      background: '#fff',
                      border: '2px solid',
                      borderColor: '#808080 #fff #fff #808080'
                    }}
                  >
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-lg font-bold">Analizuje kod...</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Sprawdzam wersje bibliotek, skladnie i najlepsze praktyki
                    </p>
                    <div className="mt-4">
                      <div
                        className="h-4 mx-auto"
                        style={{
                          width: '200px',
                          background: '#c0c0c0',
                          border: '2px solid',
                          borderColor: '#808080 #fff #fff #808080'
                        }}
                      >
                        <div
                          className="h-full animate-pulse"
                          style={{ background: '#000080', width: '60%' }}
                        />
                      </div>
                    </div>
                  </div>
                ) : result ? (
                  <>
                    {/* Status Banner */}
                    <div
                      className="p-3 text-white font-bold text-center"
                      style={{ background: getStatusColor(result.status) }}
                    >
                      {getStatusText(result.status)}
                    </div>

                    {/* Summary */}
                    <div
                      className="p-3"
                      style={{
                        background: '#fff',
                        border: '2px solid',
                        borderColor: '#808080 #fff #fff #808080'
                      }}
                    >
                      <h3 className="font-bold mb-2">📋 Podsumowanie:</h3>
                      <p className="text-sm">{result.summary}</p>
                    </div>

                    {/* Issues Found */}
                    {result.issues.length > 0 && (
                      <div
                        className="p-3"
                        style={{
                          background: '#fff',
                          border: '2px solid',
                          borderColor: '#808080 #fff #fff #808080'
                        }}
                      >
                        <h3 className="font-bold mb-3">🔧 Znalezione problemy ({result.issues.length}):</h3>
                        <div className="space-y-4">
                          {result.issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className="p-3"
                              style={{
                                background: '#f0f0f0',
                                border: '1px solid #808080'
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="px-2 py-0.5 text-xs font-bold text-white"
                                  style={{ background: '#dc2626' }}
                                >
                                  {issue.type}
                                </span>
                              </div>
                              <p className="text-sm mb-3">{issue.description}</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Old Code */}
                                <div>
                                  <p className="text-xs font-bold mb-1" style={{ color: '#dc2626' }}>
                                    Stary kod (z kursu):
                                  </p>
                                  <pre
                                    className="p-2 text-xs overflow-x-auto"
                                    style={{
                                      background: '#ffe0e0',
                                      border: '1px solid #dc2626'
                                    }}
                                  >
                                    {issue.oldCode}
                                  </pre>
                                </div>

                                {/* New Code */}
                                <div>
                                  <p className="text-xs font-bold mb-1" style={{ color: '#22c55e' }}>
                                    Nowy kod (aktualny):
                                  </p>
                                  <pre
                                    className="p-2 text-xs overflow-x-auto"
                                    style={{
                                      background: '#e0ffe0',
                                      border: '1px solid #22c55e'
                                    }}
                                  >
                                    {issue.newCode}
                                  </pre>
                                </div>
                              </div>

                              <div
                                className="mt-3 p-2"
                                style={{
                                  background: '#ffffcc',
                                  border: '1px solid #f59e0b'
                                }}
                              >
                                <p className="text-xs">
                                  <strong>💡 Wyjasnienie:</strong> {issue.explanation}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Updated Code */}
                    <div
                      className="p-3"
                      style={{
                        background: '#fff',
                        border: '2px solid',
                        borderColor: '#808080 #fff #fff #808080'
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold">Zaktualizowany kod:</h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(result.updatedCode);
                          }}
                          className="px-3 py-1 text-sm font-bold"
                          style={{
                            background: '#22c55e',
                            color: '#fff',
                            border: '2px solid',
                            borderColor: '#fff #000 #000 #fff'
                          }}
                        >
                          📋 Kopiuj
                        </button>
                      </div>
                      <pre
                        className="p-3 text-sm overflow-x-auto font-mono"
                        style={{
                          background: '#1e1e1e',
                          color: '#d4d4d4',
                          border: '2px solid',
                          borderColor: '#808080 #fff #fff #808080',
                          maxHeight: '400px'
                        }}
                      >
                        {result.updatedCode}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div
                    className="text-center py-12"
                    style={{
                      background: '#fff',
                      border: '2px solid',
                      borderColor: '#808080 #fff #fff #808080'
                    }}
                  >
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-lg font-bold">Brak wynikow</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Wklej kod w zakladce Walidator Kodu i kliknij Sprawdz i Zaktualizuj Kod
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* LEARN TAB */}
            {activeTab === 'learn' && (
              <div className="space-y-4">
                {/* Learning Points from Result */}
                {result?.learningPoints && result.learningPoints.length > 0 ? (
                  <div
                    className="p-3"
                    style={{
                      background: '#fff',
                      border: '2px solid',
                      borderColor: '#808080 #fff #fff #808080'
                    }}
                  >
                    <h3 className="font-bold mb-3">🎓 Czego sie nauczyles z tej analizy:</h3>
                    <ul className="space-y-2">
                      {result.learningPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span>📌</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div
                    className="p-3"
                    style={{
                      background: '#ffffcc',
                      border: '2px solid',
                      borderColor: '#808080 #fff #fff #808080'
                    }}
                  >
                    <p className="text-sm">
                      Przeanalizuj kod, aby zobaczyc punkty nauki zwiazane z Twoim kodem.
                    </p>
                  </div>
                )}

                {/* General Learning Resources */}
                <div
                  className="p-3"
                  style={{
                    background: '#fff',
                    border: '2px solid',
                    borderColor: '#808080 #fff #fff #808080'
                  }}
                >
                  <h3 className="font-bold mb-3">📚 Dlaczego kursy sie starzeja?</h3>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>1. Szybki rozwoj technologii:</strong><br/>
                      React, Next.js, Vue i inne frameworki wydaja nowe wersje co kilka miesiecy.
                      Kurs nagrany w 2022 moze uzywac React 17, podczas gdy aktualna wersja to React 19.
                    </p>
                    <p>
                      <strong>2. Zmiany w API i skladni:</strong><br/>
                      Next.js 13+ wprowadzil App Router zamiast Pages Router.
                      React przeszedl z class components do functional components z hooks.
                    </p>
                    <p>
                      <strong>3. Deprecjacja bibliotek:</strong><br/>
                      Popularne biblioteki jak moment.js zostaly zastapione przez day.js.
                      Create React App ustapilo miejsca Vite i Next.js.
                    </p>
                    <p>
                      <strong>4. Najlepsze praktyki:</strong><br/>
                      To co bylo best practice 2 lata temu, moze byc dzis anty-wzorcem.
                    </p>
                  </div>
                </div>

                {/* Tips */}
                <div
                  className="p-3"
                  style={{
                    background: '#e0ffe0',
                    border: '2px solid',
                    borderColor: '#808080 #fff #fff #808080'
                  }}
                >
                  <h3 className="font-bold mb-2">💡 Wskazowki:</h3>
                  <ul className="text-sm space-y-1">
                    <li>Zawsze sprawdzaj date publikacji kursu</li>
                    <li>Porownuj wersje bibliotek z package.json kursu z aktualnymi</li>
                    <li>Czytaj oficjalna dokumentacje obok kursu</li>
                    <li>Uzywaj tego narzedzia do walidacji kodu z tutoriali</li>
                  </ul>
                </div>

                {/* Link to AI KUPMAX */}
                <div
                  className="p-3 text-center"
                  style={{
                    background: '#000080',
                    color: '#fff',
                    border: '2px solid',
                    borderColor: '#fff #000 #000 #fff'
                  }}
                >
                  <p className="font-bold mb-2">🤖 Potrzebujesz glebszej pomocy?</p>
                  <p className="text-sm mb-3">
                    Odwiedz AI KUPMAX - nasz glowny system do zaawansowanej analizy kodu
                  </p>
                  <a
                    href="https://ai.kupmax.pl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 font-bold"
                    style={{
                      background: '#22c55e',
                      color: '#fff',
                      border: '2px solid',
                      borderColor: '#fff #000 #000 #fff'
                    }}
                  >
                    🚀 Otworz AI KUPMAX
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div
            className="flex justify-between px-2 py-1 text-xs"
            style={{
              background: '#c0c0c0',
              borderTop: '2px solid #fff'
            }}
          >
            <span>Gotowy</span>
            <span>KUPMAX Retro (C) 2024</span>
          </div>
        </div>

        {/* Back to Desktop Link */}
        <div className="text-center mt-4">
          <Link href="/">
            <button
              className="px-4 py-2 text-sm font-bold"
              style={{
                background: '#c0c0c0',
                border: '2px solid',
                borderColor: '#fff #000 #000 #fff'
              }}
            >
              Powrot do Pulpitu
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
