import React, { useEffect } from 'react';
import { TopNavbar } from './components/layout/TopNavbar';
import { ComponentLibrary } from './components/library/ComponentLibrary';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { ComponentInspector } from './components/inspector/ComponentInspector';
import { BottomPanel } from './components/editor/BottomPanel';
import { RoboticsFormulasStudio } from './components/robotics/RoboticsFormulasStudio';
import { useRoboLabStore } from './store/useRoboLabStore';

export const App: React.FC = () => {
  const { runERC, isFormulasOpen, setFormulasOpen } = useRoboLabStore();

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

      {/* Floating Robotics Engineering Laws & Formulas Modal */}
      {isFormulasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-5xl h-[88vh] rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col">
            <RoboticsFormulasStudio onClose={() => setFormulasOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
