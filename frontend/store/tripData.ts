import { create } from 'zustand';

const tripDataStore = create((set) => ({
  runningTrip: null,
  setRunningTrip: (trip: any) =>
    set(() => ({ runningTrip: trip })),
  clearRunningTrip: () => set({ runningTrip: null }),
}));

export default tripDataStore;