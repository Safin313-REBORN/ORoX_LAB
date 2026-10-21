import React from 'react';
import { useRoboLabStore } from '../../store/useRoboLabStore';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { COMPONENT_CATALOG } from '../../simulation/models/componentRegistry';
import { RotateCw, Trash2, Sliders, Battery, Compass, Volume2, Tv, Power } from 'lucide-react';

export const ComponentInspector: React.FC = () => {
  const {
    project,
    selectedComponentId,
    simulationTelemetry,
    rotateComponent,
    deleteComponent,
    updateComponentProperty,
    updateComponentState
  } = useRoboLabStore();

  const selectedComp = project.components.find(c => c.id === selectedComponentId);

  if (!selectedComp) {
    // Show Board Inspector by default
    const board = BOARD_DEFINITIONS[project.boardId] || BOARD_DEFINITIONS['esp32doit-devkit-v1'];
    return (
      <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-full p-3 select-none text-slate-300">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5 mb-3">
          <div className="w-7 h-7 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
            MCU
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100">{board.name}</h2>
            <div className="text-[10px] text-cyan-400 font-mono">{board.module}</div>
          </div>
        </div>

        <div className="space-y-3 text-xs overflow-y-auto custom-scrollbar flex-1">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Architecture</div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Chip:</span>
                <span className="text-slate-200">{board.chipFamily}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Clock:</span>
                <span className="text-slate-200">240 MHz Dual-Core</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Voltage:</span>
                <span className="text-slate-200">3.3 V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">I2C Default:</span>
                <span className="text-cyan-400">SDA: 21, SCL: 22</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SPI Default:</span>
                <span className="text-cyan-400">MOSI: 23, SCK: 18</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Live GPIO Pinout</div>
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800 max-h-60 overflow-y-auto custom-scrollbar space-y-1">
              {board.pins.filter(p => p.gpioNum !== undefined).map(pin => {
                const gpioName = `GPIO${pin.gpioNum}`;
                const val = simulationTelemetry.pinStates[gpioName] ?? 0;
                return (
                  <div key={pin.id} className="flex items-center justify-between px-2 py-0.5 rounded hover:bg-slate-900 font-mono text-[10px]">
                    <span className="text-slate-300">{gpioName}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold ${val === 1 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
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
    <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-full p-3 select-none text-slate-300">
      {/* Inspector Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div>
          <h2 className="text-xs font-bold text-slate-100">{selectedComp.name}</h2>
          <div className="text-[10px] text-slate-400 font-mono">{selectedComp.id}</div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => rotateComponent(selectedComp.id)}
            title="Rotate 90°"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteComponent(selectedComp.id)}
            title="Delete Component"
            className="p-1.5 rounded hover:bg-red-900/40 text-red-400 border border-slate-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Specific Component Controls */}
      <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
        {/* MPU6050 Orientation Dials */}
        {selectedComp.type === 'mpu6050' && (
          <div className="p-3 bg-slate-950 border border-sky-900/50 rounded-lg space-y-3">
            <div className="flex items-center space-x-1.5 text-sky-400 font-bold text-[11px]">
              <Compass className="w-4 h-4" />
              <span>3D Motion & Orientation</span>
            </div>

            {/* Pitch Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Pitch (X-Axis):</span>
                <span className="font-mono text-sky-300">{selectedComp.properties.pitch || 0}°</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                value={selectedComp.properties.pitch || 0}
                onChange={(e) => updateComponentProperty(selectedComp.id, 'pitch', parseInt(e.target.value))}
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Roll Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Roll (Y-Axis):</span>
                <span className="font-mono text-sky-300">{selectedComp.properties.roll || 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedComp.properties.roll || 0}
                onChange={(e) => updateComponentProperty(selectedComp.id, 'roll', parseInt(e.target.value))}
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Yaw Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Yaw (Z-Axis):</span>
                <span className="font-mono text-sky-300">{selectedComp.properties.yaw || 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedComp.properties.yaw || 0}
                onChange={(e) => updateComponentProperty(selectedComp.id, 'yaw', parseInt(e.target.value))}
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <button
              onClick={() => {
                updateComponentProperty(selectedComp.id, 'pitch', 0);
                updateComponentProperty(selectedComp.id, 'roll', 0);
                updateComponentProperty(selectedComp.id, 'yaw', 0);
              }}
              className="w-full py-1 text-[11px] font-medium bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 rounded"
            >
              Reset to Neutral (0°, 0°)
            </button>
          </div>
        )}

        {/* Battery & TP4056 Controls */}
        {selectedComp.type === 'battery-tp4056' && (
          <div className="p-3 bg-slate-950 border border-emerald-900/50 rounded-lg space-y-3">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
              <Battery className="w-4 h-4" />
              <span>Battery & Charger System</span>
            </div>

            <div className="space-y-1 font-mono text-[11px] p-2 bg-slate-900 rounded border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Terminal Voltage:</span>
                <span className="text-emerald-400">{simulationTelemetry.batteryState?.terminalVoltage || 3.85} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">State of Charge:</span>
                <span className="text-emerald-300">{simulationTelemetry.batteryState?.socPercent || 65}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Charging Phase:</span>
                <span className="text-amber-400">{simulationTelemetry.batteryState?.chargingState || 'CC'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Charge Current:</span>
                <span className="text-slate-200">{simulationTelemetry.batteryState?.chargeCurrentMa || 850} mA</span>
              </div>
            </div>

            {/* USB Power Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300">USB 5V Supply:</span>
              <button
                onClick={() => {
                  const curr = selectedComp.properties.usbPluggedIn ?? true;
                  updateComponentProperty(selectedComp.id, 'usbPluggedIn', !curr);
                  if (simulationTelemetry.batteryState) {
                    simulationTelemetry.batteryState.isUsbConnected = !curr;
                  }
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                  (selectedComp.properties.usbPluggedIn ?? true)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {(selectedComp.properties.usbPluggedIn ?? true) ? 'CONNECTED' : 'DISCONNECTED'}
              </button>
            </div>
          </div>
        )}

        {/* Button Component Direct Press */}
        {selectedComp.type === 'push-button' && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <span className="text-[11px] font-bold text-slate-200">Interactive Tactile Push</span>
            <button
              onMouseDown={() => updateComponentState(selectedComp.id, 'pressed', true)}
              onMouseUp={() => updateComponentState(selectedComp.id, 'pressed', false)}
              className={`w-full py-2.5 rounded font-bold text-xs uppercase shadow transition-all ${
                selectedComp.state?.pressed
                  ? 'bg-blue-600 text-white scale-95'
                  : 'bg-blue-500 hover:bg-blue-400 text-white'
              }`}
            >
              {selectedComp.state?.pressed ? 'PRESSED (GPIO LOW)' : 'HOLD TO PRESS'}
            </button>
          </div>
        )}

        {/* Pin Connections Overview */}
        <div>
          <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Pinout Specifications</div>
          <div className="p-2 bg-slate-950 border border-slate-800 rounded space-y-1.5 font-mono text-[10px]">
            {meta?.pins.map((pin) => (
              <div key={pin.id} className="flex justify-between items-center py-0.5 border-b border-slate-800/40 last:border-none">
                <span className="font-bold text-slate-300">{pin.label || pin.name}</span>
                <span className="text-slate-500">{pin.signalType}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
