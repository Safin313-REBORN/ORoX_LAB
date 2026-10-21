import React, { useState } from 'react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { COMPONENT_CATALOG } from '../../simulation/models/componentRegistry';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { Search, Plus, Cpu, Tv, Compass, ToggleLeft, Volume2, BatteryCharging, Zap } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Zap className="w-3.5 h-3.5" />,
  microcontrollers: <Cpu className="w-3.5 h-3.5" />,
  displays: <Tv className="w-3.5 h-3.5" />,
  sensors: <Compass className="w-3.5 h-3.5" />,
  inputs: <ToggleLeft className="w-3.5 h-3.5" />,
  audio: <Volume2 className="w-3.5 h-3.5" />,
  power: <BatteryCharging className="w-3.5 h-3.5" />
};

export const ComponentLibrary: React.FC = () => {
  const { addComponent } = useRoboLabStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
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
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none text-slate-300">
      {/* Header */}
      <div className="p-3 border-b border-slate-800">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
          Component Catalog
        </h2>
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts, ICs..."
            className="w-full bg-slate-950 text-xs text-slate-200 rounded border border-slate-800 pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-cyan-500 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="p-2 border-b border-slate-800 flex flex-wrap gap-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              category === c.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {items.map((item) => (
          <div
            key={item.type}
            className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            onClick={() => {
              // Add to center canvas with small random offset
              const rx = 340 + (Math.random() - 0.5) * 80;
              const ry = 160 + (Math.random() - 0.5) * 80;
              addComponent(item.type, Math.round(rx), Math.round(ry));
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-1.5 font-medium text-xs text-slate-200 group-hover:text-cyan-400">
                {CATEGORY_ICONS[item.category] || <Zap className="w-3.5 h-3.5" />}
                <span>{item.name}</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
              {item.description}
            </p>
            <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-500 font-mono">
              <span className="px-1 py-0.5 rounded bg-slate-950 border border-slate-800">
                {item.pins.length} PINS
              </span>
              <span className="uppercase">{item.category}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            No components match your search.
          </div>
        )}
      </div>
    </div>
  );
};
