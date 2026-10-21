import React, { useState } from 'react';
import { 
  Calculator, Cpu, Battery, Compass, Sliders, Zap, 
  Bot, Cog, Activity, BookOpen, Check, Copy, Sparkles, X 
} from 'lucide-react';

export interface RoboticsFormulasStudioProps {
  onClose?: () => void;
}

export const RoboticsFormulasStudio: React.FC<RoboticsFormulasStudioProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState<'kinematics' | 'motors' | 'electrical' | 'sensors' | 'control'>('kinematics');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // 1. CALCULATOR STATES
  // ─────────────────────────────────────────────────────────────
  // Kinematics: Differential Drive
  const [wheelRadiusCm, setWheelRadiusCm] = useState(3.3); // standard TT motor wheel 66mm
  const [trackWidthCm, setTrackWidthCm] = useState(14.0); // 140mm chassis width
  const [rpmLeft, setRpmLeft] = useState(120);
  const [rpmRight, setRpmRight] = useState(150);

  // Electrical: LED Resistor
  const [vSupply, setVSupply] = useState(5.0);
  const [vForward, setVForward] = useState(2.0); // Red LED
  const [iCurrentMa, setICurrentMa] = useState(15.0);

  // Electrical: Voltage Divider Level Shifter
  const [vInDivider, setVInDivider] = useState(5.0);
  const [r1Ohm, setR1Ohm] = useState(1000);
  const [r2Ohm, setR2Ohm] = useState(2000);

  // Motor: Sizing & Torque
  const [motorVoltage, setMotorVoltage] = useState(6.0);
  const [motorResistance, setMotorResistance] = useState(2.5);
  const [motorKv, setMotorKv] = useState(50); // RPM/V

  // Sensor: Ultrasonic Distance
  const [echoTimeUs, setEchoTimeUs] = useState(1450); // microseconds

  // Battery: Autonomy
  const [battCapMah, setBattCapMah] = useState(2400); // dual 18650
  const [loadCurrentMa, setLoadCurrentMa] = useState(650);

  // ─────────────────────────────────────────────────────────────
  // CALCULATIONS
  // ─────────────────────────────────────────────────────────────
  // 1. Differential Drive Forward Kinematics
  // w (rad/s) = RPM * 2pi / 60
  const omegaL = (rpmLeft * 2 * Math.PI) / 60;
  const omegaR = (rpmRight * 2 * Math.PI) / 60;
  const rMeters = wheelRadiusCm / 100;
  const trackMeters = trackWidthCm / 100;
  const linearVelocityMps = (rMeters * (omegaR + omegaL)) / 2;
  const angularVelocityRps = (rMeters * (omegaR - omegaL)) / trackMeters;
  const turnRadiusCm = Math.abs(angularVelocityRps) > 0.001 
    ? (linearVelocityMps / angularVelocityRps) * 100 
    : Infinity;

  // 2. LED Resistor
  const calculatedResistorOhm = Math.max(0, (vSupply - vForward) / (iCurrentMa / 1000));
  const resistorPowerMw = Math.pow(iCurrentMa / 1000, 2) * calculatedResistorOhm * 1000;

  // 3. Voltage Divider
  const vOutDivider = vInDivider * (r2Ohm / (r1Ohm + r2Ohm));
  const esp32AdcCounts = Math.round((vOutDivider / 3.3) * 4095);

  // 4. DC Motor Stall
  const stallCurrentA = motorVoltage / Math.max(0.1, motorResistance);
  const noLoadRpm = motorVoltage * motorKv;

  // 5. Ultrasonic Distance: d = (t * 0.0343) / 2
  const distanceCm = (echoTimeUs * 0.0343) / 2;
  const distanceInches = distanceCm / 2.54;

  // 6. Battery Run-Time
  const runTimeHours = (battCapMah * 0.85) / Math.max(1, loadCurrentMa);
  const runTimeMinutes = runTimeHours * 60;

  const copySnippet = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] text-slate-200 select-none overflow-hidden">
      {/* Studio Header */}
      <div className="h-14 bg-[#0d1424] border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-6 shadow-md z-10 flex-shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold shadow-clay-btn">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-wide font-sans flex items-center space-x-2">
              <span>Robotics Engineering Laws & Formulas Studio</span>
              <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-bold">
                MATHEMATICAL ENGINE
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">
              Interactive physics calculators, governing mechatronic laws & C++ kinematics implementations
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all shadow-clay-btn"
            title="Close Formulas Studio"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="bg-[#0e1729] border-b border-white/[0.06] px-4 py-2 flex space-x-2 overflow-x-auto custom-scrollbar flex-shrink-0">
        {[
          { id: 'kinematics', label: 'Kinematics & Motion', icon: <Bot className="w-3.5 h-3.5" /> },
          { id: 'motors', label: 'Motor Dynamics & Sizing', icon: <Cog className="w-3.5 h-3.5" /> },
          { id: 'electrical', label: 'Circuit & Power Laws', icon: <Zap className="w-3.5 h-3.5" /> },
          { id: 'sensors', label: 'Sensor Physics & Fusion', icon: <Compass className="w-3.5 h-3.5" /> },
          { id: 'control', label: 'PID & Control Theory', icon: <Sliders className="w-3.5 h-3.5" /> },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              activeCategory === cat.id
                ? 'clay-btn-primary text-white shadow-clay-btn'
                : 'bg-[#141d30] text-slate-400 hover:text-slate-200 border border-white/[0.04]'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Main Studio Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 1. KINEMATICS & MOTION                                        */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeCategory === 'kinematics' && (
          <div className="space-y-6">
            {/* Interactive Calculator: Differential Drive */}
            <div className="clay-card p-5 space-y-4 border border-amber-500/20">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white">Differential Drive Forward Kinematics</h2>
                    <span className="text-[10px] text-slate-400 font-mono">Governs 2WD & 4WD mobile rovers, line followers & AGVs</span>
                  </div>
                </div>
                <button
                  onClick={() => copySnippet(
`// Differential Drive Kinematics
const float r = ${rMeters.toFixed(4)}; // Wheel radius in meters
const float L = ${trackMeters.toFixed(4)}; // Track gauge in meters

float omegaL = (rpmL * 2.0 * PI) / 60.0;
float omegaR = (rpmR * 2.0 * PI) / 60.0;

float v = (r * (omegaR + omegaL)) / 2.0;       // Linear velocity (m/s)
float omega = (r * (omegaR - omegaL)) / L;     // Angular velocity (rad/s)
`, 'diff_drive')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#162238] hover:bg-[#1f2f4c] text-slate-300 text-xs font-mono border border-white/10 shadow-clay-btn"
                >
                  {copiedKey === 'diff_drive' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'diff_drive' ? 'Copied' : 'Copy C++'}</span>
                </button>
              </div>

              {/* Mathematical Equation Box */}
              <div className="clay-inset p-3 font-mono text-xs text-amber-300 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Governing Equations:</div>
                <div className="text-white font-bold">v = r · (ω_R + ω_L) / 2 &nbsp;&nbsp;|&nbsp;&nbsp; ω = r · (ω_R - ω_L) / L</div>
                <div className="text-slate-400 text-[11px]">R_turn = (L / 2) · [(ω_R + ω_L) / (ω_R - ω_L)]</div>
              </div>

              {/* Inputs & Outputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inputs */}
                <div className="space-y-3 p-3 rounded-2xl bg-[#0c1424] border border-white/[0.04]">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Physical Parameters</span>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Wheel Radius (r):</span>
                      <span className="font-mono text-white font-bold">{wheelRadiusCm} cm</span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="10.0"
                      step="0.1"
                      value={wheelRadiusCm}
                      onChange={(e) => setWheelRadiusCm(Number(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Track Gauge / Wheelbase (L):</span>
                      <span className="font-mono text-white font-bold">{trackWidthCm} cm</span>
                    </div>
                    <input
                      type="range"
                      min="6.0"
                      max="30.0"
                      step="0.5"
                      value={trackWidthCm}
                      onChange={(e) => setTrackWidthCm(Number(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[11px] text-slate-400">Left RPM:</span>
                      <input
                        type="number"
                        value={rpmLeft}
                        onChange={(e) => setRpmLeft(Number(e.target.value))}
                        className="w-full bg-[#111a2d] text-xs font-mono text-white px-2 py-1.5 rounded-lg border border-white/10 mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Right RPM:</span>
                      <input
                        type="number"
                        value={rpmRight}
                        onChange={(e) => setRpmRight(Number(e.target.value))}
                        className="w-full bg-[#111a2d] text-xs font-mono text-white px-2 py-1.5 rounded-lg border border-white/10 mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Computed Results */}
                <div className="space-y-3 p-3 rounded-2xl bg-[#0c1424] border border-white/[0.04] flex flex-col justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live Kinematic State</span>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between p-2 rounded-xl bg-[#121d33] border border-white/[0.05]">
                      <span className="text-slate-400">Linear Speed (v):</span>
                      <span className="text-emerald-400 font-bold">{linearVelocityMps.toFixed(3)} m/s ({(linearVelocityMps * 3.6).toFixed(2)} km/h)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-[#121d33] border border-white/[0.05]">
                      <span className="text-slate-400">Angular Velocity (ω):</span>
                      <span className="text-amber-400 font-bold">{angularVelocityRps.toFixed(3)} rad/s ({(angularVelocityRps * 180 / Math.PI).toFixed(1)}°/s)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-[#121d33] border border-white/[0.05]">
                      <span className="text-slate-400">Instant Turning Radius:</span>
                      <span className="text-cyan-400 font-bold">
                        {isFinite(turnRadiusCm) ? `${turnRadiusCm.toFixed(1)} cm` : 'Straight (∞)'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    {angularVelocityRps > 0.05 ? '↪ Turning Left' : angularVelocityRps < -0.05 ? '↩ Turning Right' : '⬆ Moving Straight Forward'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Link Robotic Arm Inverse Kinematics Card */}
            <div className="clay-card p-5 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">2-Link Planar Robotic Arm Kinematics</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Closed-form analytical Inverse Kinematics for SCARA & 2-DOF Arms</span>
                </div>
              </div>
              <div className="clay-inset p-3 font-mono text-xs text-cyan-300 space-y-1">
                <div>cos(θ_2) = (x² + y² - l₁² - l₂²) / (2 · l₁ · l₂)</div>
                <div>θ₁ = atan2(y, x) - atan2(l₂ · sin θ₂, l₁ + l₂ · cos θ₂)</div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Determines the exact joint servo angles (θ₁, θ₂) needed to position the end-effector at Cartesian coordinate (x, y). Ideal for robotic manipulators using two SG90 or MG996R servo actuators.
              </p>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 2. MOTOR DYNAMICS & SIZING                                    */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeCategory === 'motors' && (
          <div className="space-y-6">
            <div className="clay-card p-5 space-y-4 border border-blue-500/20">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 font-bold">
                    <Cog className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white">DC Motor Electrical & Torque Model</h2>
                    <span className="text-[10px] text-slate-400 font-mono">Back-EMF, Armature Current, Stall Torque & Speed Sizing</span>
                  </div>
                </div>
              </div>

              <div className="clay-inset p-3 font-mono text-xs text-blue-300 space-y-1">
                <div>V_in = I · R_a + E_b &nbsp;&nbsp;|&nbsp;&nbsp; E_b = K_e · ω &nbsp;&nbsp;|&nbsp;&nbsp; τ = K_t · I</div>
                <div>I_stall = V_supply / R_armature &nbsp;&nbsp;|&nbsp;&nbsp; P_mech = τ · ω</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-3 rounded-2xl bg-[#0c1424] border border-white/[0.04]">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Motor Specs</span>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Supply Voltage (V):</span>
                      <span className="font-mono text-white font-bold">{motorVoltage} V</span>
                    </div>
                    <input
                      type="range"
                      min="3.0"
                      max="24.0"
                      step="0.5"
                      value={motorVoltage}
                      onChange={(e) => setMotorVoltage(Number(e.target.value))}
                      className="w-full accent-blue-400 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Armature Resistance (R_a):</span>
                      <span className="font-mono text-white font-bold">{motorResistance} Ω</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="15.0"
                      step="0.5"
                      value={motorResistance}
                      onChange={(e) => setMotorResistance(Number(e.target.value))}
                      className="w-full accent-blue-400 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-3 rounded-2xl bg-[#0c1424] border border-white/[0.04]">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Predicted Motor Performance</span>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between p-2 rounded-xl bg-[#121d33] border border-white/[0.05]">
                      <span className="text-slate-400">Stall Current (I_stall):</span>
                      <span className="text-rose-400 font-bold">{stallCurrentA.toFixed(2)} A</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-[#121d33] border border-white/[0.05]">
                      <span className="text-slate-400">Estimated No-Load RPM:</span>
                      <span className="text-white font-bold">~{Math.round(noLoadRpm)} RPM</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-[#121d33] border border-white/[0.05]">
                      <span className="text-slate-400">Required Driver Rating:</span>
                      <span className="text-emerald-400 font-bold">≥ {(stallCurrentA * 1.25).toFixed(2)} A (Peak)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Motor Microstepping Law */}
            <div className="clay-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-white">Stepper Motor Step Angle & Reduction Law</h3>
              <div className="clay-inset p-3 font-mono text-xs text-emerald-300">
                θ_step = 360° / (N_phases · N_rotor_teeth) = Stride / GearRatio
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                For the 28BYJ-48 stepper motor, stride angle is 5.625° with an internal 64:1 reduction gearbox, resulting in 4096 half-steps or 2048 full-steps per 360° revolution.
              </p>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 3. ELECTRICAL & POWER LAWS                                    */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeCategory === 'electrical' && (
          <div className="space-y-6">
            {/* LED Current-Limiting Resistor Calculator */}
            <div className="clay-card p-5 space-y-4 border border-rose-500/20">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white">LED Current-Limiting Resistor (Ohm's Law)</h2>
                    <span className="text-[10px] text-slate-400 font-mono">Calculates R_limit and power dissipation</span>
                  </div>
                </div>
              </div>

              <div className="clay-inset p-3 font-mono text-xs text-rose-300 space-y-1">
                <div>R_limit = (V_source - V_forward) / I_forward &nbsp;&nbsp;|&nbsp;&nbsp; P_resistor = I² · R</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-3 rounded-2xl bg-[#0c1424] border border-white/[0.04]">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Supply Voltage (V_s):</span>
                    <span className="font-mono text-white font-bold">{vSupply} V</span>
                  </div>
                  <input
                    type="range"
                    min="3.3"
                    max="12.0"
                    step="0.1"
                    value={vSupply}
                    onChange={(e) => setVSupply(Number(e.target.value))}
                    className="w-full accent-rose-400 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">LED Forward Voltage (V_f):</span>
                    <span className="font-mono text-white font-bold">{vForward} V</span>
                  </div>
                  <input
                    type="range"
                    min="1.6"
                    max="3.6"
                    step="0.1"
                    value={vForward}
                    onChange={(e) => setVForward(Number(e.target.value))}
                    className="w-full accent-rose-400 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Forward Current (I_f):</span>
                    <span className="font-mono text-white font-bold">{iCurrentMa} mA</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={iCurrentMa}
                    onChange={(e) => setICurrentMa(Number(e.target.value))}
                    className="w-full accent-rose-400 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-3 p-3 rounded-2xl bg-[#0c1424] border border-white/[0.04]">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Required Resistor</span>
                  <div className="p-3 rounded-xl bg-[#121d33] border border-white/[0.05] space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Exact Resistance:</span>
                      <span className="text-emerald-400 font-bold text-sm">{Math.round(calculatedResistorOhm)} Ω</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Standard E24 Value:</span>
                      <span className="text-cyan-400 font-bold">
                        {calculatedResistorOhm <= 220 ? '220 Ω' : calculatedResistorOhm <= 330 ? '330 Ω' : calculatedResistorOhm <= 470 ? '470 Ω' : '1 kΩ'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resistor Dissipation:</span>
                      <span className="text-white font-bold">{resistorPowerMw.toFixed(1)} mW (1/4W is Safe)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voltage Divider Level Shifter Calculator */}
            <div className="clay-card p-5 space-y-4 border border-cyan-500/20">
              <h2 className="text-sm font-extrabold text-white">5V to 3.3V Voltage Divider Level Shifter</h2>
              <div className="clay-inset p-3 font-mono text-xs text-cyan-300">
                V_out = V_in · [ R₂ / (R₁ + R₂) ] &nbsp;&nbsp;|&nbsp;&nbsp; ESP32 ADC Max Safe = 3.3V
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Input Voltage (V_in):</span>
                    <span className="font-mono text-white font-bold">{vInDivider} V</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resistor R₁ (top):</span>
                    <input
                      type="number"
                      value={r1Ohm}
                      onChange={(e) => setR1Ohm(Number(e.target.value))}
                      className="w-24 bg-[#111a2d] text-xs font-mono text-white px-2 py-1 rounded border border-white/10"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resistor R₂ (bottom to GND):</span>
                    <input
                      type="number"
                      value={r2Ohm}
                      onChange={(e) => setR2Ohm(Number(e.target.value))}
                      className="w-24 bg-[#111a2d] text-xs font-mono text-white px-2 py-1 rounded border border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2 p-3 rounded-xl bg-[#121d33] font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Output Voltage (V_out):</span>
                    <span className={`font-bold text-sm ${vOutDivider <= 3.3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {vOutDivider.toFixed(2)} V
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {vOutDivider <= 3.3 ? '✓ Safe for ESP32 GPIO / ADC Pin' : '⚠ OVERVOLTAGE! May damage ESP32 GPIO (max 3.3V)'}
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">ESP32 12-Bit ADC Value:</span>
                    <span className="text-cyan-400 font-bold">{Math.min(4095, esp32AdcCounts)} / 4095</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Battery Run-Time Calculator */}
            <div className="clay-card p-5 space-y-4 border border-emerald-500/20">
              <h2 className="text-sm font-extrabold text-white">Mobile Robot Battery Autonomy & Run-Time</h2>
              <div className="clay-inset p-3 font-mono text-xs text-emerald-300">
                t_hours = (Capacity_mAh · 0.85_efficiency) / I_total_mA
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Battery Pack Capacity:</span>
                    <span className="font-mono text-white font-bold">{battCapMah} mAh</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="6000"
                    step="100"
                    value={battCapMah}
                    onChange={(e) => setBattCapMah(Number(e.target.value))}
                    className="w-full accent-emerald-400 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average Load Current:</span>
                    <span className="font-mono text-white font-bold">{loadCurrentMa} mA</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="3000"
                    step="50"
                    value={loadCurrentMa}
                    onChange={(e) => setLoadCurrentMa(Number(e.target.value))}
                    className="w-full accent-emerald-400 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
                <div className="p-3 rounded-xl bg-[#121d33] font-mono flex flex-col justify-center space-y-1.5">
                  <span className="text-slate-400">Continuous Operating Time:</span>
                  <span className="text-emerald-400 font-extrabold text-lg">
                    {runTimeHours.toFixed(1)} Hours ({Math.round(runTimeMinutes)} mins)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 4. SENSORS & SIGNAL PROCESSING                                */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeCategory === 'sensors' && (
          <div className="space-y-6">
            {/* Ultrasonic Distance Law */}
            <div className="clay-card p-5 space-y-4 border border-purple-500/20">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 font-bold">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white">HC-SR04 Speed of Sound Time-of-Flight</h2>
                    <span className="text-[10px] text-slate-400 font-mono">Acoustic echo ranging equation: 343 m/s @ 20°C</span>
                  </div>
                </div>
                <button
                  onClick={() => copySnippet(
`// HC-SR04 Ultrasonic Distance Calculation
digitalWrite(TRIG_PIN, LOW);
delayMicroseconds(2);
digitalWrite(TRIG_PIN, HIGH);
delayMicroseconds(10);
digitalWrite(TRIG_PIN, LOW);

long durationUs = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout (~5m)
float distanceCm = (durationUs * 0.0343) / 2.0;
`, 'ultrasonic')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#162238] hover:bg-[#1f2f4c] text-slate-300 text-xs font-mono border border-white/10 shadow-clay-btn"
                >
                  {copiedKey === 'ultrasonic' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'ultrasonic' ? 'Copied' : 'Copy C++'}</span>
                </button>
              </div>

              <div className="clay-inset p-3 font-mono text-xs text-purple-300">
                distance_cm = (time_μs · 0.0343 cm/μs) / 2 &nbsp;&nbsp;|&nbsp;&nbsp; distance_inches = distance_cm / 2.54
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Echo Pulse Time (t):</span>
                    <span className="font-mono text-white font-bold">{echoTimeUs} μs</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="15000"
                    step="50"
                    value={echoTimeUs}
                    onChange={(e) => setEchoTimeUs(Number(e.target.value))}
                    className="w-full accent-purple-400 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
                <div className="p-3 rounded-xl bg-[#121d33] font-mono text-xs flex justify-around items-center">
                  <div>
                    <span className="text-slate-400 text-[10px]">DISTANCE (CM):</span>
                    <div className="text-emerald-400 font-extrabold text-base">{distanceCm.toFixed(1)} cm</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">DISTANCE (IN):</span>
                    <div className="text-cyan-400 font-extrabold text-base">{distanceInches.toFixed(1)} in</div>
                  </div>
                </div>
              </div>
            </div>

            {/* MPU6050 Accelerometer Pitch & Roll Law */}
            <div className="clay-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-white">MPU-6050 Accelerometer Trigonometric Tilt Law</h3>
              <div className="clay-inset p-3 font-mono text-xs text-sky-300 space-y-1">
                <div>Pitch = atan2(A_y, √(A_x² + A_z²)) · (180° / π)</div>
                <div>Roll = atan2(-A_x, A_z) · (180° / π)</div>
                <div>θ_fused = 0.98 · (θ_prev + ω_gyro · Δt) + 0.02 · θ_accel</div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Accelerometer vectors provide absolute gravity orientation but are susceptible to dynamic vibration noise. The Complementary Filter fuses fast gyroscope integration with long-term accelerometer gravity stability.
              </p>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 5. PID & CONTROL THEORY                                       */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeCategory === 'control' && (
          <div className="space-y-6">
            <div className="clay-card p-5 space-y-4 border border-emerald-500/20">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white">PID Controller Law (Proportional-Integral-Derivative)</h2>
                    <span className="text-[10px] text-slate-400 font-mono">Self-balancing robots, line tracking, motor RPM closed-loop control</span>
                  </div>
                </div>
                <button
                  onClick={() => copySnippet(
`// Discrete PID Controller Implementation
float Kp = 2.5, Ki = 0.15, Kd = 1.2;
float integral = 0, lastError = 0;

float computePID(float setpoint, float measured, float dt) {
  float error = setpoint - measured;
  float P = Kp * error;
  integral += error * dt;
  float I = Ki * integral;
  float D = Kd * (error - lastError) / dt;
  lastError = error;
  return P + I + D;
}
`, 'pid_snippet')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#162238] hover:bg-[#1f2f4c] text-slate-300 text-xs font-mono border border-white/10 shadow-clay-btn"
                >
                  {copiedKey === 'pid_snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'pid_snippet' ? 'Copied' : 'Copy C++'}</span>
                </button>
              </div>

              <div className="clay-inset p-3 font-mono text-xs text-emerald-300 space-y-1">
                <div>u(t) = K_p · e(t) + K_i · ∫ e(τ)dτ + K_d · (de(t)/dt)</div>
                <div className="text-slate-400 text-[11px]">
                  P: Drives reaction to current error | I: Eliminates steady-state offset | D: Dampens overshoot & oscillations
                </div>
              </div>

              <div className="space-y-3 p-3 rounded-2xl bg-[#0c1424] border border-white/[0.04]">
                <span className="text-xs font-bold text-white uppercase tracking-wider">PID Tuning Heuristics (Ziegler-Nichols)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#11192b] border border-white/5 space-y-1">
                    <span className="font-bold text-rose-400">Too High K_p:</span>
                    <p className="text-[11px] text-slate-400">Violent oscillation and mechanical instability.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#11192b] border border-white/5 space-y-1">
                    <span className="font-bold text-amber-400">Too High K_i:</span>
                    <p className="text-[11px] text-slate-400">Integral wind-up and massive overshoot.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#11192b] border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400">Too High K_d:</span>
                    <p className="text-[11px] text-slate-400">Noise amplification and motor chatter.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
