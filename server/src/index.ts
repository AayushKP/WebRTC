import * as dotenv from "dotenv";
import * as express from "express";
import * as http from "http";
import * as cors from "cors";
import { Server, Socket } from "socket.io";

// Load environment variables
dotenv.config();

// Initialize Express app
const app: express.Application = express();

// Initialize HTTP server
const server: http.Server = http.createServer(app);

// Define server port
const PORT: number = Number(process.env.PORT) || 3000;

// Enable CORS for the server
app.use(
  cors({
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Define TypeScript interfaces for room and call data
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

// Initialize Socket.IO server with the HTTP server
const io: Server = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Maps to store user-session relationships
const emailToSocketIdMap = new Map<string, string>();
const socketidToEmailMap = new Map<string, string>();

// Handle socket connection events
io.on("connection", (socket: Socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // Handle user joining a room
  socket.on("room:join", (data: JoinRoomData) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    socket.join(room);
    io.to(room).emit("user:joined", { email, id: socket.id });
    io.to(socket.id).emit("room:join", data);
  });

  // Handle incoming call offer
  socket.on("user:call", ({ to, offer }: CallOfferData) => {
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  // Handle call acceptance
  socket.on("call:accepted", ({ to, ans }: CallAnswerData) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  // Handle peer negotiation required
  socket.on("peer:nego:needed", ({ to, offer }: NegotiationData) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  // Handle final peer negotiation
  socket.on("peer:nego:done", ({ to, ans }: NegotiationFinalData) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});

// Health check route to confirm server is running
app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Server is running");
});

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
