import { describe, it, expect } from 'vitest';
import { SSD1306Model } from '../simulation/models/ssd1306';
import { MPU6050Model } from '../simulation/models/mpu6050';
import { BatteryModel } from '../simulation/models/battery';
import { STARTER_PROJECTS } from '../templates/starterProjects';
import { BOARD_DEFINITIONS } from '../boards/boardRegistry';

describe('SSD1306 OLED Model', () => {
  it('initializes with a clean 1024-byte framebuffer for 128x64 pixels', () => {
    const oled = new SSD1306Model(128, 64);
    expect(oled.buffer.length).toBe(1024);
    expect(oled.buffer.every(b => b === 0)).toBe(true);
  });

  it('sets and clears individual pixels correctly', () => {
    const oled = new SSD1306Model(128, 64);
    oled.setPixel(10, 15, true);

    const page = Math.floor(15 / 8); // page 1
    const bit = 15 % 8; // bit 7
    const index = page * 128 + 10;

    expect(oled.buffer[index] & (1 << bit)).toBe(1 << bit);

    // Clear pixel
    oled.setPixel(10, 15, false);
    expect(oled.buffer[index] & (1 << bit)).toBe(0);
  });

  it('renders ASCII text characters into framebuffer memory', () => {
    const oled = new SSD1306Model(128, 64);
    oled.drawText('ROBOLAB', 0, 0, true);

    // Buffer should now have non-zero pixels
    const nonZeroCount = oled.buffer.filter(b => b > 0).length;
    expect(nonZeroCount).toBeGreaterThan(10);
  });
});

describe('MPU6050 IMU Model', () => {
  it('returns 0x68 on WHO_AM_I register (0x75)', () => {
    const mpu = new MPU6050Model(0);
    expect(mpu.readRegister(0x75)).toBe(0x68);
    expect(mpu.getI2CAddress()).toBe(0x68);

    // Test AD0 address change to 0x69
    const mpuHigh = new MPU6050Model(1);
    expect(mpuHigh.getI2CAddress()).toBe(0x69);
  });

  it('updates raw 16-bit accelerometer registers according to pitch and roll', () => {
    const mpu = new MPU6050Model(0);

    // At flat neutral orientation (0, 0), Az should be ~1.0g (+16384 LSB), Ax and Ay ~0
    mpu.setOrientation(0, 0, 0);
    const rawAz = (mpu.readRegister(0x3F) << 8) | mpu.readRegister(0x40);
    const signedAz = rawAz > 32767 ? rawAz - 65536 : rawAz;
    expect(signedAz).toBeGreaterThan(16000);
    expect(signedAz).toBeLessThanOrEqual(16384);

    // Pitch 90 degrees up: Ax should be ~1.0g (+16384 LSB)
    mpu.setOrientation(90, 0, 0);
    const rawAx = (mpu.readRegister(0x3B) << 8) | mpu.readRegister(0x3C);
    const signedAx = rawAx > 32767 ? rawAx - 65536 : rawAx;
    expect(signedAx).toBeGreaterThan(16000);
  });
});

describe('Battery & TP4056 Subsystem', () => {
  it('estimates State of Charge (SoC) across typical OCV curve', () => {
    const bat = new BatteryModel(4.20, 1200);
    expect(bat.getEstimatedSoC(4.20)).toBe(100);
    expect(bat.getEstimatedSoC(3.85)).toBe(60);
    expect(bat.getEstimatedSoC(3.00)).toBe(0);
  });

  it('operates in Constant Current (CC) charging mode when cell voltage < 4.18V', () => {
    const bat = new BatteryModel(3.70, 1200);
    bat.isUsbConnected = true;
    const state = bat.step(1.0);

    expect(state.chargingState).toBe('CC');
    expect(state.chargeCurrentMa).toBe(1000);
    expect(state.redLed).toBe(true);
    expect(state.blueLed).toBe(false);
  });

  it('transitions to DONE mode when fully charged to 4.2V', () => {
    const bat = new BatteryModel(4.20, 1200);
    bat.isUsbConnected = true;
    const state = bat.step(1.0);

    expect(state.chargingState).toBe('DONE');
    expect(state.blueLed).toBe(true);
  });
});

describe('Starter Projects Integrity', () => {
  it('includes all 8 mandatory starter projects with complete schemas', () => {
    expect(STARTER_PROJECTS.length).toBe(8);

    for (const starter of STARTER_PROJECTS) {
      expect(starter.id).toBeDefined();
      expect(starter.name).toBeDefined();
      expect(starter.project.files.length).toBeGreaterThan(0);
      expect(starter.project.files[0].content.length).toBeGreaterThan(20);
      expect(starter.project.components.length).toBeGreaterThan(0);
      expect(BOARD_DEFINITIONS[starter.project.boardId]).toBeDefined();
    }
  });
});
