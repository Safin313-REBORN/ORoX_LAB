import React, { useEffect } from 'react';
import { TopNavbar } from './components/layout/TopNavbar';
import { ComponentLibrary } from './components/library/ComponentLibrary';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { ComponentInspector } from './components/inspector/ComponentInspector';
import { BottomPanel } from './components/editor/BottomPanel';
import { useRoboLabStore } from './store/useRoboLabStore';

export const App: React.FC = () => {
  const { runERC } = useRoboLabStore();

  useEffect(() => {
    // Run initial ERC validation on mount
    runERC();
  }, [runERC]);

  return (
    <div className="flex flex-col w-full h-full bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Top Engineering Toolbar */}
      <TopNavbar />

      {/* Center Integrated Engineering Workspace (Full-bleed schematic with sliding clay drawers) */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full">
        {/* Full-bleed Interactive Schematic & Netlist Canvas */}
        <CircuitCanvas />

        {/* Left: Sliding Claymorphic Component & Board Catalog Drawer */}
        <ComponentLibrary />

        {/* Right: Sliding Claymorphic Component Properties & Live Telemetry Drawer */}
        <ComponentInspector />
      </div>

      {/* Bottom: Monaco Editor, Serial Monitor, Compiler, Oscilloscope, ERC */}
      <BottomPanel />
    </div>
  );
};

export default App;
