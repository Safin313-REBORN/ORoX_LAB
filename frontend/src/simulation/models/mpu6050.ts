/**
 * MPU6050 6-Axis MotionTracking IMU Emulation Model
 * Accurate InvenSense MPU-6050 I2C Register Map & Physical Projection
 */

export class MPU6050Model {
  public ad0State: number = 0; // 0 -> 0x68, 1 -> 0x69
  public registers: Uint8Array = new Uint8Array(128);

  // Physical orientation (degrees)
  public pitch: number = 0;
  public roll: number = 0;
  public yaw: number = 0;

  // Angular velocity (deg/s)
  public gyroX: number = 0;
  public gyroY: number = 0;
  public gyroZ: number = 0;

  // Temperature
  public temperatureC: number = 25.0;

  constructor(ad0: number = 0) {
    this.ad0State = ad0;
    this.reset();
  }

  public reset(): void {
    this.registers.fill(0);
    this.registers[0x75] = 0x68; // WHO_AM_I always returns 0x68
    this.registers[0x6B] = 0x40; // Sleep mode enabled on boot
    this.updateRegisters();
  }

  public getI2CAddress(): number {
    return this.ad0State === 1 ? 0x69 : 0x68;
  }

  public setOrientation(pitchDeg: number, rollDeg: number, yawDeg: number): void {
    this.pitch = pitchDeg;
    this.roll = rollDeg;
    this.yaw = yawDeg;
    this.updateRegisters();
  }

  public setAngularVelocity(gx: number, gy: number, gz: number): void {
    this.gyroX = gx;
    this.gyroY = gy;
    this.gyroZ = gz;
    this.updateRegisters();
  }

  public setTemperature(tempC: number): void {
    this.temperatureC = tempC;
    this.updateRegisters();
  }

  private updateRegisters(): void {
    // Gravitational vector components at pitch theta, roll phi
    const theta = (this.pitch * Math.PI) / 180;
    const phi = (this.roll * Math.PI) / 180;

    const ax_g = Math.sin(theta);
    const ay_g = -Math.sin(phi) * Math.cos(theta);
    const az_g = Math.cos(theta) * Math.cos(phi);

    // Default scale: +/- 2g (16384 LSB/g)
    const rawAx = Math.max(-32768, Math.min(32767, Math.round(ax_g * 16384)));
    const rawAy = Math.max(-32768, Math.min(32767, Math.round(ay_g * 16384)));
    const rawAz = Math.max(-32768, Math.min(32767, Math.round(az_g * 16384)));

    // Gyro scale: +/- 250 deg/s (131 LSB / (deg/s))
    const rawGx = Math.max(-32768, Math.min(32767, Math.round(this.gyroX * 131)));
    const rawGy = Math.max(-32768, Math.min(32767, Math.round(this.gyroY * 131)));
    const rawGz = Math.max(-32768, Math.min(32767, Math.round(this.gyroZ * 131)));

    // Temp: raw = (tempC - 36.53) * 340
    const rawTemp = Math.round((this.temperatureC - 36.53) * 340);

    // Store into 16-bit Big-Endian register pairs
    this.setWord16(0x3B, rawAx);
    this.setWord16(0x3D, rawAy);
    this.setWord16(0x3F, rawAz);
    this.setWord16(0x41, rawTemp);
    this.setWord16(0x43, rawGx);
    this.setWord16(0x45, rawGy);
    this.setWord16(0x47, rawGz);
  }

  private setWord16(regHigh: number, value: number): void {
    const unsignedVal = value < 0 ? 65536 + value : value;
    this.registers[regHigh] = (unsignedVal >> 8) & 0xFF;
    this.registers[regHigh + 1] = unsignedVal & 0xFF;
  }

  public readRegister(reg: number): number {
    if (reg >= 0 && reg < this.registers.length) {
      return this.registers[reg];
    }
    return 0;
  }

  public writeRegister(reg: number, val: number): void {
    if (reg >= 0 && reg < this.registers.length) {
      this.registers[reg] = val & 0xFF;
      if (reg === 0x6B && (val & 0x40) === 0) {
        // Waking from sleep mode
        this.updateRegisters();
      }
    }
  }

  public readSequence(startReg: number, count: number): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < count; i++) {
      bytes.push(this.readRegister(startReg + i));
    }
    return bytes;
  }
}
