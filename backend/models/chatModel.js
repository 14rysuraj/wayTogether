import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true }, // associated trip
  senderId: { type: String, required: true }, // match rider.id from riderSchema
  senderName: { type: String }, // optional, for convenience
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;