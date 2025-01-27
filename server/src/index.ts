import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { Server, Socket } from "socket.io";

const app = express();
const io = new Server(3001, {
  cors: {
    origin: "http://localhost:5183",
    methods: ["GET", "POST"],
  },
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

io.on("connection", (socket: Socket) => {});

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the TypeScript Express Server!");
});

app.listen(3000, () => {
  console.log("HTTP Server is running on 3000");
});
