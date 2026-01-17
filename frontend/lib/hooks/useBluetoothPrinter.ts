'use client';

import { useState, useCallback, useEffect } from 'react';
import { BluetoothPrinterUtil } from '@/lib/utils/bluetooth-printer';
import { PrinterConnectionState } from '@/lib/types/bluetooth-printer';

export function useBluetoothPrinter() {
  const [state, setState] = useState<PrinterConnectionState>({
    isConnected: false,
    isConnecting: false,
    device: null,
    error: null,
  });

  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  // Check if Bluetooth is supported - defer to avoid hydration mismatch
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setIsSupported(BluetoothPrinterUtil.isBluetoothSupported());
  }, []);

  // Connect to printer
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const connection = await BluetoothPrinterUtil.connectToPrinter();

      setCharacteristic(connection.characteristic);
      setState({
        isConnected: true,
        isConnecting: false,
        device: connection.device,
        error: null,
      });

      // Listen for disconnection
      connection.device.addEventListener('gattserverdisconnected', () => {
        setState({
          isConnected: false,
          isConnecting: false,
          device: null,
          error: 'Printer disconnected',
        });
        setCharacteristic(null);
      });

      return connection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setState({
        isConnected: false,
        isConnecting: false,
        device: null,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  // Disconnect from printer
  const disconnect = useCallback(async () => {
    if (state.device?.gatt?.connected) {
      state.device.gatt.disconnect();
    }

    setState({
      isConnected: false,
      isConnecting: false,
      device: null,
      error: null,
    });
    setCharacteristic(null);
  }, [state.device]);

  // Print processed image
  const printImage = useCallback(
    async (imageData: ImageData) => {
      if (!characteristic) {
        throw new Error('Printer not connected');
      }

      await BluetoothPrinterUtil.printProcessedImage(characteristic, imageData);
    },
    [characteristic]
  );

  // Print and cut
  const printAndCut = useCallback(async () => {
    if (!characteristic) {
      throw new Error('Printer not connected');
    }

    await BluetoothPrinterUtil.printAndCut(characteristic);
  }, [characteristic]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    isSupported,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    device: state.device,
    error: state.error,
    characteristic,

    // Actions
    connect,
    disconnect,
    printImage,
    printAndCut,
    clearError,
  };
}
