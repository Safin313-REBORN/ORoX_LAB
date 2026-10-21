import { ComponentInstance, Wire, RoboLabProject, NetState } from '../../types/circuit';
import { buildCircuitNets, resolvePinDefinition, pinKey } from '../circuit/netlist';
import { SSD1306Model } from '../models/ssd1306';
import { MPU6050Model } from '../models/mpu6050';
import { AudioEngine } from '../audio/audioEngine';
import { BatteryModel, BatteryState } from '../models/battery';

export interface LogicAnalyzerSample {
  timeMs: number;
  channels: Record<string, number>;
}

export type SimulationStatus = 'idle' | 'compiling' | 'running' | 'paused' | 'error';

export interface SimulationTelemetry {
  status: SimulationStatus;
  mode: 'modeA' | 'modeB' | 'modeC';
  simulationTimeMs: number;
  serialLogs: Array<{ text: string; isInput: boolean; timestamp: number }>;
  pinStates: Record<string, number>;
  logicTraces: LogicAnalyzerSample[];
  ssd1306?: SSD1306Model;
  mpu6050?: MPU6050Model;
  batteryState?: BatteryState;
  errorMessage?: string;
}

export class SimulationEngine {
  private static instance: SimulationEngine;
  private timerId: any = null;
  private ws: WebSocket | null = null;
  private simTimeMs: number = 0;

  // Active models
  public ssd1306Model: SSD1306Model = new SSD1306Model(128, 64);
  public mpu6050Model: MPU6050Model = new MPU6050Model(0);
  public batteryModel: BatteryModel = new BatteryModel(3.85, 1200);

  // Cached Netlist
  private cachedNets: Map<string, NetState> | null = null;
  private cachedTopologyKey: string = '';

  // Telemetry state
  public status: SimulationStatus = 'idle';
  public mode: 'modeA' | 'modeB' | 'modeC' = 'modeB';
  public serialLogs: Array<{ text: string; isInput: boolean; timestamp: number }> = [];
  public pinStates: Record<string, number> = {};
  public logicTraces: LogicAnalyzerSample[] = [];
  public errorMessage?: string;

  private onUpdateCallback?: (telemetry: SimulationTelemetry) => void;

  private constructor() {}

  public static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  public setUpdateListener(cb: (telemetry: SimulationTelemetry) => void): void {
    this.onUpdateCallback = cb;
  }

  private notify(): void {
    if (this.onUpdateCallback) {
      this.onUpdateCallback({
        status: this.status,
        mode: this.mode,
        simulationTimeMs: this.simTimeMs,
        serialLogs: [...this.serialLogs],
        pinStates: { ...this.pinStates },
        logicTraces: this.logicTraces.slice(-50),
        ssd1306: this.ssd1306Model,
        mpu6050: this.mpu6050Model,
        batteryState: this.batteryModel.step(0),
        errorMessage: this.errorMessage
      });
    }
  }

  public logSerial(text: string, isInput: boolean = false): void {
    this.serialLogs.push({
      text,
      isInput,
      timestamp: Date.now()
    });
    if (this.serialLogs.length > 1000) {
      this.serialLogs.shift();
    }
    this.notify();
  }

  public clearSerialLogs(): void {
    this.serialLogs = [];
    this.notify();
  }

  public startSimulation(project: RoboLabProject): void {
    this.stopSimulation();
    this.status = 'running';
    this.mode = project.simulationMode || 'modeB';
    this.simTimeMs = 0;
    this.errorMessage = undefined;

    // Invalidate cached topology
    this.cachedNets = null;
    this.cachedTopologyKey = '';

    // Reset models
    this.ssd1306Model.clear();
    this.mpu6050Model.reset();

    this.logSerial(`[RoboLab] Target: ${project.boardId.toUpperCase()} (${this.mode.toUpperCase()})`);
    this.logSerial(`[RoboLab] Initializing peripheral bus and circuit netlist...`);

    this.timerId = setInterval(() => {
      this.tick(project);
    }, 50);

    this.notify();
  }

  public stopSimulation(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    AudioEngine.getInstance().stopAll();
    this.status = 'idle';
    this.logSerial('[RoboLab] Simulation session terminated.');
    this.notify();
  }

  public resetSimulation(project: RoboLabProject): void {
    this.stopSimulation();
    this.startSimulation(project);
  }

  public setPin(pinName: string, state: number): void {
    this.pinStates[pinName] = state;
    this.notify();
  }

  private tick(project: RoboLabProject): void {
    this.simTimeMs += 50;

    // Cache netlist computation if topology has not changed
    const topologyKey = `${project.boardId}_${project.components.length}_${project.wires.length}`;
    if (!this.cachedNets || this.cachedTopologyKey !== topologyKey) {
      this.cachedNets = buildCircuitNets(project.components, project.wires, project.boardId);
      this.cachedTopologyKey = topologyKey;
    }

    const buttonComp = project.components.find(c => c.type === 'push-button');
    const touchComp = project.components.find(c => c.type === 'ttp223');
    const primaryFile = project.files[0]?.content || '';

    // Project 1: Blink
    if (primaryFile.includes('digitalWrite') && (primaryFile.includes('LED_BUILTIN') || primaryFile.includes('2'))) {
      const cycleTime = 1000;
      const isHigh = (this.simTimeMs % cycleTime) < (cycleTime / 2);
      this.pinStates['GPIO2'] = isHigh ? 1 : 0;
      this.pinStates['GPIO4'] = isHigh ? 1 : 0;
    }

    // Project 2: OLED Hello World
    if (primaryFile.includes('Adafruit_SSD1306') || primaryFile.includes('display.print') || primaryFile.includes('Hello')) {
      if (this.simTimeMs === 50) {
        this.ssd1306Model.clear();
        this.ssd1306Model.drawText("ROBOLAB ESP32", 10, 8, true);
        this.ssd1306Model.drawText("SSD1306 OLED I2C", 10, 24, true);
        this.ssd1306Model.drawText("128x64 Pixels OK", 10, 40, true);
        this.logSerial("[OLED] SSD1306 Init 0x3C OK, Framebuffer Flushed.");
      }
    }

    // Project 3: Push-button status
    if (buttonComp) {
      const isPressed = buttonComp.state?.pressed || false;
      this.pinStates['GPIO15'] = isPressed ? 0 : 1;
      if (isPressed && (this.simTimeMs % 500 === 0)) {
        this.logSerial(`[GPIO] Push Button Pressed! State=LOW`);
        if (project.components.some(c => c.type === 'ssd1306')) {
          this.ssd1306Model.clear();
          this.ssd1306Model.drawText("BUTTON PRESSED!", 14, 24, true);
          this.ssd1306Model.drawText(`TIME: ${Math.round(this.simTimeMs / 1000)}s`, 14, 40, true);
        }
      }
    }

    // Project 4: MPU6050 Live Dashboard
    const mpuComp = project.components.find(c => c.type === 'mpu6050');
    if (mpuComp) {
      const pitch = mpuComp.properties?.pitch || 0;
      const roll = mpuComp.properties?.roll || 0;
      const yaw = mpuComp.properties?.yaw || 0;
      this.mpu6050Model.setOrientation(pitch, roll, yaw);

      if (this.simTimeMs % 500 === 0) {
        const ax = (Math.sin((pitch * Math.PI) / 180)).toFixed(2);
        const ay = (-Math.sin((roll * Math.PI) / 180) * Math.cos((pitch * Math.PI) / 180)).toFixed(2);
        const az = (Math.cos((pitch * Math.PI) / 180) * Math.cos((roll * Math.PI) / 180)).toFixed(2);

        this.logSerial(`[MPU6050] Pitch:${pitch}° Roll:${roll}° | Accel: X=${ax}g Y=${ay}g Z=${az}g`);

        if (project.components.some(c => c.type === 'ssd1306')) {
          this.ssd1306Model.clear();
          this.ssd1306Model.drawText("MPU6050 IMU LIVE", 8, 4, true);
          this.ssd1306Model.drawText(`Pitch: ${pitch} deg`, 8, 18, true);
          this.ssd1306Model.drawText(`Roll : ${roll} deg`, 8, 30, true);
          this.ssd1306Model.drawText(`Acc Z: ${az} g`, 8, 44, true);
        }
      }
    }

    // Project 5: Touch-controlled Buzzer
    const buzzerComp = project.components.find(c => c.type === 'active-buzzer' || c.type === 'passive-buzzer');
    if (touchComp && buzzerComp) {
      const isTouched = touchComp.state?.touched || false;
      this.pinStates['GPIO4'] = isTouched ? 1 : 0;
      if (isTouched) {
        if (buzzerComp.type === 'active-buzzer') {
          AudioEngine.getInstance().setActiveBuzzer(true);
        } else {
          AudioEngine.getInstance().setPassiveBuzzer(1500, 0.5);
        }
        if (this.simTimeMs % 500 === 0) {
          this.logSerial(`[TOUCH] TTP223 Active -> Buzzer Beeping!`);
        }
      } else {
        AudioEngine.getInstance().stopAll();
      }
    }

    // Project 6: MAX98357A I2S Audio
    const maxComp = project.components.find(c => c.type === 'max98357a');
    if (maxComp) {
      const freq = 440 + Math.sin(this.simTimeMs / 400) * 220;
      AudioEngine.getInstance().setI2SAudio(true, freq);
      if (this.simTimeMs % 1000 === 0) {
        this.logSerial(`[I2S] MAX98357A DMA Stream active. Freq: ${Math.round(freq)}Hz`);
      }
    }

    // Project 7: Battery Monitoring
    const battComp = project.components.find(c => c.type === 'battery-tp4056');
    if (battComp) {
      const bState = this.batteryModel.step(0.05);
      if (this.simTimeMs % 1000 === 0) {
        this.logSerial(`[BATTERY] V=${bState.terminalVoltage}V (${bState.socPercent}%) Status=${bState.chargingState} I_chg=${bState.chargeCurrentMa}mA`);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // ROBOTICS SIMULATION MODELS
    // ─────────────────────────────────────────────────────────────
    // 8. L298N Dual Motor Driver & DC Motors
    const l298Comp = project.components.find(c => c.type === 'l298n');
    const dcMotors = project.components.filter(c => c.type === 'dc-motor');
    if (l298Comp) {
      // Check firmware code for motor control signals
      if (primaryFile.includes('IN1') || primaryFile.includes('IN2') || primaryFile.includes('analogWrite')) {
        l298Comp.state = {
          ...l298Comp.state,
          motorA_speed: 180,
          motorA_dir: 'FORWARD',
          motorB_speed: 180,
          motorB_dir: 'FORWARD'
        };
        dcMotors.forEach(m => {
          m.state = {
            ...m.state,
            rpm: 150,
            direction: 'FORWARD'
          };
        });
        if (this.simTimeMs % 1000 === 0) {
          this.logSerial(`[ROBOTICS] L298N Dual Drive: Motors Forward @ 150 RPM (v=0.42 m/s)`);
        }
      }
    }

    // 9. TCRT5000 IR Line Tracker
    const irComp = project.components.find(c => c.type === 'ir-tracker');
    if (irComp) {
      const isBlack = irComp.state?.surfaceType === 'black';
      this.pinStates['GPIO14'] = isBlack ? 1 : 0;
      if (this.simTimeMs % 1500 === 0) {
        this.logSerial(`[SENSOR] IR Line Tracker: ${isBlack ? 'BLACK LINE DETECTED (DO=1)' : 'WHITE SURFACE (DO=0)'}`);
      }
    }

    // 10. Relay Module
    const relayComp = project.components.find(c => c.type === 'relay');
    if (relayComp && primaryFile.includes('RELAY')) {
      const isCycle = (this.simTimeMs % 2000) < 1000;
      relayComp.state = {
        ...relayComp.state,
        energized: isCycle,
        contactState: isCycle ? 'NO' : 'NC'
      };
      if (this.simTimeMs % 1000 === 0) {
        this.logSerial(`[RELAY] Coil ${isCycle ? 'ENERGIZED [NO Connected]' : 'DE-ENERGIZED [NC Connected]'}`);
      }
    }

    // Record sample for Logic Analyzer
    this.logicTraces.push({
      timeMs: this.simTimeMs,
      channels: {
        'GPIO2 (LED)': this.pinStates['GPIO2'] || 0,
        'GPIO4 (Touch)': this.pinStates['GPIO4'] || 0,
        'GPIO15 (Button)': this.pinStates['GPIO15'] !== undefined ? this.pinStates['GPIO15'] : 1,
        'I2C_SCL': (this.simTimeMs % 100 < 50) ? 1 : 0
      }
    });

    if (this.logicTraces.length > 200) {
      this.logicTraces.shift();
    }

    this.notify();
  }
}
