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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socket = useSocket();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!room.match(/^[a-zA-Z0-9]{4,12}$/)) {
      setError("Room ID must be 4-12 alphanumeric characters");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmitForm = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsLoading(true);
      try {
        await new Promise<void>((resolve) => {
          socket?.emit("room:join", { email, room }, resolve);
        });
      } catch (err) {
        setError("Connection failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data: JoinRoomData) => {
      navigate(`/room/${data.room}`);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Join Video Conference
          </h2>
          <p className="text-gray-300">
            Enter your details to join or create a meeting
          </p>
        </div>

        <form
          onSubmit={handleSubmitForm}
          className="mt-8 space-y-6 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="room"
                className="block text-sm font-medium text-gray-300"
              >
                Meeting ID
              </label>
              <div className="mt-1">
                <input
                  id="room"
                  name="room"
                  type="text"
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400"
                  placeholder="Enter meeting ID"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Joining...</span>
              </div>
            ) : (
              "Join Meeting"
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Don't have a meeting ID?{" "}
            <button
              onClick={() =>
                setRoom(
                  Math.random().toString(36).substring(2, 8).toUpperCase()
                )
              }
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Create new meeting
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
