const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidV4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
let rooms = {}; // Track rooms and their hosts
app.use(express.static("public"));

// io.on('connection', (socket) => {
//     socket.on('join-room', (roomId, userId, username) => {
//         if (!rooms[roomId]) {
//             rooms[roomId] = [];
//         }

//         // Add the user to the room with a unique ID and username
//         rooms[roomId].push({ userId, username });

//         socket.join(roomId);

//         // Send the current user their username (correction)
//         socket.emit('username-assigned', username);

//         // Notify others about the new user
//         socket.to(roomId).emit('user-connected', userId, username);

//         // Handle disconnection
//         socket.on('disconnect', () => {
//             rooms[roomId] = rooms[roomId].filter(user => user.userId !== userId);
//             socket.to(roomId).emit('user-disconnected', userId);

//             // Clean up the room if no users are left
//             if (rooms[roomId].length === 0) {
//                 delete rooms[roomId];
//             }
//         });

//         socket.on('leave-room', () => {
//             rooms[roomId] = rooms[roomId].filter(user => user.userId !== userId);
//             socket.to(roomId).emit('user-disconnected', userId);
//             socket.leave(roomId);
//         });

//         socket.on('chat-message', ({ roomId, message }) => {
//             socket.to(roomId).emit('chat-message', { userId, message });
//         });
//     });

// });

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join-room", (roomId, userId, username) => {
    console.log("User joining room:", roomId, userId, username);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    rooms[roomId].push({ userId, username });
    socket.join(roomId);

    // Notify others about the new user
    socket.to(roomId).emit("user-connected", userId, username);

    socket.on("leave-room", (id, localStreamid) => {
      console.log(`User ${userId} leaving room: ${roomId}`);
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((user) => user.userId !== userId);
        socket.to(roomId).emit("user-disconnected", localStreamid);

        // Clean up the room if no users are left
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
      }
      socket.leave(roomId);
    });
    // Handle screen sharing events
    // socket.on("screen-sharing", ({ roomId, userId, isSharing }) => {
    //     console.log(`User ${userId} started ${isSharing ? "sharing" : "stopped sharing"} their screen.`);

    //     // Notify all users in the room about the screen sharing status
    //     io.to(roomId).emit("screen-sharing", { userId, isSharing });
    //   });

    socket.on("screen-sharing", ({ roomId, userId }) => {
      console.log(`User ${userId} is sharing their screen in room ${roomId}`);
      socket.to(roomId).emit("screen-sharing", { userId });
    });

    socket.on("stop-screen-sharing", ({ roomId, userId }) => {
      console.log(`User ${userId} stopped screen sharing in room ${roomId}`);
      socket.to(roomId).emit("stop-screen-sharing", { userId });
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((user) => user.userId !== userId);
        socket.to(roomId).emit("user-disconnected", userId);

        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
      }
    });
  });

  socket.on("chat-message", ({ roomId, message }) => {
    socket.to(roomId).emit("chat-message", { userId: socket.id, message });
  });
});

// io.on('connection', socket => {
//     socket.on('join-room', (roomId, userId) => {
//         // Initialize room if it doesn't exist
//         if (!rooms[roomId]) {
//             rooms[roomId] = { host: userId, users: [] };
//         }

//         rooms[roomId].users.push(userId);  // Add user to the room
//         socket.join(roomId);  // Join the socket.io room
//         socket.emit('host-assigned', rooms[roomId].host);  // Notify the user of the current host
//         socket.to(roomId).emit('user-connected', userId);  // Notify others about the new user

//         // Handle chat messages
//         socket.on('chat-message', ({ roomId, message }) => {
//             socket.to(roomId).emit('chat-message', { userId, message });
//         });

//         // Handle user disconnection
//         socket.on('disconnect', () => {
//             rooms[roomId].users = rooms[roomId].users.filter(user => user !== userId);

//             if (rooms[roomId].host === userId && rooms[roomId].users.length > 0) {
//                 // Assign a new host
//                 const newHost = rooms[roomId].users[0];
//                 rooms[roomId].host = newHost;
//                 io.to(roomId).emit('host-assigned', newHost);
//             }

//             socket.to(roomId).emit('user-disconnected', userId);

//             if (rooms[roomId].users.length === 0) {
//                 delete rooms[roomId];  // Clean up the room if no users are left
//             }
//         });

//         // Handle manual leave-room event
//         socket.on('leave-room', () => {
//             socket.leave(roomId);
//             rooms[roomId].users = rooms[roomId].users.filter(user => user !== userId);

//             if (rooms[roomId].host === userId && rooms[roomId].users.length > 0) {
//                 const newHost = rooms[roomId].users[0];
//                 rooms[roomId].host = newHost;
//                 io.to(roomId).emit('host-assigned', newHost);
//             }

//             socket.to(roomId).emit('user-disconnected', userId);
//         });
//     });
// });

server.listen(3000, () => console.log("Server running on port 3000"));
