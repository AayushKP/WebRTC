"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const socket_io_1 = require("socket.io");
const io = new socket_io_1.Server(3001, {
    cors: {
        origin: "http://localhost:5183",
        methods: ["GET", "POST"],
    },
});
exports.io = io;
const emailToSocketIdMap = new Map();
io.on("connection", (socket) => {
    console.log("New Connection:", socket.id);
    socket.on("join-room", (data) => {
        console.log("user", data.emailId, "Joined Room", data.roomId);
        emailToSocketIdMap.set(data.emailId, socket.id);
        socket.join(data.roomId);
        socket.broadcast.to(data.roomId).emit("user-joined", {
            email: data.emailId,
        });
    });
});
const startSocketServer = () => {
    console.log("Socket Server is running on http://localhost:3001");
};
startSocketServer();
