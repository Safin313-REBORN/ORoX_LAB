import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { ComponentInstance, Wire, WireEndpoint, ComponentPin } from '../../types/circuit';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { COMPONENT_CATALOG } from '../../simulation/models/componentRegistry';
import { calculateAbsolutePinPosition, resolvePinDefinition } from '../../simulation/circuit/netlist';
import { ZoomIn, ZoomOut, Maximize2, Trash2, Palette, Sparkles, Volume2 } from 'lucide-react';

const WIRE_COLORS = [
  { name: 'Power VCC (Red)', hex: '#ef4444' },
  { name: 'Ground (Green)', hex: '#10b981' },
  { name: 'I2C SCL / Clock (Amber)', hex: '#f59e0b' },
  { name: 'I2C SDA / Data (Blue)', hex: '#3b82f6' },
  { name: 'Signal (Purple)', hex: '#8b5cf6' },
  { name: 'Digital (Cyan)', hex: '#06b6d4' }
];

export const CircuitCanvas: React.FC = () => {
  const {
    project,
    zoom,
    pan,
    selectedComponentId,
    selectedWireId,
    simulationTelemetry,
    setZoom,
    setPan,
    selectComponent,
    selectWire,
    moveComponent,
    deleteComponent,
    addWire,
    deleteWire,
    updateWireColor,
    updateComponentState
  } = useRoboLabStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging component state
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Interactive Wiring State
  const [wireStart, setWireStart] = useState<WireEndpoint | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState<{ componentId: string; pinId: string } | null>(null);

  // SSD1306 rendering ref
  const oledCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (oledCanvasRef.current && simulationTelemetry.ssd1306) {
      const ctx = oledCanvasRef.current.getContext('2d');
      if (ctx) {
        simulationTelemetry.ssd1306.renderToCanvas(ctx, '#00e5ff');
      }
    }
  }, [simulationTelemetry.ssd1306, simulationTelemetry.simulationTimeMs]);

  // Keyboard Delete / Esc listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) {
          deleteComponent(selectedComponentId);
        } else if (selectedWireId) {
          deleteWire(selectedWireId);
        }
      } else if (e.key === 'Escape') {
        setWireStart(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, selectedWireId]);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }, [pan, zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      selectComponent(null);
      selectWire(null);
      setWireStart(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (wireStart) {
      const cPos = screenToCanvas(e.clientX, e.clientY);
      setCursorPos(cPos);
    }

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingCompId) {
      const cPos = screenToCanvas(e.clientX, e.clientY);
      const snappedX = Math.round((cPos.x - dragOffset.x) / 10) * 10;
      const snappedY = Math.round((cPos.y - dragOffset.y) / 10) * 10;
      moveComponent(draggingCompId, snappedX, snappedY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingCompId(null);
  };

  const handlePinClick = (comp: ComponentInstance, pin: ComponentPin, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!wireStart) {
      setWireStart({ componentId: comp.id, pinId: pin.id });
    } else {
      if (wireStart.componentId !== comp.id || wireStart.pinId !== pin.id) {
        let wireColor = '#3b82f6';
        if (pin.signalType === 'POWER_VCC' || pin.name === '3V3' || pin.name === 'VIN') wireColor = '#ef4444';
        else if (pin.signalType === 'POWER_GND' || pin.name === 'GND') wireColor = '#10b981';
        else if (pin.signalType === 'I2C_SCL' || pin.signalType === 'I2S_BCLK') wireColor = '#f59e0b';
        else if (pin.signalType === 'I2C_SDA' || pin.signalType === 'I2S_DIN') wireColor = '#06b6d4';

        addWire(wireStart, { componentId: comp.id, pinId: pin.id }, wireColor);
      }
      setWireStart(null);
    }
  };

  const getEndpointPos = (endpoint: WireEndpoint): { x: number; y: number } => {
    const comp = project.components.find(c => c.id === endpoint.componentId);
    if (!comp) return { x: 0, y: 0 };
    const pinDef = resolvePinDefinition(comp, endpoint.pinId, project.boardId);
    if (!pinDef) return { x: comp.x, y: comp.y };
    return calculateAbsolutePinPosition(comp, pinDef);
  };

  const selectedWire = project.wires.find(w => w.id === selectedWireId);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full bg-[#0a0f1d] overflow-hidden select-none cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        const newZoom = Math.min(2.5, Math.max(0.4, zoom + delta));
        setZoom(newZoom);
      }}
    >
      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1.2px, transparent 1.2px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Selected Wire Action Bar */}
      {selectedWire && (
        <div className="absolute top-4 left-4 z-30 flex items-center space-x-2 bg-[#12192c]/95 border border-white/[0.1] rounded-2xl p-2 backdrop-blur shadow-clay-card animate-fadeIn">
          <span className="text-xs font-mono font-bold text-slate-300 pl-1">Wire Color:</span>
          <div className="flex items-center space-x-1.5">
            {WIRE_COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => updateWireColor(selectedWire.id, c.hex)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  selectedWire.color === c.hex 
                    ? 'ring-2 ring-white scale-125 shadow-lg' 
                    : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
          <div className="h-5 w-[1px] bg-white/[0.1] mx-1" />
          <button
            onClick={() => deleteWire(selectedWire.id)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 shadow-clay-btn transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Floating Zoom & View Controls (Centered Pill at top of canvas) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 bg-[#12192c]/95 border border-white/[0.1] rounded-2xl p-1.5 backdrop-blur shadow-clay-card">
        <button
          onClick={() => setZoom(Math.min(2.5, zoom + 0.15))}
          className="p-2 rounded-xl hover:bg-[#1a233d] text-slate-300 hover:text-white shadow-clay-btn transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-bold text-cyan-400 px-2 min-w-[50px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.max(0.4, zoom - 0.15))}
          className="p-2 rounded-xl hover:bg-[#1a233d] text-slate-300 hover:text-white shadow-clay-btn transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-5 w-[1px] bg-white/[0.1] mx-1" />
        <button
          onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
          className="p-2 rounded-xl hover:bg-[#1a233d] text-slate-300 hover:text-white shadow-clay-btn transition-all"
          title="Reset to 100%"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Pan & Zoom Canvas Container */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        {/* SVG Wire Layer */}
        <svg className="absolute inset-0 overflow-visible pointer-events-none w-[5000px] h-[5000px]">
          <defs>
            <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {project.wires.map((wire) => {
            const p1 = getEndpointPos(wire.start);
            const p2 = getEndpointPos(wire.end);
            const isSelected = selectedWireId === wire.id;
            const dx = Math.abs(p2.x - p1.x) * 0.55;
            const pathD = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;

            return (
              <g 
                key={wire.id} 
                className="pointer-events-auto cursor-pointer" 
                onClick={(e) => { e.stopPropagation(); selectWire(wire.id); }}
              >
                {/* Wide invisible click target */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="16" />
                {/* Ambient wire shadow */}
                <path d={pathD} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="5" transform="translate(1, 2)" />
                {/* Visible colored wire */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSelected ? '#38bdf8' : wire.color}
                  strokeWidth={isSelected ? '4' : '3'}
                  filter={isSelected ? 'url(#wire-glow)' : undefined}
                />
                {/* Connection beads */}
                <circle cx={p1.x} cy={p1.y} r="4" fill={wire.color} stroke="#ffffff" strokeWidth="1" />
                <circle cx={p2.x} cy={p2.y} r="4" fill={wire.color} stroke="#ffffff" strokeWidth="1" />
              </g>
            );
          })}

          {/* Wire Currently Being Drawn */}
          {wireStart && (
            (() => {
              const p1 = getEndpointPos(wireStart);
              const p2 = cursorPos;
              const dx = Math.abs(p2.x - p1.x) * 0.5;
              const pathD = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
              return (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="6,4"
                  filter="url(#wire-glow)"
                />
              );
            })()
          )}
        </svg>

        {/* Components Rendering Layer */}
        {project.components.map((comp) => {
          const isSelected = selectedComponentId === comp.id;
          const isESP32 = comp.type === 'esp32doit-devkit-v1' || comp.type === 'board';
          const meta = COMPONENT_CATALOG[comp.type];
          const boardMeta = BOARD_DEFINITIONS[project.boardId] || BOARD_DEFINITIONS['esp32doit-devkit-v1'];
          const pins = isESP32 ? boardMeta.pins : (meta?.pins || []);

          return (
            <div
              key={comp.id}
              className={`absolute select-none transition-shadow ${
                isSelected ? 'ring-2 ring-cyan-400 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.5)]' : ''
              }`}
              style={{
                left: comp.x,
                top: comp.y,
                transform: `rotate(${comp.rotation}deg)`,
                transformOrigin: 'top left'
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                selectComponent(comp.id);
                setDraggingCompId(comp.id);
                const cPos = screenToCanvas(e.clientX, e.clientY);
                setDragOffset({ x: cPos.x - comp.x, y: cPos.y - comp.y });
              }}
            >
              {/* ───────────────────────────────────────────────────────── */}
              {/* 1. ESP32 DevKit V1 REALISTIC CLAYMORPHIC HARDWARE BOARD */}
              {/* ───────────────────────────────────────────────────────── */}
              {isESP32 ? (
                <div className="w-[200px] h-[340px] clay-pcb relative flex flex-col items-center justify-between p-2 select-none overflow-hidden">
                  {/* Gold Corner Mounting Holes */}
                  <div className="absolute top-2 left-2 w-3 h-3 rounded-full border-2 border-amber-500/80 bg-[#090e18] shadow-inner" />
                  <div className="absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-amber-500/80 bg-[#090e18] shadow-inner" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full border-2 border-amber-500/80 bg-[#090e18] shadow-inner" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-amber-500/80 bg-[#090e18] shadow-inner" />

                  {/* LEFT PIN HEADER SILKSCREEN LABELS */}
                  <div className="absolute left-[26px] top-[37px] flex flex-col space-y-[9px] pointer-events-none z-0">
                    {boardMeta.pins.slice(0, 15).map(p => (
                      <span key={p.id} className="text-[8px] font-mono font-bold text-slate-300 tracking-tight leading-none">
                        {p.label || p.name}
                      </span>
                    ))}
                  </div>

                  {/* RIGHT PIN HEADER SILKSCREEN LABELS */}
                  <div className="absolute right-[26px] top-[37px] flex flex-col space-y-[9px] items-end pointer-events-none z-0">
                    {boardMeta.pins.slice(15, 30).map(p => (
                      <span key={p.id} className="text-[8px] font-mono font-bold text-slate-300 tracking-tight leading-none text-right">
                        {p.label || p.name}
                      </span>
                    ))}
                  </div>

                  {/* Top Antenna Area */}
                  <div className="w-20 h-6 bg-[#0a151e] rounded border border-amber-600/40 mt-1 flex items-center justify-center relative overflow-hidden">
                    <svg className="w-16 h-4 opacity-75" viewBox="0 0 60 16">
                      <path d="M 4 8 L 12 8 L 12 2 L 20 2 L 20 14 L 28 14 L 28 2 L 36 2 L 36 14 L 44 14 L 44 2 L 52 2 L 52 8 L 58 8" fill="none" stroke="#d97706" strokeWidth="1.5" />
                    </svg>
                  </div>

                  {/* ESP-WROOM-32 Metal RF Shield */}
                  <div className="w-[84px] h-28 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-lg border border-slate-300 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.3),2px_4px_10px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-1.5 text-center text-slate-800 z-10">
                    <div className="w-2.5 h-2.5 rounded-full border border-slate-500 absolute top-1.5 right-1.5 flex items-center justify-center text-[5px] font-bold">1</div>
                    <span className="font-extrabold text-[9px] tracking-widest uppercase text-slate-900">ESPRESSIF</span>
                    <span className="font-mono text-[8px] font-bold text-slate-800">ESP-WROOM-32</span>
                    <div className="h-[1px] w-12 bg-slate-400 my-1" />
                    <span className="text-[6.5px] text-slate-600 font-semibold">WiFi + BT + BLE</span>
                    <span className="text-[5.5px] font-mono text-slate-500 mt-0.5">FCC: 2AC7Z-ESP32</span>
                  </div>

                  {/* Silabs CP2102 USB Bridge Chip */}
                  <div className="w-10 h-10 bg-[#090d16] border border-slate-700 rounded shadow-inner flex flex-col items-center justify-center text-slate-500 text-[6px] font-mono font-bold z-10">
                    <span>SILABS</span>
                    <span>CP2102</span>
                  </div>

                  {/* Buttons & Status LEDs */}
                  <div className="w-full flex items-center justify-between px-10 z-10">
                    {/* EN Button */}
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 bg-slate-500 hover:bg-slate-400 active:bg-slate-600 rounded-sm border border-slate-300 shadow-clay-btn cursor-pointer" />
                      <span className="text-[8px] text-slate-400 font-mono font-bold mt-0.5">EN</span>
                    </div>

                    {/* Status LEDs */}
                    <div className="flex items-center space-x-3">
                      {/* Red Power LED */}
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" title="3.3V Power Active" />
                        <span className="text-[6px] text-slate-400 font-mono mt-0.5">PWR</span>
                      </div>
                      {/* Blue GPIO2 User LED */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${
                            simulationTelemetry.pinStates['GPIO2'] === 1
                              ? 'bg-cyan-400 shadow-[0_0_14px_#38bdf8]'
                              : 'bg-cyan-950/60 border border-cyan-800'
                          }`}
                          title="GPIO2 User LED"
                        />
                        <span className="text-[6px] text-slate-400 font-mono mt-0.5">D2</span>
                      </div>
                    </div>

                    {/* BOOT Button */}
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 bg-slate-500 hover:bg-slate-400 active:bg-slate-600 rounded-sm border border-slate-300 shadow-clay-btn cursor-pointer" />
                      <span className="text-[8px] text-slate-400 font-mono font-bold mt-0.5">BOOT</span>
                    </div>
                  </div>

                  {/* Micro-USB Connector & Silkscreen Name */}
                  <div className="flex flex-col items-center z-10 mb-1">
                    <span className="text-[9px] font-bold text-amber-400/90 tracking-wider font-mono">
                      DOIT ESP32 DEVKIT V1
                    </span>
                    <div className="w-10 h-3 bg-gradient-to-b from-slate-400 to-slate-600 rounded-b-md border border-slate-400 shadow-md flex items-center justify-center">
                      <div className="w-5 h-1 bg-slate-900 rounded-sm" />
                    </div>
                  </div>
                </div>
              ) : comp.type === 'ssd1306' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 2. SSD1306 0.96" OLED GRAPHIC DISPLAY                     */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[150px] h-[100px] clay-panel bg-[#0e1d33] border-2 border-blue-600/40 rounded-2xl p-2 flex flex-col justify-between shadow-clay-card">
                  {/* Top Pinout Labels */}
                  <div className="flex items-center justify-around text-[8px] font-mono font-bold text-cyan-300 px-1">
                    <span>GND</span>
                    <span>VCC</span>
                    <span>SCL</span>
                    <span>SDA</span>
                  </div>

                  {/* OLED Glass Screen Bezel */}
                  <div className="w-full h-[64px] bg-[#000812] border-2 border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shadow-clay-inner">
                    <canvas
                      ref={oledCanvasRef}
                      width={128}
                      height={64}
                      className="w-[136px] h-[58px] image-render-pixel"
                    />
                  </div>

                  <div className="text-[8px] font-mono font-semibold text-blue-300/80 text-center">
                    SSD1306 128×64 (0x3C)
                  </div>
                </div>
              ) : comp.type === 'mpu6050' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 3. MPU-6050 6-AXIS IMU (GY-521)                           */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[140px] h-[95px] clay-panel bg-[#0d2238] border-2 border-sky-600/40 rounded-2xl p-2 flex flex-col justify-between shadow-clay-card">
                  <div className="flex items-center justify-between px-1 text-[7px] font-mono font-bold text-sky-300">
                    <span>VCC</span>
                    <span>GND</span>
                    <span>SCL</span>
                    <span>SDA</span>
                    <span>XDA</span>
                    <span>XCL</span>
                    <span>AD0</span>
                    <span>INT</span>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="w-10 h-10 bg-[#090d16] border border-sky-500/60 rounded-xl flex flex-col items-center justify-center text-sky-400 font-mono text-[8px] font-bold shadow-clay-inner">
                      <span>GY-521</span>
                      <span className="text-[6px] text-slate-500">6-DOF</span>
                    </div>

                    <div className="text-right font-mono text-[9px] space-y-0.5">
                      <div className="text-sky-300 font-bold">MPU-6050</div>
                      <div className="text-slate-400 text-[8px]">
                        P: <span className="text-amber-400 font-bold">{comp.properties.pitch || 0}°</span>
                      </div>
                      <div className="text-slate-400 text-[8px]">
                        R: <span className="text-cyan-400 font-bold">{comp.properties.roll || 0}°</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[8px] font-mono text-center text-sky-400/80">
                    I2C: {comp.properties.ad0 === 1 ? '0x69' : '0x68'}
                  </div>
                </div>
              ) : comp.type === 'push-button' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 4. TACTILE PUSHBUTTON SWITCH                              */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[70px] h-[70px] bg-[#161c2c] border-2 border-slate-600/70 rounded-2xl shadow-clay-card flex items-center justify-center p-2 relative">
                  {/* Metal corner tabs */}
                  <div className="absolute top-1 left-1 w-2 h-2 bg-slate-400 rounded-sm" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-slate-400 rounded-sm" />
                  <div className="absolute bottom-1 left-1 w-2 h-2 bg-slate-400 rounded-sm" />
                  <div className="absolute bottom-1 right-1 w-2 h-2 bg-slate-400 rounded-sm" />

                  <button
                    onMouseDown={() => updateComponentState(comp.id, 'pressed', true)}
                    onMouseUp={() => updateComponentState(comp.id, 'pressed', false)}
                    className={`w-11 h-11 rounded-full transition-transform active:scale-90 flex items-center justify-center border-2 ${
                      comp.state?.pressed
                        ? 'bg-blue-600 border-blue-400 shadow-clay-inner scale-95'
                        : 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-300 shadow-clay-btn hover:brightness-110'
                    }`}
                  >
                    <span className="text-[9px] font-extrabold text-white uppercase drop-shadow">
                      {comp.state?.pressed ? 'DN' : 'SW1'}
                    </span>
                  </button>
                </div>
              ) : comp.type === 'ttp223' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 5. TTP223 TOUCH SENSOR                                    */
                /* ───────────────────────────────────────────────────────── */
                <div
                  onClick={() => updateComponentState(comp.id, 'touched', !comp.state?.touched)}
                  className={`w-[75px] h-[75px] rounded-2xl border-2 p-2 flex flex-col items-center justify-between cursor-pointer transition-all shadow-clay-card ${
                    comp.state?.touched
                      ? 'bg-rose-950/90 border-rose-500 shadow-[0_0_20px_#f43f5e]'
                      : 'bg-[#24131b] border-rose-900/60 hover:border-rose-600'
                  }`}
                >
                  <span className="text-[8px] font-bold text-rose-300 font-mono">TTP223 TOUCH</span>
                  <div className="w-9 h-9 rounded-full border-2 border-dashed border-rose-400/80 flex items-center justify-center">
                    <div className={`w-5 h-5 rounded-full transition-all ${comp.state?.touched ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]' : 'bg-rose-900/60'}`} />
                  </div>
                  <div className="flex justify-around w-full text-[7px] font-mono text-rose-400">
                    <span>GND</span>
                    <span>VCC</span>
                    <span>I/O</span>
                  </div>
                </div>
              ) : comp.type === 'active-buzzer' || comp.type === 'passive-buzzer' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 6. PIEZO BUZZER (ACTIVE & PASSIVE)                        */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[70px] h-[70px] rounded-full bg-[#111622] border-2 border-slate-600 shadow-clay-card flex flex-col items-center justify-center relative">
                  <div className="w-6 h-6 rounded-full border border-slate-500 bg-[#070a10] flex items-center justify-center shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  </div>
                  <span className="text-[8px] font-mono font-bold text-slate-300 mt-1">
                    {comp.type === 'active-buzzer' ? 'ACT BZZ' : 'PWM BZZ'}
                  </span>
                  <div className="flex items-center space-x-3 text-[8px] font-bold text-slate-400 mt-0.5">
                    <span className="text-rose-400">+</span>
                    <span>-</span>
                  </div>
                  {/* Audible animation halo */}
                  {simulationTelemetry.pinStates['GPIO25'] === 1 && (
                    <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-75" />
                  )}
                </div>
              ) : comp.type === 'max98357a' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 7. MAX98357A I2S CLASS-D AMPLIFIER                        */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[100px] h-[90px] clay-panel bg-[#1f112e] border-2 border-purple-600/40 rounded-2xl p-2 flex flex-col justify-between shadow-clay-card">
                  <div className="flex justify-around text-[7px] font-mono font-bold text-purple-300">
                    <span>VIN</span>
                    <span>GND</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Volume2 className="w-5 h-5 text-purple-400 animate-pulse" />
                    <span className="text-[8px] font-mono font-bold text-purple-300">MAX98357A</span>
                    <span className="text-[6px] text-purple-400/80">I2S DAC 3.2W</span>
                  </div>
                  <div className="flex justify-between text-[6px] font-mono text-purple-400 px-1">
                    <span>SD</span>
                    <span>GAIN</span>
                    <span>DIN</span>
                    <span>BCLK</span>
                    <span>LRC</span>
                  </div>
                </div>
              ) : comp.type === 'battery-tp4056' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 8. TP4056 CHARGER + 18650 LI-ION BATTERY                  */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[160px] h-[100px] clay-panel bg-[#0d221c] border-2 border-emerald-600/40 rounded-2xl p-2 flex flex-col justify-between shadow-clay-card">
                  <div className="flex items-center justify-between text-[8px] font-mono font-bold text-emerald-300">
                    <span>TP4056 + 18650</span>
                    <span className="text-cyan-400 font-bold">{simulationTelemetry.batteryState?.socPercent || 65}%</span>
                  </div>
                  
                  {/* Battery Charge Bar */}
                  <div className="w-full bg-[#07130f] border border-emerald-700/60 rounded-xl h-5 overflow-hidden relative shadow-inner p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-lg transition-all duration-300"
                      style={{ width: `${simulationTelemetry.batteryState?.socPercent || 65}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-extrabold text-white drop-shadow">
                      {simulationTelemetry.batteryState?.terminalVoltage || 3.85} V
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[8px] font-mono text-emerald-300">
                    <span className="flex items-center space-x-1">
                      <span className={`w-2 h-2 rounded-full ${simulationTelemetry.batteryState?.redLed ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-rose-950'}`} />
                      <span>CHG</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className={`w-2 h-2 rounded-full ${simulationTelemetry.batteryState?.blueLed ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]' : 'bg-cyan-950'}`} />
                      <span>FULL</span>
                    </span>
                    <span className="text-slate-400 text-[7px]">OUT: 3.7-4.2V</span>
                  </div>
                </div>
              ) : comp.type === 'led' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 9. REALISTIC 5mm THROUGH-HOLE LED WITH INTENSE GLOW       */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[50px] h-[70px] flex flex-col items-center justify-between select-none">
                  {/* 3D Glass Bulb Dome */}
                  <div
                    className={`w-9 h-11 rounded-t-full rounded-b-md transition-all duration-150 relative border ${
                      simulationTelemetry.pinStates['GPIO4'] === 1 || comp.state?.illuminated
                        ? 'bg-rose-500 border-rose-300 shadow-[0_0_35px_10px_rgba(244,63,94,0.85),inset_0_0_12px_rgba(255,255,255,0.8)]'
                        : 'bg-rose-950/70 border-rose-800 shadow-clay-card'
                    }`}
                  >
                    {/* Specular glass reflection */}
                    <div className="w-2 h-4 rounded-full bg-white/40 absolute top-2 left-2 blur-[0.5px]" />
                    {/* Internal Anode / Cathode anvil cup */}
                    <div className="w-3 h-3 border-b border-l border-slate-300/40 absolute bottom-1.5 left-3" />
                  </div>

                  {/* Cathode Notch & Leads */}
                  <div className="w-8 flex justify-around">
                    <div className="w-0.5 h-4 bg-slate-300" />
                    <div className="w-0.5 h-3 bg-slate-400" />
                  </div>
                </div>
              ) : comp.type === 'resistor' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 10. REALISTIC THROUGH-HOLE AXIAL RESISTOR                 */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[80px] h-[32px] flex items-center justify-center select-none">
                  {/* Left lead wire */}
                  <div className="w-3 h-[2px] bg-slate-300 shadow" />
                  {/* Ceramic Body with 3D bulbous ends */}
                  <div className="w-12 h-6 bg-gradient-to-b from-[#e8cfb3] via-[#d6b490] to-[#b38e67] border border-[#a37e58] rounded-full flex items-center justify-around px-1 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.7),inset_-1px_-1px_3px_rgba(0,0,0,0.4),2px_3px_6px_rgba(0,0,0,0.3)]">
                    {/* Color Bands (e.g. Red, Red, Brown, Gold for 220 Ohm) */}
                    <div className="w-1 h-full bg-rose-600 shadow-sm" />
                    <div className="w-1 h-full bg-rose-600 shadow-sm" />
                    <div className="w-1 h-full bg-amber-800 shadow-sm" />
                    <div className="w-1 h-full bg-amber-400 shadow-sm" />
                  </div>
                </div>
              ) : comp.type === 'l298n' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 11. L298N DUAL H-BRIDGE MOTOR DRIVER                      */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[170px] h-[130px] clay-pcb bg-[#8b1515] border-2 border-red-500/40 rounded-2xl p-2 flex flex-col justify-between shadow-clay-card select-none relative overflow-hidden">
                  {/* Top: Screw Terminal Out 1 & 2 / Out 3 & 4 */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex space-x-1">
                      <div className="w-5 h-5 bg-blue-600 rounded border border-blue-400 flex items-center justify-center text-[7px] font-mono text-white font-bold shadow-inner">M1</div>
                      <div className="w-5 h-5 bg-blue-600 rounded border border-blue-400 flex items-center justify-center text-[7px] font-mono text-white font-bold shadow-inner">M2</div>
                    </div>
                    <span className="text-[8px] font-mono font-bold text-amber-300">L298N DRIVER</span>
                    <div className="flex space-x-1">
                      <div className="w-5 h-5 bg-blue-600 rounded border border-blue-400 flex items-center justify-center text-[7px] font-mono text-white font-bold shadow-inner">M3</div>
                      <div className="w-5 h-5 bg-blue-600 rounded border border-blue-400 flex items-center justify-center text-[7px] font-mono text-white font-bold shadow-inner">M4</div>
                    </div>
                  </div>

                  {/* Center: Aluminum Finned Heatsink & L298 Multiwatt IC */}
                  <div className="flex items-center justify-center">
                    <div className="w-24 h-11 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-md border border-slate-300 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.4),2px_2px_6px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative">
                      {/* Fins */}
                      <div className="w-full flex justify-around px-1">
                        <div className="w-1 h-8 bg-slate-500 rounded-sm" />
                        <div className="w-1 h-8 bg-slate-500 rounded-sm" />
                        <div className="w-1 h-8 bg-slate-500 rounded-sm" />
                        <div className="w-1 h-8 bg-slate-500 rounded-sm" />
                        <div className="w-1 h-8 bg-slate-500 rounded-sm" />
                      </div>
                      <span className="text-[6.5px] font-mono font-extrabold text-slate-800 tracking-wider absolute bottom-1">
                        ST L298N
                      </span>
                    </div>
                  </div>

                  {/* Middle Left: Power Terminal Block (12V, GND, 5V) */}
                  <div className="absolute left-1 top-10 flex flex-col space-y-1">
                    <div className="w-4 h-4 bg-blue-600 rounded border border-blue-400 flex items-center justify-center text-[6px] font-mono text-white font-bold shadow-inner">12</div>
                    <div className="w-4 h-4 bg-blue-600 rounded border border-blue-400 flex items-center justify-center text-[6px] font-mono text-white font-bold shadow-inner">G</div>
                    <div className="w-4 h-4 bg-blue-600 rounded border border-blue-400 flex items-center justify-center text-[6px] font-mono text-white font-bold shadow-inner">5V</div>
                  </div>

                  {/* Bottom: Silkscreen for Logic Pins */}
                  <div className="flex items-center justify-between px-2 text-[7px] font-mono font-bold text-amber-200/90 pt-1">
                    <span>ENA</span>
                    <span>IN1</span>
                    <span>IN2</span>
                    <span className="text-rose-400">● 5V</span>
                    <span>IN3</span>
                    <span>IN4</span>
                    <span>ENB</span>
                  </div>
                </div>
              ) : comp.type === 'dc-motor' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 12. TT DC GEAR MOTOR WITH ROTATING WHEEL                  */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[140px] h-[100px] flex items-center justify-between select-none relative">
                  {/* Left: Robotic Wheel with Rubber Tire */}
                  <div className="w-[84px] h-[84px] rounded-full bg-[#12161f] border-4 border-slate-700 shadow-clay-card flex items-center justify-center relative overflow-hidden">
                    {/* Rubber Tread Marks */}
                    <div className="absolute inset-0 border-2 border-dashed border-slate-500 rounded-full opacity-60" />
                    {/* Yellow Rim */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border-2 border-amber-600 flex items-center justify-center shadow-inner">
                      {/* Center Nut & Spokes */}
                      <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Right: Yellow Gearbox Motor Body */}
                  <div className="w-[50px] h-[74px] bg-gradient-to-r from-amber-400 to-amber-500 rounded-r-2xl border-2 border-amber-600 shadow-md p-1.5 flex flex-col justify-between">
                    <span className="text-[7px] font-mono font-extrabold text-amber-950 uppercase tracking-tighter">
                      TT 1:48
                    </span>
                    <div className="w-8 h-4 bg-slate-300 rounded border border-slate-400 mx-auto shadow-inner flex items-center justify-center text-[5px] font-mono text-slate-700">
                      DC 3-6V
                    </div>
                    <div className="flex flex-col space-y-1 items-end text-[7px] font-mono font-bold text-amber-950">
                      <span>M+</span>
                      <span>M-</span>
                    </div>
                  </div>
                </div>
              ) : comp.type === 'stepper-motor' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 13. 28BYJ-48 STEPPER MOTOR + ULN2003 DRIVER               */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[160px] h-[110px] clay-panel bg-[#0d2618] border-2 border-emerald-600/40 rounded-2xl p-2 flex items-center justify-between shadow-clay-card select-none">
                  {/* Left: Blue Stepper Motor Casing */}
                  <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 border-2 border-blue-400 shadow-inner flex items-center justify-center relative">
                    {/* Brass D-shaft */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 border border-amber-600 flex items-center justify-center shadow-md">
                      <div className="w-2.5 h-1 bg-amber-800 rounded-sm" />
                    </div>
                    <span className="absolute bottom-1 text-[6px] font-mono font-bold text-blue-100">28BYJ-48</span>
                  </div>

                  {/* Right: ULN2003 Driver Board */}
                  <div className="w-[70px] h-[92px] bg-[#0a1f13] border border-emerald-500/50 rounded-xl p-1.5 flex flex-col justify-between">
                    <span className="text-[7px] font-mono font-bold text-emerald-400 text-center">ULN2003</span>
                    {/* 4 Coil LEDs */}
                    <div className="flex justify-around px-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" title="Coil A" />
                      <span className="w-2 h-2 rounded-full bg-rose-950" title="Coil B" />
                      <span className="w-2 h-2 rounded-full bg-rose-950" title="Coil C" />
                      <span className="w-2 h-2 rounded-full bg-rose-950" title="Coil D" />
                    </div>
                    <div className="w-12 h-4 bg-slate-900 border border-slate-700 rounded mx-auto flex items-center justify-center text-[5.5px] font-mono text-slate-400">
                      ULN2003A
                    </div>
                    <div className="flex justify-between text-[6.5px] font-mono font-bold text-emerald-300 px-0.5">
                      <span>IN1-4</span>
                      <span>5V</span>
                    </div>
                  </div>
                </div>
              ) : comp.type === 'ir-tracker' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 14. TCRT5000 IR LINE TRACKING SENSOR                      */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[110px] h-[75px] clay-panel bg-[#0d2238] border-2 border-sky-600/40 rounded-2xl p-2 flex flex-col justify-between shadow-clay-card select-none">
                  {/* Top: Dual IR Optical Sensor Tubes */}
                  <div className="flex items-center justify-center space-x-3 pt-1">
                    <div className="w-4 h-4 rounded-full bg-purple-950 border border-purple-600/80 shadow-[0_0_8px_rgba(168,85,247,0.5)] flex items-center justify-center" title="IR LED Emitter">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    </div>
                    <div className="w-4 h-4 rounded-full bg-slate-900 border border-sky-400 shadow-inner flex items-center justify-center" title="Phototransistor Receiver">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400/80" />
                    </div>
                  </div>

                  <div className="text-[7.5px] font-mono font-bold text-sky-300 text-center">
                    TCRT5000 TRACKER
                  </div>

                  {/* Bottom: Silkscreen labels */}
                  <div className="flex items-center justify-between px-1 text-[7px] font-mono font-bold text-sky-400">
                    <span>VCC</span>
                    <span>GND</span>
                    <span>DO</span>
                    <span>AO</span>
                  </div>
                </div>
              ) : comp.type === 'pir-sensor' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 15. HC-SR501 PIR MOTION SENSOR                            */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[120px] h-[90px] clay-panel bg-[#0c2419] border-2 border-emerald-600/40 rounded-2xl p-2 flex flex-col items-center justify-between shadow-clay-card select-none">
                  {/* Center: Hemispherical Translucent Fresnel Lens */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/95 via-slate-200/90 to-slate-400/90 border border-white/60 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),2px_3px_8px_rgba(0,0,0,0.4)] flex items-center justify-center relative overflow-hidden">
                    {/* Facet grid pattern */}
                    <div className="absolute inset-0 border border-slate-400/40 rounded-full" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400/40" />
                  </div>

                  <span className="text-[7.5px] font-mono font-bold text-emerald-300">
                    HC-SR501 PIR
                  </span>

                  {/* Bottom: Silkscreen */}
                  <div className="w-full flex items-center justify-around text-[7.5px] font-mono font-bold text-emerald-400 px-2">
                    <span>VCC</span>
                    <span className="text-amber-400">OUT</span>
                    <span>GND</span>
                  </div>
                </div>
              ) : comp.type === 'gas-sensor' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 16. MQ-2 FLAMMABLE GAS & SMOKE SENSOR                     */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[120px] h-[85px] clay-panel bg-[#0e1d33] border-2 border-blue-600/40 rounded-2xl p-2 flex flex-col items-center justify-between shadow-clay-card select-none">
                  {/* Circular Stainless Steel Mesh Sensor Dome */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border-2 border-slate-300 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8),2px_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center relative">
                    <div className="w-8 h-8 rounded-full border border-dashed border-slate-700/60 flex items-center justify-center">
                      <span className="text-[6.5px] font-mono font-bold text-slate-800">MQ-2</span>
                    </div>
                  </div>

                  <span className="text-[7.5px] font-mono font-bold text-blue-300">
                    GAS & SMOKE
                  </span>

                  {/* Bottom: Silkscreen */}
                  <div className="w-full flex items-center justify-between px-2 text-[7.5px] font-mono font-bold text-blue-400">
                    <span>VCC</span>
                    <span>GND</span>
                    <span>DO</span>
                    <span>AO</span>
                  </div>
                </div>
              ) : comp.type === 'photoresistor' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 17. LDR LIGHT SENSOR MODULE                               */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[110px] h-[75px] clay-panel bg-[#0e2133] border-2 border-cyan-600/40 rounded-2xl p-2 flex flex-col justify-between shadow-clay-card select-none">
                  {/* Top: Cadmium-Sulfide Photoresistor Disk */}
                  <div className="flex items-center justify-center pt-1">
                    <div className="w-7 h-5 rounded-md bg-[#c2410c] border border-amber-600 shadow-inner flex items-center justify-center">
                      <svg className="w-5 h-3" viewBox="0 0 20 12">
                        <path d="M 2 6 Q 6 1, 10 6 T 18 6" fill="none" stroke="#fed7aa" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>

                  <span className="text-[7.5px] font-mono font-bold text-cyan-300 text-center">
                    LDR LIGHT
                  </span>

                  {/* Bottom: Silkscreen */}
                  <div className="flex items-center justify-between px-1 text-[7px] font-mono font-bold text-cyan-400">
                    <span>VCC</span>
                    <span>GND</span>
                    <span>DO</span>
                    <span>AO</span>
                  </div>
                </div>
              ) : comp.type === 'relay' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 18. 1-CHANNEL 5V OPTOCOUPLED RELAY                        */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[130px] h-[90px] clay-panel bg-[#0d1c33] border-2 border-blue-600/40 rounded-2xl p-2 flex items-center justify-between shadow-clay-card select-none">
                  {/* Left: Input Header & Optocoupler */}
                  <div className="flex flex-col justify-between h-full py-1 text-[7px] font-mono font-bold text-cyan-400">
                    <span>VCC</span>
                    <span>IN</span>
                    <span>GND</span>
                  </div>

                  {/* Center: Blue Songle Cube */}
                  <div className="w-[62px] h-[68px] bg-blue-600 rounded-lg border border-blue-400 shadow-md p-1 flex flex-col justify-between text-[6px] font-mono text-white leading-tight">
                    <span className="font-extrabold text-[7px] text-amber-300">SONGLE</span>
                    <span>SRD-05VDC</span>
                    <span>10A 250VAC</span>
                    <span className="text-[5.5px] text-blue-200">10A 30VDC</span>
                  </div>

                  {/* Right: Terminal Block (NO, COM, NC) */}
                  <div className="flex flex-col justify-between h-full py-1 text-[7px] font-mono font-bold text-slate-300">
                    <span>NO</span>
                    <span>COM</span>
                    <span>NC</span>
                  </div>
                </div>
              ) : comp.type === 'rgb-led' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 19. 5mm 4-PIN RGB LED WITH MULTI-COLOR EMISSION           */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[70px] h-[80px] flex flex-col items-center justify-between select-none">
                  {/* 3D Frosted Dome */}
                  <div
                    className="w-9 h-11 rounded-t-full rounded-b-md transition-all duration-150 relative border border-white/40 shadow-clay-card bg-slate-200/90"
                    style={{
                      boxShadow: comp.state?.illuminated
                        ? `0 0 30px 8px ${comp.properties?.currentColor || '#ff00ff'}, inset 0 0 10px rgba(255,255,255,0.8)`
                        : 'inset 0 0 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div className="w-2 h-4 rounded-full bg-white/60 absolute top-2 left-2 blur-[0.5px]" />
                  </div>

                  {/* 4 Metallic Leads */}
                  <div className="w-12 flex justify-between">
                    <div className="w-0.5 h-4 bg-slate-300" />
                    <div className="w-0.5 h-5 bg-slate-300" />
                    <div className="w-0.5 h-4 bg-slate-300" />
                    <div className="w-0.5 h-4 bg-slate-300" />
                  </div>
                </div>
              ) : comp.type === 'rotary-encoder' ? (
                /* ───────────────────────────────────────────────────────── */
                /* 20. KY-040 ROTARY ENCODER MODULE                          */
                /* ───────────────────────────────────────────────────────── */
                <div className="w-[110px] h-[85px] clay-panel bg-[#121c2d] border-2 border-slate-600/40 rounded-2xl p-2 flex flex-col items-center justify-between shadow-clay-card select-none">
                  {/* Center: Knurled Metallic Silver Potentiometer Knob */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-300 shadow-clay-btn flex items-center justify-center relative">
                    {/* Position Notch */}
                    <div className="w-1.5 h-3 bg-cyan-400 rounded-full absolute top-1 shadow-[0_0_6px_#38bdf8]" />
                    <div className="w-4 h-4 rounded-full bg-slate-700 border border-slate-500 shadow-inner" />
                  </div>

                  <span className="text-[7.5px] font-mono font-bold text-slate-300">
                    KY-040 ENCODER
                  </span>

                  {/* Bottom: Silkscreen */}
                  <div className="w-full flex items-center justify-between px-1 text-[7px] font-mono font-bold text-cyan-400">
                    <span>CLK</span>
                    <span>DT</span>
                    <span>SW</span>
                    <span>+</span>
                    <span>GND</span>
                  </div>
                </div>
              ) : null}

              {/* ───────────────────────────────────────────────────────── */}
              {/* INTERACTIVE PIN PORTS (REALISTIC GOLD VIA PADS + TOOLTIP)  */}
              {/* ───────────────────────────────────────────────────────── */}
              {pins.map((pin) => {
                const isHovered = hoveredPin?.componentId === comp.id && hoveredPin?.pinId === pin.id;
                const isWireTarget = wireStart?.componentId === comp.id && wireStart?.pinId === pin.id;
                const gpioName = pin.gpioNum !== undefined ? `GPIO${pin.gpioNum}` : null;
                const liveValue = gpioName ? simulationTelemetry.pinStates[gpioName] : undefined;

                return (
                  <div
                    key={pin.id}
                    className="absolute cursor-pointer z-20 group"
                    style={{ left: pin.x - 7, top: pin.y - 7 }}
                    onMouseEnter={() => setHoveredPin({ componentId: comp.id, pinId: pin.id })}
                    onMouseLeave={() => setHoveredPin(null)}
                    onClick={(e) => handlePinClick(comp, pin, e)}
                  >
                    {/* Metallic Gold Pin Socket / Solder Via */}
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                        isWireTarget
                          ? 'bg-cyan-400 ring-4 ring-cyan-400/50 scale-125 shadow-[0_0_12px_#38bdf8]'
                          : isHovered
                          ? 'bg-amber-300 ring-2 ring-amber-300 scale-125 shadow-[0_0_10px_#fbbf24]'
                          : 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-600/80 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.7),1px_1px_3px_rgba(0,0,0,0.5)]'
                      }`}
                    >
                      {/* Center Solder Hole */}
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0a0f18] shadow-inner" />
                    </div>

                    {/* Clean Floating Claymorphic Pin Tooltip on Hover ONLY */}
                    <div className="hidden group-hover:block absolute left-5 top-1/2 -translate-y-1/2 z-50 bg-[#12192c] border border-cyan-500/30 text-slate-100 text-[10px] font-mono px-3 py-2 rounded-2xl shadow-clay-card whitespace-nowrap pointer-events-none animate-fadeIn">
                      <div className="font-bold text-cyan-400 text-xs flex items-center space-x-1">
                        <span>{pin.label || pin.name}</span>
                        {pin.direction && (
                          <span className="text-[8px] uppercase px-1 rounded bg-[#1c2742] text-slate-300 font-sans">
                            {pin.direction}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{pin.description || pin.signalType}</div>
                      {liveValue !== undefined && (
                        <div className="text-[9px] font-bold mt-1">
                          State: <span className={liveValue === 1 ? 'text-cyan-400' : 'text-slate-400'}>
                            {liveValue === 1 ? 'HIGH (3.3V)' : 'LOW (0.0V)'}
                          </span>
                        </div>
                      )}
                      <div className="text-[8px] text-amber-400 mt-1 font-sans font-semibold">
                        Click to draw wire
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
