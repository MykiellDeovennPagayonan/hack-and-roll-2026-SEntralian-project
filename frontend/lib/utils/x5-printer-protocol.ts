/**
 * Cat Printer Protocol Implementation
 * Based on:
 * - https://werwolv.net/blog/cat_printer
 * - https://github.com/JJJollyjim/catprinter/blob/main/COMMANDS.md
 * - https://github.com/rbaron/catprinter
 */

export class X5PrinterProtocol {
  // Printer width in pixels
  private static readonly PRINTER_WIDTH = 384;
  private static readonly BYTES_PER_LINE = 48; // 384 / 8

  // Command opcodes (corrected based on documentation)
  private static readonly CMD_RETRACT_PAPER = 0xa0;
  private static readonly CMD_FEED_PAPER = 0xa1;
  private static readonly CMD_DRAW_BITMAP = 0xa2;
  private static readonly CMD_GET_STATUS = 0xa3;
  private static readonly CMD_QUALITY = 0xa4;
  private static readonly CMD_LATTICE = 0xa6;
  private static readonly CMD_GET_INFO = 0xa8;
  private static readonly CMD_FLOW_CONTROL = 0xae;
  private static readonly CMD_ENERGY = 0xaf;
  private static readonly CMD_SPEED = 0xbd;
  private static readonly CMD_DRAWING_MODE = 0xbe;

  // CRC8 lookup table (CCITT)
  private static readonly CRC8_TABLE = new Uint8Array([
    0x00, 0x07, 0x0e, 0x09, 0x1c, 0x1b, 0x12, 0x15, 0x38, 0x3f, 0x36, 0x31,
    0x24, 0x23, 0x2a, 0x2d, 0x70, 0x77, 0x7e, 0x79, 0x6c, 0x6b, 0x62, 0x65,
    0x48, 0x4f, 0x46, 0x41, 0x54, 0x53, 0x5a, 0x5d, 0xe0, 0xe7, 0xee, 0xe9,
    0xfc, 0xfb, 0xf2, 0xf5, 0xd8, 0xdf, 0xd6, 0xd1, 0xc4, 0xc3, 0xca, 0xcd,
    0x90, 0x97, 0x9e, 0x99, 0x8c, 0x8b, 0x82, 0x85, 0xa8, 0xaf, 0xa6, 0xa1,
    0xb4, 0xb3, 0xba, 0xbd, 0xc7, 0xc0, 0xc9, 0xce, 0xdb, 0xdc, 0xd5, 0xd2,
    0xff, 0xf8, 0xf1, 0xf6, 0xe3, 0xe4, 0xed, 0xea, 0xb7, 0xb0, 0xb9, 0xbe,
    0xab, 0xac, 0xa5, 0xa2, 0x8f, 0x88, 0x81, 0x86, 0x93, 0x94, 0x9d, 0x9a,
    0x27, 0x20, 0x29, 0x2e, 0x3b, 0x3c, 0x35, 0x32, 0x1f, 0x18, 0x11, 0x16,
    0x03, 0x04, 0x0d, 0x0a, 0x57, 0x50, 0x59, 0x5e, 0x4b, 0x4c, 0x45, 0x42,
    0x6f, 0x68, 0x61, 0x66, 0x73, 0x74, 0x7d, 0x7a, 0x89, 0x8e, 0x87, 0x80,
    0x95, 0x92, 0x9b, 0x9c, 0xb1, 0xb6, 0xbf, 0xb8, 0xad, 0xaa, 0xa3, 0xa4,
    0xf9, 0xfe, 0xf7, 0xf0, 0xe5, 0xe2, 0xeb, 0xec, 0xc1, 0xc6, 0xcf, 0xc8,
    0xdd, 0xda, 0xd3, 0xd4, 0x69, 0x6e, 0x67, 0x60, 0x75, 0x72, 0x7b, 0x7c,
    0x51, 0x56, 0x5f, 0x58, 0x4d, 0x4a, 0x43, 0x44, 0x19, 0x1e, 0x17, 0x10,
    0x05, 0x02, 0x0b, 0x0c, 0x21, 0x26, 0x2f, 0x28, 0x3d, 0x3a, 0x33, 0x34,
    0x4e, 0x49, 0x40, 0x47, 0x52, 0x55, 0x5c, 0x5b, 0x76, 0x71, 0x78, 0x7f,
    0x6a, 0x6d, 0x64, 0x63, 0x3e, 0x39, 0x30, 0x37, 0x22, 0x25, 0x2c, 0x2b,
    0x06, 0x01, 0x08, 0x0f, 0x1a, 0x1d, 0x14, 0x13, 0xae, 0xa9, 0xa0, 0xa7,
    0xb2, 0xb5, 0xbc, 0xbb, 0x96, 0x91, 0x98, 0x9f, 0x8a, 0x8d, 0x84, 0x83,
    0xde, 0xd9, 0xd0, 0xd7, 0xc2, 0xc5, 0xcc, 0xcb, 0xe6, 0xe1, 0xe8, 0xef,
    0xfa, 0xfd, 0xf4, 0xf3,
  ]);

  /**
   * Calculate CRC8 checksum (CCITT)
   */
  private static calculateCRC8(data: number[]): number {
    let crc = 0;
    for (const byte of data) {
      crc = this.CRC8_TABLE[(crc ^ byte) & 0xff];
    }
    return crc;
  }

  /**
   * Build a command packet
   * Format: [0x51] [0x78] [opcode] [flag] [length_low] [0x00] [data...] [crc] [0xff]
   */
  private static buildCommand(opcode: number, data: number[]): Uint8Array {
    const packet = [
      0x51,                    // Magic byte 1
      0x78,                    // Magic byte 2
      opcode,                  // Command opcode
      0x00,                    // Flag (0x00 = from host)
      data.length & 0xff,      // Data length low byte
      0x00,                    // Reserved/padding
      ...data,                 // Data payload
      this.calculateCRC8(data), // CRC8 of data only
      0xff,                    // Magic terminator
    ];

    return new Uint8Array(packet);
  }

  /**
   * Get initialization commands for printing
   */
  static getInitCommands(energyLevel: number = 17000): Uint8Array[] {
    return [
      // Set drawing mode to image mode (0x00)
      this.buildCommand(this.CMD_DRAWING_MODE, [0x00]),

      // Set energy level (16-bit little-endian)
      // GB01: 8000-17500, GB02: similar range
      this.buildCommand(this.CMD_ENERGY, [
        energyLevel & 0xff,
        (energyLevel >> 8) & 0xff,
      ]),

      // Lattice start sequence
      this.buildCommand(this.CMD_LATTICE, [
        0xaa, 0x55, 0x17, 0x38, 0x44, 0x5f, 0x5f, 0x5f, 0x44, 0x38, 0x2c,
      ]),
    ];
  }

  /**
   * Get finalization commands after printing
   */
  static getFinishCommands(): Uint8Array[] {
    return [
      // Lattice end sequence
      this.buildCommand(this.CMD_LATTICE, [
        0xaa, 0x55, 0x17, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17,
      ]),
    ];
  }

  /**
   * Convert ImageData to bitmap format for the printer
   * Returns array of line data (48 bytes per line for 384px width)
   * Bit order: LSB first (bit 0 = leftmost pixel in byte)
   */
  static imageToBitmap(imageData: ImageData): number[][] {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    const lines: number[][] = [];

    for (let y = 0; y < height; y++) {
      const line: number[] = new Array(this.BYTES_PER_LINE).fill(0);

      for (let x = 0; x < Math.min(width, this.PRINTER_WIDTH); x++) {
        const pixelIndex = (y * width + x) * 4;

        // Get grayscale value
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const gray = (r + g + b) / 3;

        // If pixel is dark (< 128), set bit to 1 (will burn/darken paper)
        if (gray < 128) {
          const byteIndex = Math.floor(x / 8);
          const bitIndex = x % 8; // LSB first (bit 0 = leftmost)
          line[byteIndex] |= 1 << bitIndex;
        }
      }

      lines.push(line);
    }

    return lines;
  }

  /**
   * Create a print line command
   * The 0xA2 command takes exactly 48 bytes of bitmap data
   */
  static createPrintLineCommand(lineData: number[]): Uint8Array {
    // Ensure exactly 48 bytes
    const data = lineData.slice(0, this.BYTES_PER_LINE);
    while (data.length < this.BYTES_PER_LINE) {
      data.push(0);
    }
    return this.buildCommand(this.CMD_DRAW_BITMAP, data);
  }

  /**
   * Create a feed paper command
   * Parameter: number of pixel rows to advance (1 row = 1 dot line)
   */
  static createFeedCommand(rows: number = 1): Uint8Array {
    return this.buildCommand(this.CMD_FEED_PAPER, [rows & 0xff, 0x00]);
  }

  /**
   * Create all commands to print an image
   */
  static createPrintCommands(
    imageData: ImageData,
    energyLevel: number = 8000
  ): Uint8Array[] {
    const commands: Uint8Array[] = [];

    // Initialize printer
    commands.push(...this.getInitCommands(energyLevel));

    // Convert image to bitmap lines
    const bitmapLines = this.imageToBitmap(imageData);

    console.log(
      `Creating print commands for ${bitmapLines.length} lines (${imageData.width}x${imageData.height})`
    );

    // Print each line: draw bitmap then feed 1 line
    for (let i = 0; i < bitmapLines.length; i++) {
      // Draw the line
      commands.push(this.createPrintLineCommand(bitmapLines[i]));
      // Advance paper by 1 row
      // commands.push(this.createFeedCommand(1));
    }

    // Feed extra paper at the end
    for (let i = 0; i < 100; i++) {
      commands.push(this.createFeedCommand(1));
    }

    // Finalize
    commands.push(...this.getFinishCommands());

    return commands;
  }

  /**
   * Feed paper without printing
   */
  static feedPaper(lines: number = 50): Uint8Array[] {
    const commands: Uint8Array[] = [];
    for (let i = 0; i < lines; i++) {
      commands.push(this.createFeedCommand(1));
    }
    return commands;
  }
}
