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
import { initSocket } from "./socketServer.js";

connectDB();

const server = http.createServer(app);

initSocket(server);

// io.on("connection", (socket) => {
//   console.log(`user connected: ${socket.id}`);

//   socket.on("get-trip", async (userId) => {
//     try {
//       const trip = await getRunningTripForUser(userId);
//       socket.emit("trip-data", trip);
//     } catch (error) {
//       console.error("Socket get-trip error:", error.message);
//       socket.emit("trip:error", { message: error.message });
//     }
//   });



//   socket.on("join-trip", async ({ email, password }) => {
//     try {
//       const trip = await Trip.findOne({
//         password: password,
//       });

//       if (!trip) {
//         return socket.emit("join:error", { message: "Trip not found" });
//       }

//       if (trip.password !== password) {
//         return socket.emit("join:error", {
//           message: "Incorrect trip password",
//         });
//       }

//       socket.join(trip._id);

//       socket.emit("join:success", { message: "Joined trip successfully" });
      
      

//       socket
//         .to(trip._id)
//         .emit("trip:notification", { message: `${email} joined the trip ` });
//       console.log(`User ${email} joined trip ${trip._id}`);
//     } catch (error) {
//       console.error("Join trip error:", error.message);
//       socket.emit("join:error", { message: "Failed to join trip" });
//     }
//   });

//   socket.on("join-room", (tripId) => {
//     socket.join(tripId);
//     console.log(`Socket ${socket.id} joined trip room ${tripId}`);
//   });



//   socket.on("leave-trip", async ({ tripId, userId,email }) => {
//     try {
//       const trip = await Trip.findById(tripId);
//       if (!trip) {
//         return socket.emit("leave:error", { message: "Trip not found" });
//       }

//       // Remove user from trip
//       trip.riders = trip.riders.filter((rider) => rider.id !== userId);
//       await trip.save();

//       socket.leave(tripId);
//       socket.emit("leave:success", { message: "Left trip successfully" });
//       socket.emit("trip-data", null);
//       socket
//         .to(tripId)
//         .emit("trip:notification", { message: `${email} left the trip ` });
//       console.log(`User ${userId} left trip ${tripId}`);
//     } catch (error) {
//       console.error("Leave trip error:", error.message);
//       socket.emit("leave:error", { message: "Failed to leave trip" });
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log(`user disconnected: ${socket.id}`);
//   });
// });

server.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
