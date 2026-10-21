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
      ctx.fillStyle = '#080d18';
      ctx.fillRect(0, 0, w, h);

      // Draw subtle grid
      ctx.strokeStyle = '#151e33';
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
        ctx.fillText(ch, 12, yBase - 16);

        // Draw waveform
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        const stepX = (w - 140) / Math.max(1, traces.length - 1);

        traces.forEach((sample, sIdx) => {
          const val = sample.channels[ch] ?? 0;
          const x = 120 + sIdx * stepX;
          const y = val === 1 ? yBase - 16 : yBase;

          if (sIdx === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevVal = traces[sIdx - 1].channels[ch] ?? 0;
            const prevY = prevVal === 1 ? yBase - 16 : yBase;
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
    <div className={`border-t border-white/[0.08] bg-[#0b101d] flex flex-col transition-all select-none shadow-[-4px_0_20px_rgba(0,0,0,0.5)] ${isCollapsed ? 'h-11' : 'h-80'}`}>
      {/* Tab Navigation Header */}
      <div className="h-11 bg-[#0e1424] border-b border-white/[0.06] flex items-center justify-between px-3">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => { setActiveTab('editor'); setIsCollapsed(false); }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'editor' && !isCollapsed
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Firmware Editor</span>
          </button>

          <button
            onClick={() => { setActiveTab('serial'); setIsCollapsed(false); }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'serial' && !isCollapsed
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Serial Monitor</span>
            {simulationTelemetry.serialLogs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab('compiler'); setIsCollapsed(false); }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'compiler' && !isCollapsed
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Compiler Output</span>
            {compileErrors.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 font-bold text-[9px] border border-rose-800">
                {compileErrors.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('instruments'); setIsCollapsed(false); }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'instruments' && !isCollapsed
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Logic Analyzer</span>
          </button>

          <button
            onClick={() => { setActiveTab('erc'); setIsCollapsed(false); }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'erc' && !isCollapsed
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Electrical Diagnostics</span>
            {diagnostics.some(d => d.severity === 'error') && (
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            )}
          </button>
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-xl bg-[#141b2e] hover:bg-[#1a243d] text-slate-400 hover:text-white border border-white/[0.06] shadow-clay-btn"
          title={isCollapsed ? 'Expand Bottom Studio Panel' : 'Collapse Bottom Studio Panel'}
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Panel Body */}
      {!isCollapsed && (
        <div className="flex-1 bg-[#090d18] overflow-hidden relative">
          {/* TAB 1: CODE EDITOR */}
          {activeTab === 'editor' && (
            <div className="flex flex-col h-full">
              {/* File Tabs */}
              <div className="h-9 bg-[#0b101e] border-b border-white/[0.06] flex items-center px-3 space-x-1.5">
                {project.files.map(f => (
                  <div
                    key={f.id}
                    onClick={() => setActiveFile(f.id)}
                    className={`px-3 py-1 text-xs font-mono rounded-xl flex items-center space-x-2 cursor-pointer transition-all ${
                      activeFileId === f.id
                        ? 'bg-[#18233a] text-cyan-300 border border-cyan-500/40 shadow-clay-pill font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
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
                        className="ml-1 text-slate-500 hover:text-rose-400 text-xs px-0.5 rounded"
                        title="Delete file"
                      >
                        ×
                      </span>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const fname = prompt('Enter new sketch file name (e.g. config.h):');
                    if (fname) createFile(fname);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 text-xs ml-1 hover:bg-white/[0.04]"
                  title="Add File to Sketch"
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
                    fontSize: 12.5,
                    fontFamily: 'JetBrains Mono, Menlo, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    lineNumbersMinChars: 3
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: SERIAL MONITOR */}
          {activeTab === 'serial' && (
            <div className="flex flex-col h-full bg-[#070b14] font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 border-b border-white/[0.06] text-[11px] text-slate-400 bg-[#0c1220]">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-slate-300">ESP32 UART0 (/dev/ttyUSB0)</span>
                  <div className="h-3 w-[1px] bg-white/[0.1]" />
                  <div className="flex items-center space-x-1.5">
                    <span>Baud:</span>
                    <select
                      value={baudRate}
                      onChange={(e) => setBaudRate(e.target.value)}
                      className="bg-[#12192c] text-cyan-400 text-xs rounded-lg border border-white/[0.08] px-2 py-0.5 focus:outline-none shadow-clay-card-sm"
                    >
                      <option value="115200">115200 baud</option>
                      <option value="9600">9600 baud</option>
                      <option value="57600">57600 baud</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all shadow-clay-btn ${
                      autoScroll 
                        ? 'bg-cyan-950/80 border border-cyan-800 text-cyan-400' 
                        : 'bg-[#141c2e] border border-white/[0.06] text-slate-500'
                    }`}
                    title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
                  >
                    Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={clearSerial}
                    className="px-2.5 py-1 bg-[#141c2e] hover:bg-[#1a243a] text-slate-300 rounded-xl border border-white/[0.06] text-[10px] font-mono font-bold flex items-center space-x-1 shadow-clay-btn transition-all"
                    title="Clear Serial Output"
                  >
                    <Trash2 className="w-3 h-3 text-slate-400" />
                    <span>Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportSerialLogs}
                    className="px-2.5 py-1 bg-[#141c2e] hover:bg-[#1a243a] text-slate-300 rounded-xl border border-white/[0.06] text-[10px] font-mono font-bold flex items-center space-x-1 shadow-clay-btn transition-all"
                    title="Export Logs to .log File"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>Export</span>
                  </button>
                  <div className="h-3 w-[1px] bg-white/[0.1]" />
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Serial Logs Feed */}
              <div className="flex-1 p-3 overflow-y-auto space-y-1 custom-scrollbar text-[11px] leading-relaxed">
                {simulationTelemetry.serialLogs.map((log, idx) => (
                  <div key={idx} className={`${log.isInput ? 'text-amber-400 font-semibold' : 'text-slate-300'}`}>
                    <span className="text-slate-600 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    {log.isInput ? `> ${log.text}` : log.text}
                  </div>
                ))}
                <div ref={serialEndRef} />
              </div>

              {/* Serial Command Input Bar */}
              <form onSubmit={handleSendSerial} className="p-2 border-t border-white/[0.06] flex items-center space-x-2 bg-[#0c1220]">
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  placeholder="Send serial string or command to ESP32 UART..."
                  className="flex-1 bg-[#070b14] border border-white/[0.08] rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono shadow-clay-inner"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 clay-btn-primary text-white rounded-xl font-bold text-xs flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: COMPILER OUTPUT */}
          {activeTab === 'compiler' && (
            <div className="h-full bg-[#070b14] font-mono text-[11px] p-3 overflow-y-auto custom-scrollbar flex flex-col space-y-3">
              {compileErrors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-rose-400 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Compiler Diagnostics ({compileErrors.length}) — Click item to jump to code</span>
                  </div>
                  <div className="space-y-1.5">
                    {compileErrors.map((err, idx) => (
                      <div
                        key={idx}
                        onClick={() => jumpToDiagnostic(err)}
                        className="p-2.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/80 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-clay-card-sm"
                      >
                        <div className="flex-1 pr-2">
                          <div className="flex items-center space-x-2 text-[10px]">
                            <span className="font-bold text-rose-300 font-mono">
                              {err.file || 'sketch'}:{err.line}:{err.column}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-rose-900 text-rose-200 uppercase text-[9px] font-mono">
                              {err.severity || 'error'}
                            </span>
                          </div>
                          <p className="text-slate-200 text-xs font-mono mt-0.5">{err.message}</p>
                        </div>
                        <div className="text-[11px] text-cyan-400 flex items-center space-x-1 font-sans bg-[#111728] px-2.5 py-1 rounded-xl border border-white/[0.08] shadow-clay-btn">
                          <span>Jump</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Raw Compilation Log</div>
                {compileOutput ? (
                  <pre className="whitespace-pre-wrap text-slate-300 leading-relaxed font-mono bg-[#090e18] p-3 rounded-xl border border-white/[0.06] shadow-clay-inner">
                    {compileOutput}
                  </pre>
                ) : (
                  <div className="text-slate-500 text-center py-12">
                    No compilation job has run yet. Click 'Compile & Run' to build for {project.boardId}.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LOGIC ANALYZER */}
          {activeTab === 'instruments' && (
            <div className="h-full flex flex-col bg-[#070b14]">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] text-[11px] text-slate-400 bg-[#0c1220]">
                <span className="font-mono font-bold text-slate-300">4-Channel Digital Logic Analyzer (50ms Timebase)</span>
                <span className="text-cyan-400 font-mono font-bold">{simulationTelemetry.simulationTimeMs} ms elapsed</span>
              </div>
              <div className="flex-1 relative p-1">
                <canvas
                  ref={logicCanvasRef}
                  width={1000}
                  height={240}
                  className="w-full h-full rounded-xl"
                />
              </div>
            </div>
          )}

          {/* TAB 5: ELECTRICAL DIAGNOSTICS (ERC) */}
          {activeTab === 'erc' && (
            <div className="h-full bg-[#070b14] p-3 overflow-y-auto custom-scrollbar space-y-2.5">
              {diagnostics.map((diag) => (
                <div
                  key={diag.id}
                  className={`p-3 rounded-2xl border text-xs flex items-start space-x-3 shadow-clay-card-sm ${
                    diag.severity === 'error'
                      ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                      : diag.severity === 'warning'
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                      : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {diag.severity === 'error' ? (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    ) : diag.severity === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold flex items-center justify-between">
                      <span className="text-sm">{diag.title}</span>
                      {diag.blocksSimulation && (
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-rose-900/80 text-rose-200 font-mono font-bold">
                          Blocks Simulation
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-slate-300 leading-normal">{diag.message}</p>
                    <div className="mt-2 text-[11px] text-slate-300 bg-[#0c1220] p-2 rounded-xl border border-white/[0.06] shadow-clay-inner">
                      <span className="font-bold text-cyan-400">Recommended Correction: </span>
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
