import { ComponentPin } from '../../types/circuit';

export interface ComponentMetadata {
  type: string;
  category: 'displays' | 'sensors' | 'inputs' | 'audio' | 'power' | 'discretes' | 'actuators' | 'robotics';
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
  },

  // ─────────────────────────────────────────────────────────────
  // ROBOTICS & ACTUATORS
  // ─────────────────────────────────────────────────────────────
  'l298n': {
    type: 'l298n',
    category: 'robotics',
    name: 'L298N Dual H-Bridge Motor Driver',
    description: 'High-power dual DC motor & stepper driver module with onboard 5V regulator and heat sink.',
    width: 170,
    height: 130,
    pins: [
      { id: 'ena', name: 'ENA', label: 'ENA', x: 25, y: 118, direction: 'input', signalType: 'DIGITAL', description: 'Motor A Speed Enable (PWM)' },
      { id: 'in1', name: 'IN1', label: 'IN1', x: 45, y: 118, direction: 'input', signalType: 'DIGITAL', description: 'Motor A Direction 1' },
      { id: 'in2', name: 'IN2', label: 'IN2', x: 65, y: 118, direction: 'input', signalType: 'DIGITAL', description: 'Motor A Direction 2' },
      { id: 'in3', name: 'IN3', label: 'IN3', x: 105, y: 118, direction: 'input', signalType: 'DIGITAL', description: 'Motor B Direction 1' },
      { id: 'in4', name: 'IN4', label: 'IN4', x: 125, y: 118, direction: 'input', signalType: 'DIGITAL', description: 'Motor B Direction 2' },
      { id: 'enb', name: 'ENB', label: 'ENB', x: 145, y: 118, direction: 'input', signalType: 'DIGITAL', description: 'Motor B Speed Enable (PWM)' },
      { id: 'vcc_motor', name: '12V', label: '12V', x: 14, y: 48, direction: 'power', signalType: 'POWER_VCC', voltageMin: 5.0, voltageMax: 35.0, description: 'Motor Battery Power (+5V to +35V)' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 14, y: 68, direction: 'power', signalType: 'POWER_GND', description: 'Power Ground (Common with ESP32 GND)' },
      { id: 'vcc_5v', name: '5V', label: '5V', x: 14, y: 88, direction: 'power', signalType: 'POWER_VCC', voltageMin: 4.8, voltageMax: 5.2, description: '5V Logic Supply / 5V Regulated Out' },
      { id: 'out1', name: 'OUT1', label: 'OUT1', x: 14, y: 18, direction: 'output', signalType: 'DIGITAL', description: 'Motor A Output +' },
      { id: 'out2', name: 'OUT2', label: 'OUT2', x: 38, y: 18, direction: 'output', signalType: 'DIGITAL', description: 'Motor A Output -' },
      { id: 'out3', name: 'OUT3', label: 'OUT3', x: 132, y: 18, direction: 'output', signalType: 'DIGITAL', description: 'Motor B Output +' },
      { id: 'out4', name: 'OUT4', label: 'OUT4', x: 156, y: 18, direction: 'output', signalType: 'DIGITAL', description: 'Motor B Output -' }
    ],
    defaultProperties: {
      supplyVoltage: 12.0,
      jumper5vEnabled: true
    },
    defaultState: {
      motorA_speed: 0,
      motorA_dir: 'STOP',
      motorB_speed: 0,
      motorB_dir: 'STOP',
      powerLed: true
    }
  },

  'dc-motor': {
    type: 'dc-motor',
    category: 'actuators',
    name: 'TT DC Gear Motor with Wheel',
    description: 'Standard robotic chassis 3-6V geared DC motor with rubber all-terrain wheel.',
    width: 140,
    height: 100,
    pins: [
      { id: 'm_plus', name: 'M+', label: 'M+', x: 126, y: 35, direction: 'passive', signalType: 'PASSIVE', description: 'Motor Terminal +' },
      { id: 'm_minus', name: 'M-', label: 'M-', x: 126, y: 65, direction: 'passive', signalType: 'PASSIVE', description: 'Motor Terminal -' }
    ],
    defaultProperties: {
      gearRatio: 48,
      ratedVoltage: 6.0,
      noLoadRpm: 200,
      stallTorqueKgCm: 0.8
    },
    defaultState: {
      rpm: 0,
      angleDeg: 0,
      direction: 'STOP',
      voltage: 0
    }
  },

  'stepper-motor': {
    type: 'stepper-motor',
    category: 'actuators',
    name: '28BYJ-48 Stepper + ULN2003 Driver',
    description: '4-phase 5V geared unipolar stepper motor with ULN2003 Darlington driver board.',
    width: 160,
    height: 110,
    pins: [
      { id: 'in1', name: 'IN1', label: 'IN1', x: 25, y: 98, direction: 'input', signalType: 'DIGITAL', description: 'Phase A Coil' },
      { id: 'in2', name: 'IN2', label: 'IN2', x: 45, y: 98, direction: 'input', signalType: 'DIGITAL', description: 'Phase B Coil' },
      { id: 'in3', name: 'IN3', label: 'IN3', x: 65, y: 98, direction: 'input', signalType: 'DIGITAL', description: 'Phase C Coil' },
      { id: 'in4', name: 'IN4', label: 'IN4', x: 85, y: 98, direction: 'input', signalType: 'DIGITAL', description: 'Phase D Coil' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 120, y: 98, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 140, y: 98, direction: 'power', signalType: 'POWER_VCC', voltageMin: 4.5, voltageMax: 12.0, description: '5V - 12V Power' }
    ],
    defaultProperties: {
      strideAngle: 5.625,
      reductionRatio: 64,
      stepMode: '4-step'
    },
    defaultState: {
      stepPosition: 0,
      angleDeg: 0,
      activeCoils: [0, 0, 0, 0]
    }
  },

  'ir-tracker': {
    type: 'ir-tracker',
    category: 'sensors',
    name: 'TCRT5000 IR Line Tracking Sensor',
    description: 'Infrared reflective optical sensor module for line-following robots and edge detection.',
    width: 110,
    height: 75,
    pins: [
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 25, y: 64, direction: 'power', signalType: 'POWER_VCC', voltageMin: 3.0, voltageMax: 5.5, description: '3.3V - 5V Power' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 45, y: 64, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'do', name: 'DO', label: 'DO', x: 65, y: 64, direction: 'output', signalType: 'DIGITAL', description: 'Digital Output (0=Reflective White, 1=Black Line)' },
      { id: 'ao', name: 'AO', label: 'AO', x: 85, y: 64, direction: 'output', signalType: 'ANALOG', description: 'Analog Output Voltage' }
    ],
    defaultProperties: {
      threshold: 2.5
    },
    defaultState: {
      surfaceType: 'white',
      reflectance: 0.1,
      outputState: 0,
      ledState: false
    }
  },

  'pir-sensor': {
    type: 'pir-sensor',
    category: 'sensors',
    name: 'HC-SR501 PIR Motion Sensor',
    description: 'Passive pyroelectric infrared motion detector module with adjustable delay and sensitivity.',
    width: 120,
    height: 90,
    pins: [
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 35, y: 78, direction: 'power', signalType: 'POWER_VCC', voltageMin: 4.5, voltageMax: 12.0, description: '5V Power Supply' },
      { id: 'out', name: 'OUT', label: 'OUT', x: 60, y: 78, direction: 'output', signalType: 'DIGITAL', description: '3.3V High on Motion Detected' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 85, y: 78, direction: 'power', signalType: 'POWER_GND', description: 'Ground' }
    ],
    defaultProperties: {
      delaySec: 3,
      sensitivityMeters: 7
    },
    defaultState: {
      motionDetected: false,
      outputHigh: false
    }
  },

  'gas-sensor': {
    type: 'gas-sensor',
    category: 'sensors',
    name: 'MQ-2 Gas & Smoke Sensor',
    description: 'Electrochemical gas sensor module detecting LPG, i-butane, propane, methane, alcohol, hydrogen and smoke.',
    width: 120,
    height: 85,
    pins: [
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 30, y: 72, direction: 'power', signalType: 'POWER_VCC', voltageMin: 4.8, voltageMax: 5.2, description: '5V Heater & Circuit Power' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 50, y: 72, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'do', name: 'DO', label: 'DO', x: 70, y: 72, direction: 'output', signalType: 'DIGITAL', description: 'Digital Alarm (Active LOW when PPM > Threshold)' },
      { id: 'ao', name: 'AO', label: 'AO', x: 90, y: 72, direction: 'output', signalType: 'ANALOG', description: 'Analog Output Voltage (0-3.3V)' }
    ],
    defaultProperties: {
      preheatDone: true,
      thresholdPpm: 200
    },
    defaultState: {
      ppm: 85,
      analogVoltage: 0.55,
      alarmActive: false
    }
  },

  'photoresistor': {
    type: 'photoresistor',
    category: 'sensors',
    name: 'LDR Light Sensor Module',
    description: 'Photoresistor module with LM393 comparator, potentiometer threshold tuning, and dual analog/digital outputs.',
    width: 110,
    height: 75,
    pins: [
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 25, y: 64, direction: 'power', signalType: 'POWER_VCC', voltageMin: 3.3, voltageMax: 5.0, description: '3.3V - 5V Power' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 45, y: 64, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'do', name: 'DO', label: 'DO', x: 65, y: 64, direction: 'output', signalType: 'DIGITAL', description: 'Digital Output (High in darkness)' },
      { id: 'ao', name: 'AO', label: 'AO', x: 85, y: 64, direction: 'output', signalType: 'ANALOG', description: 'Analog Output (Voltage decreases with light)' }
    ],
    defaultProperties: {
      thresholdLux: 300
    },
    defaultState: {
      lux: 450,
      analogVoltage: 1.65,
      isDark: false
    }
  },

  'relay': {
    type: 'relay',
    category: 'actuators',
    name: '1-Channel 5V Relay Module',
    description: 'Optoisolated electromechanical relay module for switching high-voltage/high-current AC or DC loads.',
    width: 130,
    height: 90,
    pins: [
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 14, y: 25, direction: 'power', signalType: 'POWER_VCC', voltageMin: 4.8, voltageMax: 5.5, description: '5V Relay Coil Power' },
      { id: 'in', name: 'IN', label: 'IN', x: 14, y: 45, direction: 'input', signalType: 'DIGITAL', description: 'Active-LOW Trigger Input' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 14, y: 65, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'no', name: 'NO', label: 'NO', x: 116, y: 22, direction: 'passive', signalType: 'PASSIVE', description: 'Normally Open Load Contact' },
      { id: 'com', name: 'COM', label: 'COM', x: 116, y: 45, direction: 'passive', signalType: 'PASSIVE', description: 'Common Load Terminal' },
      { id: 'nc', name: 'NC', label: 'NC', x: 116, y: 68, direction: 'passive', signalType: 'PASSIVE', description: 'Normally Closed Load Contact' }
    ],
    defaultProperties: {
      maxCurrentA: 10,
      maxVoltageAc: 250
    },
    defaultState: {
      energized: false,
      contactState: 'NC'
    }
  },

  'rgb-led': {
    type: 'rgb-led',
    category: 'discretes',
    name: 'RGB LED (5mm 4-Pin)',
    description: 'Common cathode full-color RGB LED with separate Red, Green, and Blue anodes.',
    width: 70,
    height: 80,
    pins: [
      { id: 'r', name: 'R', label: 'R', x: 16, y: 70, direction: 'passive', signalType: 'PASSIVE', description: 'Red Anode (+)' },
      { id: 'cathode', name: 'K', label: 'K', x: 28, y: 70, direction: 'passive', signalType: 'POWER_GND', description: 'Common Cathode (Longest Lead, -)' },
      { id: 'g', name: 'G', label: 'G', x: 42, y: 70, direction: 'passive', signalType: 'PASSIVE', description: 'Green Anode (+)' },
      { id: 'b', name: 'B', label: 'B', x: 54, y: 70, direction: 'passive', signalType: 'PASSIVE', description: 'Blue Anode (+)' }
    ],
    defaultProperties: {
      colorR: 255,
      colorG: 255,
      colorB: 255
    },
    defaultState: {
      illuminated: false,
      currentColor: '#ff00ff'
    }
  },

  'rotary-encoder': {
    type: 'rotary-encoder',
    category: 'inputs',
    name: 'KY-040 Rotary Encoder Module',
    description: '360-degree incremental quadrature rotary encoder with integrated push-button switch.',
    width: 110,
    height: 85,
    pins: [
      { id: 'clk', name: 'CLK', label: 'CLK', x: 18, y: 74, direction: 'output', signalType: 'DIGITAL', description: 'Quadrature Output A' },
      { id: 'dt', name: 'DT', label: 'DT', x: 36, y: 74, direction: 'output', signalType: 'DIGITAL', description: 'Quadrature Output B' },
      { id: 'sw', name: 'SW', label: 'SW', x: 54, y: 74, direction: 'output', signalType: 'DIGITAL', description: 'Push-Button Switch (Active Low)' },
      { id: 'plus', name: '+', label: '+', x: 72, y: 74, direction: 'power', signalType: 'POWER_VCC', voltageMin: 3.0, voltageMax: 5.5, description: 'Power 3.3V - 5V' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 90, y: 74, direction: 'power', signalType: 'POWER_GND', description: 'Ground' }
    ],
    defaultProperties: {
      ppr: 20
    },
    defaultState: {
      position: 0,
      buttonPressed: false,
      direction: 'NONE'
    }
  },

  'tp4056-module': {
    type: 'tp4056-module',
    category: 'power',
    name: 'TP4056 USB-C Charger Module',
    description: '1A Lithium battery charging module with Type-C USB port, dual charging status LEDs, and DW01A protection.',
    width: 140,
    height: 90,
    pins: [
      { id: 'in_plus', name: 'IN+', label: 'IN+', x: 14, y: 20, direction: 'power', signalType: 'POWER_VCC', voltageMin: 4.5, voltageMax: 5.5, description: '5V USB / DC Power Input +' },
      { id: 'in_minus', name: 'IN-', label: 'IN-', x: 14, y: 70, direction: 'power', signalType: 'POWER_GND', description: 'Power Input Ground -' },
      { id: 'out_plus', name: 'OUT+', label: 'OUT+', x: 126, y: 16, direction: 'output', signalType: 'POWER_VCC', description: 'System Protected Load +' },
      { id: 'bat_plus', name: 'B+', label: 'B+', x: 126, y: 36, direction: 'power', signalType: 'POWER_VCC', description: 'Lithium Battery Cell +' },
      { id: 'bat_minus', name: 'B-', label: 'B-', x: 126, y: 54, direction: 'power', signalType: 'POWER_GND', description: 'Lithium Battery Cell -' },
      { id: 'out_minus', name: 'OUT-', label: 'OUT-', x: 126, y: 74, direction: 'output', signalType: 'POWER_GND', description: 'System Protected Load -' }
    ],
    defaultProperties: {
      usbPowered: true,
      maxChargeCurrentMa: 1000
    },
    defaultState: {
      charging: true,
      charged: false,
      inputVoltage: 5.0,
      outputVoltage: 4.2
    }
  },

  'battery-600mah': {
    type: 'battery-600mah',
    category: 'power',
    name: '3.7V 600mAh LiPo Battery',
    description: 'Rechargeable 3.7V 600mAh lithium-polymer pouch cell with internal PCM protection circuit and silicone wire leads.',
    width: 130,
    height: 80,
    pins: [
      { id: 'pos', name: '+', label: '+', x: 118, y: 26, direction: 'power', signalType: 'POWER_VCC', voltageMin: 3.0, voltageMax: 4.2, description: 'Battery Positive (Red Wire, +3.7V)' },
      { id: 'neg', name: '-', label: '-', x: 118, y: 54, direction: 'power', signalType: 'POWER_GND', description: 'Battery Ground (Black Wire, 0V)' }
    ],
    defaultProperties: {
      capacityMah: 600,
      cellChemistry: 'LiPo',
      nominalVoltage: 3.7
    },
    defaultState: {
      socPercent: 80,
      voltage: 3.92,
      currentMa: 0
    }
  },

  'display-13-rgb': {
    type: 'display-13-rgb',
    category: 'displays',
    name: '1.3" IPS 240x240 RGB Display',
    description: 'High-definition 1.3 inch 240x240 IPS 65K full-color TFT display driven by ST7789 via high-speed SPI.',
    width: 140,
    height: 115,
    pins: [
      { id: 'gnd', name: 'GND', label: 'GND', x: 18, y: 14, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 33, y: 14, direction: 'power', signalType: 'POWER_VCC', voltageMin: 3.0, voltageMax: 5.0, description: 'Power 3.3V - 5V' },
      { id: 'scl', name: 'SCL', label: 'SCL', x: 48, y: 14, direction: 'input', signalType: 'SPI_SCK', description: 'SPI Clock (SCK)' },
      { id: 'sda', name: 'SDA', label: 'SDA', x: 63, y: 14, direction: 'input', signalType: 'SPI_MOSI', description: 'SPI Data (MOSI)' },
      { id: 'res', name: 'RES', label: 'RES', x: 78, y: 14, direction: 'input', signalType: 'DIGITAL', description: 'Reset (Active Low)' },
      { id: 'dc', name: 'DC', label: 'DC', x: 93, y: 14, direction: 'input', signalType: 'DIGITAL', description: 'Data / Command Select' },
      { id: 'cs', name: 'CS', label: 'CS', x: 108, y: 14, direction: 'input', signalType: 'SPI_CS', description: 'Chip Select' },
      { id: 'blk', name: 'BLK', label: 'BLK', x: 123, y: 14, direction: 'input', signalType: 'DIGITAL', description: 'Backlight Control' }
    ],
    defaultProperties: {
      resolution: '240x240',
      driver: 'ST7789',
      colorMode: 'RGB565'
    },
    defaultState: {
      backlightOn: true,
      demoPattern: 'radar'
    }
  },

  'vibration-sensor': {
    type: 'vibration-sensor',
    category: 'sensors',
    name: 'SW-420 Vibration Sensor',
    description: 'Normally closed high-sensitivity vibration detection module featuring SW-420 switch and LM393 voltage comparator.',
    width: 120,
    height: 75,
    pins: [
      { id: 'vcc', name: 'VCC', label: 'VCC', x: 30, y: 64, direction: 'power', signalType: 'POWER_VCC', voltageMin: 3.3, voltageMax: 5.5, description: 'Power 3.3V - 5V' },
      { id: 'gnd', name: 'GND', label: 'GND', x: 60, y: 64, direction: 'power', signalType: 'POWER_GND', description: 'Ground' },
      { id: 'do', name: 'DO', label: 'DO', x: 90, y: 64, direction: 'output', signalType: 'DIGITAL', description: 'Digital Output (High when vibrating)' }
    ],
    defaultProperties: {
      sensitivity: 50
    },
    defaultState: {
      vibrating: false,
      outputHigh: false
    }
  }
};
