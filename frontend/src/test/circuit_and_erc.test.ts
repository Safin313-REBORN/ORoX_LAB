import { describe, it, expect } from 'vitest';
import { buildCircuitNets, pinKey } from '../simulation/circuit/netlist';
import { runElectricalRuleCheck } from '../simulation/validation/erc';
import { BOARD_DEFINITIONS } from '../boards/boardRegistry';
import { STARTER_PROJECTS } from '../templates/starterProjects';
import { ComponentInstance, Wire } from '../types/circuit';

describe('Circuit Graph & Netlist Engine', () => {
  it('correctly groups pins into electrical nets via Union-Find', () => {
    const components: ComponentInstance[] = [
      {
        id: 'esp32_1',
        type: 'esp32doit-devkit-v1',
        name: 'ESP32',
        x: 100,
        y: 100,
        rotation: 0,
        properties: {},
        state: {}
      },
      {
        id: 'oled_1',
        type: 'ssd1306',
        name: 'OLED',
        x: 300,
        y: 100,
        rotation: 0,
        properties: { i2cAddress: 0x3C },
        state: {}
      }
    ];

    const wires: Wire[] = [
      {
        id: 'w_sda',
        start: { componentId: 'esp32_1', pinId: 'gpio21' },
        end: { componentId: 'oled_1', pinId: 'sda' },
        color: '#06b6d4'
      },
      {
        id: 'w_scl',
        start: { componentId: 'esp32_1', pinId: 'gpio22' },
        end: { componentId: 'oled_1', pinId: 'scl' },
        color: '#f59e0b'
      }
    ];

    const nets = buildCircuitNets(components, wires, 'esp32doit-devkit-v1');
    expect(nets.size).toBeGreaterThan(0);

    // Verify SDA net contains both esp32:gpio21 and oled:sda
    const sdaKey = pinKey({ componentId: 'esp32_1', pinId: 'gpio21' });
    const sdaNet = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === sdaKey));
    expect(sdaNet).toBeDefined();
    expect(sdaNet?.pins.some(ep => ep.componentId === 'oled_1' && ep.pinId === 'sda')).toBe(true);

    // Verify SCL net contains both esp32:gpio22 and oled:scl
    const sclKey = pinKey({ componentId: 'esp32_1', pinId: 'gpio22' });
    const sclNet = Array.from(nets.values()).find(n => n.pins.some(ep => pinKey(ep) === sclKey));
    expect(sclNet).toBeDefined();
    expect(sclNet?.pins.some(ep => ep.componentId === 'oled_1' && ep.pinId === 'scl')).toBe(true);
  });
});

describe('Electrical Validation Engine (ERC)', () => {
  it('detects a dead short circuit between VCC and GND', () => {
    const components: ComponentInstance[] = [
      {
        id: 'esp32_1',
        type: 'esp32doit-devkit-v1',
        name: 'ESP32',
        x: 100,
        y: 100,
        rotation: 0,
        properties: {},
        state: {}
      }
    ];

    // Wire directly connecting 3V3 to GND
    const shortWire: Wire[] = [
      {
        id: 'w_short',
        start: { componentId: 'esp32_1', pinId: 'vcc_3v3' },
        end: { componentId: 'esp32_1', pinId: 'gnd_2' },
        color: '#ef4444'
      }
    ];

    const diagnostics = runElectricalRuleCheck(components, shortWire, 'esp32doit-devkit-v1');
    const shortDiag = diagnostics.find(d => d.id.startsWith('erc_short'));
    expect(shortDiag).toBeDefined();
    expect(shortDiag?.severity).toBe('error');
    expect(shortDiag?.blocksSimulation).toBe(true);
  });

  it('detects unpowered active ICs missing VCC or GND connections', () => {
    const components: ComponentInstance[] = [
      {
        id: 'oled_unpowered',
        type: 'ssd1306',
        name: 'Floating OLED',
        x: 200,
        y: 200,
        rotation: 0,
        properties: {},
        state: {}
      }
    ];

    const diagnostics = runElectricalRuleCheck(components, [], 'esp32doit-devkit-v1');
    const missingVcc = diagnostics.find(d => d.id === 'erc_missing_vcc_oled_unpowered');
    const missingGnd = diagnostics.find(d => d.id === 'erc_missing_gnd_oled_unpowered');

    expect(missingVcc).toBeDefined();
    expect(missingVcc?.severity).toBe('error');
    expect(missingGnd).toBeDefined();
    expect(missingGnd?.severity).toBe('error');
  });

  it('detects I2C address collisions when two devices share the same 7-bit address', () => {
    const components: ComponentInstance[] = [
      {
        id: 'mpu_1',
        type: 'mpu6050',
        name: 'MPU6050 A',
        x: 100,
        y: 100,
        rotation: 0,
        properties: { ad0: 0 }, // 0x68
        state: {}
      },
      {
        id: 'mpu_2',
        type: 'mpu6050',
        name: 'MPU6050 B',
        x: 250,
        y: 100,
        rotation: 0,
        properties: { ad0: 0 }, // 0x68 collision!
        state: {}
      }
    ];

    const diagnostics = runElectricalRuleCheck(components, [], 'esp32doit-devkit-v1');
    const collisionDiag = diagnostics.find(d => d.id.includes('collision_104')); // 0x68 = 104 decimal
    expect(collisionDiag).toBeDefined();
    expect(collisionDiag?.severity).toBe('error');
  });

  it('passes ERC with valid wiring on Project 1 (ESP32 Blink)', () => {
    const p1 = STARTER_PROJECTS[0].project;
    const diagnostics = runElectricalRuleCheck(p1.components, p1.wires, p1.boardId);
    const hasErrors = diagnostics.some(d => d.severity === 'error');
    expect(hasErrors).toBe(false);
  });

  it('validates ERC on all starter projects', () => {
    for (const starter of STARTER_PROJECTS) {
      const p = starter.project;
      const diags = runElectricalRuleCheck(p.components, p.wires, p.boardId);
      const errors = diags.filter(d => d.severity === 'error');
      if (errors.length > 0) {
        console.log(`Starter Project "${starter.name}" has ERC errors:`, errors.map(e => e.message));
      }
      expect(errors.length).toBe(0);
    }
  });
});

