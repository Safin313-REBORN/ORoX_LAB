import { ComponentPin } from '../../types/circuit';

export interface ComponentMetadata {
  type: string;
  category: 'displays' | 'sensors' | 'inputs' | 'audio' | 'power' | 'discretes';
  name: string;
  description: string;
  width: number;
  height: number;
  pins: ComponentPin[];
  defaultProperties: Record<string, any>;
  defaultState: Record<string, any>;
}

export const COMPONENT_CATALOG: Record<string, ComponentMetadata> = {
  'ssd1306': {
    type: 'ssd1306',
    category: 'displays',
    name: 'SSD1306 OLED (128x64 I2C)',
    description: '0.96 inch monochrome 128x64 OLED graphic display module communicating via I2C.',
    width: 150,
    height: 100,
    pins: [
      { id: 'gnd', name: 'GND', label: 'GND', x: 26, y: 12, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 58, y: 12, direction: 'power', signalType: 'POWER_VCC', voltageMin: 3.0, voltageMax: 5.5, description: 'Power 3.3V - 5V' },
      { id: 'scl', name: 'SCL', label: 'SCL', x: 92, y: 12, direction: 'input', signalType: 'I2C_SCL', description: 'I2C Clock' },
      { id: 'sda', name: 'SDA', label: 'SDA', x: 124, y: 12, direction: 'bidirectional', signalType: 'I2C_SDA', description: 'I2C Data' },
    ],
    defaultProperties: {
      i2cAddress: 0x3C,
      rows: 64,
      cols: 128,
      color: '#00e5ff'
    },
    defaultState: {
      powerOn: false,
      contrast: 0x7F,
      inverted: false,
      buffer: new Uint8Array(1024), // 128 * 64 / 8 bytes
      lastRenderTime: 0
    }
  },
  'mpu6050': {
    type: 'mpu6050',
    category: 'sensors',
    name: 'MPU6050 6-Axis IMU',
    description: '6-degree-of-freedom inertial measurement unit with 3-axis accelerometer and 3-axis gyroscope.',
    width: 140,
    height: 95,
    pins: [
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 14, y: 12, direction: 'power', signalType: 'POWER_VCC', voltageMin: 3.0, voltageMax: 5.0, description: '3.3V - 5V Power' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 30, y: 12, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'scl', name: 'SCL', label: 'SCL', x: 46, y: 12, direction: 'input', signalType: 'I2C_SCL', description: 'I2C Clock' },
      { id: 'sda', name: 'SDA', label: 'SDA', x: 62, y: 12, direction: 'bidirectional', signalType: 'I2C_SDA', description: 'I2C Data' },
      { id: 'xda', name: 'XDA', label: 'XDA', x: 78, y: 12, direction: 'bidirectional', signalType: 'DIGITAL', description: 'Auxiliary I2C Data' },
      { id: 'xcl', name: 'XCL', label: 'XCL', x: 94, y: 12, direction: 'output', signalType: 'DIGITAL', description: 'Auxiliary I2C Clock' },
      { id: 'ad0', name: 'AD0', label: 'AD0', x: 110, y: 12, direction: 'input', signalType: 'DIGITAL', description: 'I2C Address Select: Low=0x68, High=0x69' },
      { id: 'int', name: 'INT', label: 'INT', x: 126, y: 12, direction: 'output', signalType: 'DIGITAL', description: 'Interrupt Output' },
    ],
    defaultProperties: {
      ad0: 0, // 0 -> 0x68, 1 -> 0x69
      pitch: 0,
      roll: 0,
      yaw: 0,
      accelX: 0,
      accelY: 0,
      accelZ: 1.0,
      gyroX: 0,
      gyroY: 0,
      gyroZ: 0,
      tempC: 25.0
    },
    defaultState: {
      sleepMode: false,
      sampleRateDiv: 0,
      dlpfConfig: 0
    }
  },
  'push-button': {
    type: 'push-button',
    category: 'inputs',
    name: 'Push Button',
    description: 'Tactile momentary push button for digital input triggers.',
    width: 70,
    height: 70,
    pins: [
      { id: 'pin1', name: '1', label: '1', x: 10, y: 35, direction: 'passive', signalType: 'PASSIVE', description: 'Terminal 1' },
      { id: 'pin2', name: '2', label: '2', x: 60, y: 35, direction: 'passive', signalType: 'PASSIVE', description: 'Terminal 2' },
    ],
    defaultProperties: {
      buttonColor: '#3b82f6',
      label: 'SW1'
    },
    defaultState: {
      pressed: false
    }
  },
  'ttp223': {
    type: 'ttp223',
    category: 'inputs',
    name: 'TTP223 Touch Sensor',
    description: 'Capacitive touch switch module providing direct digital output upon contact.',
    width: 75,
    height: 75,
    pins: [
      { id: 'gnd', name: 'GND', label: 'GND', x: 16, y: 64, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 37, y: 64, direction: 'power', signalType: 'POWER_VCC', voltageMin: 2.0, voltageMax: 5.5, description: 'Power 2.0V - 5.5V' },
      { id: 'io', name: 'IO', label: 'I/O', x: 58, y: 64, direction: 'output', signalType: 'DIGITAL', description: 'Digital Output Signal' },
    ],
    defaultProperties: {
      activeHigh: true
    },
    defaultState: {
      touched: false
    }
  },
  'active-buzzer': {
    type: 'active-buzzer',
    category: 'audio',
    name: 'Active Buzzer',
    description: 'Piezoelectric buzzer with built-in internal oscillator producing ~2.3kHz audible tone on HIGH signal.',
    width: 70,
    height: 70,
    pins: [
      { id: 'pos', name: '+', label: '+', x: 20, y: 56, direction: 'input', signalType: 'DIGITAL', voltageMin: 3.3, voltageMax: 5.0, description: 'Positive Supply / Signal' },
      { id: 'neg', name: '-', label: '-', x: 50, y: 56, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
    ],
    defaultProperties: {
      volume: 0.5
    },
    defaultState: {
      sounding: false
    }
  },
  'passive-buzzer': {
    type: 'passive-buzzer',
    category: 'audio',
    name: 'Passive Buzzer / Speaker',
    description: 'Piezo element requiring external PWM / tone signal to produce variable pitch frequencies and musical notes.',
    width: 70,
    height: 70,
    pins: [
      { id: 'pos', name: '+', label: '+', x: 20, y: 56, direction: 'input', signalType: 'DIGITAL', voltageMin: 1.0, voltageMax: 5.0, description: 'PWM Signal In' },
      { id: 'neg', name: '-', label: '-', x: 50, y: 56, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
    ],
    defaultProperties: {
      frequencyHz: 1000,
      volume: 0.5
    },
    defaultState: {
      sounding: false,
      currentFrequency: 0
    }
  },
  'max98357a': {
    type: 'max98357a',
    category: 'audio',
    name: 'MAX98357A I2S DAC & Amp',
    description: 'Digital 3.2W mono Class-D audio amplifier taking direct I2S digital audio (BCLK, LRC, DIN).',
    width: 100,
    height: 90,
    pins: [
      { id: 'vin', name: 'VIN', label: 'VIN', x: 30, y: 12, direction: 'power', signalType: 'POWER_VCC', voltageMin: 2.5, voltageMax: 5.5, description: '2.5V - 5.5V Power' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 70, y: 12, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'sd', name: 'SD', label: 'SD', x: 16, y: 76, direction: 'input', signalType: 'DIGITAL', description: 'Shutdown / Channel Mode' },
      { id: 'gain', name: 'GAIN', label: 'GAIN', x: 33, y: 76, direction: 'input', signalType: 'DIGITAL', description: 'Gain Select' },
      { id: 'din', name: 'DIN', label: 'DIN', x: 50, y: 76, direction: 'input', signalType: 'I2S_DIN', description: 'I2S Serial Data' },
      { id: 'bclk', name: 'BCLK', label: 'BCLK', x: 67, y: 76, direction: 'input', signalType: 'I2S_BCLK', description: 'I2S Bit Clock' },
      { id: 'lrc', name: 'LRC', label: 'LRC', x: 84, y: 76, direction: 'input', signalType: 'I2S_LRC', description: 'I2S Word Select / LRC' },
    ],
    defaultProperties: {
      gainDb: 12,
      sampleRate: 44100
    },
    defaultState: {
      active: false,
      sampleRate: 44100
    }
  },
  'battery-tp4056': {
    type: 'battery-tp4056',
    category: 'power',
    name: 'Li-ion Battery & TP4056 Charger',
    description: 'Complete power management module with 3.7V Li-ion cell, TP4056 CC/CV charging controller, and protection circuitry.',
    width: 160,
    height: 100,
    pins: [
      { id: 'in_plus', name: 'IN+', label: 'IN+', x: 12, y: 18, direction: 'power', signalType: 'POWER_VCC', voltageMin: 4.5, voltageMax: 5.5, description: 'USB 5V In +' },
      { id: 'in_minus', name: 'IN-', label: 'IN-', x: 12, y: 82, direction: 'power', signalType: 'POWER_GND', description: 'USB 5V In -' },
      { id: 'bat_plus', name: 'B+', label: 'B+', x: 70, y: 88, direction: 'power', signalType: 'POWER_VCC', description: 'Cell Terminal +' },
      { id: 'bat_minus', name: 'B-', label: 'B-', x: 90, y: 88, direction: 'power', signalType: 'POWER_GND', description: 'Cell Terminal -' },
      { id: 'out_plus', name: 'OUT+', label: 'OUT+', x: 148, y: 18, direction: 'output', signalType: 'POWER_VCC', description: 'Regulated/Protected Output +' },
      { id: 'out_minus', name: 'OUT-', label: 'OUT-', x: 148, y: 82, direction: 'output', signalType: 'POWER_GND', description: 'Protected System GND' },
    ],
    defaultProperties: {
      nominalCapacityMah: 1200,
      internalResistanceOhm: 0.08,
      usbPluggedIn: true,
      batteryChemistry: 'LiCoO2',
      cellVoltage: 3.85,
      loadResistanceOhm: 50.0
    },
    defaultState: {
      socPercent: 65,
      chargingState: 'CC', // 'IDLE' | 'TRICKLE' | 'CC' | 'CV' | 'DONE' | 'FAULT'
      chargeCurrentMa: 850,
      loadCurrentMa: 75,
      batteryCurrentMa: 775,
      redLed: true, // Charging
      blueLed: false // Done
    }
  },
  'led': {
    type: 'led',
    category: 'discretes',
    name: 'LED (5mm)',
    description: 'Standard 5mm discrete Light Emitting Diode.',
    width: 50,
    height: 70,
    pins: [
      { id: 'anode', name: 'A', label: 'A', x: 18, y: 60, direction: 'passive', signalType: 'PASSIVE', description: 'Anode (Longer pin, +)' },
      { id: 'cathode', name: 'K', label: 'K', x: 32, y: 60, direction: 'passive', signalType: 'PASSIVE', description: 'Cathode (Flat side, -)' },
    ],
    defaultProperties: {
      color: '#ef4444',
      forwardVoltage: 2.0,
      brightness: 1.0
    },
    defaultState: {
      illuminated: false,
      currentMa: 0
    }
  },
  'resistor': {
    type: 'resistor',
    category: 'discretes',
    name: 'Resistor',
    description: 'Fixed value through-hole axial resistor.',
    width: 80,
    height: 32,
    pins: [
      { id: 'pin1', name: '1', label: '1', x: 8, y: 16, direction: 'passive', signalType: 'PASSIVE', description: 'Terminal 1' },
      { id: 'pin2', name: '2', label: '2', x: 72, y: 16, direction: 'passive', signalType: 'PASSIVE', description: 'Terminal 2' },
    ],
    defaultProperties: {
      resistance: 220
    },
    defaultState: {}
  }
};
