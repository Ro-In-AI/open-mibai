export interface BluetoothDevice {
    id: string;
    name: string | null;
    rssi: number | null;
    manufacturerData?: string;
    serviceUUIDs?: string[];
    isConnectable: boolean;
  }