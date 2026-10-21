import { ComponentPin } from '../types/circuit';

export interface BoardProfileFrontend {
  id: string;
  name: string;
  manufacturer: string;
  chipFamily: string;
  module: string;
  fqbn: string;
  supportStatus: 'fully_tested' | 'partially_supported' | 'compile_only' | 'definition_available';
  width: number;
  height: number;
  voltageOperating: number;
  builtinLedGpio?: number;
  builtinButtonGpio?: number;
  defaultI2C: { sda: number; scl: number };
  defaultSPI: { mosi: number; miso: number; sck: number; cs: number };
  defaultUART: { tx: number; rx: number };
  defaultI2S: { bclk: number; lrc: number; dout: number };
  dacChannels: number[];
  inputOnlyPins: number[];
  strappingPins: number[];
  flashReservedPins: number[];
  pins: ComponentPin[];
  description: string;
}

// Generate exact pin coordinates for ESP32 DevKit V1 (30-pin, 15 on left, 15 on right)
function createEsp32DevKitV1Pins(): ComponentPin[] {
  const pins: ComponentPin[] = [];
  const startY = 44;
  const pinSpacing = 18;
  const leftX = 14;
  const rightX = 166;

  // Left side pins (1 to 15)
  const leftDefinitions = [
    { id: 'en', name: 'EN', label: 'EN', dir: 'input', type: 'RESET', desc: 'Chip Enable' },
    { id: 'gpio36', name: 'GPIO36', label: 'VP', dir: 'input', type: 'ANALOG', gpio: 36, inputOnly: true, desc: 'ADC1_CH0 (Input only)' },
    { id: 'gpio39', name: 'GPIO39', label: 'VN', dir: 'input', type: 'ANALOG', gpio: 39, inputOnly: true, desc: 'ADC1_CH3 (Input only)' },
    { id: 'gpio34', name: 'GPIO34', label: 'D34', dir: 'input', type: 'ANALOG', gpio: 34, inputOnly: true, desc: 'ADC1_CH6 (Input only)' },
    { id: 'gpio35', name: 'GPIO35', label: 'D35', dir: 'input', type: 'ANALOG', gpio: 35, inputOnly: true, desc: 'ADC1_CH7 (Input only)' },
    { id: 'gpio32', name: 'GPIO32', label: 'D32', dir: 'bidirectional', type: 'DIGITAL', gpio: 32, desc: 'ADC1_CH4, Touch 9' },
    { id: 'gpio33', name: 'GPIO33', label: 'D33', dir: 'bidirectional', type: 'DIGITAL', gpio: 33, desc: 'ADC1_CH5, Touch 8' },
    { id: 'gpio25', name: 'GPIO25', label: 'D25', dir: 'bidirectional', type: 'DIGITAL', gpio: 25, desc: 'DAC1, ADC2_CH8, I2S LRC' },
    { id: 'gpio26', name: 'GPIO26', label: 'D26', dir: 'bidirectional', type: 'DIGITAL', gpio: 26, desc: 'DAC2, ADC2_CH9, I2S BCLK' },
    { id: 'gpio27', name: 'GPIO27', label: 'D27', dir: 'bidirectional', type: 'DIGITAL', gpio: 27, desc: 'ADC2_CH7, Touch 7' },
    { id: 'gpio14', name: 'GPIO14', label: 'D14', dir: 'bidirectional', type: 'DIGITAL', gpio: 14, desc: 'HSPI_SCK, ADC2_CH6' },
    { id: 'gpio12', name: 'GPIO12', label: 'D12', dir: 'bidirectional', type: 'DIGITAL', gpio: 12, strapping: true, desc: 'MTDI strapping, HSPI_MISO' },
    { id: 'gpio13', name: 'GPIO13', label: 'D13', dir: 'bidirectional', type: 'DIGITAL', gpio: 13, desc: 'HSPI_MOSI, ADC2_CH4' },
    { id: 'gnd_1', name: 'GND', label: 'GND', dir: 'power', type: 'POWER_GND', desc: 'Ground' },
    { id: 'vin', name: 'VIN', label: 'VIN', dir: 'power', type: 'POWER_VCC', desc: '5V Power Supply Input' },
  ];

  leftDefinitions.forEach((d, idx) => {
    pins.push({
      id: d.id,
      name: d.name,
      label: d.label,
      x: leftX,
      y: startY + idx * pinSpacing,
      direction: d.dir as any,
      signalType: d.type as any,
      gpioNum: (d as any).gpio,
      isInputOnly: !!(d as any).inputOnly,
      isStrapping: !!(d as any).strapping,
      description: d.desc
    });
  });

  // Right side pins (16 to 30)
  const rightDefinitions = [
    { id: 'gpio23', name: 'GPIO23', label: 'D23', dir: 'bidirectional', type: 'SPI_MOSI', gpio: 23, desc: 'VSPI MOSI' },
    { id: 'gpio22', name: 'GPIO22', label: 'D22', dir: 'bidirectional', type: 'I2C_SCL', gpio: 22, desc: 'Default Wire I2C SCL' },
    { id: 'gpio1', name: 'GPIO1', label: 'TX0', dir: 'output', type: 'DIGITAL', gpio: 1, desc: 'UART0 TX Serial Monitor' },
    { id: 'gpio3', name: 'GPIO3', label: 'RX0', dir: 'input', type: 'DIGITAL', gpio: 3, desc: 'UART0 RX Serial Monitor' },
    { id: 'gpio21', name: 'GPIO21', label: 'D21', dir: 'bidirectional', type: 'I2C_SDA', gpio: 21, desc: 'Default Wire I2C SDA' },
    { id: 'gpio19', name: 'GPIO19', label: 'D19', dir: 'bidirectional', type: 'SPI_MISO', gpio: 19, desc: 'VSPI MISO' },
    { id: 'gpio18', name: 'GPIO18', label: 'D18', dir: 'bidirectional', type: 'SPI_SCK', gpio: 18, desc: 'VSPI SCK' },
    { id: 'gpio5', name: 'GPIO5', label: 'D5', dir: 'bidirectional', type: 'SPI_CS', gpio: 5, strapping: true, desc: 'VSPI CS, Boot strapping' },
    { id: 'gpio4', name: 'GPIO4', label: 'D4', dir: 'bidirectional', type: 'DIGITAL', gpio: 4, desc: 'ADC2_CH0, Touch 0' },
    { id: 'gpio0', name: 'GPIO0', label: 'D0', dir: 'bidirectional', type: 'DIGITAL', gpio: 0, strapping: true, desc: 'Boot mode select (pull-up)' },
    { id: 'gpio2', name: 'GPIO2', label: 'D2', dir: 'bidirectional', type: 'DIGITAL', gpio: 2, strapping: true, desc: 'Built-in LED, Boot strapping' },
    { id: 'gpio15', name: 'GPIO15', label: 'D15', dir: 'bidirectional', type: 'DIGITAL', gpio: 15, strapping: true, desc: 'MTDO strapping' },
    { id: 'gnd_2', name: 'GND', label: 'GND', dir: 'power', type: 'POWER_GND', desc: 'Ground' },
    { id: 'vcc_3v3', name: '3V3', label: '3V3', dir: 'power', type: 'POWER_VCC', desc: '3.3V Regulated Output' },
    { id: 'en_2', name: 'EN', label: 'EN', dir: 'input', type: 'RESET', desc: 'Enable' },
  ];

  rightDefinitions.forEach((d, idx) => {
    pins.push({
      id: d.id,
      name: d.name,
      label: d.label,
      x: rightX,
      y: startY + idx * pinSpacing,
      direction: d.dir as any,
      signalType: d.type as any,
      gpioNum: (d as any).gpio,
      isStrapping: !!(d as any).strapping,
      description: d.desc
    });
  });

  return pins;
}

export const BOARD_DEFINITIONS: Record<string, BoardProfileFrontend> = {
  'esp32doit-devkit-v1': {
    id: 'esp32doit-devkit-v1',
    name: 'DOIT ESP32 DevKit V1',
    manufacturer: 'DOIT / Espressif',
    chipFamily: 'ESP32',
    module: 'ESP-WROOM-32',
    fqbn: 'esp32:esp32:esp32doit-devkit-v1',
    supportStatus: 'fully_tested',
    width: 180,
    height: 340,
    voltageOperating: 3.3,
    builtinLedGpio: 2,
    builtinButtonGpio: 0,
    defaultI2C: { sda: 21, scl: 22 },
    defaultSPI: { mosi: 23, miso: 19, sck: 18, cs: 5 },
    defaultUART: { tx: 1, rx: 3 },
    defaultI2S: { bclk: 26, lrc: 25, dout: 22 },
    dacChannels: [25, 26],
    inputOnlyPins: [34, 35, 36, 39],
    strappingPins: [0, 2, 5, 12, 15],
    flashReservedPins: [6, 7, 8, 9, 10, 11],
    pins: createEsp32DevKitV1Pins(),
    description: 'Flagship ESP32 board. Xtensa dual-core LX6 @ 240MHz, 520KB SRAM, hardware I2C/SPI/I2S/PWM, DAC.'
  },
  'esp32s3': {
    id: 'esp32s3',
    name: 'ESP32-S3 DevKitC-1',
    manufacturer: 'Espressif',
    chipFamily: 'ESP32-S3',
    module: 'ESP32-S3-WROOM-1',
    fqbn: 'esp32:esp32:esp32s3',
    supportStatus: 'partially_supported',
    width: 150,
    height: 300,
    voltageOperating: 3.3,
    builtinLedGpio: 48,
    defaultI2C: { sda: 8, scl: 9 },
    defaultSPI: { mosi: 11, miso: 13, sck: 12, cs: 10 },
    defaultUART: { tx: 43, rx: 44 },
    defaultI2S: { bclk: 15, lrc: 16, dout: 7 },
    dacChannels: [], // No DAC on S3!
    inputOnlyPins: [],
    strappingPins: [0, 3, 45, 46],
    flashReservedPins: [26, 27, 28, 29, 30, 31, 32],
    pins: createEsp32DevKitV1Pins(), // fallback pin mapping
    description: 'Dual-core Xtensa LX7 with vector extensions and native USB OTG.'
  },
  'esp32c3': {
    id: 'esp32c3',
    name: 'ESP32-C3 DevKitM-1',
    manufacturer: 'Espressif',
    chipFamily: 'ESP32-C3',
    module: 'ESP32-C3-MINI-1',
    fqbn: 'esp32:esp32:esp32c3',
    supportStatus: 'fully_tested',
    width: 140,
    height: 280,
    voltageOperating: 3.3,
    builtinLedGpio: 8,
    defaultI2C: { sda: 8, scl: 9 },
    defaultSPI: { mosi: 6, miso: 5, sck: 4, cs: 7 },
    defaultUART: { tx: 21, rx: 20 },
    defaultI2S: { bclk: 2, lrc: 3, dout: 10 },
    dacChannels: [],
    inputOnlyPins: [],
    strappingPins: [2, 8, 9],
    flashReservedPins: [12, 13, 14, 15, 16, 17],
    pins: createEsp32DevKitV1Pins(),
    description: 'RISC-V 32-bit RV32IMC processor core @ 160MHz.'
  }
};
