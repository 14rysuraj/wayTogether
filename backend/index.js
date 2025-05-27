import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDB } from "./config/database.js";
import Trip from "./models/Trip.js";
import {
  getRunningTripForUser,
  updateLocation,
} from "./controllers/SocketController.js";
import Chat from "./models/chatModel.js";

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // use specific origin in production
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);

  socket.on("get-trip", async (userId) => {
    try {
      const trip = await getRunningTripForUser(userId);
      socket.emit("trip-data", trip);
    } catch (error) {
      console.error("Socket get-trip error:", error.message);
      socket.emit("trip:error", { message: error.message });
    }
  });

  socket.on(
    "update-location",
    async ({ tripId, riderId, latitude, longitude, address }) => {
      try {
        const updatedTrip = await updateLocation(
          tripId,
          riderId,
          latitude,
          longitude
        );

        socket.broadcast.emit("locationUpdate", updatedTrip);
        console.log("location updated");
      } catch (error) {
        console.error("Socket update-location error:", error.message);
        socket.emit("location:error", { message: error.message });
      }
    }
  );

  socket.on("join-trip", async ({ email, password }) => {
    try {
      const trip = await Trip.findOne({
        password: password,
      });

      if (!trip) {
        return socket.emit("join:error", { message: "Trip not found" });
      }

      if (trip.password !== password) {
        return socket.emit("join:error", {
          message: "Incorrect trip password",
        });
      }

      socket.join(trip._id);

      socket.emit("join:success", { message: "Joined trip successfully" });

      socket
        .to(trip._id)
        .emit("trip:notification", { message: `${email} joined the trip ` });
      console.log(`User ${email} joined trip ${trip._id}`);
    } catch (error) {
      console.error("Join trip error:", error.message);
      socket.emit("join:error", { message: "Failed to join trip" });
    }
  });

  socket.on("join-room", (tripId) => {
    socket.join(tripId);
    console.log(`Socket ${socket.id} joined trip room ${tripId}`);
  });

  socket.on(
    "send-message",
    async ({ tripId, senderId, senderName, message }) => {
      try {
        const chatMessage = await Chat.create({
          tripId,
          senderId,
          senderName,
          message: typeof message === "object" ? message.text : message,
        });

        // Emit to everyone in room *except sender*
        socket.to(tripId.toString()).emit("receive-message", chatMessage);

        // Emit to sender as well (in case they're not receiving from room)
        socket.emit("receive-message", chatMessage);
      } catch (error) {
        console.error("Send message error:", error.message);
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    }
  );

  socket.on("fetch-messages", async (tripId) => {
    try {
      const messages = await Chat.find({
        tripId: tripId,
      }).sort({ timestamp: 1 });
      socket.emit("chat:history", messages);
      console.log("Messages fetched successfully");
      console.log(messages);
    } catch (error) {
      console.error("Fetch messages error:", error.message);
      socket.emit("chat:error", { message: "Failed to fetch messages" });
    }
  });

  socket.on("leave-trip", async ({ tripId, userId }) => {
    try {
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return socket.emit("leave:error", { message: "Trip not found" });
      }

      // Remove user from trip
      trip.riders = trip.riders.filter((rider) => rider.id !== userId);
      await trip.save();

      socket.leave(tripId);
      socket.emit("leave:success", { message: "Left trip successfully" });
      socket.emit("trip-data", null);
      socket
        .to(tripId)
        .emit("trip:notification", { message: `${userId} left the trip ` });
      console.log(`User ${userId} left trip ${tripId}`);
    } catch (error) {
      console.error("Leave trip error:", error.message);
      socket.emit("leave:error", { message: "Failed to leave trip" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected: ${socket.id}`);
  });
});

server.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
