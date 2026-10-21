/**
 * SSD1306 128x64 / 128x32 OLED Display Emulation Model
 * Decodes standard Solomon Systech SSD1306 I2C Command and Data Stream.
 */

export class SSD1306Model {
  public width: number = 128;
  public height: number = 64;
  public buffer: Uint8Array;
  public powerOn: boolean = true;
  public inverted: boolean = false;
  public contrast: number = 0x7F;

  // Addressing state
  private addressMode: number = 0; // 0=Horizontal, 1=Vertical, 2=Page
  private pageAddress: number = 0; // 0 to 7
  private columnAddress: number = 0; // 0 to 127
  private colStart: number = 0;
  private colEnd: number = 127;
  private pageStart: number = 0;
  private pageEnd: number = 7;

  private pendingCommand: number | null = null;
  private lastUpdate: number = Date.now();

  constructor(width: number = 128, height: number = 64) {
    this.width = width;
    this.height = height;
    this.buffer = new Uint8Array((width * height) / 8);
  }

  public clear(): void {
    this.buffer.fill(0);
    this.lastUpdate = Date.now();
  }

  /**
   * Process incoming I2C byte stream
   * @param controlByte 0x00 for commands, 0x40 for data bytes
   * @param dataBytes stream of payload bytes
   */
  public processI2CStream(controlByte: number, dataBytes: number[]): void {
    if (controlByte === 0x00) {
      // Command stream
      for (const cmd of dataBytes) {
        this.executeCommand(cmd);
      }
    } else if (controlByte === 0x40) {
      // GDDRAM Data stream
      for (const d of dataBytes) {
        this.writeDataByte(d);
      }
      this.lastUpdate = Date.now();
    }
  }

  private executeCommand(cmd: number): void {
    if (this.pendingCommand !== null) {
      // Handle multi-byte command parameters
      const prev = this.pendingCommand;
      this.pendingCommand = null;

      if (prev === 0x81) {
        this.contrast = cmd;
      } else if (prev === 0x20) {
        this.addressMode = cmd & 0x03;
      } else if (prev === 0x21) {
        // Set column address range
        this.colStart = cmd & 0x7F;
      } else if (prev === 0x22) {
        // Set page address range
        this.pageStart = cmd & 0x07;
      }
      return;
    }

    // Single-byte commands or prefixes
    if (cmd === 0xAE) {
      this.powerOn = false;
    } else if (cmd === 0xAF) {
      this.powerOn = true;
    } else if (cmd === 0xA6) {
      this.inverted = false;
    } else if (cmd === 0xA7) {
      this.inverted = true;
    } else if ((cmd & 0xF0) === 0xB0) {
      // Set Page Start Address for Page Addressing Mode (0xB0 - 0xB7)
      this.pageAddress = cmd & 0x07;
    } else if ((cmd & 0xF0) === 0x00) {
      // Set Lower Column Start Address (0x00 - 0x0F)
      this.columnAddress = (this.columnAddress & 0xF0) | (cmd & 0x0F);
    } else if ((cmd & 0xF0) === 0x10) {
      // Set Higher Column Start Address (0x10 - 0x1F)
      this.columnAddress = (this.columnAddress & 0x0F) | ((cmd & 0x0F) << 4);
    } else if (cmd === 0x81 || cmd === 0x20 || cmd === 0x21 || cmd === 0x22) {
      // Commands expecting an argument byte next
      this.pendingCommand = cmd;
    }
  }

  private writeDataByte(val: number): void {
    if (this.pageAddress >= 8 || this.columnAddress >= this.width) return;

    const index = this.pageAddress * this.width + this.columnAddress;
    if (index < this.buffer.length) {
      this.buffer[index] = val;
    }

    // Increment pointer according to addressing mode
    this.columnAddress++;
    if (this.columnAddress > this.colEnd) {
      this.columnAddress = this.colStart;
      this.pageAddress++;
      if (this.pageAddress > this.pageEnd) {
        this.pageAddress = this.pageStart;
      }
    }
  }

  /**
   * Helper to write formatted text into the framebuffer for simulation
   */
  public drawText(text: string, x: number, y: number, color: boolean = true): void {
    // 5x7 ASCII font renderer
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      this.drawChar(charCode, x + i * 6, y, color);
    }
    this.lastUpdate = Date.now();
  }

  private drawChar(charCode: number, startX: number, startY: number, color: boolean): void {
    const glyph = FONT_5X7[charCode] || FONT_5X7[32]; // space default
    for (let col = 0; col < 5; col++) {
      const colBits = glyph[col];
      for (let row = 0; row < 7; row++) {
        if ((colBits & (1 << row)) !== 0) {
          this.setPixel(startX + col, startY + row, color);
        }
      }
    }
  }

  public setPixel(x: number, y: number, on: boolean): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const page = Math.floor(y / 8);
    const bit = y % 8;
    const index = page * this.width + x;

    if (on) {
      this.buffer[index] |= (1 << bit);
    } else {
      this.buffer[index] &= ~(1 << bit);
    }
  }

  public renderToCanvas(ctx: CanvasRenderingContext2D, displayColor: string = '#00e5ff'): void {
    const imgData = ctx.createImageData(this.width, this.height);
    const pixels = imgData.data;

    // Parse color hex to rgb
    const r = parseInt(displayColor.slice(1, 3), 16) || 0;
    const g = parseInt(displayColor.slice(3, 5), 16) || 229;
    const b = parseInt(displayColor.slice(5, 7), 16) || 255;

    for (let page = 0; page < 8; page++) {
      for (let col = 0; col < this.width; col++) {
        const byte = this.buffer[page * this.width + col];
        for (let bit = 0; bit < 8; bit++) {
          const y = page * 8 + bit;
          if (y >= this.height) continue;

          const isPixelOn = ((byte & (1 << bit)) !== 0) !== this.inverted;
          const pixelIdx = (y * this.width + col) * 4;

          if (isPixelOn && this.powerOn) {
            pixels[pixelIdx] = r;
            pixels[pixelIdx + 1] = g;
            pixels[pixelIdx + 2] = b;
            pixels[pixelIdx + 3] = 255;
          } else {
            pixels[pixelIdx] = 10;
            pixels[pixelIdx + 1] = 12;
            pixels[pixelIdx + 2] = 16;
            pixels[pixelIdx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }
}

// Built-in compact 5x7 ASCII bitmap font table
const FONT_5X7: Record<number, number[]> = {
  32: [0x00, 0x00, 0x00, 0x00, 0x00], // space
  33: [0x00, 0x00, 0x5F, 0x00, 0x00], // !
  43: [0x08, 0x08, 0x3E, 0x08, 0x08], // +
  45: [0x08, 0x08, 0x08, 0x08, 0x08], // -
  46: [0x00, 0x60, 0x60, 0x00, 0x00], // .
  48: [0x3E, 0x51, 0x49, 0x45, 0x3E], // 0
  49: [0x00, 0x42, 0x7F, 0x40, 0x00], // 1
  50: [0x42, 0x61, 0x51, 0x49, 0x46], // 2
  51: [0x21, 0x41, 0x45, 0x4B, 0x31], // 3
  52: [0x18, 0x14, 0x12, 0x7F, 0x10], // 4
  53: [0x27, 0x45, 0x45, 0x45, 0x39], // 5
  54: [0x3C, 0x4A, 0x49, 0x49, 0x30], // 6
  55: [0x01, 0x71, 0x09, 0x05, 0x03], // 7
  56: [0x36, 0x49, 0x49, 0x49, 0x36], // 8
  57: [0x06, 0x49, 0x49, 0x29, 0x1E], // 9
  58: [0x00, 0x36, 0x36, 0x00, 0x00], // :
  65: [0x7E, 0x11, 0x11, 0x11, 0x7E], // A
  66: [0x7F, 0x49, 0x49, 0x49, 0x36], // B
  67: [0x3E, 0x41, 0x41, 0x41, 0x22], // C
  68: [0x7F, 0x41, 0x41, 0x22, 0x1C], // D
  69: [0x7F, 0x49, 0x49, 0x49, 0x41], // E
  70: [0x7F, 0x09, 0x09, 0x09, 0x01], // F
  71: [0x3E, 0x41, 0x49, 0x49, 0x7A], // G
  72: [0x7F, 0x08, 0x08, 0x08, 0x7F], // H
  73: [0x00, 0x41, 0x7F, 0x41, 0x00], // I
  74: [0x20, 0x40, 0x41, 0x3F, 0x01], // J
  75: [0x7F, 0x08, 0x14, 0x22, 0x41], // K
  76: [0x7F, 0x40, 0x40, 0x40, 0x40], // L
  77: [0x7F, 0x02, 0x0C, 0x02, 0x7F], // M
  78: [0x7F, 0x04, 0x08, 0x10, 0x7F], // N
  79: [0x3E, 0x41, 0x41, 0x41, 0x3E], // O
  80: [0x7F, 0x09, 0x09, 0x09, 0x06], // P
  81: [0x3E, 0x41, 0x51, 0x21, 0x5E], // Q
  82: [0x7F, 0x09, 0x19, 0x29, 0x46], // R
  83: [0x46, 0x49, 0x49, 0x49, 0x31], // S
  84: [0x01, 0x01, 0x7F, 0x01, 0x01], // T
  85: [0x3F, 0x40, 0x40, 0x40, 0x3F], // U
  86: [0x1F, 0x20, 0x40, 0x20, 0x1F], // V
  87: [0x7F, 0x20, 0x18, 0x20, 0x7F], // W
  88: [0x63, 0x14, 0x08, 0x14, 0x63], // X
  89: [0x07, 0x08, 0x70, 0x08, 0x07], // Y
  90: [0x61, 0x51, 0x49, 0x45, 0x43], // Z
  97: [0x20, 0x54, 0x54, 0x54, 0x78], // a
  98: [0x7F, 0x48, 0x44, 0x44, 0x38], // b
  99: [0x38, 0x44, 0x44, 0x44, 0x20], // c
  100: [0x38, 0x44, 0x44, 0x48, 0x7F], // d
  101: [0x38, 0x54, 0x54, 0x54, 0x18], // e
  102: [0x08, 0x7E, 0x09, 0x01, 0x02], // f
  103: [0x08, 0x14, 0x54, 0x54, 0x3C], // g
  104: [0x7F, 0x08, 0x04, 0x04, 0x78], // h
  105: [0x00, 0x44, 0x7D, 0x40, 0x00], // i
  106: [0x20, 0x40, 0x44, 0x3D, 0x00], // j
  107: [0x7F, 0x10, 0x28, 0x44, 0x00], // k
  108: [0x00, 0x41, 0x7F, 0x40, 0x00], // l
  109: [0x7C, 0x04, 0x18, 0x04, 0x78], // m
  110: [0x7C, 0x08, 0x04, 0x04, 0x78], // n
  111: [0x38, 0x44, 0x44, 0x44, 0x38], // o
  112: [0x7C, 0x14, 0x14, 0x14, 0x08], // p
  113: [0x08, 0x14, 0x14, 0x18, 0x7C], // q
  114: [0x7C, 0x08, 0x04, 0x04, 0x08], // r
  115: [0x48, 0x54, 0x54, 0x54, 0x20], // s
  116: [0x04, 0x3F, 0x44, 0x40, 0x20], // t
  117: [0x3C, 0x40, 0x40, 0x20, 0x7C], // u
  118: [0x1C, 0x20, 0x40, 0x20, 0x1C], // v
  119: [0x3C, 0x40, 0x30, 0x40, 0x3C], // w
  120: [0x44, 0x28, 0x10, 0x28, 0x44], // x
  121: [0x0C, 0x50, 0x50, 0x50, 0x3C], // y
  122: [0x44, 0x64, 0x54, 0x4C, 0x44], // z
};
