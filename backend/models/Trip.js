import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: String,
  email: String,
  latitude: Number,
  longitude: Number,
  address: String,
  status: { type: String, default: 'pending' },
});

const tripLocationSchema = new mongoose.Schema({
  userLatitude: Number,
  userLongitude: Number,
  userAddress: String,
  destinationLatitude: Number,
  destinationLongitude: Number,
  destinationAddress: String,
});

const tripSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  startDate: String,
  endDate: String,
  riders: [riderSchema],
  status: { type: String, default: 'running' },
  location: tripLocationSchema,
});

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;


