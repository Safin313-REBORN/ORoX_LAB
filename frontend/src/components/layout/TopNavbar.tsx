import React, { useRef } from 'react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { STARTER_PROJECTS } from '../../templates/starterProjects';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { 
  Play, Square, RotateCcw, Cpu, Download, Upload, 
  CheckCircle2, AlertTriangle, XCircle, Layers, ShieldCheck,
  Undo2, Redo2, Sparkles, Box, Sliders, Code2
} from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const {
    project,
    simulationStatus,
    isCompiling,
    diagnostics,
    isLibraryOpen,
    isInspectorOpen,
    isBottomOpen,
    toggleLibrary,
    toggleInspector,
    toggleBottom,
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
    <header className="h-16 bg-[#0f1523] border-b border-white/[0.06] flex items-center justify-between px-3 md:px-4 select-none z-40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Left: Brand & Project Selector */}
      <div className="flex items-center space-x-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[1.5px] shadow-clay-btn flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#101728] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-white text-sm tracking-wider font-sans">
                ROBOLAB
              </span>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 shadow-clay-pill">
                ESP32
              </span>
            </div>
          </div>
        </div>

        {/* Demo Project Selector */}
        <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-[#161f36] border border-white/[0.08] shadow-clay-card-sm text-xs text-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <select
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[160px] truncate"
            onChange={(e) => {
              if (e.target.value) {
                loadStarterProject(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled className="bg-[#12192c] text-slate-400">⚡ Demos...</option>
            {STARTER_PROJECTS.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#12192c] text-slate-200">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Board & Framework (Desktop only) */}
        <div className="hidden lg:flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#161f36] border border-white/[0.08] shadow-clay-card-sm text-xs text-slate-200">
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
        </div>
      </div>

      {/* Middle: Compile & Run Button (Always Prominent & Accessible) */}
      <div className="flex items-center space-x-2">
        {simulationStatus !== 'running' ? (
          <button
            onClick={compileAndRun}
            disabled={isCompiling}
            className={`flex items-center space-x-2 px-4 sm:px-5 py-2 rounded-2xl font-bold text-xs transition-all ${
              isCompiling
                ? 'bg-amber-600/60 text-amber-100 cursor-wait shadow-clay-card'
                : 'clay-btn-success text-white'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isCompiling ? 'animate-spin' : ''}`} />
            <span>{isCompiling ? 'Building...' : 'Compile & Run'}</span>
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl font-bold text-xs clay-btn-danger text-white"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        )}

        <button
          onClick={resetSimulation}
          title="Reset Simulation Hardware"
          className="p-2 rounded-xl bg-[#161f36] hover:bg-[#1d2947] border border-white/[0.08] text-slate-400 hover:text-slate-100 shadow-clay-btn transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* ERC Status Indicator (Tablet & Desktop) */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#121828] border border-white/[0.08] shadow-clay-inner text-xs font-medium">
          {hasErrors ? (
            <span className="flex items-center font-bold text-rose-400 text-[11px]">
              <XCircle className="w-3.5 h-3.5 mr-1" /> ERC Error
            </span>
          ) : hasWarnings ? (
            <span className="flex items-center font-bold text-amber-400 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Warning
            </span>
          ) : (
            <span className="flex items-center font-bold text-emerald-400 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ERC OK
            </span>
          )}
        </div>
      </div>

      {/* Right: Drawer Toggles & Utilities */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Toggle Parts Drawer Button */}
        <button
          onClick={toggleLibrary}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isLibraryOpen
              ? 'clay-btn-primary text-white shadow-clay-btn'
              : 'bg-[#161f36] hover:bg-[#1d2947] text-slate-300 border border-white/[0.08] shadow-clay-card-sm'
          }`}
          title="Toggle Parts Library Drawer"
        >
          <Box className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Parts</span>
        </button>

        {/* Toggle Inspector Drawer Button */}
        <button
          onClick={toggleInspector}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isInspectorOpen
              ? 'clay-btn-primary text-white shadow-clay-btn'
              : 'bg-[#161f36] hover:bg-[#1d2947] text-slate-300 border border-white/[0.08] shadow-clay-card-sm'
          }`}
          title="Toggle Properties & Pinout Inspector"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Inspector</span>
        </button>

        {/* Toggle Code / Debug Bottom Panel */}
        <button
          onClick={toggleBottom}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isBottomOpen
              ? 'clay-btn-primary text-white shadow-clay-btn'
              : 'bg-[#161f36] hover:bg-[#1d2947] text-slate-300 border border-white/[0.08] shadow-clay-card-sm'
          }`}
          title="Toggle Firmware Code & Serial Monitor"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Code</span>
        </button>

        <div className="hidden xl:flex items-center space-x-1">
          <button
            onClick={undo}
            title="Undo"
            className="p-2 rounded-xl bg-[#161f36] hover:bg-[#1d2947] border border-white/[0.08] text-slate-300 hover:text-white shadow-clay-btn transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            title="Redo"
            className="p-2 rounded-xl bg-[#161f36] hover:bg-[#1d2947] border border-white/[0.08] text-slate-300 hover:text-white shadow-clay-btn transition-all"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={handleExport}
          title="Export Project File"
          className="p-2 rounded-xl bg-[#161f36] hover:bg-[#1d2947] border border-white/[0.08] text-slate-300 hover:text-white shadow-clay-btn transition-all"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".robolab,.json"
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Project File"
          className="p-2 rounded-xl bg-[#161f36] hover:bg-[#1d2947] border border-white/[0.08] text-slate-300 hover:text-white shadow-clay-btn transition-all"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>
    </header>
  );
};
