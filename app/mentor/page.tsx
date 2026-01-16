'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import Monaco Editor (client-side only)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// File type for our virtual file system
interface VirtualFile {
  name: string;
  path: string;
  content: string;
  type: 'file' | 'folder';
  children?: VirtualFile[];
  language?: string;
}

// Detect language from file extension
function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'php': 'php',
    'java': 'java',
    'cs': 'csharp',
    'cpp': 'cpp',
    'c': 'c',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'sql': 'sql',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sh': 'shell',
    'bash': 'shell',
    'vue': 'html',
  };
  return langMap[ext || ''] || 'plaintext';
}

// Get file icon based on type/extension
function getFileIcon(filename: string, isFolder: boolean): string {
  if (isFolder) return '📁';

  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    'js': '📜',
    'jsx': '⚛️',
    'ts': '📘',
    'tsx': '⚛️',
    'html': '🌐',
    'htm': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'json': '📋',
    'md': '📝',
    'py': '🐍',
    'php': '🐘',
    'java': '☕',
    'png': '🖼️',
    'jpg': '🖼️',
    'gif': '🖼️',
    'svg': '🎭',
    'zip': '📦',
    'pdf': '📕',
  };
  return iconMap[ext || ''] || '📄';
}

export default function MentorIDEPage() {
  // File system state
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Editor state
  const [editorContent, setEditorContent] = useState<string>('// Wgraj projekt lub wybierz plik z drzewa 📁');

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<Array<{role: string; content: string}>>([
    { role: 'assistant', content: '👋 Cześć! Jestem Mentor AI.\n\nWgraj projekt (ZIP lub folder), a pomogę Ci:\n• Znaleźć błędy\n• Zrozumieć kod\n• Ulepszyć projekt\n\nKliknij "📁 Wgraj projekt" żeby zacząć!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Handle file selection
  const handleFileSelect = (file: VirtualFile) => {
    if (file.type === 'folder') {
      toggleFolder(file.path);
    } else {
      setSelectedFile(file);
      setEditorContent(file.content);
    }
  };

  // Update file content when editing
  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setEditorContent(value);

    if (selectedFile) {
      // Update file in tree
      setFiles(prev => updateFileInTree(prev, selectedFile.path, value));
      setSelectedFile({ ...selectedFile, content: value });
    }
  };

  // Helper to update file in tree
  const updateFileInTree = (tree: VirtualFile[], path: string, content: string): VirtualFile[] => {
    return tree.map(file => {
      if (file.path === path) {
        return { ...file, content };
      }
      if (file.children) {
        return { ...file, children: updateFileInTree(file.children, path, content) };
      }
      return file;
    });
  };

  // Handle ZIP upload
  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    try {
      const contents = await zip.loadAsync(file);
      const newFiles: VirtualFile[] = [];
      const fileMap: Map<string, VirtualFile> = new Map();

      // Process all files
      for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
        if (zipEntry.dir) continue;

        // Skip node_modules and hidden files
        if (relativePath.includes('node_modules/') || relativePath.startsWith('.')) continue;

        const content = await zipEntry.async('text');
        const parts = relativePath.split('/');
        const fileName = parts[parts.length - 1];

        const virtualFile: VirtualFile = {
          name: fileName,
          path: relativePath,
          content,
          type: 'file',
          language: getLanguage(fileName),
        };

        fileMap.set(relativePath, virtualFile);
      }

      // Build tree structure
      const rootFiles = buildFileTree(fileMap);
      setFiles(rootFiles);

      // Expand first level
      rootFiles.forEach(f => {
        if (f.type === 'folder') {
          setExpandedFolders(prev => new Set(prev).add(f.path));
        }
      });

      // AI message
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: `📦 Wgrałem projekt z ZIP!\n\n**Pliki:** ${fileMap.size}\n\nKliknij na plik w drzewie żeby go edytować, lub zapytaj mnie o pomoc!`
      }]);

    } catch (error) {
      console.error('Error loading ZIP:', error);
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Nie udało się otworzyć ZIP. Sprawdź czy plik nie jest uszkodzony.'
      }]);
    }
  };

  // Handle folder upload
  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const fileMap: Map<string, VirtualFile> = new Map();

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relativePath = file.webkitRelativePath || file.name;

      // Skip node_modules and hidden
      if (relativePath.includes('node_modules/') || relativePath.includes('/.')) continue;

      // Only text files
      if (file.size > 500000) continue; // Skip files > 500KB

      try {
        const content = await file.text();
        const fileName = file.name;

        const virtualFile: VirtualFile = {
          name: fileName,
          path: relativePath,
          content,
          type: 'file',
          language: getLanguage(fileName),
        };

        fileMap.set(relativePath, virtualFile);
      } catch {
        // Skip binary files
      }
    }

    const rootFiles = buildFileTree(fileMap);
    setFiles(rootFiles);

    // Expand first level
    rootFiles.forEach(f => {
      if (f.type === 'folder') {
        setExpandedFolders(prev => new Set(prev).add(f.path));
      }
    });

    setAiMessages(prev => [...prev, {
      role: 'assistant',
      content: `📂 Wgrałem folder!\n\n**Pliki:** ${fileMap.size}\n\nWybierz plik z drzewa lub zapytaj mnie o cokolwiek!`
    }]);
  };

  // Build tree from flat file map
  const buildFileTree = (fileMap: Map<string, VirtualFile>): VirtualFile[] => {
    const root: VirtualFile[] = [];
    const folders: Map<string, VirtualFile> = new Map();

    // Sort paths
    const sortedPaths = Array.from(fileMap.keys()).sort();

    for (const path of sortedPaths) {
      const file = fileMap.get(path)!;
      const parts = path.split('/');

      if (parts.length === 1) {
        // Root level file
        root.push(file);
      } else {
        // Nested file - create folder structure
        let currentPath = '';
        let currentArray = root;

        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i];
          currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

          let folder = folders.get(currentPath);
          if (!folder) {
            folder = {
              name: folderName,
              path: currentPath,
              content: '',
              type: 'folder',
              children: [],
            };
            folders.set(currentPath, folder);
            currentArray.push(folder);
          }
          currentArray = folder.children!;
        }

        currentArray.push(file);
      }
    }

    return root;
  };

  // Render file tree recursively
  const renderFileTree = (items: VirtualFile[], level: number = 0): React.ReactNode => {
    return items.map(item => (
      <div key={item.path}>
        <div
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-blue-100 ${
            selectedFile?.path === item.path ? 'bg-blue-200' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleFileSelect(item)}
        >
          {item.type === 'folder' && (
            <span className="text-xs">{expandedFolders.has(item.path) ? '▼' : '▶'}</span>
          )}
          <span>{getFileIcon(item.name, item.type === 'folder')}</span>
          <span className="text-sm truncate">{item.name}</span>
        </div>
        {item.type === 'folder' && item.children && expandedFolders.has(item.path) && (
          renderFileTree(item.children, level + 1)
        )}
      </div>
    ));
  };

  // Generate preview HTML
  const generatePreview = (): string => {
    // Find index.html or similar
    const findFile = (items: VirtualFile[], name: string): VirtualFile | null => {
      for (const item of items) {
        if (item.type === 'file' && item.name.toLowerCase() === name) {
          return item;
        }
        if (item.children) {
          const found = findFile(item.children, name);
          if (found) return found;
        }
      }
      return null;
    };

    const htmlFile = findFile(files, 'index.html') || findFile(files, 'index.htm');
    const cssFile = findFile(files, 'style.css') || findFile(files, 'styles.css');
    const jsFile = findFile(files, 'script.js') || findFile(files, 'app.js') || findFile(files, 'main.js');

    if (!htmlFile && selectedFile?.language === 'html') {
      // Use current file as HTML
      return selectedFile.content;
    }

    if (!htmlFile) {
      return `<!DOCTYPE html>
<html>
<head><title>Preview</title></head>
<body style="font-family: sans-serif; padding: 20px; background: #1e1e1e; color: #fff;">
  <h2>👁️ Podgląd</h2>
  <p>Wgraj projekt z plikiem index.html żeby zobaczyć podgląd.</p>
  <p>Lub wybierz plik HTML z drzewa.</p>
</body>
</html>`;
    }

    let html = htmlFile.content;

    // Inject CSS
    if (cssFile && !html.includes(cssFile.name)) {
      html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }

    // Inject JS
    if (jsFile && !html.includes(jsFile.name)) {
      html = html.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }

    return html;
  };

  // Send message to AI
  const handleAiSend = async () => {
    if (!aiInput.trim() || isAiLoading) return;

    const userMessage = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      // Build context from current files
      const context = selectedFile
        ? `Aktualny plik: ${selectedFile.name}\n\`\`\`${selectedFile.language}\n${selectedFile.content.slice(0, 2000)}\n\`\`\``
        : 'Brak wybranego pliku.';

      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context,
          files: files.map(f => f.name).slice(0, 20),
        }),
      });

      const data = await response.json();
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'Przepraszam, nie mogłem odpowiedzieć.'
      }]);
    } catch (error) {
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Błąd połączenia. Spróbuj ponownie.'
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: '#008080' }}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleZipUpload}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore - webkitdirectory is not in types
        webkitdirectory=""
        multiple
        onChange={handleFolderUpload}
        className="hidden"
      />

      {/* Title Bar */}
      <div
        className="flex justify-between items-center px-2 py-1 text-white text-sm font-bold"
        style={{ background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)' }}
      >
        <div className="flex items-center gap-2">
          <span>🎓</span>
          <span>Mentor IDE - KUPMAX Learning Studio</span>
        </div>
        <div className="flex gap-1">
          <Link href="/">
            <button
              className="w-6 h-5 flex items-center justify-center text-black font-bold text-xs"
              style={{ background: '#c0c0c0', border: '2px solid', borderColor: '#fff #000 #000 #fff' }}
            >
              ×
            </button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="flex gap-2 px-2 py-2 flex-wrap"
        style={{ background: '#c0c0c0', borderBottom: '2px solid #808080' }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 text-sm font-bold"
          style={{ background: '#fff', border: '2px solid', borderColor: '#fff #000 #000 #fff' }}
        >
          📦 Wgraj ZIP
        </button>
        <button
          onClick={() => folderInputRef.current?.click()}
          className="px-3 py-1 text-sm font-bold"
          style={{ background: '#fff', border: '2px solid', borderColor: '#fff #000 #000 #fff' }}
        >
          📁 Wgraj Folder
        </button>
        <div className="flex-1" />
        <button
          onClick={() => {
            const blob = new Blob([generatePreview()], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          }}
          className="px-3 py-1 text-sm font-bold"
          style={{ background: '#90EE90', border: '2px solid', borderColor: '#fff #000 #000 #fff' }}
        >
          ▶️ Uruchom
        </button>
      </div>

      {/* Main Content - 3 Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - File Tree */}
        <div
          className="w-56 flex flex-col"
          style={{ background: '#fff', borderRight: '2px solid #808080' }}
        >
          <div
            className="px-2 py-1 font-bold text-sm"
            style={{ background: '#000080', color: '#fff' }}
          >
            📂 Pliki projektu
          </div>
          <div className="flex-1 overflow-y-auto">
            {files.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <p>Brak plików</p>
                <p className="mt-2">Wgraj ZIP lub folder</p>
              </div>
            ) : (
              renderFileTree(files)
            )}
          </div>
        </div>

        {/* Center Panel - Code Editor */}
        <div className="flex-1 flex flex-col" style={{ background: '#1e1e1e' }}>
          <div
            className="px-2 py-1 font-bold text-sm flex items-center gap-2"
            style={{ background: '#2d2d2d', color: '#fff' }}
          >
            <span>📝</span>
            <span>{selectedFile ? selectedFile.name : 'Edytor kodu'}</span>
            {selectedFile && (
              <span className="text-xs text-gray-400 ml-2">{selectedFile.path}</span>
            )}
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={selectedFile?.language || 'plaintext'}
              value={editorContent}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        {/* Right Panel - Preview & AI */}
        <div
          className="w-80 flex flex-col"
          style={{ background: '#c0c0c0', borderLeft: '2px solid #808080' }}
        >
          {/* Preview */}
          <div className="h-1/2 flex flex-col">
            <div
              className="px-2 py-1 font-bold text-sm"
              style={{ background: '#000080', color: '#fff' }}
            >
              👁️ Podgląd Live
            </div>
            <div className="flex-1 bg-white">
              <iframe
                srcDoc={generatePreview()}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="Preview"
              />
            </div>
          </div>

          {/* AI Chat */}
          <div className="h-1/2 flex flex-col border-t-2 border-gray-600">
            <div
              className="px-2 py-1 font-bold text-sm"
              style={{ background: '#000080', color: '#fff' }}
            >
              🤖 Mentor AI
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-white">
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-2 p-2 rounded text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-100 ml-4'
                      : 'bg-gray-100 mr-4'
                  }`}
                >
                  <div className="font-bold text-xs mb-1">
                    {msg.role === 'user' ? '👤 Ty' : '🤖 Mentor'}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
              {isAiLoading && (
                <div className="text-center text-gray-500 animate-pulse">
                  Mentor myśli...
                </div>
              )}
            </div>
            <div className="p-2 border-t flex gap-1">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                placeholder="Zapytaj o kod..."
                className="flex-1 px-2 py-1 text-sm border-2"
                style={{ borderColor: '#808080 #fff #fff #808080' }}
              />
              <button
                onClick={handleAiSend}
                disabled={isAiLoading}
                className="px-2 py-1 text-sm font-bold"
                style={{ background: '#000080', color: '#fff', border: '2px solid', borderColor: '#fff #000 #000 #fff' }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div
        className="flex justify-between px-2 py-1 text-xs"
        style={{ background: '#c0c0c0', borderTop: '2px solid #fff' }}
      >
        <span>
          {selectedFile ? `${selectedFile.language?.toUpperCase()} | ${selectedFile.path}` : 'Gotowy'}
        </span>
        <span>KUPMAX Mentor IDE v1.0</span>
      </div>
    </div>
  );
}
