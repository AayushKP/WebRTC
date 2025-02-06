import { Server, Socket } from "socket.io";
import dotenv from "dotenv";
import express, { Application } from "express";
import http from "http";

dotenv.config();

const app: Application = express();
const server: http.Server = http.createServer(app);

const PORT: number = Number(process.env.PORT) || 3000;

interface JoinRoomData {
  email: string;
  room: string;
}

interface CallOfferData {
  to: string;
  offer: RTCSessionDescriptionInit;
}

interface CallAnswerData {
  to: string;
  ans: RTCSessionDescriptionInit;
}

interface NegotiationData {
  to: string;
  offer: RTCSessionDescriptionInit;
}

interface NegotiationFinalData {
  to: string;
  ans: RTCSessionDescriptionInit;
}

const io: Server = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const emailToSocketIdMap = new Map<string, string>();
const socketidToEmailMap = new Map<string, string>();

io.on("connection", (socket: Socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  socket.on("room:join", (data: JoinRoomData) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }: CallOfferData) => {
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }: CallAnswerData) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }: NegotiationData) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }: NegotiationFinalData) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
