import { Socket } from "socket.io-client";
import { useSocket } from "../providers/Socket";
import { useEffect } from "react";

function Room() {
  const socket = useSocket() as Socket | null;

  interface NewUserData {
    emailId: string;
  }

  const handleNewUserJoined = ({ emailId }: NewUserData) => {
    console.log("New user joined:", emailId);
  };

  useEffect(() => {
    socket?.on("user-joined", handleNewUserJoined);
  }, [socket]);

  return (
    <div className="min-h-screen bg-[#000000]">
      <div className="text-white font-bold text-3xl p-10 w-full text-center">
        Room
      </div>
    </div>
  );
}
export default Room;
