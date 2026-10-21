import React, { useRef } from 'react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { STARTER_PROJECTS } from '../../templates/starterProjects';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { 
  Play, Square, RotateCcw, Cpu, Download, Upload, 
  CheckCircle2, AlertTriangle, XCircle, Layers, ShieldCheck,
  Undo2, Redo2, Sparkles
} from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const {
    project,
    simulationStatus,
    isCompiling,
    diagnostics,
    setBoard,
    setFramework,
    setSimulationMode,
    compileAndRun,
    stopSimulation,
    resetSimulation,
    loadStarterProject,
    exportProjectJson,
    importProjectJson,
    undo,
    redo
  } = useRoboLabStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasErrors = diagnostics.some(d => d.severity === 'error');
  const hasWarnings = diagnostics.some(d => d.severity === 'warning');

  const handleExport = () => {
    const jsonStr = exportProjectJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}.robolab`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importProjectJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-16 bg-[#0f1523] border-b border-white/[0.06] flex items-center justify-between px-4 select-none z-30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[1.5px] shadow-clay-btn">
            <div className="w-full h-full rounded-[14px] bg-[#101728] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-white text-sm tracking-wider font-sans">
                ROBOLAB
              </span>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 shadow-clay-pill">
                ESP32 Studio
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[150px] font-medium mt-0.5">
              {project.name}
            </div>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-white/[0.08] mx-1" />

        {/* Demo Project Selector */}
        <div className="relative flex items-center">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#161f36] border border-white/[0.08] shadow-clay-card-sm text-xs text-slate-200 hover:text-white transition-all">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <select
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
              onChange={(e) => {
                if (e.target.value) {
                  loadStarterProject(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
            >
              <option value="" disabled className="bg-[#12192c] text-slate-400">⚡ Load Demo Project...</option>
              {STARTER_PROJECTS.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#12192c] text-slate-200">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Board Selector */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#161f36] border border-white/[0.08] shadow-clay-card-sm text-xs text-slate-200">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={project.boardId}
            onChange={(e) => setBoard(e.target.value)}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
          >
            {Object.values(BOARD_DEFINITIONS).map((b) => (
              <option key={b.id} value={b.id} className="bg-[#12192c] text-slate-200">
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Framework Selector */}
        <select
          value={project.framework}
          onChange={(e) => setFramework(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-xl bg-[#161f36] border border-white/[0.08] shadow-clay-card-sm text-slate-300 text-xs font-medium focus:outline-none cursor-pointer hover:text-white"
        >
          <option value="arduino" className="bg-[#12192c]">Arduino C++</option>
          <option value="espidf" className="bg-[#12192c]">ESP-IDF (v5.5)</option>
        </select>
      </div>

      {/* Middle Execution & Live Status Controls */}
      <div className="flex items-center space-x-3">
        {simulationStatus !== 'running' ? (
          <button
            onClick={compileAndRun}
            disabled={isCompiling}
            className={`flex items-center space-x-2 px-5 py-2 rounded-2xl font-bold text-xs transition-all ${
              isCompiling
                ? 'bg-amber-600/60 text-amber-100 cursor-wait shadow-clay-card'
                : 'clay-btn-success text-white'
            }`}
          >
            <Play className={`w-4 h-4 fill-current ${isCompiling ? 'animate-spin' : ''}`} />
            <span>{isCompiling ? 'Compiling Sketch...' : 'Compile & Run'}</span>
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl font-bold text-xs clay-btn-danger text-white"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Simulation</span>
          </button>
        )}

        <button
          onClick={resetSimulation}
          title="Reset Simulation Hardware"
          className="p-2 rounded-xl bg-[#161f36] hover:bg-[#1d2947] border border-white/[0.08] text-slate-400 hover:text-slate-100 shadow-clay-btn transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Simulation Mode Pill */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#121828] border border-white/[0.08] shadow-clay-inner">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mode:</span>
          <select
            value={project.simulationMode || 'modeA'}
            onChange={(e) => setSimulationMode(e.target.value as any)}
            className="bg-transparent text-xs font-semibold text-cyan-400 focus:outline-none cursor-pointer"
          >
            <option value="modeA" className="bg-[#101728] text-slate-200">Mode A (Emulation)</option>
            <option value="modeB" className="bg-[#101728] text-slate-200">Mode B (Peripherals)</option>
            <option value="modeC" className="bg-[#101728] text-slate-200">Mode C (Logic Demo)</option>
          </select>
        </div>

        {/* ERC Status Indicator */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#121828] border border-white/[0.08] shadow-clay-inner text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          {hasErrors ? (
            <span className="flex items-center font-semibold text-rose-400">
              <XCircle className="w-3.5 h-3.5 mr-1" /> ERC Error
            </span>
          ) : hasWarnings ? (
            <span className="flex items-center font-semibold text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> ERC Warning
            </span>
          ) : (
            <span className="flex items-center font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ERC Passed
            </span>
          )}
        </div>
      </div>

      {/* Right Utility Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={undo}
          title="Undo (Ctrl+Z)"
          className="p-2 rounded-xl bg-[#161f36] hover:bg-[#1d2947] border border-white/[0.08] text-slate-300 hover:text-white shadow-clay-btn transition-all"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={redo}
          title="Redo (Ctrl+Y)"
          className="p-2 rounded-xl bg-[#161f36] hover:bg-[#1d2947] border border-white/[0.08] text-slate-300 hover:text-white shadow-clay-btn transition-all"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleExport}
          title="Export Project File (.robolab)"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#161f36] hover:bg-[#1d2947] border border-white/[0.08] text-slate-200 hover:text-white shadow-clay-btn text-xs font-semibold transition-all"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export</span>
        </button>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".robolab,.json"
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Project File (.robolab)"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#161f36] hover:bg-[#1d2947] border border-white/[0.08] text-slate-200 hover:text-white shadow-clay-btn text-xs font-semibold transition-all"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
};
