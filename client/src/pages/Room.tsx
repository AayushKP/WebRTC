import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../services/Peer";
import { useSocket } from "../providers/Socket";

interface CallData {
  from: string;
  offer: RTCSessionDescriptionInit;
  ans?: RTCSessionDescriptionInit;
}

const RoomPage: React.FC = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const [myStream, setMyStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();

  const handleUserJoined = useCallback(
    ({ email, id }: { email: string; id: string }) => {
      console.log(`Email ${email} joined room`);
      setRemoteSocketId(id);
    },
    []
  );

  const handleCallUser = useCallback(async () => {
    if (!remoteSocketId) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket?.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async (data: CallData) => {
      setRemoteSocketId(data.from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, data.from, data.offer);
      const ans = await peer.getAnswer(data.offer);
      socket?.emit("call:accepted", { to: data.from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    if (!myStream) return;

    for (const track of myStream.getTracks()) {
      peer?.peer?.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ ans }: { ans: RTCSessionDescriptionInit; from: string }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    if (!remoteSocketId) return;

    const offer = await peer.getOffer();
    socket?.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer?.peer?.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer?.peer?.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncoming = useCallback(
    async (data: CallData) => {
      const ans = await peer.getAnswer(data.offer);
      socket?.emit("peer:nego:done", { to: data.from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(
    async ({ ans }: { ans: RTCSessionDescriptionInit }) => {
      await peer.setLocalDescription(ans);
    },
    []
  );

  useEffect(() => {
    const handleTrackEvent = (ev: RTCTrackEvent) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    };

    peer?.peer?.addEventListener("track", handleTrackEvent);
    return () => {
      peer?.peer?.removeEventListener("track", handleTrackEvent);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncoming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncoming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncoming,
    handleNegoNeedFinal,
  ]);

  return (
    <div className="flex flex-col items-center p-6 bg-gray-800 min-h-screen">
      <h1 className="text-4xl font-extrabold text-white">Room Page</h1>
      <h4 className="text-lg mt-4 text-white">
        {remoteSocketId ? "Connected" : "No one in room"}
      </h4>

      <div className="flex flex-col md:flex-row w-full mt-8 justify-center gap-4">
        {/* Local Stream Section */}
        {myStream && (
          <div className="flex flex-col items-center w-full md:w-1/2 bg-gray-700 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl text-white mb-2">My Stream</h2>
            <ReactPlayer
              playing
              muted
              height="250px"
              width="100%"
              url={myStream}
            />
          </div>
        )}

        {/* Remote Stream Section */}
        {remoteStream && (
          <div className="flex flex-col items-center w-full md:w-1/2 bg-gray-700 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl text-white mb-2">Remote Stream</h2>
            <ReactPlayer
              playing
              height="250px"
              width="100%"
              url={remoteStream}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        {myStream && (
          <button
            onClick={sendStreams}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Send Stream
          </button>
        )}
        {remoteSocketId && (
          <button
            onClick={handleCallUser}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Call
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
