// socket/socket.js
import { Server } from "socket.io";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join order room for real-time updates
    socket.on('joinOrderRoom', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined order_${orderId}`);
    });

    // Leave order room
    socket.on('leaveOrderRoom', (orderId) => {
      socket.leave(`order_${orderId}`);
      console.log(`Socket ${socket.id} left order_${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};