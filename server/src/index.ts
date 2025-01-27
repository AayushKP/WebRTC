import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import { setupSocket } from "./socket"; // Import socket setup function

const app = express();
const PORT = 3000;
const SOCKET_PORT = 3001;

const io = new Server(SOCKET_PORT, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the TypeScript Express Server!");
});

app.listen(PORT, () => {
  console.log(`HTTP Server is running on http://localhost:${PORT}`);
  console.log(`Socket Server is running on http://localhost:${SOCKET_PORT}`);
  setupSocket(io);
});
