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

  static async connectToPrinter(): Promise<{
    device: BluetoothDevice;
    server: BluetoothRemoteGATTServer;
    service: BluetoothRemoteGATTService;
    characteristic: BluetoothRemoteGATTCharacteristic;
  }> {
    if (!this.isBluetoothSupported()) {
      throw new Error("Web Bluetooth is not supported in this browser");
    }

    try {
      // Request all devices and show the service we need
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "0000ae30-0000-1000-8000-00805f9b34fb", // X5 printer service
          "000018f0-0000-1000-8000-00805f9b34fb", // Standard ESC/POS
          "0000ff00-0000-1000-8000-00805f9b34fb", // PeriPage
          "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Generic BLE
          "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Alternative
        ],
      });

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
    characteristic: BluetoothRemoteGATTCharacteristic
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
          await characteristic.writeValueWithoutResponse(bytes);
        } else if (characteristic.properties.write) {
          await characteristic.writeValue(bytes);
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
    data: Uint8Array
  ): Promise<void> {
    // Cat printers work better with smaller chunks
    const CHUNK_SIZE = 128;

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);

      try {
        if (characteristic.properties.writeWithoutResponse) {
          await characteristic.writeValueWithoutResponse(chunk);
        } else {
          await characteristic.writeValue(chunk);
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
   * Print processed image (FOR X5/CAT PRINTERS)
   */
  static async printProcessedImage(
    characteristic: BluetoothRemoteGATTCharacteristic,
    imageData: ImageData
  ): Promise<void> {
    console.log("Printing on X5/Cat printer...");
    console.log(`Image size: ${imageData.width}x${imageData.height}`);

    // Generate X5-specific print commands
    const commands = X5PrinterProtocol.createPrintCommands(imageData);

    console.log(`Sending ${commands.length} commands...`);

    // Send each command
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];

      try {
        if (characteristic.properties.writeWithoutResponse) {
          await characteristic.writeValueWithoutResponse(cmd);
        } else {
          await characteristic.writeValue(cmd);
        }

        // Small delay between commands (important for X5!)
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Progress logging
        if (i % 50 === 0) {
          console.log(`Progress: ${i}/${commands.length}`);
        }
      } catch (error) {
        console.error(`Error at command ${i}:`, error);
        throw error;
      }
    }

    console.log("Print commands sent successfully!");
  }

  /**
   * Print and cut (paper feed for X5)
   */
  static async printAndCut(
    characteristic: BluetoothRemoteGATTCharacteristic
  ): Promise<void> {
    const commands = X5PrinterProtocol.feedPaper(5);

    for (const cmd of commands) {
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(cmd);
      } else {
        await characteristic.writeValue(cmd);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
