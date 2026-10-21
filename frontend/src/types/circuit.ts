export type PinDirection = 'input' | 'output' | 'bidirectional' | 'power' | 'passive';

export type ElectricalSignalType =
  | 'POWER_VCC'
  | 'POWER_GND'
  | 'DIGITAL'
  | 'ANALOG'
  | 'I2C_SDA'
  | 'I2C_SCL'
  | 'SPI_MOSI'
  | 'SPI_MISO'
  | 'SPI_SCK'
  | 'SPI_CS'
  | 'I2S_BCLK'
  | 'I2S_LRC'
  | 'I2S_DIN'
  | 'RESET'
  | 'PASSIVE';

export interface ComponentPin {
  id: string;
  name: string;
  label: string;
  x: number; // offset relative to component top-left
  y: number;
  direction: PinDirection;
  signalType: ElectricalSignalType;
  gpioNum?: number;
  voltageMin?: number;
  voltageMax?: number;
  isInputOnly?: boolean;
  isStrapping?: boolean;
  isFlashReserved?: boolean;
  description?: string;
}

export interface ComponentProperty {
  id: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color';
  value: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface ComponentInstance {
  id: string;
  type: string; // e.g. 'esp32-devkit-v1', 'ssd1306', 'mpu6050', 'push-button', 'ttp223', 'active-buzzer', 'passive-buzzer', 'max98357a', 'battery-tp4056', 'led', 'resistor'
  name: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  properties: Record<string, any>;
  state: Record<string, any>;
}

export interface WireEndpoint {
  componentId: string;
  pinId: string;
}

export interface Waypoint {
  x: number;
  y: number;
}

export interface Wire {
  id: string;
  start: WireEndpoint;
  end: WireEndpoint;
  color: string;
  waypoints?: Waypoint[];
  netId?: string;
}

export type NetLogicState = 'HIGH' | 'LOW' | 'FLOATING' | 'SHORT' | 'ANALOG';

export interface NetState {
  id: string;
  name: string;
  pins: WireEndpoint[];
  voltage: number;
  logic: NetLogicState;
  pull: 'NONE' | 'UP' | 'DOWN';
  frequency?: number;
  dutyCycle?: number;
}

export interface ElectricalDiagnostic {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  componentId?: string;
  pinId?: string;
  suggestion: string;
  blocksSimulation: boolean;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  modified?: boolean;
}

export interface RoboLabProject {
  id: string;
  name: string;
  schemaVersion: number;
  boardId: string;
  framework: 'arduino' | 'espidf';
  files: WorkspaceFile[];
  components: ComponentInstance[];
  wires: Wire[];
  simulationMode: 'modeA' | 'modeB' | 'modeC';
  createdAt: string;
  updatedAt: string;
}
