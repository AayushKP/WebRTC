import { Server, Socket } from "socket.io";

interface JoinRoomData {
  roomId: string;
  emailId: string;
}

const emailToSocketIdMap = new Map<string, string>();

export const setupSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("new connection", socket.id);
    socket.on("join-room", (data: JoinRoomData) => {
      console.log("User", data.emailId, "joined room", data.roomId);
      emailToSocketIdMap.set(data.emailId, socket.id);
      socket.join(data.roomId);
      socket.emit("joined-room", { roomId: data.roomId });
      socket.broadcast.to(data.roomId).emit("user-joined", {
        emailId: data.emailId,
      });
    });
  });
};
