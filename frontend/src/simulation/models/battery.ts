/**
 * Lithium-Ion / LiPo Battery & TP4056 Charging Subsystem Model
 * Implements physical CC/CV battery charging curves, OCV discharge, and DW01 protection.
 */

export interface BatteryState {
  cellVoltage: number;
  terminalVoltage: number;
  socPercent: number;
  chargingState: 'IDLE' | 'TRICKLE' | 'CC' | 'CV' | 'DONE' | 'FAULT';
  chargeCurrentMa: number;
  loadCurrentMa: number;
  batteryNetCurrentMa: number;
  redLed: boolean;
  blueLed: boolean;
  isUsbConnected: boolean;
  protectionTripped: boolean;
}

export class BatteryModel {
  public capacityMah: number = 1200;
  public internalResistanceOhm: number = 0.08;
  public cellVoltage: number = 3.85;
  public isUsbConnected: boolean = true;
  public loadResistanceOhm: number = 50.0;

  private ocvTable: Array<[number, number]> = [
    [4.20, 100],
    [4.15, 95],
    [4.05, 85],
    [3.92, 70],
    [3.85, 60],
    [3.78, 45],
    [3.70, 30],
    [3.60, 15],
    [3.40, 5],
    [3.00, 0]
  ];

  constructor(initialVoltage: number = 3.85, capacityMah: number = 1200) {
    this.cellVoltage = initialVoltage;
    this.capacityMah = capacityMah;
  }

  public getEstimatedSoC(voltage: number): number {
    if (voltage >= 4.20) return 100;
    if (voltage <= 3.00) return 0;

    for (let i = 0; i < this.ocvTable.length - 1; i++) {
      const [vHigh, socHigh] = this.ocvTable[i];
      const [vLow, socLow] = this.ocvTable[i + 1];

      if (voltage <= vHigh && voltage >= vLow) {
        const factor = (voltage - vLow) / (vHigh - vLow);
        return Math.round(socLow + factor * (socHigh - socLow));
      }
    }
    return 50;
  }

  public step(deltaTimeSec: number = 0.1, externalLoadMa?: number): BatteryState {
    const soc = this.getEstimatedSoC(this.cellVoltage);
    let chargeCurrentMa = 0;
    let chargingState: 'IDLE' | 'TRICKLE' | 'CC' | 'CV' | 'DONE' | 'FAULT' = 'IDLE';
    let redLed = false;
    let blueLed = false;
    let protectionTripped = false;

    // Protection check
    if (this.cellVoltage < 2.40) {
      protectionTripped = true;
      chargingState = 'FAULT';
    }

    // Determine load current
    const loadCurrentMa = externalLoadMa !== undefined ? externalLoadMa : (this.cellVoltage / this.loadResistanceOhm) * 1000;

    // TP4056 Charging Logic
    if (this.isUsbConnected && !protectionTripped) {
      if (this.cellVoltage < 2.90) {
        // Trickle Charge Phase
        chargingState = 'TRICKLE';
        chargeCurrentMa = 100;
        redLed = true;
      } else if (this.cellVoltage < 4.18) {
        // Constant Current (CC) Phase (~1000mA)
        chargingState = 'CC';
        chargeCurrentMa = 1000;
        redLed = true;
      } else if (this.cellVoltage < 4.20) {
        // Constant Voltage (CV) Phase
        chargingState = 'CV';
        const cvFactor = (4.20 - this.cellVoltage) / 0.02;
        chargeCurrentMa = Math.max(100, Math.round(1000 * cvFactor));
        redLed = true;
      } else {
        // Charge Complete
        chargingState = 'DONE';
        chargeCurrentMa = 0;
        blueLed = true;
      }
    } else {
      chargingState = 'IDLE';
    }

    // Net battery current (positive = charging, negative = discharging)
    const batteryNetCurrentMa = chargeCurrentMa - loadCurrentMa;

    // Terminal voltage under load (V = Vocv + I*R)
    const terminalVoltage = Math.max(0, this.cellVoltage + (batteryNetCurrentMa / 1000.0) * this.internalResistanceOhm);

    // Update battery capacity and open circuit voltage over time
    const chargeDeltaMah = (batteryNetCurrentMa * (deltaTimeSec / 3600));
    const deltaV = (chargeDeltaMah / this.capacityMah) * (4.20 - 3.00);
    this.cellVoltage = Math.max(2.40, Math.min(4.20, this.cellVoltage + deltaV));

    return {
      cellVoltage: Number(this.cellVoltage.toFixed(3)),
      terminalVoltage: Number(terminalVoltage.toFixed(3)),
      socPercent: soc,
      chargingState,
      chargeCurrentMa,
      loadCurrentMa: Math.round(loadCurrentMa),
      batteryNetCurrentMa: Math.round(batteryNetCurrentMa),
      redLed,
      blueLed,
      isUsbConnected: this.isUsbConnected,
      protectionTripped
    };
  }
}
