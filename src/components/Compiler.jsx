import React, { useRef, useState, useEffect } from 'react';
import { Folder, File, Play, Square, ChevronDown, X, Menu } from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { useDispatch, useSelector } from 'react-redux';
// Mock Redux actions (unchanged)
const setCode = (payload) => ({ type: 'compiler/setCode', payload });
const setLanguage = (payload) => ({ type: 'compiler/setLanguage', payload });
const setOutput = (payload) => ({ type: 'compiler/setOutput', payload });
const setError = (payload) => ({ type: 'compiler/setError', payload });
const setIsRunning = (payload) => ({ type: 'compiler/setIsRunning', payload });

export default function Compiler() {
  const dispatch = useDispatch();
  const { code, output, _, currentLanguage, error, isRunning } = useSelector(
    (state) => state.compiler.compiler
  );
  const isMobile = window.innerWidth < 768; // Check if the screen width is less than 768px

  const [activeFile, setActiveFile] = useState('main.js');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Open sidebar by default on larger screens
  const [terminalHeight, setTerminalHeight] = useState(200);
  const isDragging = useRef(false);

  // Save code to localStorage
  useEffect(() => {
    localStorage.setItem('code', code);
  }, [code]);

  const languageConfigs = [
    { id: 'javascript', name: 'JavaScript', ext: 'js' },
    { id: 'python', name: 'Python', ext: 'py' },
    { id: 'java', name: 'Java', ext: 'java' },
    { id: 'c', name: 'C', ext: 'c' },
    { id: 'cpp', name: 'C++', ext: 'cpp' },
  ];

  const files = [
    { name: 'main.js', type: 'file', language: 'javascript' },
    { name: 'app.py', type: 'file', language: 'python' },
    { name: 'Main.java', type: 'file', language: 'java' },
    { name: 'main.c', type: 'file', language: 'c' },
    { name: 'main.cpp', type: 'file', language: 'cpp' },
  ];

  const handleEditorChange = (value) => {
    dispatch(setCode(value));
    dispatch(setError(null));
    dispatch(setOutput(''));
  };

  const handleLanguageChange = (newLang) => {
    dispatch(setLanguage(newLang));
    dispatch(setOutput(''));
    dispatch(setError(null));

    const langConfig = languageConfigs.find((l) => l.id === newLang);
    setActiveFile(`main.${langConfig.ext}`);

    const defaultCode = {
      javascript: '// JavaScript\nconsole.log("Hello, World!");',
      python: '# Python\nprint("Hello, World!")',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
    };

    dispatch(setCode(defaultCode[newLang] || ''));
  };

  const runCode = async () => {
  dispatch(setIsRunning(true));
  dispatch(setError(null));
  dispatch(setOutput(''));

  try {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language: currentLanguage,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = `Error: ${data.error || 'Unknown error'}`;
      dispatch(setError(errorMessage));
      dispatch(setOutput(errorMessage));
    } else {
      dispatch(setOutput(data.message || 'No output'));
    }
  } catch (err) {
    const errorMessage = `Error: ${err.message}`;
    dispatch(setError(errorMessage));
    dispatch(setOutput(errorMessage));
  } finally {
    dispatch(setIsRunning(false));
  }
};


  const handleMouseDown = () => {
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const container = document.querySelector('.flex-1.flex.flex-col'); // Select the main container
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newHeight = containerRect.bottom - e.clientY;
    setTerminalHeight(Math.max(100, Math.min(400, newHeight)));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-screen max-w-screen overflow-hidden bg-gray-900 text-gray-300 flex flex-col">
      {/* Title Bar */}
      <div className="h-8 bg-gray-800 flex items-center justify-center text-xs border-b border-gray-700">
        Web Compiler
      </div>

      {/* Menu Bar */}
      <div className="h-9 bg-gray-800 flex items-center px-3 border-b border-gray-700">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className={`w-50 p-2  bg-gray-800 border-r border-gray-700 flex flex-col`}>
            <div className="p-3 text-xs font-semibold uppercase tracking-wide text-gray-400 bg-gray-750">
              Explorer
            </div>
            <div className="flex-1 p-2">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <ChevronDown className="w-4 h-4 mr-1" />
                  <Folder className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-sm font-medium">PROJECT</span>
                </div>
                <div className="ml-6 space-y-1">
                  {files.map((file) => (
                    <div
                      key={file.name}
                      onClick={() => {
                        setActiveFile(file.name);
                        handleLanguageChange(file.language);
                      }}
                      className={`flex items-center p-1 rounded cursor-pointer hover:bg-gray-700 ${
                        activeFile === file.name ? 'bg-gray-700' : ''
                      }`}
                    >
                      <File className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="h-9 bg-gray-800 border-b border-gray-700 flex items-center">
            <div className="flex items-center px-3 py-1 bg-gray-900 border-r border-gray-700">
              <File className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm">{activeFile}</span>
              <X className="w-4 h-4 ml-2 hover:bg-gray-700 rounded cursor-pointer" />
            </div>
          </div>

          {/* Editor and Terminal Container */}
          <div className="flex-1 flex flex-col">
            {/* Code Editor */}
            <div className="flex-1 bg-gray-900 relative h-full">
              <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
                <button
                  onClick={runCode}
                  disabled={isRunning || !code}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm font-medium"
                >
                  {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                </button>
              </div>
              <Editor
                value={code}
                theme='vs-dark'
                language={currentLanguage}
                width={`${sidebarOpen ? 'calc(100vw - 12.5rem)' : '100vw'}`}
                height={`calc(100vh - ${terminalHeight}px - 40px)`} // Adjust height based on terminal height
                onChange={(value) => handleEditorChange(value)}
                className="w-full h-full bg-gray-900 text-gray-300 font-mono text-sm resize-none outline-none"
                style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                placeholder=""
                spellCheck={false}
              />
            </div>

            {/* Resizable Divider */}
            <div
              onMouseDown={handleMouseDown}
              className="h-1 bg-gray-700 hover:bg-blue-500 cursor-row-resize transition-colors"
            />

            {/* Terminal */}
            <div
              className="bg-gray-900 border-t border-gray-700 flex flex-col"
              style={{ height: `${terminalHeight}px` }}
            >
              <div className="h-8 bg-gray-800 flex items-center px-3 border-b border-gray-700">
                <span className="text-sm font-medium">Terminal</span>
                <div className="flex ml-auto space-x-2">
                  <button
                    onClick={() => {
                      dispatch(setOutput(''));
                      dispatch(setError(null));
                    }}
                    className="text-xs hover:bg-gray-700 px-2 py-1 rounded"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex-1 p-3 overflow-auto">
                <pre className="font-mono text-sm whitespace-pre-wrap">
                  {isRunning && <span className="text-blue-400">Running code...</span>}
                  {error && !isRunning && <span className="text-red-400">{error}</span>}
                  {!error && output && !isRunning && <span className="text-green-400">{output}</span>}
                  {!output && !error && !isRunning && (
                    <span className="text-gray-500">Ready to run your code...</span>
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}