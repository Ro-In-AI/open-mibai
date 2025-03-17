import create from 'zustand';
import { BleDeviceState, IBleStore } from '../../services/bluetooth/types';

const initialState: BleDeviceState = {
    isScanning: false,
    isConnected: false,
    connectedDevice: null,
    allDevices: [],
    battery: 0,
    quaternion: {
        Quaternion_X: 0,
        Quaternion_Y: 0,
        Quaternion_Z: 0,
        Quaternion_W: 0
    },
    height: null
};

export const useBleStore = create<IBleStore>((set) => ({
    state: initialState,
    setState: (newState) => set((prev) => ({
        state: { ...prev.state, ...newState }
    })),
    resetState: () => set({ state: initialState })
}));