import Trip from '../models/Trip.js';

export const getRunningTripForUser = async (userId) => {
  if (!userId) throw new Error("User ID is required.");

  const activeTrip = await Trip.findOne({
    'riders.id': userId,
    status: 'running',
  });

  if (!activeTrip) {
    throw new Error("No active trip found for this user.");
  }

  return activeTrip;
};


export const updateLocation = async (tripId, riderId, latitude, longitude) => {
    
    

    if (!tripId) {
        throw new Error("Trip ID is required.");
    }
    if (!riderId) {
        throw new Error("Rider ID is required.");
    }
    if (!latitude || !longitude ) {
        throw new Error("Latitude and longitude are required.");
    }
    

    
    const trip = await Trip.findOne({ _id: tripId });
    if (!trip) {
        throw new Error("Trip not found.");
    }
    
    const rider = trip.riders.find(r => r.id === riderId);
    if (!rider) {
        throw new Error("Rider not found in this trip.");
    }
    
    rider.latitude = latitude;
    rider.longitude = longitude;
    
    
    await trip.save();
    
    return trip;
}