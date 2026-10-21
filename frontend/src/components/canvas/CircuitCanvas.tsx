import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { ComponentInstance, Wire, WireEndpoint, ComponentPin } from '../../types/circuit';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { COMPONENT_CATALOG } from '../../simulation/models/componentRegistry';
import { calculateAbsolutePinPosition, resolvePinDefinition } from '../../simulation/circuit/netlist';
import { ZoomIn, ZoomOut, Maximize2, Trash2, Palette } from 'lucide-react';

const WIRE_COLORS = [
  { name: 'Power VCC (Red)', hex: '#ef4444' },
  { name: 'Ground (Green)', hex: '#10b981' },
  { name: 'I2C SCL / Clock (Yellow)', hex: '#f59e0b' },
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
    // Only track cursor coordinates when actively drawing a wire to prevent unnecessary re-renders
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
      className="relative flex-1 h-full bg-[#0b0f19] overflow-hidden select-none cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setZoom(zoom + delta);
      }}
    >
      {/* Grid Canvas */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Selected Wire Action Bar */}
      {selectedWire && (
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-slate-900/95 border border-slate-700 rounded-lg p-1.5 backdrop-blur shadow-xl">
          <span className="text-[11px] font-mono font-bold text-slate-300 pl-1">Wire:</span>
          <div className="flex items-center space-x-1">
            {WIRE_COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => updateWireColor(selectedWire.id, c.hex)}
                className={`w-4 h-4 rounded-full border ${selectedWire.color === c.hex ? 'ring-2 ring-white scale-110' : 'border-slate-600'}`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={() => deleteWire(selectedWire.id)}
            className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 backdrop-blur shadow-lg">
        <button
          onClick={() => setZoom(zoom + 0.15)}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-400 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom - 0.15)}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-800 mx-1" />
        <button
          onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Transform Container */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        {/* SVG Wire Layer */}
        <svg className="absolute inset-0 overflow-visible pointer-events-none w-[4000px] h-[4000px]">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {project.wires.map((wire) => {
            const p1 = getEndpointPos(wire.start);
            const p2 = getEndpointPos(wire.end);
            const isSelected = selectedWireId === wire.id;
            const dx = Math.abs(p2.x - p1.x) * 0.5;
            const pathD = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;

            return (
              <g key={wire.id} className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); selectWire(wire.id); }}>
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="12" />
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSelected ? '#38bdf8' : wire.color}
                  strokeWidth={isSelected ? '3.5' : '2.5'}
                  filter={isSelected ? 'url(#glow)' : undefined}
                />
                <circle cx={p1.x} cy={p1.y} r="3" fill={wire.color} />
                <circle cx={p2.x} cy={p2.y} r="3" fill={wire.color} />
              </g>
            );
          })}

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
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                  className="animate-pulse"
                />
              );
            })()
          )}
        </svg>

        {/* Components Layer */}
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
                isSelected ? 'ring-2 ring-cyan-500 rounded-lg shadow-xl shadow-cyan-950/40' : ''
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
              {isESP32 ? (
                <div className="w-[150px] h-[300px] bg-[#12161f] border-2 border-slate-700/80 rounded-xl shadow-2xl relative flex flex-col items-center justify-between p-2">
                  <div className="w-8 h-4 bg-slate-400 rounded-t-sm border border-slate-500 shadow-inner flex items-center justify-center">
                    <div className="w-4 h-1.5 bg-slate-700 rounded-sm" />
                  </div>
                  <div className="w-24 h-28 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded border border-slate-400 shadow-md flex flex-col items-center justify-center p-2 text-center text-slate-800">
                    <span className="font-bold text-[10px] tracking-widest uppercase">ESPRESSIF</span>
                    <span className="font-mono text-[9px] font-semibold">ESP-WROOM-32</span>
                    <span className="text-[7px] text-slate-700">WiFi + Bluetooth</span>
                  </div>
                  <div className="w-full flex items-center justify-between px-3 py-1">
                    <div className="flex flex-col items-center">
                      <div className="w-3.5 h-3.5 bg-slate-600 rounded-sm border border-slate-400 shadow cursor-pointer active:bg-slate-400" />
                      <span className="text-[7px] text-slate-400 font-mono mt-0.5">EN</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" title="Power 3.3V" />
                      <div
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
                          simulationTelemetry.pinStates['GPIO2'] === 1
                            ? 'bg-blue-400 shadow-[0_0_12px_#38bdf8]'
                            : 'bg-blue-950/60 border border-blue-800'
                        }`}
                        title="GPIO 2 (Built-in LED)"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-3.5 h-3.5 bg-slate-600 rounded-sm border border-slate-400 shadow cursor-pointer active:bg-slate-400" />
                      <span className="text-[7px] text-slate-400 font-mono mt-0.5">BOOT</span>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 tracking-wider font-mono">
                    DOIT ESP32 DEVKIT V1
                  </div>
                </div>
              ) : comp.type === 'ssd1306' ? (
                <div className="w-[140px] h-[90px] bg-blue-950 border-2 border-blue-900 rounded-md shadow-xl p-1.5 flex flex-col justify-between">
                  <div className="text-[8px] font-mono font-bold text-blue-300 text-center tracking-wider">
                    SSD1306 0.96" OLED I2C (0x3C)
                  </div>
                  <div className="w-full h-[58px] bg-[#000508] border border-blue-800/80 rounded flex items-center justify-center overflow-hidden">
                    <canvas
                      ref={oledCanvasRef}
                      width={128}
                      height={64}
                      className="w-full h-full image-render-pixel"
                    />
                  </div>
                </div>
              ) : comp.type === 'mpu6050' ? (
                <div className="w-[120px] h-[90px] bg-sky-950 border-2 border-sky-800 rounded-md shadow-xl p-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[8px] font-mono font-bold text-sky-300">
                    <span>MPU-6050</span>
                    <span>{comp.properties.ad0 === 1 ? '0x69' : '0x68'}</span>
                  </div>
                  <div className="w-10 h-10 bg-slate-900 border border-sky-700/80 rounded flex flex-col items-center justify-center mx-auto text-sky-400 font-mono text-[8px] font-bold shadow-inner">
                    <span>GY-521</span>
                    <span className="text-[6px] text-slate-500">6-DOF</span>
                  </div>
                  <div className="text-[7px] font-mono text-center text-sky-400">
                    P:{comp.properties.pitch || 0}° R:{comp.properties.roll || 0}°
                  </div>
                </div>
              ) : comp.type === 'push-button' ? (
                <div className="w-[60px] h-[60px] bg-slate-800 border-2 border-slate-700 rounded-lg shadow-lg flex items-center justify-center p-1">
                  <button
                    onMouseDown={() => updateComponentState(comp.id, 'pressed', true)}
                    onMouseUp={() => updateComponentState(comp.id, 'pressed', false)}
                    className={`w-10 h-10 rounded-full transition-transform active:scale-90 flex items-center justify-center border-2 ${
                      comp.state?.pressed
                        ? 'bg-blue-600 border-blue-400 shadow-inner'
                        : 'bg-blue-500 hover:bg-blue-400 border-blue-300 shadow-md'
                    }`}
                  >
                    <span className="text-[8px] font-bold text-white uppercase">SW1</span>
                  </button>
                </div>
              ) : comp.type === 'ttp223' ? (
                <div
                  onClick={() => updateComponentState(comp.id, 'touched', !comp.state?.touched)}
                  className={`w-[70px] h-[70px] rounded-lg border-2 p-1.5 flex flex-col items-center justify-between cursor-pointer transition-all ${
                    comp.state?.touched
                      ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_15px_#f43f5e]'
                      : 'bg-rose-900/40 border-rose-800 hover:border-rose-600'
                  }`}
                >
                  <span className="text-[8px] font-bold text-rose-300 font-mono">TTP223</span>
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-rose-400/60 flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full ${comp.state?.touched ? 'bg-rose-500' : 'bg-rose-900'}`} />
                  </div>
                  <span className="text-[7px] font-mono text-rose-400">
                    {comp.state?.touched ? 'ACTIVE' : 'TOUCH'}
                  </span>
                </div>
              ) : comp.type === 'active-buzzer' || comp.type === 'passive-buzzer' ? (
                <div className="w-[60px] h-[60px] rounded-full bg-slate-900 border-2 border-slate-700 shadow-xl flex flex-col items-center justify-center relative">
                  <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                  </div>
                  <span className="text-[7px] font-mono font-bold text-slate-400 mt-1">
                    {comp.type === 'active-buzzer' ? 'ACT BZZ' : 'PAS BZZ'}
                  </span>
                  {simulationTelemetry.pinStates['GPIO25'] === 1 && (
                    <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-60" />
                  )}
                </div>
              ) : comp.type === 'max98357a' ? (
                <div className="w-[90px] h-[90px] bg-purple-950 border-2 border-purple-800 rounded-lg p-2 flex flex-col justify-between shadow-xl">
                  <span className="text-[8px] font-mono font-bold text-purple-300 text-center">MAX98357A I2S</span>
                  <div className="w-10 h-10 rounded-full border-2 border-purple-600 mx-auto flex items-center justify-center bg-slate-950">
                    <div className="w-4 h-4 rounded-full bg-purple-700" />
                  </div>
                  <span className="text-[7px] font-mono text-purple-400 text-center">Mono Class D</span>
                </div>
              ) : comp.type === 'battery-tp4056' ? (
                <div className="w-[140px] h-[95px] bg-emerald-950 border-2 border-emerald-800 rounded-lg p-2 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between text-[8px] font-mono font-bold text-emerald-300">
                    <span>TP4056 + LiPo</span>
                    <span>{simulationTelemetry.batteryState?.socPercent || 65}%</span>
                  </div>
                  <div className="w-full bg-slate-900 border border-emerald-700 rounded h-4 overflow-hidden relative">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${simulationTelemetry.batteryState?.socPercent || 65}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white drop-shadow">
                      {simulationTelemetry.batteryState?.terminalVoltage || 3.85} V
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[7px] font-mono text-emerald-400">
                    <span className="flex items-center space-x-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${simulationTelemetry.batteryState?.redLed ? 'bg-red-500' : 'bg-red-950'}`} />
                      <span>CHG</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${simulationTelemetry.batteryState?.blueLed ? 'bg-blue-500' : 'bg-blue-950'}`} />
                      <span>FULL</span>
                    </span>
                  </div>
                </div>
              ) : comp.type === 'led' ? (
                <div className="w-[40px] h-[60px] flex flex-col items-center justify-center">
                  <div
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      simulationTelemetry.pinStates['GPIO4'] === 1
                        ? 'bg-red-500 border-red-300 shadow-[0_0_20px_#ef4444]'
                        : 'bg-red-950/80 border-red-900'
                    }`}
                  />
                  <div className="w-3 h-5 border-l-2 border-r-2 border-slate-400" />
                </div>
              ) : comp.type === 'resistor' ? (
                <div className="w-[60px] h-[30px] flex items-center justify-center">
                  <div className="w-3 h-0.5 bg-slate-400" />
                  <div className="w-8 h-4 bg-amber-200 border border-amber-400 rounded-sm flex items-center justify-around px-0.5">
                    <div className="w-0.5 h-full bg-red-600" />
                    <div className="w-0.5 h-full bg-red-600" />
                    <div className="w-0.5 h-full bg-amber-700" />
                    <div className="w-0.5 h-full bg-yellow-500" />
                  </div>
                  <div className="w-3 h-0.5 bg-slate-400" />
                </div>
              ) : null}

              {pins.map((pin) => {
                const isHovered = hoveredPin?.componentId === comp.id && hoveredPin?.pinId === pin.id;
                const isWireTarget = wireStart?.componentId === comp.id && wireStart?.pinId === pin.id;

                return (
                  <div
                    key={pin.id}
                    className="absolute cursor-pointer z-10 group"
                    style={{ left: pin.x - 5, top: pin.y - 5 }}
                    onMouseEnter={() => setHoveredPin({ componentId: comp.id, pinId: pin.id })}
                    onMouseLeave={() => setHoveredPin(null)}
                    onClick={(e) => handlePinClick(comp, pin, e)}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full transition-transform ${
                        isWireTarget
                          ? 'bg-cyan-400 ring-4 ring-cyan-500/40 scale-125'
                          : isHovered
                          ? 'bg-amber-300 ring-2 ring-amber-400 scale-125'
                          : 'bg-slate-300 border border-slate-600'
                      }`}
                    />
                    <div className="hidden group-hover:block absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-slate-900 border border-slate-700 text-slate-200 text-[9px] font-mono px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none">
                      <div className="font-bold text-cyan-400">{pin.label || pin.name}</div>
                      <div className="text-[8px] text-slate-400">{pin.signalType}</div>
                      {pin.gpioNum !== undefined && (
                        <div className="text-[8px] text-amber-400">GPIO {pin.gpioNum}</div>
                      )}
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
