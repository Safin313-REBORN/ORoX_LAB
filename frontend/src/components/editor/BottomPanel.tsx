import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { 
  Terminal, Code2, Activity, ShieldAlert, Cpu, 
  Trash2, Send, Plus, ChevronUp, ChevronDown, CheckCircle, AlertTriangle, XCircle,
  Download, ArrowRight
} from 'lucide-react';

export const BottomPanel: React.FC = () => {
  const {
    project,
    activeFileId,
    activeTab,
    compileOutput,
    compileErrors,
    simulationTelemetry,
    diagnostics,
    setActiveTab,
    setActiveFile,
    updateFileContent,
    createFile,
    deleteFile,
    sendSerialInput,
    clearSerial
  } = useRoboLabStore();

  const [serialInput, setSerialInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [baudRate, setBaudRate] = useState('115200');
  const [autoScroll, setAutoScroll] = useState(true);

  const serialEndRef = useRef<HTMLDivElement>(null);
  const logicCanvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const activeFile = project.files.find(f => f.id === activeFileId) || project.files[0];

  // Auto-scroll serial log
  useEffect(() => {
    if (activeTab === 'serial' && autoScroll && serialEndRef.current) {
      serialEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simulationTelemetry.serialLogs, activeTab, autoScroll]);

  // Monaco Model Markers for compiler errors
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers = compileErrors
          .filter(err => !err.file || err.file.includes(activeFile?.name || '') || (activeFile?.name && activeFile.name.includes(err.file || '')))
          .map(err => ({
            severity: err.severity === 'warning' ? monacoRef.current.MarkerSeverity.Warning : monacoRef.current.MarkerSeverity.Error,
            message: err.message,
            startLineNumber: Math.max(1, err.line || 1),
            startColumn: Math.max(1, err.column || 1),
            endLineNumber: Math.max(1, err.line || 1),
            endColumn: Math.max(1, (err.column || 1) + 20)
          }));
        monacoRef.current.editor.setModelMarkers(model, 'compiler', markers);
      }
    }
  }, [compileErrors, activeFile, activeTab]);

  // Logic Analyzer Canvas Rendering
  useEffect(() => {
    if (activeTab === 'instruments' && logicCanvasRef.current) {
      const canvas = logicCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Draw grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      const traces = simulationTelemetry.logicTraces;
      if (!traces || traces.length < 2) return;

      const channels = ['GPIO2 (LED)', 'GPIO4 (Touch)', 'GPIO15 (Button)', 'I2C_SCL'];
      const channelColors = ['#38bdf8', '#f43f5e', '#a855f7', '#fbbf24'];
      const rowHeight = h / channels.length;

      channels.forEach((ch, chIdx) => {
        const yBase = (chIdx + 1) * rowHeight - 12;
        const color = channelColors[chIdx % channelColors.length];

        // Channel label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(ch, 10, yBase - 18);

        // Draw waveform
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const stepX = (w - 120) / Math.max(1, traces.length - 1);

        traces.forEach((sample, sIdx) => {
          const val = sample.channels[ch] ?? 0;
          const x = 110 + sIdx * stepX;
          const y = val === 1 ? yBase - 14 : yBase;

          if (sIdx === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevVal = traces[sIdx - 1].channels[ch] ?? 0;
            const prevY = prevVal === 1 ? yBase - 14 : yBase;
            ctx.lineTo(x, prevY);
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      });
    }
  }, [activeTab, simulationTelemetry.logicTraces]);

  const handleSendSerial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    sendSerialInput(serialInput);
    setSerialInput('');
  };

  const exportSerialLogs = () => {
    const content = simulationTelemetry.serialLogs
      .map(log => `[${new Date(log.timestamp).toISOString()}] ${log.isInput ? '> ' : ''}${log.text}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robolab_serial_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const jumpToDiagnostic = (err: any) => {
    const matchingFile = project.files.find(f => 
      f.name === err.file || 
      (err.file && f.name.endsWith(err.file)) ||
      (err.file && err.file.endsWith(f.name))
    ) || activeFile;

    if (matchingFile && matchingFile.id !== activeFileId) {
      setActiveFile(matchingFile.id);
    }

    setActiveTab('editor');
    setIsCollapsed(false);

    setTimeout(() => {
      if (editorRef.current) {
        const line = Math.max(1, err.line || 1);
        const col = Math.max(1, err.column || 1);
        editorRef.current.revealPositionInCenter({ lineNumber: line, column: col });
        editorRef.current.setPosition({ lineNumber: line, column: col });
        editorRef.current.focus();
      }
    }, 100);
  };

  return (
    <div className={`border-t border-slate-800 bg-slate-900 flex flex-col transition-all select-none ${isCollapsed ? 'h-9' : 'h-72'}`}>
      {/* Tab Navigation Header */}
      <div className="h-9 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => { setActiveTab('editor'); setIsCollapsed(false); }}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-t transition-colors ${
              activeTab === 'editor' && !isCollapsed
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Firmware Editor</span>
          </button>

          <button
            onClick={() => { setActiveTab('serial'); setIsCollapsed(false); }}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-t transition-colors ${
              activeTab === 'serial' && !isCollapsed
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Serial Monitor</span>
            {simulationTelemetry.serialLogs.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab('compiler'); setIsCollapsed(false); }}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-t transition-colors ${
              activeTab === 'compiler' && !isCollapsed
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Compiler Output</span>
            {compileErrors.length > 0 && (
              <span className="px-1 py-0.2 rounded bg-red-950 text-red-400 font-bold text-[9px]">
                {compileErrors.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('instruments'); setIsCollapsed(false); }}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-t transition-colors ${
              activeTab === 'instruments' && !isCollapsed
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Logic Analyzer</span>
          </button>

          <button
            onClick={() => { setActiveTab('erc'); setIsCollapsed(false); }}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-t transition-colors ${
              activeTab === 'erc' && !isCollapsed
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Electrical Diagnostics</span>
            {diagnostics.some(d => d.severity === 'error') && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-1"
          title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Panel Body */}
      {!isCollapsed && (
        <div className="flex-1 bg-slate-900 overflow-hidden relative">
          {/* TAB 1: CODE EDITOR */}
          {activeTab === 'editor' && (
            <div className="flex flex-col h-full">
              {/* File Tabs */}
              <div className="h-8 bg-slate-950/60 border-b border-slate-800 flex items-center px-2 space-x-1">
                {project.files.map(f => (
                  <div
                    key={f.id}
                    onClick={() => setActiveFile(f.id)}
                    className={`px-3 py-1 text-xs font-mono rounded-t flex items-center space-x-1.5 cursor-pointer ${
                      activeFileId === f.id
                        ? 'bg-slate-900 text-cyan-400 border-b-2 border-cyan-500'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{f.name}</span>
                    {f.id !== 'main_ino' && project.files.length > 1 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${f.name}?`)) {
                            deleteFile(f.id);
                          }
                        }}
                        className="ml-1 text-slate-500 hover:text-red-400 text-xs px-0.5"
                        title="Delete file"
                      >
                        ×
                      </span>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const fname = prompt('Enter new file name (e.g. config.h):');
                    if (fname) createFile(fname);
                  }}
                  className="p-1 text-slate-500 hover:text-cyan-400 text-xs ml-1"
                  title="Add File"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language="cpp"
                  value={activeFile?.content || ''}
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    monacoRef.current = monaco;
                  }}
                  onChange={(val) => {
                    if (activeFile && val !== undefined) {
                      updateFileContent(activeFile.id, val);
                    }
                  }}
                  options={{
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono, Menlo, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: SERIAL MONITOR */}
          {activeTab === 'serial' && (
            <div className="flex flex-col h-full bg-[#090d16] font-mono text-xs">
              <div className="flex items-center justify-between p-2 border-b border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center space-x-2">
                  <span>Port: /dev/ttyUSB0 (ESP32 UART0)</span>
                  <div className="h-3 w-px bg-slate-800" />
                  <span>Baud:</span>
                  <select
                    value={baudRate}
                    onChange={(e) => setBaudRate(e.target.value)}
                    className="bg-slate-900 text-cyan-400 text-xs rounded border border-slate-800 px-1.5 py-0.5 focus:outline-none"
                  >
                    <option value="115200">115200 baud</option>
                    <option value="9600">9600 baud</option>
                    <option value="57600">57600 baud</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                      autoScroll 
                        ? 'bg-cyan-950/60 border-cyan-800 text-cyan-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
                  >
                    Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={clearSerial}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px] font-mono flex items-center space-x-1"
                    title="Clear Serial Monitor"
                  >
                    <Trash2 className="w-3 h-3 text-slate-400" />
                    <span>Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportSerialLogs}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px] font-mono flex items-center space-x-1"
                    title="Export Serial Log to text file"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>Export</span>
                  </button>
                  <div className="h-3 w-px bg-slate-800" />
                  <span className="text-[10px] text-emerald-400 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Serial Logs */}
              <div className="flex-1 p-2.5 overflow-y-auto space-y-1 custom-scrollbar text-[11px]">
                {simulationTelemetry.serialLogs.map((log, idx) => (
                  <div key={idx} className={`leading-snug ${log.isInput ? 'text-amber-400' : 'text-slate-300'}`}>
                    <span className="text-slate-600 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    {log.isInput ? `> ${log.text}` : log.text}
                  </div>
                ))}
                <div ref={serialEndRef} />
              </div>

              {/* Serial Input Bar */}
              <form onSubmit={handleSendSerial} className="p-2 border-t border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  placeholder="Send text or AT command to ESP32 UART..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-xs flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: COMPILER OUTPUT */}
          {activeTab === 'compiler' && (
            <div className="h-full bg-[#090d16] font-mono text-[11px] p-3 overflow-y-auto custom-scrollbar flex flex-col space-y-3">
              {compileErrors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-red-400 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Compiler Diagnostics ({compileErrors.length}) — Click to jump to line</span>
                  </div>
                  <div className="space-y-1">
                    {compileErrors.map((err, idx) => (
                      <div
                        key={idx}
                        onClick={() => jumpToDiagnostic(err)}
                        className="p-2 bg-red-950/40 hover:bg-red-900/50 border border-red-800/70 rounded cursor-pointer transition-colors flex items-center justify-between group"
                      >
                        <div className="flex-1 pr-2">
                          <div className="flex items-center space-x-2 text-[10px]">
                            <span className="font-bold text-red-300 font-mono">
                              {err.file || 'sketch'}:{err.line}:{err.column}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-red-900 text-red-200 uppercase text-[9px] font-mono">
                              {err.severity || 'error'}
                            </span>
                          </div>
                          <p className="text-slate-200 text-xs font-mono mt-0.5">{err.message}</p>
                        </div>
                        <div className="text-[11px] text-cyan-400 opacity-80 group-hover:opacity-100 flex items-center space-x-1 font-sans bg-slate-900 px-2 py-1 rounded border border-slate-700">
                          <span>Jump</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Raw Build Log</div>
                {compileOutput ? (
                  <pre className="whitespace-pre-wrap text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded border border-slate-800">
                    {compileOutput}
                  </pre>
                ) : (
                  <div className="text-slate-600 text-center py-10">
                    No compilation job has run yet. Click 'Compile & Run' to build for {project.boardId}.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LOGIC ANALYZER */}
          {activeTab === 'instruments' && (
            <div className="h-full flex flex-col bg-[#090d16]">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400">
                <span className="font-mono">4-Channel Digital Logic Analyzer (50ms Timebase)</span>
                <span className="text-cyan-400 font-mono">{simulationTelemetry.simulationTimeMs} ms elapsed</span>
              </div>
              <div className="flex-1 relative">
                <canvas
                  ref={logicCanvasRef}
                  width={900}
                  height={220}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* TAB 5: ELECTRICAL DIAGNOSTICS (ERC) */}
          {activeTab === 'erc' && (
            <div className="h-full bg-[#090d16] p-3 overflow-y-auto custom-scrollbar space-y-2">
              {diagnostics.map((diag) => (
                <div
                  key={diag.id}
                  className={`p-2.5 rounded border text-xs flex items-start space-x-2.5 ${
                    diag.severity === 'error'
                      ? 'bg-red-950/40 border-red-800/80 text-red-200'
                      : diag.severity === 'warning'
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                      : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {diag.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : diag.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold flex items-center justify-between">
                      <span>{diag.title}</span>
                      {diag.blocksSimulation && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-red-900/60 text-red-300 font-mono">
                          Blocks Simulation
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-slate-300 leading-normal">{diag.message}</p>
                    <div className="mt-1.5 text-[11px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                      <span className="font-semibold text-slate-200">Recommended Correction: </span>
                      {diag.suggestion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
