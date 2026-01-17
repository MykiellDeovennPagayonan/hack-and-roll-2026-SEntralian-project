import { X5PrinterProtocol } from "./x5-printer-protocol";

export class BluetoothPrinterUtil {
  // X5/Cat printer configuration
  private static readonly PRINTER_SERVICES = [
    // X5 Cat Printer - Primary (WRITE characteristic)
    {
      name: "X5 Cat Printer (Write)",
      service: "0000ae30-0000-1000-8000-00805f9b34fb",
      char: "0000ae01-0000-1000-8000-00805f9b34fb",
    },
    // X5 Cat Printer - Alternative (READ/WRITE characteristic)
    {
      name: "X5 Cat Printer (Read/Write)",
      service: "0000ae30-0000-1000-8000-00805f9b34fb",
      char: "0000ae10-0000-1000-8000-00805f9b34fb",
    },

    // Other cat printer models
    {
      name: "Cat Printer GB02",
      service: "0000ae30-0000-1000-8000-00805f9b34fb",
      char: "0000ae01-0000-1000-8000-00805f9b34fb",
    },

    // Standard ESC/POS printers
    {
      name: "Standard ESC/POS",
      service: "000018f0-0000-1000-8000-00805f9b34fb",
      char: "00002af1-0000-1000-8000-00805f9b34fb",
    },

    // PeriPage printers
    {
      name: "PeriPage",
      service: "0000ff00-0000-1000-8000-00805f9b34fb",
      char: "0000ff02-0000-1000-8000-00805f9b34fb",
    },

    // Other common thermal printers
    {
      name: "Generic BLE Printer 1",
      service: "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      char: "49535343-8841-43f4-a8d4-ecbe34729bb3",
    },
  ];

  static isBluetoothSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  static async connectToPrinter(filterByX: boolean = true): Promise<{
    device: BluetoothDevice;
    server: BluetoothRemoteGATTServer;
    service: BluetoothRemoteGATTService;
    characteristic: BluetoothRemoteGATTCharacteristic;
  }> {
    if (!this.isBluetoothSupported()) {
      throw new Error("Web Bluetooth is not supported in this browser");
    }

    try {
      const options: RequestDeviceOptions = {
        optionalServices: [
          "0000ae30-0000-1000-8000-00805f9b34fb", // X5 printer service
          "000018f0-0000-1000-8000-00805f9b34fb", // Standard ESC/POS
          "0000ff00-0000-1000-8000-00805f9b34fb", // PeriPage
          "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Generic BLE
          "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Alternative
        ],
      };

      // If filtering by X, use filters instead of acceptAllDevices
      if (filterByX) {
        options.filters = [{ namePrefix: "X" }, { namePrefix: "x" }];
      } else {
        options.acceptAllDevices = true;
      }

      const device = await navigator.bluetooth.requestDevice(options);

      console.log("Device selected:", device.name);

      if (!device.gatt) {
        throw new Error("Device does not support GATT");
      }

      const server = await device.gatt.connect();
      console.log("Connected to GATT server");

      // Try known printer configurations
      for (const printer of this.PRINTER_SERVICES) {
        try {
          console.log(`Trying ${printer.name}...`);
          const service = await server.getPrimaryService(printer.service);
          const characteristic = await service.getCharacteristic(printer.char);

          console.log(`Found ${printer.name} printer!`);

          // Initialize X5/Cat printer
          if (printer.name.includes("X5") || printer.name.includes("Cat")) {
            await this.initializeCatPrinter(characteristic);
          }

          return { device, server, service, characteristic };
        } catch {
          console.log(`   Not ${printer.name}`);
          continue;
        }
      }

      throw new Error("Could not find compatible printer characteristic");
    } catch (error) {
      console.error("Connection error:", error);
      throw error;
    }
  }

  /**
   * Initialize Cat/X5 printer with required commands
   */
  private static async initializeCatPrinter(
    characteristic: BluetoothRemoteGATTCharacteristic,
  ): Promise<void> {
    console.log("Initializing Cat printer...");

    // These hex commands are from reverse engineering the Cat printer protocol
    const initCommands = [
      "5178a80001000000ff5178a30001000000ff", // Init command 1
      "5178bb0001000107ff", // Init command 2
    ];

    for (const hexCmd of initCommands) {
      const bytes = this.hexToBytes(hexCmd);

      try {
        if (characteristic.properties.writeWithoutResponse) {
          await characteristic.writeValueWithoutResponse(bytes.buffer as ArrayBuffer);
        } else if (characteristic.properties.write) {
          await characteristic.writeValue(bytes.buffer as ArrayBuffer);
        }

        // Small delay between commands
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.warn("Init command warning:", error);
        // Continue anyway - some printers may not need all init commands
      }
    }

    console.log("Cat printer initialized");
  }

  /**
   * Convert hex string to Uint8Array
   */
  private static hexToBytes(hex: string): Uint8Array {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
  }

  /**
   * Write data to printer characteristic
   */
  static async writeData(
    characteristic: BluetoothRemoteGATTCharacteristic,
    data: Uint8Array,
  ): Promise<void> {
    // Cat printers work better with smaller chunks
    const CHUNK_SIZE = 128;

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);

      try {
        if (characteristic.properties.writeWithoutResponse) {
          await characteristic.writeValueWithoutResponse(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as ArrayBuffer);
        } else {
          await characteristic.writeValue(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as ArrayBuffer);
        }
      } catch (error) {
        console.error(`Write error at chunk ${i}:`, error);
        throw error;
      }

      // Longer delay for cat printers to prevent jamming
      if (i + CHUNK_SIZE < data.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Send a single command to the printer
   */
  private static async sendCommand(
    characteristic: BluetoothRemoteGATTCharacteristic,
    data: Uint8Array,
  ): Promise<void> {
    // Log the first few bytes for debugging
    const preview = Array.from(data.slice(0, 10))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");

    try {
      // Prefer writeValueWithoutResponse for speed, fall back to writeValue
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
      } else if (characteristic.properties.write) {
        await characteristic.writeValue(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
      } else {
        throw new Error("Characteristic does not support writing");
      }
    } catch (error) {
      console.error(`Failed to send command [${preview}...]:`, error);
      throw error;
    }
  }

  /**
   * Print processed image (FOR CAT PRINTERS)
   */
  static async printProcessedImage(
    characteristic: BluetoothRemoteGATTCharacteristic,
    imageData: ImageData,
    onProgress?: (current: number, total: number) => void,
  ): Promise<void> {
    console.log("=== Starting Print Job ===");
    console.log(`Image size: ${imageData.width}x${imageData.height}`);
    console.log(
      `Characteristic properties:`,
      JSON.stringify({
        write: characteristic.properties.write,
        writeWithoutResponse: characteristic.properties.writeWithoutResponse,
        read: characteristic.properties.read,
        notify: characteristic.properties.notify,
      }),
    );

    // Generate print commands
    const commands = X5PrinterProtocol.createPrintCommands(imageData);
    console.log(`Generated ${commands.length} commands`);

    // Send each command with delay
    const COMMAND_DELAY = 20; // ms between commands (adjust if needed)
    const BATCH_SIZE = 10; // Log progress every N commands
    const BATCH_DELAY = 50; // Extra delay every batch to prevent buffer overflow

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];

      try {
        await this.sendCommand(characteristic, cmd);

        // Small delay between each command
        await new Promise((resolve) => setTimeout(resolve, COMMAND_DELAY));

        // Extra delay and progress logging every batch
        if (i > 0 && i % BATCH_SIZE === 0) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
          const percent = Math.round((i / commands.length) * 100);
          console.log(`Progress: ${i}/${commands.length} (${percent}%)`);
          onProgress?.(i, commands.length);
        }
      } catch (error) {
        console.error(`Error at command ${i}/${commands.length}:`, error);
        throw new Error(`Print failed at command ${i}: ${error}`);
      }
    }

    console.log("=== Print Job Complete ===");
    onProgress?.(commands.length, commands.length);
  }

  /**
   * Print and cut (paper feed for X5)
   */
  static async printAndCut(
    characteristic: BluetoothRemoteGATTCharacteristic,
  ): Promise<void> {
    const commands = X5PrinterProtocol.feedPaper(5);

    for (const cmd of commands) {
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(cmd.buffer.slice(cmd.byteOffset, cmd.byteOffset + cmd.byteLength) as ArrayBuffer);
      } else {
        await characteristic.writeValue(cmd.buffer.slice(cmd.byteOffset, cmd.byteOffset + cmd.byteLength) as ArrayBuffer);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
