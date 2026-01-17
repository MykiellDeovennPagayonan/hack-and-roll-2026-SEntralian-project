interface Navigator {
  bluetooth: Bluetooth;
}

interface Bluetooth {
  getAvailability(): Promise<boolean>;
  getDevices(): Promise<BluetoothDevice[]>;
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: 'gattserverdisconnected', listener: () => void): void;
  removeEventListener(type: 'gattserverdisconnected', listener: () => void): void;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(service?: string | number): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTService {
  device: BluetoothDevice;
  uuid: string;
  isPrimary: boolean;
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(characteristic?: string | number): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  service: BluetoothRemoteGATTService;
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
  removeEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
}

interface BluetoothCharacteristicProperties {
  broadcast: boolean;
  read: boolean;
  writeWithoutResponse: boolean;
  write: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite: boolean;
  writableAuxiliaries: boolean;
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: (string | number)[];
  acceptAllDevices?: boolean;
}

interface BluetoothLEScanFilter {
  services?: (string | number)[];
  name?: string;
  namePrefix?: string;
  manufacturerData?: BluetoothManufacturerDataFilter[];
  serviceData?: BluetoothServiceDataFilter[];
}

interface BluetoothManufacturerDataFilter {
  companyIdentifier: number;
  dataPrefix?: BufferSource;
  mask?: BufferSource;
}

interface BluetoothServiceDataFilter {
  service: string | number;
  dataPrefix?: BufferSource;
  mask?: BufferSource;
}