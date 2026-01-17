'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { BluetoothPrinterUtil } from '@/lib/utils/bluetooth-printer';
import { PrinterConnectionState } from '@/lib/types/bluetooth-printer';

interface PrinterContextType {
  // State
  isSupported: boolean | null;
  isConnected: boolean;
  isConnecting: boolean;
  device: BluetoothDevice | null;
  error: string | null;
  characteristic: BluetoothRemoteGATTCharacteristic | null;

  // Actions
  connect: () => Promise<BluetoothRemoteGATTCharacteristic>;
  disconnect: () => void;
  printImage: (imageData: ImageData, char?: BluetoothRemoteGATTCharacteristic) => Promise<void>;
  printAndCut: (char?: BluetoothRemoteGATTCharacteristic) => Promise<void>;
  clearError: () => void;
}

const PrinterContext = createContext<PrinterContextType | null>(null);

export function PrinterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PrinterConnectionState>({
    isConnected: false,
    isConnecting: false,
    device: null,
    error: null,
  });

  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setIsSupported(BluetoothPrinterUtil.isBluetoothSupported());
  }, []);

  const connect = useCallback(async (): Promise<BluetoothRemoteGATTCharacteristic> => {
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

      return connection.characteristic;
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

  const disconnect = useCallback(() => {
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

  const printImage = useCallback(
    async (imageData: ImageData, char?: BluetoothRemoteGATTCharacteristic) => {
      const activeChar = char || characteristic;
      if (!activeChar) {
        throw new Error('Printer not connected');
      }

      await BluetoothPrinterUtil.printProcessedImage(activeChar, imageData);
    },
    [characteristic]
  );

  const printAndCut = useCallback(async (char?: BluetoothRemoteGATTCharacteristic) => {
    const activeChar = char || characteristic;
    if (!activeChar) {
      throw new Error('Printer not connected');
    }

    await BluetoothPrinterUtil.printAndCut(activeChar);
  }, [characteristic]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return (
    <PrinterContext.Provider
      value={{
        isSupported,
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        device: state.device,
        error: state.error,
        characteristic,
        connect,
        disconnect,
        printImage,
        printAndCut,
        clearError,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
}
