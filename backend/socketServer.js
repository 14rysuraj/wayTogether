// socketServer.js
import { Server } from 'socket.io';
import { updateLocation } from './controllers/SocketController.js';
import Chat from './models/chatModel.js';

let io; 

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected', socket.id);
    

    
 socket.on('join-room', (tripId) => {
  const room = tripId?.toString?.() ?? tripId;
  if (room) {
    socket.join(room);
    
    console.log(`Socket ${socket.id} joined room ${room}`);
  }
 });
  
      socket.on("leave-room", (tripId) => {
    const room = tripId?.toString?.() ?? tripId;
    socket.leave(room);
    console.log(`Socket ${socket.id} left room ${room}`);
  });

   
    

      
    socket.on( "update-location",
    async ({ tripId, riderId, latitude, longitude, address }) => {
      try {
        const updatedTrip = await updateLocation(
          tripId,
          riderId,
          latitude,
          longitude
        );

        io.to(tripId).emit("locationUpdate", updatedTrip);
        console.log("location updated");
      } catch (error) {
        console.error("Socket update-location error:", error.message);
        socket.emit("location:error", { message: error.message });
      }
    }
    );



      socket.on(    "send-message",
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
    


    
    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
    });
  });

  return io;
};


export { io };