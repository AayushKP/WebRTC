import { Socket } from "socket.io-client";
import { useSocket } from "../providers/Socket";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const socket = useSocket() as Socket | null;
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const handleJoinRoom = () => {
    if (socket && email && roomId) {
      socket.emit("join-room", { emailId: email, roomId });
      console.log(`Joining room with email: ${email}, roomId: ${roomId}`);
    } else {
      console.log("Please enter both email and room ID.");
    }
  };

  interface JoinRoomResponse {
    roomId: string;
  }

  const handleRoomJoined = ({ roomId }: JoinRoomResponse) => {
    console.log("Room joined successfully.", roomId);
    navigate(`/room/${roomId}`);
  };

  useEffect(() => {
    socket?.on("joined-room", handleRoomJoined);
  }, [socket]);

  return (
    <div className="min-h-screen bg-[#110f0f] flex items-center w-screen justify-center">
      <div className="w-1/3 flex flex-col gap-3 bg-[#ffffff] rounded-3xl p-10">
        <h1 className="text-2xl mb-2 font-bold text-center text-black">
          CONNECT NOW
        </h1>

        <div className="flex gap-2 items-center mb-4">
          <label htmlFor="Email" className="text-black w-20">
            Email:
          </label>
          <input
            className="text-black px-2 py-1 rounded-lg border flex-grow"
            type="email"
            name="Email"
            id="Email"
            placeholder="Please Enter Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center mb-4">
          <label htmlFor="RoomId" className="text-black w-20">
            Room Id:
          </label>
          <input
            className="text-black px-2 py-1 rounded-lg border flex-grow"
            type="text"
            name="RoomId"
            id="RoomId"
            placeholder="Please Enter Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
        </div>
        <div className="w-full flex gap-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg w-1/2 hover:bg-blue-700 transition duration-300 cursor-pointer"
            onClick={handleJoinRoom}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
