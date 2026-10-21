import React, { useRef } from 'react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { STARTER_PROJECTS } from '../../templates/starterProjects';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { 
  Play, Square, RotateCcw, Cpu, Download, Upload, 
  Sparkles, CheckCircle, AlertTriangle, XCircle, FileCode, Layers, ShieldCheck
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
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 select-none z-30">
      {/* Brand & Project Selector */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold tracking-wider">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-100 text-sm tracking-wide">ROBOLAB</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                ESP32 Studio
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[160px] font-medium">
              {project.name}
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* Starter Templates Dropdown */}
        <div className="flex items-center space-x-1">
          <Layers className="w-4 h-4 text-slate-400 ml-1" />
          <select
            className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs rounded border border-slate-700/60 px-2 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            onChange={(e) => {
              if (e.target.value) {
                loadStarterProject(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>Load Demo Project...</option>
            {STARTER_PROJECTS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Board Selector */}
        <select
          value={project.boardId}
          onChange={(e) => setBoard(e.target.value)}
          className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs rounded border border-slate-700/60 px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          {Object.values(BOARD_DEFINITIONS).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.chipFamily})
            </option>
          ))}
        </select>

        {/* Framework Selector */}
        <select
          value={project.framework}
          onChange={(e) => setFramework(e.target.value as any)}
          className="bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs rounded border border-slate-700/60 px-2 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="arduino">Arduino C++</option>
          <option value="espidf">ESP-IDF (v5.5)</option>
        </select>
      </div>

      {/* Middle Execution & Status Controls */}
      <div className="flex items-center space-x-2">
        {simulationStatus !== 'running' ? (
          <button
            onClick={compileAndRun}
            disabled={isCompiling}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-md font-medium text-xs transition-all shadow-sm ${
              isCompiling
                ? 'bg-amber-600/50 text-amber-200 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-950/40'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isCompiling ? 'animate-spin' : ''}`} />
            <span>{isCompiling ? 'Compiling...' : 'Compile & Run'}</span>
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium text-xs bg-red-600 hover:bg-red-500 active:bg-red-700 text-white transition-all shadow-sm shadow-red-950/40"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        )}

        <button
          onClick={resetSimulation}
          title="Reset Simulation"
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Simulation Mode Pill */}
        <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800 rounded px-2 py-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Mode:</span>
          <select
            value={project.simulationMode || 'modeB'}
            onChange={(e) => setSimulationMode(e.target.value as any)}
            className="bg-transparent text-[11px] font-medium text-cyan-400 focus:outline-none cursor-pointer"
          >
            <option value="modeA" className="bg-slate-900 text-slate-200">Mode A (Emulation)</option>
            <option value="modeB" className="bg-slate-900 text-slate-200">Mode B (Peripherals)</option>
            <option value="modeC" className="bg-slate-900 text-slate-200">Mode C (Logic Demo)</option>
          </select>
        </div>

        {/* ERC Status Pill */}
        <div className="flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-medium bg-slate-800 border border-slate-700/60">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          {hasErrors ? (
            <span className="flex items-center text-red-400">
              <XCircle className="w-3.5 h-3.5 mr-1" /> ERC Errors
            </span>
          ) : hasWarnings ? (
            <span className="flex items-center text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> ERC Warnings
            </span>
          ) : (
            <span className="flex items-center text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> ERC Valid
            </span>
          )}
        </div>
      </div>

      {/* Right Utility Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={undo}
          title="Undo"
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 text-xs"
        >
          Undo
        </button>
        <button
          onClick={redo}
          title="Redo"
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 text-xs"
        >
          Redo
        </button>

        <button
          onClick={handleExport}
          title="Export Project File (.robolab)"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".robolab,.json"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Project File"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
};
