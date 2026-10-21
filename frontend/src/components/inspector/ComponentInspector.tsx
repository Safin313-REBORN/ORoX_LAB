import React from 'react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { COMPONENT_CATALOG } from '../../simulation/models/componentRegistry';
import { 
  RotateCw, Trash2, Sliders, Battery, Compass, Volume2, 
  Tv, Power, Zap, Activity, Info, Sparkles, X 
} from 'lucide-react';

export const ComponentInspector: React.FC = () => {
  const {
    project,
    selectedComponentId,
    simulationTelemetry,
    isInspectorOpen,
    toggleInspector,
    rotateComponent,
    deleteComponent,
    updateComponentProperty,
    updateComponentState
  } = useRoboLabStore();

  const selectedComp = project.components.find(c => c.id === selectedComponentId);

  // If no component is selected, display the Master ESP32 Board Inspector
  if (!selectedComp) {
    const board = BOARD_DEFINITIONS[project.boardId] || BOARD_DEFINITIONS['esp32doit-devkit-v1'];
    return (
      <div 
        className={`absolute right-0 top-0 bottom-0 z-30 w-80 sm:w-84 bg-[#0d1424]/95 backdrop-blur-xl border-l border-white/10 flex flex-col h-full p-4 select-none text-slate-300 shadow-[-8px_0_32px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out ${
          isInspectorOpen 
            ? 'translate-x-0 opacity-100 pointer-events-auto' 
            : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shadow-clay-pill">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-white">{board.name}</h2>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{board.module} • 240MHz</div>
            </div>
          </div>
          <button
            onClick={toggleInspector}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all shadow-clay-btn"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1 pt-3">
          {/* Architecture Card */}
          <div className="clay-card p-3 space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Board Architecture</div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Core:</span>
                <span className="text-slate-200 font-semibold">{board.chipFamily} Dual-Core</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Operating Voltage:</span>
                <span className="text-slate-200 font-semibold">{board.voltageOperating} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Default I2C:</span>
                <span className="text-cyan-400 font-semibold">SDA: 21, SCL: 22</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Default SPI:</span>
                <span className="text-cyan-400 font-semibold">MOSI: 23, SCK: 18</span>
              </div>
            </div>
          </div>

          {/* Live GPIO Pin States */}
          <div className="clay-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live GPIO Telemetry</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="clay-inset p-2 max-h-64 overflow-y-auto custom-scrollbar space-y-1.5">
              {board.pins.filter(p => p.gpioNum !== undefined).map(pin => {
                const gpioName = `GPIO${pin.gpioNum}`;
                const val = simulationTelemetry.pinStates[gpioName] ?? 0;
                return (
                  <div key={pin.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#111728] border border-white/[0.04] font-mono text-[11px]">
                    <span className="text-slate-300 font-semibold">{gpioName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      val === 1 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.4)]' 
                        : 'bg-[#1a233a] text-slate-500'
                    }`}>
                      {val === 1 ? 'HIGH (3.3V)' : 'LOW (0.0V)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const meta = COMPONENT_CATALOG[selectedComp.type];

  return (
    <div 
      className={`absolute right-0 top-0 bottom-0 z-30 w-80 sm:w-84 bg-[#0d1424]/95 backdrop-blur-xl border-l border-white/10 flex flex-col h-full p-4 select-none text-slate-300 shadow-[-8px_0_32px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out ${
        isInspectorOpen 
          ? 'translate-x-0 opacity-100 pointer-events-auto' 
          : 'translate-x-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Inspector Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div>
          <h2 className="text-xs font-extrabold text-white">{selectedComp.name}</h2>
          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{selectedComp.id}</div>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => rotateComponent(selectedComp.id)}
            title="Rotate 90° Clockwise"
            className="p-2 rounded-xl bg-[#161f36] hover:bg-[#1d2947] text-slate-300 hover:text-white border border-white/[0.08] shadow-clay-btn transition-all"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteComponent(selectedComp.id)}
            title="Delete Component"
            className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 shadow-clay-btn transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleInspector}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all shadow-clay-btn"
            title="Close Inspector"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1 pt-3">
        {/* Dynamic Interactive Component Controls */}
        <div className="clay-card p-3 space-y-3">
          <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Live Interactive Controls</span>
          </div>

          {/* PUSH BUTTON INTERACTION */}
          {selectedComp.type === 'push-button' && (
            <div className="space-y-2">
              <button
                onMouseDown={() => updateComponentState(selectedComp.id, 'pressed', true)}
                onMouseUp={() => updateComponentState(selectedComp.id, 'pressed', false)}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-all ${
                  selectedComp.state?.pressed
                    ? 'clay-btn-danger text-white scale-98 shadow-clay-inner'
                    : 'clay-btn-primary text-white shadow-clay-btn'
                }`}
              >
                {selectedComp.state?.pressed ? 'BUTTON DEPRESSED (LOW)' : 'PRESS & HOLD SWITCH'}
              </button>
              <div className="text-[10px] text-slate-400 text-center font-mono">
                Connects Terminal 1 to Terminal 2
              </div>
            </div>
          )}

          {/* TTP223 TOUCH SENSOR INTERACTION */}
          {selectedComp.type === 'ttp223' && (
            <div className="space-y-2">
              <button
                onClick={() => updateComponentState(selectedComp.id, 'touched', !selectedComp.state?.touched)}
                className={`w-full py-2.5 rounded-2xl font-bold text-xs transition-all ${
                  selectedComp.state?.touched
                    ? 'clay-btn-danger text-white'
                    : 'clay-btn-primary text-white'
                }`}
              >
                {selectedComp.state?.touched ? 'RELEASE TOUCH' : 'TOUCH SENSOR PAD'}
              </button>
            </div>
          )}

          {/* LED COLOR SELECTION */}
          {selectedComp.type === 'led' && (
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans">LED Color:</span>
                <select
                  value={selectedComp.properties.color || '#ef4444'}
                  onChange={(e) => updateComponentProperty(selectedComp.id, 'color', e.target.value)}
                  className="bg-[#090e18] text-slate-200 border border-white/[0.08] rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                >
                  <option value="#ef4444">Ruby Red</option>
                  <option value="#10b981">Emerald Green</option>
                  <option value="#3b82f6">Sapphire Blue</option>
                  <option value="#f59e0b">Amber Yellow</option>
                  <option value="#ffffff">Pure White</option>
                </select>
              </div>
            </div>
          )}

          {/* RESISTOR VALUE */}
          {selectedComp.type === 'resistor' && (
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans">Resistance:</span>
                <select
                  value={selectedComp.properties.resistance || 220}
                  onChange={(e) => updateComponentProperty(selectedComp.id, 'resistance', Number(e.target.value))}
                  className="bg-[#090e18] text-slate-200 border border-white/[0.08] rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                >
                  <option value="100">100 Ω (Brown Black Brown)</option>
                  <option value="220">220 Ω (Red Red Brown)</option>
                  <option value="330">330 Ω (Orange Orange Brown)</option>
                  <option value="1000">1 kΩ (Brown Black Red)</option>
                  <option value="10000">10 kΩ (Brown Black Orange)</option>
                </select>
              </div>
            </div>
          )}

          {/* MPU-6050 TILT SLIDERS */}
          {selectedComp.type === 'mpu6050' && (
            <div className="space-y-3 font-mono text-[11px]">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400 font-sans">Pitch Angle:</span>
                  <span className="text-cyan-400 font-bold">{selectedComp.properties.pitch || 0}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={selectedComp.properties.pitch || 0}
                  onChange={(e) => updateComponentProperty(selectedComp.id, 'pitch', Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400 font-sans">Roll Angle:</span>
                  <span className="text-amber-400 font-bold">{selectedComp.properties.roll || 0}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={selectedComp.properties.roll || 0}
                  onChange={(e) => updateComponentProperty(selectedComp.id, 'roll', Number(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* BATTERY CONTROLS */}
          {selectedComp.type === 'battery-tp4056' && (
            <div className="space-y-2">
              <button
                onClick={() => updateComponentProperty(selectedComp.id, 'usbPluggedIn', !selectedComp.properties.usbPluggedIn)}
                className={`w-full py-2.5 rounded-2xl font-bold text-xs transition-all ${
                  selectedComp.properties.usbPluggedIn
                    ? 'clay-btn-success text-white'
                    : 'bg-[#18233a] text-slate-300 border border-white/[0.08]'
                }`}
              >
                {selectedComp.properties.usbPluggedIn ? '⚡ 5V USB CHARGER CONNECTED' : '🔌 PLUG IN 5V USB CHARGER'}
              </button>
            </div>
          )}

          {/* L298N DUAL MOTOR DRIVER CONTROLS */}
          {selectedComp.type === 'l298n' && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">Motor A Direction:</span>
                <span className="text-emerald-400 font-bold">{selectedComp.state?.motorA_dir || 'STOP'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">Motor B Direction:</span>
                <span className="text-cyan-400 font-bold">{selectedComp.state?.motorB_dir || 'STOP'}</span>
              </div>
              <button
                onClick={() => updateComponentProperty(selectedComp.id, 'jumper5vEnabled', !selectedComp.properties.jumper5vEnabled)}
                className="w-full py-2 rounded-xl bg-[#162138] hover:bg-[#1e2c4a] text-slate-200 border border-white/10 text-xs font-semibold shadow-clay-btn transition-all"
              >
                {selectedComp.properties.jumper5vEnabled ? '✓ 5V Jumper Enabled (Regulator ON)' : '✗ 5V Jumper Removed (External 5V)'}
              </button>
            </div>
          )}

          {/* DC GEAR MOTOR CONTROLS */}
          {selectedComp.type === 'dc-motor' && (
            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Motor Status:</span>
                <span className="text-amber-400 font-bold">{selectedComp.state?.direction || 'STOP'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shaft RPM:</span>
                <span className="text-white font-bold">{selectedComp.state?.rpm || 0} RPM</span>
              </div>
              <div className="space-y-1 font-sans">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Load Torque:</span>
                  <span className="text-slate-200 font-mono">{selectedComp.properties.loadTorque || 0.2} kg·cm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={selectedComp.properties.loadTorque || 0.2}
                  onChange={(e) => updateComponentProperty(selectedComp.id, 'loadTorque', Number(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* STEPPER MOTOR CONTROLS */}
          {selectedComp.type === 'stepper-motor' && (
            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Rotor Position:</span>
                <span className="text-emerald-400 font-bold">{Math.round(selectedComp.state?.angleDeg || 0)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Step Counter:</span>
                <span className="text-white font-bold">{selectedComp.state?.stepPosition || 0} steps</span>
              </div>
              <button
                onClick={() => {
                  const newPos = (selectedComp.state?.stepPosition || 0) + 1;
                  const newAngle = (newPos * 5.625 / 64) % 360;
                  updateComponentState(selectedComp.id, 'stepPosition', newPos);
                  updateComponentState(selectedComp.id, 'angleDeg', newAngle);
                }}
                className="w-full py-2 rounded-xl clay-btn-primary text-white text-xs font-bold shadow-clay-btn transition-all font-sans"
              >
                Manual Step Clockwise (+1)
              </button>
            </div>
          )}

          {/* IR LINE TRACKER CONTROLS */}
          {selectedComp.type === 'ir-tracker' && (
            <div className="space-y-2 font-sans">
              <div className="text-[11px] text-slate-400 mb-1">Simulated Surface Type:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    updateComponentState(selectedComp.id, 'surfaceType', 'white');
                    updateComponentState(selectedComp.id, 'outputState', 0);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedComp.state?.surfaceType === 'white' || !selectedComp.state?.surfaceType
                      ? 'bg-slate-200 text-slate-900 shadow-clay-btn'
                      : 'bg-[#141b2e] text-slate-400 border border-white/10'
                  }`}
                >
                  ⬜ White Surface (DO=0)
                </button>
                <button
                  onClick={() => {
                    updateComponentState(selectedComp.id, 'surfaceType', 'black');
                    updateComponentState(selectedComp.id, 'outputState', 1);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedComp.state?.surfaceType === 'black'
                      ? 'bg-purple-600 text-white shadow-clay-btn'
                      : 'bg-[#141b2e] text-slate-400 border border-white/10'
                  }`}
                >
                  ⬛ Black Line (DO=1)
                </button>
              </div>
            </div>
          )}

          {/* PIR MOTION SENSOR CONTROLS */}
          {selectedComp.type === 'pir-sensor' && (
            <div className="space-y-2">
              <button
                onMouseDown={() => {
                  updateComponentState(selectedComp.id, 'motionDetected', true);
                  updateComponentState(selectedComp.id, 'outputHigh', true);
                }}
                onMouseUp={() => {
                  setTimeout(() => {
                    updateComponentState(selectedComp.id, 'motionDetected', false);
                    updateComponentState(selectedComp.id, 'outputHigh', false);
                  }, 2000);
                }}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-all ${
                  selectedComp.state?.motionDetected
                    ? 'clay-btn-danger text-white shadow-clay-inner'
                    : 'clay-btn-primary text-white shadow-clay-btn'
                }`}
              >
                {selectedComp.state?.motionDetected ? '🚶 MOTION ACTIVE! (OUT=HIGH)' : '🚶 SIMULATE HUMAN MOTION'}
              </button>
            </div>
          )}

          {/* MQ-2 GAS SENSOR CONTROLS */}
          {selectedComp.type === 'gas-sensor' && (
            <div className="space-y-2 font-sans">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Gas Concentration:</span>
                <span className="text-amber-400 font-mono font-bold">{selectedComp.state?.ppm || 85} PPM</span>
              </div>
              <input
                type="range"
                min="20"
                max="800"
                step="10"
                value={selectedComp.state?.ppm || 85}
                onChange={(e) => {
                  const ppm = Number(e.target.value);
                  const voltage = Math.min(3.3, 0.4 + (ppm / 800) * 2.8);
                  updateComponentState(selectedComp.id, 'ppm', ppm);
                  updateComponentState(selectedComp.id, 'analogVoltage', Number(voltage.toFixed(2)));
                  updateComponentState(selectedComp.id, 'alarmActive', ppm > (selectedComp.properties.thresholdPpm || 200));
                }}
                className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Analog Voltage:</span>
                <span className="text-white font-bold">{selectedComp.state?.analogVoltage || 0.55} V</span>
              </div>
            </div>
          )}

          {/* LDR LIGHT SENSOR CONTROLS */}
          {selectedComp.type === 'photoresistor' && (
            <div className="space-y-2 font-sans">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Ambient Illumination:</span>
                <span className="text-cyan-400 font-mono font-bold">{selectedComp.state?.lux || 450} Lux</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="25"
                value={selectedComp.state?.lux || 450}
                onChange={(e) => {
                  const lux = Number(e.target.value);
                  const voltage = Math.min(3.3, 3.3 * (1 - lux / 1000));
                  updateComponentState(selectedComp.id, 'lux', lux);
                  updateComponentState(selectedComp.id, 'analogVoltage', Number(voltage.toFixed(2)));
                  updateComponentState(selectedComp.id, 'isDark', lux < (selectedComp.properties.thresholdLux || 300));
                }}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Output Signal:</span>
                <span className="text-white font-bold">{selectedComp.state?.isDark ? 'HIGH (Darkness)' : 'LOW (Bright)'}</span>
              </div>
            </div>
          )}

          {/* RELAY MODULE CONTROLS */}
          {selectedComp.type === 'relay' && (
            <div className="space-y-2">
              <button
                onClick={() => {
                  const energized = !selectedComp.state?.energized;
                  updateComponentState(selectedComp.id, 'energized', energized);
                  updateComponentState(selectedComp.id, 'contactState', energized ? 'NO' : 'NC');
                }}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-all ${
                  selectedComp.state?.energized
                    ? 'clay-btn-success text-white shadow-clay-inner'
                    : 'bg-[#18233a] hover:bg-[#202f4d] text-slate-200 border border-white/10 shadow-clay-btn'
                }`}
              >
                {selectedComp.state?.energized ? '⚡ RELAY ENERGIZED [NO Connected]' : 'OFF: RELAY DE-ENERGIZED [NC Connected]'}
              </button>
            </div>
          )}

          {/* RGB LED CONTROLS */}
          {selectedComp.type === 'rgb-led' && (
            <div className="space-y-2.5 font-sans">
              <div className="text-[11px] text-slate-400">Color Presets:</div>
              <div className="flex flex-wrap gap-1.5">
                {['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#ffffff'].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      updateComponentProperty(selectedComp.id, 'currentColor', color);
                      updateComponentState(selectedComp.id, 'illuminated', true);
                    }}
                    className="w-6 h-6 rounded-full border-2 border-white/40 shadow-clay-pill hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ROTARY ENCODER CONTROLS */}
          {selectedComp.type === 'rotary-encoder' && (
            <div className="space-y-2.5 font-sans">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Encoder Position:</span>
                <span className="text-cyan-400 font-bold">{selectedComp.state?.position || 0}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const pos = (selectedComp.state?.position || 0) - 1;
                    updateComponentState(selectedComp.id, 'position', pos);
                    updateComponentState(selectedComp.id, 'direction', 'CCW');
                  }}
                  className="py-2.5 rounded-xl bg-[#141d30] hover:bg-[#1a2640] text-slate-200 border border-white/10 text-xs font-bold shadow-clay-btn"
                >
                  ⟲ Turn Left (CCW)
                </button>
                <button
                  onClick={() => {
                    const pos = (selectedComp.state?.position || 0) + 1;
                    updateComponentState(selectedComp.id, 'position', pos);
                    updateComponentState(selectedComp.id, 'direction', 'CW');
                  }}
                  className="py-2.5 rounded-xl bg-[#141d30] hover:bg-[#1a2640] text-slate-200 border border-white/10 text-xs font-bold shadow-clay-btn"
                >
                  ⟳ Turn Right (CW)
                </button>
              </div>
              <button
                onMouseDown={() => updateComponentState(selectedComp.id, 'buttonPressed', true)}
                onMouseUp={() => updateComponentState(selectedComp.id, 'buttonPressed', false)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedComp.state?.buttonPressed
                    ? 'clay-btn-danger text-white shadow-clay-inner'
                    : 'bg-[#18233a] text-slate-300 border border-white/10 shadow-clay-btn'
                }`}
              >
                {selectedComp.state?.buttonPressed ? 'SWITCH PRESSED (LOW)' : 'PRESS ENCODER SWITCH'}
              </button>
            </div>
          )}
        </div>

        {/* Pinout Specifications Table */}
        <div className="clay-card p-3 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pinout Details</div>
          <div className="clay-inset p-2 space-y-1.5 font-mono text-[10px]">
            {meta?.pins.map(pin => (
              <div key={pin.id} className="flex items-center justify-between p-1.5 rounded-lg bg-[#111728] border border-white/[0.04]">
                <div>
                  <span className="font-bold text-cyan-400 text-xs">{pin.label || pin.name}</span>
                  <span className="text-[9px] text-slate-400 ml-1.5">{pin.description}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#1b253d] text-slate-300 uppercase font-sans text-[9px] font-bold">
                  {pin.signalType}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
