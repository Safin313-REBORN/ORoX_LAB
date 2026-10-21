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
    width: 140,
    height: 90,
    pins: [
      { id: 'gnd', name: 'GND', label: 'GND', x: 25, y: 8, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 55, y: 8, direction: 'power', signalType: 'POWER_VCC', voltageMin: 3.0, voltageMax: 5.5, description: 'Power 3.3V - 5V' },
      { id: 'scl', name: 'SCL', label: 'SCL', x: 85, y: 8, direction: 'input', signalType: 'I2C_SCL', description: 'I2C Clock' },
      { id: 'sda', name: 'SDA', label: 'SDA', x: 115, y: 8, direction: 'bidirectional', signalType: 'I2C_SDA', description: 'I2C Data' },
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
    width: 120,
    height: 90,
    pins: [
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 14, y: 8, direction: 'power', signalType: 'POWER_VCC', voltageMin: 3.0, voltageMax: 5.0, description: '3.3V - 5V Power' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 28, y: 8, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'scl', name: 'SCL', label: 'SCL', x: 42, y: 8, direction: 'input', signalType: 'I2C_SCL', description: 'I2C Clock' },
      { id: 'sda', name: 'SDA', label: 'SDA', x: 56, y: 8, direction: 'bidirectional', signalType: 'I2C_SDA', description: 'I2C Data' },
      { id: 'xda', name: 'XDA', label: 'XDA', x: 70, y: 8, direction: 'bidirectional', signalType: 'DIGITAL', description: 'Auxiliary I2C Data' },
      { id: 'xcl', name: 'XCL', label: 'XCL', x: 84, y: 8, direction: 'output', signalType: 'DIGITAL', description: 'Auxiliary I2C Clock' },
      { id: 'ad0', name: 'AD0', label: 'AD0', x: 98, y: 8, direction: 'input', signalType: 'DIGITAL', description: 'I2C Address Select: Low=0x68, High=0x69' },
      { id: 'int', name: 'INT', label: 'INT', x: 112, y: 8, direction: 'output', signalType: 'DIGITAL', description: 'Interrupt Output' },
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
    width: 60,
    height: 60,
    pins: [
      { id: 'pin1', name: '1', label: '1', x: 8, y: 30, direction: 'passive', signalType: 'PASSIVE', description: 'Terminal 1' },
      { id: 'pin2', name: '2', label: '2', x: 52, y: 30, direction: 'passive', signalType: 'PASSIVE', description: 'Terminal 2' },
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
    width: 70,
    height: 70,
    pins: [
      { id: 'gnd', name: 'GND', label: 'GND', x: 16, y: 8, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 35, y: 8, direction: 'power', signalType: 'POWER_VCC', voltageMin: 2.0, voltageMax: 5.5, description: 'Power 2.0V - 5.5V' },
      { id: 'io', name: 'IO', label: 'I/O', x: 54, y: 8, direction: 'output', signalType: 'DIGITAL', description: 'Digital Output Signal' },
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
    width: 60,
    height: 60,
    pins: [
      { id: 'pos', name: '+', label: '+', x: 18, y: 52, direction: 'input', signalType: 'DIGITAL', voltageMin: 3.3, voltageMax: 5.0, description: 'Positive Supply / Signal' },
      { id: 'neg', name: '-', label: '-', x: 42, y: 52, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
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
    width: 60,
    height: 60,
    pins: [
      { id: 'pos', name: '+', label: '+', x: 18, y: 52, direction: 'input', signalType: 'DIGITAL', description: 'PWM / Frequency Tone Signal' },
      { id: 'neg', name: '-', label: '-', x: 42, y: 52, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
    ],
    defaultProperties: {
      volume: 0.5
    },
    defaultState: {
      frequency: 0,
      dutyCycle: 0,
      active: false
    }
  },
  'max98357a': {
    type: 'max98357a',
    category: 'audio',
    name: 'MAX98357A I2S Amplifier',
    description: 'Mono Class-D audio amplifier receiving digital I2S audio stream and driving a virtual speaker.',
    width: 90,
    height: 90,
    pins: [
      { id: 'lrc', name: 'LRC', label: 'LRC', x: 12, y: 8, direction: 'input', signalType: 'I2S_LRC', description: 'Left/Right Word Select Clock' },
      { id: 'bclk', name: 'BCLK', label: 'BCLK', x: 26, y: 8, direction: 'input', signalType: 'I2S_BCLK', description: 'Bit Clock' },
      { id: 'din', name: 'DIN', label: 'DIN', x: 40, y: 8, direction: 'input', signalType: 'I2S_DIN', description: 'Serial Data Input' },
      { id: 'gain', name: 'GAIN', label: 'GAIN', x: 54, y: 8, direction: 'input', signalType: 'DIGITAL', description: 'Gain Select' },
      { id: 'sd', name: 'SD', label: 'SD', x: 68, y: 8, direction: 'input', signalType: 'DIGITAL', description: 'Shutdown / Channel Select' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 78, y: 8, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'vin', name: 'VIN', label: 'VIN', x: 88, y: 8, direction: 'power', signalType: 'POWER_VCC', voltageMin: 2.5, voltageMax: 5.5, description: 'Power Supply 2.5V - 5.5V' },
    ],
    defaultProperties: {
      gainSetting: '9dB',
      volume: 0.6
    },
    defaultState: {
      streamActive: false,
      sampleRate: 44100,
      vuLevel: 0
    }
  },
  'battery-tp4056': {
    type: 'battery-tp4056',
    category: 'power',
    name: 'Li-ion Battery & TP4056 Charger',
    description: 'Complete power management module with 3.7V Li-ion cell, TP4056 CC/CV charging controller, and protection circuitry.',
    width: 140,
    height: 95,
    pins: [
      { id: 'in_plus', name: 'IN+', label: 'IN+', x: 10, y: 16, direction: 'power', signalType: 'POWER_VCC', voltageMin: 4.5, voltageMax: 5.5, description: 'USB 5V In +' },
      { id: 'in_minus', name: 'IN-', label: 'IN-', x: 10, y: 80, direction: 'power', signalType: 'POWER_GND', description: 'USB 5V In -' },
      { id: 'bat_plus', name: 'B+', label: 'B+', x: 60, y: 85, direction: 'power', signalType: 'POWER_VCC', description: 'Cell Terminal +' },
      { id: 'bat_minus', name: 'B-', label: 'B-', x: 80, y: 85, direction: 'power', signalType: 'POWER_GND', description: 'Cell Terminal -' },
      { id: 'out_plus', name: 'OUT+', label: 'OUT+', x: 130, y: 16, direction: 'output', signalType: 'POWER_VCC', description: 'Regulated/Protected Output +' },
      { id: 'out_minus', name: 'OUT-', label: 'OUT-', x: 130, y: 80, direction: 'output', signalType: 'POWER_GND', description: 'Protected System GND' },
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
    width: 40,
    height: 60,
    pins: [
      { id: 'anode', name: 'A', label: 'A', x: 14, y: 52, direction: 'passive', signalType: 'PASSIVE', description: 'Anode (Longer pin, +)' },
      { id: 'cathode', name: 'K', label: 'K', x: 26, y: 52, direction: 'passive', signalType: 'PASSIVE', description: 'Cathode (Flat side, -)' },
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
    description: 'Fixed value through-hole resistor.',
    width: 60,
    height: 30,
    pins: [
      { id: 'pin1', name: '1', label: '1', x: 6, y: 15, direction: 'passive', signalType: 'PASSIVE', description: 'Terminal 1' },
      { id: 'pin2', name: '2', label: '2', x: 54, y: 15, direction: 'passive', signalType: 'PASSIVE', description: 'Terminal 2' },
    ],
    defaultProperties: {
      resistance: 330
    },
    defaultState: {}
  }
};
