/**
 * X5/Cat Printer Protocol Implementation
 * Based on: https://github.com/lisp3r/bluetooth-thermal-printer
 * and https://werwolv.net/blog/cat_printer
 */

export class X5PrinterProtocol {
  // Command headers - all commands start with 0x51 0x78
  private static readonly CMD_HEADER = [0x51, 0x78];

  // Command types
  private static readonly CMD_DRAW_BITMAP = 0xA2;
  private static readonly CMD_FEED_PAPER = 0xA1;
  private static readonly CMD_LATTICE_START = 0xA6;
  private static readonly CMD_LATTICE_END = 0xBD;
  private static readonly CMD_ENERGY = 0xBE; // Print density/energy
  private static readonly CMD_QUALITY = 0xAF;

  /**
   * Calculate CRC checksum (XOR of all bytes)
   */
  private static calculateCRC(data: number[]): number {
    return data.reduce((crc, byte) => crc ^ byte, 0);
  }

  /**
   * Build a command packet
   */
  private static buildCommand(
    cmd: number,
    data: number[]
  ): Uint8Array {
    const packet = [
      ...this.CMD_HEADER,
      cmd,
      0x00, // Flag
      data.length & 0xFF, // Data length low byte
      (data.length >> 8) & 0xFF, // Data length high byte
      ...data,
    ];

    // Add CRC
    packet.push(this.calculateCRC(packet));

    return new Uint8Array(packet);
  }

  /**
   * Initialize printer
   */
  static getInitCommands(): Uint8Array[] {
    return [
      // Set energy/density (0-0xFFFF, default 0x3000)
      this.buildCommand(this.CMD_ENERGY, [0x00, 0x00]),

      // Set lattice start
      this.buildCommand(this.CMD_LATTICE_START, [
        0xAA, 0x55, 0x17, 0x38, 0x44, 0x5F, 0x5F, 0x5F, 0x44, 0x38, 0x2C
      ]),

      // Set quality
      this.buildCommand(this.CMD_QUALITY, [0xE0, 0x2E]),

      // Set more parameters
      this.buildCommand(0xA8, [0x00]),
      this.buildCommand(0xA3, [0x00]),
      this.buildCommand(0xBB, [0x01, 0x07]),
    ];
  }

  /**
   * Convert ImageData to bitmap format for X5 printer
   * Returns array of line data (48 bytes per line for 384px width)
   */
  static imageToBitmap(imageData: ImageData): number[][] {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // X5 printer width is 384 pixels = 48 bytes per line
    const PRINTER_WIDTH = 384;
    const BYTES_PER_LINE = PRINTER_WIDTH / 8;

    const lines: number[][] = [];

    for (let y = 0; y < height; y++) {
      const line: number[] = new Array(BYTES_PER_LINE).fill(0);

      for (let x = 0; x < Math.min(width, PRINTER_WIDTH); x++) {
        const pixelIndex = (y * width + x) * 4;

        // Get grayscale value (assuming ImageData is already processed)
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const gray = (r + g + b) / 3;

        // Threshold: if pixel is dark (< 128), set bit to 1
        if (gray < 128) {
          const byteIndex = Math.floor(x / 8);
          const bitIndex = 7 - (x % 8); // MSB first
          line[byteIndex] |= (1 << bitIndex);
        }
      }

      lines.push(line);
    }

    return lines;
  }

  /**
   * Create commands to print an image
   */
  static createPrintCommands(imageData: ImageData): Uint8Array[] {
    const commands: Uint8Array[] = [];

    // Add init commands
    commands.push(...this.getInitCommands());

    // Convert image to bitmap lines
    const bitmapLines = this.imageToBitmap(imageData);

    console.log(`Printing ${bitmapLines.length} lines...`);

    // Print each line
    for (let i = 0; i < bitmapLines.length; i++) {
      // Draw bitmap line (0xA2 command)
      commands.push(this.buildCommand(this.CMD_DRAW_BITMAP, [
        0x00, // Line number low byte
        0x30, // 48 bytes per line (0x30 = 48)
        ...bitmapLines[i]
      ]));

      // Feed paper one line (0xA1 command)
      // Format: 0xA1 [speed_low] [speed_high]
      commands.push(this.buildCommand(this.CMD_FEED_PAPER, [0x30, 0x00]));
    }

    // Final paper feed (3 lines)
    for (let i = 0; i < 3; i++) {
      commands.push(this.buildCommand(this.CMD_FEED_PAPER, [0x30, 0x00]));
    }

    // End lattice
    commands.push(this.buildCommand(this.CMD_LATTICE_END, [0x00]));

    return commands;
  }

  /**
   * Feed paper (without printing)
   */
  static feedPaper(lines: number = 3): Uint8Array[] {
    const commands: Uint8Array[] = [];
    for (let i = 0; i < lines; i++) {
      commands.push(this.buildCommand(this.CMD_FEED_PAPER, [0x30, 0x00]));
    }
    return commands;
  }
}
