export interface PrinterDevice {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  service: BluetoothRemoteGATTService;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

export interface PrinterConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  device: BluetoothDevice | null;
  error: string | null;
}

export interface PrintOptions {
  bold?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  size?: 'normal' | 'double';
}

export interface ImagePrintOptions {
  dither?: boolean;
  threshold?: number;
}
