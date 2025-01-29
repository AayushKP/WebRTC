import { Server, Socket } from "socket.io";

interface JoinRoomData {
  roomId: string;
  emailId: string;
}

const emailToSocketIdMap = new Map<string, string>();
const socketIdToEmailMap = new Map<string, string>();

export const setupSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("new connection", socket.id);

    socket.on("join-room", (data: JoinRoomData) => {
      console.log("User", data.emailId, "joined room", data.roomId);

      emailToSocketIdMap.set(data.emailId, socket.id);
      socketIdToEmailMap.set(socket.id, data.emailId);

      socket.join(data.roomId);

      socket.emit("joined-room", { roomId: data.roomId });

      socket.broadcast.to(data.roomId).emit("user-joined", {
        emailId: data.emailId,
      });
    });

    socket.on(
      "call-user",
      (data: { emailId: string; offer: RTCSessionDescriptionInit }) => {
        const { emailId, offer } = data;
        const fromEmail = socketIdToEmailMap.get(socket.id);
        const socketId: string = emailToSocketIdMap.get(emailId) ?? "";
        socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
      }
    );

    socket.on(
      "call-accepted",
      (data: { emailId: string; ans: RTCSessionDescriptionInit }) => {
        const { emailId, ans } = data;
        const socketId: string = emailToSocketIdMap.get(emailId) ?? "";
        socket.to(socketId).emit("call-accepted", {
          ans,
          from: socketIdToEmailMap.get(socket.id),
        });
      }
    );
  });
};
