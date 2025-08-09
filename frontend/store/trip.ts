import { create } from 'zustand';

// Define the Rider interface
interface Rider {
  latitude: number;
  longitude: number;
  address: string;
}

// Define the TripLocation interface
interface TripLocation {
  userLatitude: number;
  userLongitude: number;
  userAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  destinationAddress: string;
}

// Define the Trip interface
interface Trip {
  name: string;
  password: string;
  riders: Rider[];
  location: TripLocation;
}

// Define the TripStore interface
interface TripStore {
  trip: Trip;
  setTrip: (trip: Partial<Trip>) => void;
  addRider: (rider: Rider) => void;
}

// Initial state for the trip
const initialTrip: Trip = {
  name: '',
  password: '',
  riders: [],
  location: {
    userLatitude: 0,
    userLongitude: 0,
    userAddress: '',
    destinationLatitude: 0,
    destinationLongitude: 0,
    destinationAddress: '',
  },
};

// Create the Zustand store
const tripStore = create<TripStore>((set) => ({
  trip: initialTrip,
  setTrip: (trip) => set((state) => ({ trip: { ...state.trip, ...trip } })),
  addRider: (rider) =>
    set((state) => ({
      trip: {
        ...state.trip,
        riders: [...state.trip.riders, rider],
      },
    })),
}));





export default tripStore;