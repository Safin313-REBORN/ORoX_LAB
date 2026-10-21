import { ComponentInstance, Wire, ElectricalDiagnostic } from '../../types/circuit';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { COMPONENT_CATALOG } from '../models/componentRegistry';
import { buildCircuitNets, resolvePinDefinition, pinKey } from '../circuit/netlist';

export function runElectricalRuleCheck(
  components: ComponentInstance[],
  wires: Wire[],
  boardId: string
): ElectricalDiagnostic[] {
  const diagnostics: ElectricalDiagnostic[] = [];
  const board = BOARD_DEFINITIONS[boardId] || BOARD_DEFINITIONS['esp32doit-devkit-v1'];
  const nets = buildCircuitNets(components, wires, boardId);
  const componentMap = new Map<string, ComponentInstance>();
  components.forEach(c => componentMap.set(c.id, c));

  // 1. Direct Short Circuit Detection (VCC directly connected to GND)
  for (const net of nets.values()) {
    let hasVcc = false;
    let hasGnd = false;
    let vccPinStr = '';
    let gndPinStr = '';

    for (const ep of net.pins) {
      const comp = componentMap.get(ep.componentId);
      if (!comp) continue;
      const pin = resolvePinDefinition(comp, ep.pinId, boardId);
      if (!pin) continue;

      if (pin.signalType === 'POWER_VCC' || pin.name === '3V3' || pin.name === 'VIN' || pin.name === 'VCC') {
        hasVcc = true;
        vccPinStr = `${comp.name} (${pin.name})`;
      }
      if (pin.signalType === 'POWER_GND' || pin.name === 'GND') {
        hasGnd = true;
        gndPinStr = `${comp.name} (${pin.name})`;
      }
    }

    if (hasVcc && hasGnd) {
      diagnostics.push({
        id: `erc_short_${net.id}`,
        severity: 'error',
        title: 'Dead Short Circuit Detected',
        message: `Power rail (${vccPinStr}) is directly connected to Ground (${gndPinStr}) in ${net.name}.`,
        suggestion: 'Remove the wire directly bridging the VCC and GND pins immediately to prevent simulated power destruction.',
        blocksSimulation: true
      });
    }
  }

  // 2. Active IC Power & Ground Path Verification
  const activeComponentsRequiringPower = ['ssd1306', 'mpu6050', 'max98357a', 'ttp223', 'active-buzzer'];
  for (const comp of components) {
    if (!activeComponentsRequiringPower.includes(comp.type)) continue;
    const meta = COMPONENT_CATALOG[comp.type];
    if (!meta) continue;

    // Check VCC connected to a power rail
    const vccPin = meta.pins.find(p => p.id === 'vcc' || p.id === 'vin' || p.id === 'pos');
    if (vccPin) {
      const vccKey = pinKey({ componentId: comp.id, pinId: vccPin.id });
      const net = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === vccKey));
      const isConnectedToVcc = net && (net.pins.length > 1) && net.pins.some(ep => {
        const otherComp = componentMap.get(ep.componentId);
        if (!otherComp || ep.componentId === comp.id) return false;
        const otherPin = resolvePinDefinition(otherComp, ep.pinId, boardId);
        return otherPin && (otherPin.signalType === 'POWER_VCC' || otherPin.name === '3V3' || otherPin.name === 'VIN');
      });

      if (!isConnectedToVcc) {
        diagnostics.push({
          id: `erc_missing_vcc_${comp.id}`,
          severity: 'error',
          title: `Unpowered Component: ${comp.name}`,
          message: `${comp.name} pin ${vccPin.name} is not connected to a valid positive voltage supply rail (3V3 or VIN).`,
          componentId: comp.id,
          pinId: vccPin.id,
          suggestion: `Connect ${comp.name} pin ${vccPin.name} to the ESP32 3V3 or VIN power pin.`,
          blocksSimulation: true
        });
      }
    }

    // Check GND connected to system ground
    const gndPin = meta.pins.find(p => p.id === 'gnd' || p.id === 'neg');
    if (gndPin) {
      const gndKey = pinKey({ componentId: comp.id, pinId: gndPin.id });
      const net = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === gndKey));
      const isConnectedToGnd = net && (net.pins.length > 1) && net.pins.some(ep => {
        const otherComp = componentMap.get(ep.componentId);
        if (!otherComp || ep.componentId === comp.id) return false;
        const otherPin = resolvePinDefinition(otherComp, ep.pinId, boardId);
        return otherPin && (otherPin.signalType === 'POWER_GND' || otherPin.name === 'GND');
      });

      if (!isConnectedToGnd) {
        diagnostics.push({
          id: `erc_missing_gnd_${comp.id}`,
          severity: 'error',
          title: `Missing Ground Path: ${comp.name}`,
          message: `${comp.name} pin ${gndPin.name} has no return path to system Ground.`,
          componentId: comp.id,
          pinId: gndPin.id,
          suggestion: `Connect ${comp.name} pin ${gndPin.name} to a board GND pin.`,
          blocksSimulation: true
        });
      }
    }
  }

  // 3. ESP32 Input-Only Pin Validation (GPIO 34, 35, 36, 39 cannot output)
  const boardComp = components.find(c => c.type === 'board' || c.type.startsWith('esp32'));
  if (boardComp) {
    for (const pin of board.pins) {
      if (pin.isInputOnly && pin.gpioNum !== undefined) {
        const pk = pinKey({ componentId: boardComp.id, pinId: pin.id });
        const net = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === pk));
        if (net) {
          // Check if connected to something requiring driving output, like buzzer pos or led anode without external pull
          for (const ep of net.pins) {
            const comp = componentMap.get(ep.componentId);
            if (!comp || ep.componentId === boardComp.id) continue;
            if (comp.type === 'active-buzzer' && ep.pinId === 'pos') {
              diagnostics.push({
                id: `erc_input_only_buzzer_${pin.gpioNum}`,
                severity: 'error',
                title: `Invalid GPIO Mode: GPIO${pin.gpioNum}`,
                message: `GPIO${pin.gpioNum} on ESP32 is an input-only pin (no internal output driver) and cannot drive the buzzer.`,
                componentId: boardComp.id,
                pinId: pin.id,
                suggestion: `Move the buzzer signal connection to an output-capable GPIO, such as GPIO25, GPIO26, or GPIO4.`,
                blocksSimulation: true
              });
            }
          }
        }
      }
    }
  }

  // 4. I2C Bus Diagnostics & Address Collision
  // Find all I2C devices attached to the same I2C SDA/SCL net
  const i2cDevices = components.filter(c => c.type === 'ssd1306' || c.type === 'mpu6050');
  const i2cAddressUsage = new Map<number, string[]>();

  for (const dev of i2cDevices) {
    let addr = 0;
    if (dev.type === 'ssd1306') {
      addr = dev.properties.i2cAddress || 0x3C;
    } else if (dev.type === 'mpu6050') {
      addr = dev.properties.ad0 === 1 ? 0x69 : 0x68;
    }

    if (!i2cAddressUsage.has(addr)) {
      i2cAddressUsage.set(addr, []);
    }
    i2cAddressUsage.get(addr)!.push(dev.name);

    // Verify both SDA and SCL are connected
    const sdaKey = pinKey({ componentId: dev.id, pinId: 'sda' });
    const sclKey = pinKey({ componentId: dev.id, pinId: 'scl' });
    const sdaNet = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === sdaKey));
    const sclNet = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === sclKey));

    if (!sdaNet || sdaNet.pins.length < 2 || !sclNet || sclNet.pins.length < 2) {
      diagnostics.push({
        id: `erc_i2c_incomplete_${dev.id}`,
        severity: 'warning',
        title: `Incomplete I2C Bus Connection: ${dev.name}`,
        message: `${dev.name} requires both SDA (data) and SCL (clock) lines connected to the microcontroller I2C bus.`,
        componentId: dev.id,
        suggestion: `Connect ${dev.name} SDA to ESP32 GPIO21 and SCL to ESP32 GPIO22.`,
        blocksSimulation: false
      });
    }
  }

  // Check address collision
  for (const [addr, devNames] of i2cAddressUsage.entries()) {
    if (devNames.length > 1) {
      diagnostics.push({
        id: `erc_i2c_collision_${addr}`,
        severity: 'error',
        title: `I2C Bus Address Collision: 0x${addr.toString(16).toUpperCase()}`,
        message: `Multiple devices share the same 7-bit I2C address 0x${addr.toString(16).toUpperCase()}: ${devNames.join(', ')}.`,
        suggestion: `Change the AD0 address jumper on one of the sensors to assign a unique address (e.g. 0x69 for MPU6050).`,
        blocksSimulation: true
      });
    }
  }

  // 5. MAX98357A I2S Peripheral Validation
  const maxAmp = components.find(c => c.type === 'max98357a');
  if (maxAmp) {
    const lrcKey = pinKey({ componentId: maxAmp.id, pinId: 'lrc' });
    const bclkKey = pinKey({ componentId: maxAmp.id, pinId: 'bclk' });
    const dinKey = pinKey({ componentId: maxAmp.id, pinId: 'din' });

    const lrcNet = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === lrcKey));
    const bclkNet = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === bclkKey));
    const dinNet = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === dinKey));

    if (!lrcNet || lrcNet.pins.length < 2 || !bclkNet || bclkNet.pins.length < 2 || !dinNet || dinNet.pins.length < 2) {
      diagnostics.push({
        id: `erc_i2s_incomplete_${maxAmp.id}`,
        severity: 'warning',
        title: 'Incomplete I2S Digital Audio Interface',
        message: 'MAX98357A requires LRC (Word Select), BCLK (Bit Clock), and DIN (Data) lines wired to the ESP32.',
        componentId: maxAmp.id,
        suggestion: 'Connect LRC to GPIO25, BCLK to GPIO26, and DIN to GPIO22.',
        blocksSimulation: false
      });
    }
  }

  // 6. Strapping Pin Warnings (GPIO0, GPIO2, GPIO12)
  if (boardComp) {
    const gpio0Pin = board.pins.find(p => p.gpioNum === 0);
    if (gpio0Pin) {
      const pk = pinKey({ componentId: boardComp.id, pinId: gpio0Pin.id });
      const net = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === pk));
      if (net && net.logic === 'LOW') {
        diagnostics.push({
          id: `erc_strapping_gpio0`,
          severity: 'warning',
          title: 'Boot Strapping Conflict: GPIO0 Pulled LOW',
          message: 'GPIO0 is tied LOW at power-up, which forces the ESP32 into ROM Serial Download/Flashing mode instead of executing SPI flash firmware.',
          componentId: boardComp.id,
          suggestion: 'Ensure GPIO0 is pulled HIGH (or left floating with internal weak pull-up) during regular boot.',
          blocksSimulation: false
        });
      }
    }
  }

  // 7. Success notice if 0 errors
  const hasErrors = diagnostics.some(d => d.severity === 'error');
  if (!hasErrors) {
    diagnostics.push({
      id: 'erc_passed',
      severity: 'info',
      title: 'Electrical Rules Check Passed',
      message: 'All power rails, ground nets, and peripheral pin assignments conform to ESP32 electrical specifications.',
      suggestion: 'Ready to compile firmware and execute simulation.',
      blocksSimulation: false
    });
  }

  return diagnostics;
}
