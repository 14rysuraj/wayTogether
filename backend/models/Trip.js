
import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  email: String,
  latitude: Number,
  longitude: Number,
  address: String,
  status: 
  {
    type: String,
    enum: ['online', 'offline'],
    default: 'online',
   
  }
  
 
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
  tripId: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  startDate: {
    type: Date,
    default:Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  riders: [riderSchema],
  status: {
    type: String,
    enum: ['running', 'completed', 'cancelled'],
    default: 'running'
  },
  location: tripLocationSchema,
  createdBy:mongoose.Schema.Types.ObjectId,
});

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;


