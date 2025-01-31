import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../providers/Socket";

interface JoinRoomData {
  email: string;
  room: string;
}

const LobbyScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [room, setRoom] = useState<string>("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      socket?.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data: JoinRoomData) => {
      const { room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket?.on("room:join", handleJoinRoom);
    return () => {
      socket?.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="p-6 bg-gray-200 min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold mb-6">Lobby</h1>
      <form
        onSubmit={handleSubmitForm}
        className="bg-white p-6 rounded-lg shadow-lg"
      >
        <div className="mb-4">
          <label htmlFor="email" className="block text-lg">
            Email ID
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            className="mt-2 p-2 border rounded-md w-full"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="room" className="block text-lg">
            Room Number
          </label>
          <input
            type="text"
            id="room"
            value={room}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRoom(e.target.value)
            }
            className="mt-2 p-2 border rounded-md w-full"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-blue-500 text-white rounded-md mt-4"
        >
          Join
        </button>
      </form>
    </div>
  );
};

export default LobbyScreen;
