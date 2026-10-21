import React, { useRef, useState } from 'react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { STARTER_PROJECTS } from '../../templates/starterProjects';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { 
  Play, Square, RotateCcw, Cpu, Download, Upload, 
  CheckCircle2, AlertTriangle, XCircle, Layers,
  Undo2, Redo2, Sparkles, Box, Sliders, Code2, Calculator,
  MoreVertical, X, Check
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
    isFormulasOpen,
    toggleLibrary,
    toggleInspector,
    toggleBottom,
    toggleFormulas,
    setBoard,
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
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasErrors = diagnostics.some(d => d.severity === 'error');
  const hasWarnings = diagnostics.some(d => d.severity === 'warning');

  const handleExport = () => {
    const jsonStr = exportProjectJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}.oroxlab`;
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
    <>
      <header className="h-14 sm:h-16 bg-[#090e1a]/95 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-2.5 sm:px-4 select-none z-40 shadow-[0_4px_24px_rgba(0,0,0,0.6)] relative">
        {/* Left: Brand & Quick Templates */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
          {/* Logo with futuristic glowing chip */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="relative group cursor-pointer">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-600 p-[1.5px] shadow-[0_0_16px_rgba(6,182,212,0.4)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_24px_rgba(6,182,212,0.6)]">
                <div className="w-full h-full rounded-[14px] bg-[#0c1222] flex items-center justify-center">
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                </div>
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyan-400 border-2 border-[#090e1a] animate-pulse" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-sm sm:text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-sky-300">
                  ORoX<span className="text-cyan-400 font-extrabold">LAB</span>
                </span>
                <span className="hidden md:inline-flex text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-700/50 shadow-clay-pill tracking-widest">
                  ESP32
                </span>
              </div>
            </div>
          </div>

          {/* Demos Quick Dropdown (Laptop & Desktop >= 1024px) */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-[#141c30] border border-white/[0.08] shadow-clay-card-sm text-xs text-slate-200 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <select
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[150px] lg:max-w-[180px] truncate"
              onChange={(e) => {
                if (e.target.value) {
                  loadStarterProject(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              aria-label="Starter Projects"
            >
              <option value="" disabled className="bg-[#0f172a] text-slate-400">⚡ Demos...</option>
              {STARTER_PROJECTS.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0f172a] text-slate-200">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Board Selector (Desktop >= 1280px) */}
          <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#141c30] border border-white/[0.08] shadow-clay-card-sm text-xs text-slate-200 flex-shrink-0">
            <Layers className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <select
              value={project.boardId}
              onChange={(e) => setBoard(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[150px] truncate"
              aria-label="Target Microcontroller Board"
            >
              {Object.values(BOARD_DEFINITIONS).map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0f172a] text-slate-200">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Compile & Run Button + Hardware Reset + ERC Status */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {simulationStatus !== 'running' ? (
            <button
              onClick={compileAndRun}
              disabled={isCompiling}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-2xl font-bold text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 ${
                isCompiling
                  ? 'bg-amber-600/70 text-amber-100 cursor-wait shadow-clay-card'
                  : 'clay-btn-success text-white'
              }`}
              title="Compile sketch with Arduino/ESP32 toolchain and execute emulation"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isCompiling ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isCompiling ? 'Building...' : 'Compile & Run'}</span>
              <span className="sm:hidden">{isCompiling ? 'Build' : 'Run'}</span>
            </button>
          ) : (
            <button
              onClick={stopSimulation}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-bold text-xs clay-btn-danger text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-95"
              title="Halt active emulation and reset clock"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          )}

          <button
            onClick={resetSimulation}
            title="Reset Simulation Hardware & Registers"
            className="p-1.5 sm:p-2 rounded-xl bg-[#141c30] hover:bg-[#1a2540] border border-white/[0.08] text-slate-400 hover:text-slate-100 shadow-clay-btn transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* ERC Status Indicator (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#0c1220] border border-white/[0.08] shadow-clay-inner text-xs font-medium">
            {hasErrors ? (
              <span className="flex items-center font-bold text-rose-400 text-[11px]" title="Electrical Rules Check detected errors">
                <XCircle className="w-3.5 h-3.5 mr-1" />
                <span className="hidden lg:inline">ERC Error</span>
              </span>
            ) : hasWarnings ? (
              <span className="flex items-center font-bold text-amber-400 text-[11px]" title="Electrical Rules Check detected warnings">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                <span className="hidden lg:inline">Warning</span>
              </span>
            ) : (
              <span className="flex items-center font-bold text-emerald-400 text-[11px]" title="All circuits meet electrical specifications">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                <span className="hidden lg:inline">ERC OK</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Drawer Toggles & Responsive Action Menu */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 flex-shrink-0">
          {/* Toggle Parts Drawer Button */}
          <button
            onClick={toggleLibrary}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isLibraryOpen
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'bg-[#141c30] hover:bg-[#1b253f] text-slate-300 border border-white/[0.08] shadow-clay-card-sm'
            }`}
            title="Toggle Parts & Sensors Catalog"
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Parts</span>
          </button>

          {/* Toggle Inspector Drawer Button */}
          <button
            onClick={toggleInspector}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isInspectorOpen
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'bg-[#141c30] hover:bg-[#1b253f] text-slate-300 border border-white/[0.08] shadow-clay-card-sm'
            }`}
            title="Toggle Properties & Pinout Inspector"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Inspector</span>
          </button>

          {/* Toggle Code / Debug Bottom Panel */}
          <button
            onClick={toggleBottom}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isBottomOpen
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'bg-[#141c30] hover:bg-[#1b253f] text-slate-300 border border-white/[0.08] shadow-clay-card-sm'
            }`}
            title="Toggle Firmware Code & Serial Monitor"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Code</span>
          </button>

          {/* Toggle Robotics Formulas & Laws Studio */}
          <button
            onClick={toggleFormulas}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isFormulasOpen
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'bg-[#141c30] hover:bg-[#1b253f] text-slate-300 border border-white/[0.08] shadow-clay-card-sm'
            }`}
            title="Robotics Engineering Laws, Formulas & Live Calculators"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Laws & Math</span>
          </button>

          {/* Desktop Quick Actions: Undo, Redo, Export, Import */}
          <div className="hidden xl:flex items-center space-x-1">
            <button
              onClick={undo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 sm:p-2 rounded-xl bg-[#141c30] hover:bg-[#1b253f] border border-white/[0.08] text-slate-300 hover:text-white shadow-clay-btn transition-all active:scale-95"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              title="Redo (Ctrl+Y)"
              className="p-1.5 sm:p-2 rounded-xl bg-[#141c30] hover:bg-[#1b253f] border border-white/[0.08] text-slate-300 hover:text-white shadow-clay-btn transition-all active:scale-95"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleExport}
              title="Export Project File (.oroxlab)"
              className="p-1.5 sm:p-2 rounded-xl bg-[#141c30] hover:bg-[#1b253f] border border-white/[0.08] text-slate-300 hover:text-white shadow-clay-btn transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import Project File"
              className="p-1.5 sm:p-2 rounded-xl bg-[#141c30] hover:bg-[#1b253f] border border-white/[0.08] text-slate-300 hover:text-white shadow-clay-btn transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>

          {/* Mobile / Tablet Overflow Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-1.5 sm:p-2 rounded-xl bg-[#141c30] hover:bg-[#1b253f] text-slate-300 hover:text-white border border-white/[0.08] shadow-clay-btn transition-all"
            title="More Options & Settings"
            aria-label="More Options"
          >
            <MoreVertical className="w-4 h-4 text-cyan-400" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".oroxlab,.robolab,.json"
            style={{ display: 'none' }}
          />
        </div>
      </header>

      {/* Mobile / Compact Viewport Responsive Menu Sheet */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#0e1628] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="font-extrabold text-sm text-white">ORoXLAB Quick Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Demos selector in mobile menu */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Starter Projects & Demos</span>
              </label>
              <select
                className="w-full bg-[#162238] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                onChange={(e) => {
                  if (e.target.value) {
                    loadStarterProject(e.target.value);
                    setMobileMenuOpen(false);
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Select starter project...</option>
                {STARTER_PROJECTS.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0f172a] text-slate-200">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Board selector in mobile menu */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target Hardware Microcontroller</span>
              </label>
              <select
                value={project.boardId}
                onChange={(e) => {
                  setBoard(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#162238] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {Object.values(BOARD_DEFINITIONS).map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#0f172a] text-slate-200">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project File Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => {
                  handleExport();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-[#162238] hover:bg-[#1e2f4e] text-xs font-bold text-cyan-300 border border-cyan-500/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Project</span>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-[#162238] hover:bg-[#1e2f4e] text-xs font-bold text-slate-200 border border-white/10"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Project</span>
              </button>
            </div>

            {/* Undo / Redo */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { undo(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-[#141c30] hover:bg-[#1a2540] text-xs text-slate-300 border border-white/[0.08]"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                onClick={() => { redo(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-[#141c30] hover:bg-[#1a2540] text-xs text-slate-300 border border-white/[0.08]"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Redo</span>
              </button>
            </div>

            {/* Direct Laws Studio Button */}
            <button
              onClick={() => {
                toggleFormulas();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl clay-btn-primary text-white font-bold text-xs shadow-clay-btn"
            >
              <Calculator className="w-4 h-4 text-amber-300" />
              <span>Open Robotics Formulas & Math Studio</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
