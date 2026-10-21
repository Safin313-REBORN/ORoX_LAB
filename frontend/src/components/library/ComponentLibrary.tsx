import React, { useState } from 'react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { COMPONENT_CATALOG } from '../../simulation/models/componentRegistry';
import { 
  Search, Plus, Cpu, Tv, Compass, ToggleLeft, Volume2, 
  BatteryCharging, Zap, Sparkles, Box, X 
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
  displays: <Tv className="w-3.5 h-3.5 text-blue-400" />,
  sensors: <Compass className="w-3.5 h-3.5 text-sky-400" />,
  inputs: <ToggleLeft className="w-3.5 h-3.5 text-emerald-400" />,
  audio: <Volume2 className="w-3.5 h-3.5 text-purple-400" />,
  power: <BatteryCharging className="w-3.5 h-3.5 text-teal-400" />,
  discretes: <Zap className="w-3.5 h-3.5 text-rose-400" />
};

export const ComponentLibrary: React.FC = () => {
  const { isLibraryOpen, toggleLibrary, addComponent } = useRoboLabStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Parts' },
    { id: 'displays', label: 'Displays' },
    { id: 'sensors', label: 'Sensors' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'audio', label: 'Audio' },
    { id: 'power', label: 'Power' },
    { id: 'discretes', label: 'Passives' },
  ];

  const items = Object.values(COMPONENT_CATALOG).filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || item.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div 
      className={`absolute left-0 top-0 bottom-0 z-30 w-72 sm:w-80 bg-[#0d1424]/95 backdrop-blur-xl border-r border-white/10 flex flex-col h-full select-none text-slate-300 shadow-[8px_0_32px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out ${
        isLibraryOpen 
          ? 'translate-x-0 opacity-100 pointer-events-auto' 
          : '-translate-x-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Header & Search Bar */}
      <div className="p-3.5 border-b border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shadow-clay-pill">
              <Box className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-extrabold text-white tracking-wider uppercase font-sans">
              Parts Library
            </h2>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#161f36] text-slate-400 border border-white/[0.05]">
              {items.length} parts
            </span>
            <button
              onClick={toggleLibrary}
              className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all shadow-clay-btn"
              title="Close Parts Library"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input with Clay Inset */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts, sensors, ICs..."
            className="w-full bg-[#080d18] text-xs text-white rounded-xl pl-9 pr-3 py-2 border border-white/[0.06] shadow-clay-inner focus:outline-none focus:border-cyan-500/60 placeholder-slate-500 font-medium"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="p-2.5 border-b border-white/[0.06] flex flex-wrap gap-1.5 bg-[#0b101d]">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
              category === c.id
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'bg-[#141c2e] hover:bg-[#1a253d] text-slate-400 hover:text-slate-200 border border-white/[0.05]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Components Catalog List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {items.map((item) => (
          <div
            key={item.type}
            className="clay-card p-3 cursor-pointer group flex flex-col justify-between"
            onClick={() => {
              // Add to center canvas with friendly offset
              const rx = 400 + (Math.random() - 0.5) * 80;
              const ry = 180 + (Math.random() - 0.5) * 80;
              addComponent(item.type, Math.round(rx), Math.round(ry));
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 font-bold text-xs text-slate-100 group-hover:text-cyan-400 transition-colors">
                <div className="p-1 rounded-lg bg-[#0e1628] border border-white/[0.06] shadow-clay-inner">
                  {CATEGORY_ICONS[item.category] || <Zap className="w-3.5 h-3.5" />}
                </div>
                <span>{item.name}</span>
              </div>
              <div className="w-6 h-6 rounded-lg bg-[#1a253e] group-hover:bg-cyan-500 text-slate-400 group-hover:text-slate-900 flex items-center justify-center transition-all shadow-clay-btn">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
              {item.description}
            </p>

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04] text-[10px] text-slate-400 font-mono">
              <span className="px-2 py-0.5 rounded-full bg-[#0d1424] border border-white/[0.05]">
                {item.pins.length} PINS
              </span>
              <span className="text-cyan-400 font-semibold group-hover:underline">
                + Click to Place
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
