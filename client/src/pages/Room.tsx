// room.tsx (updated)
import { useEffect, useCallback, useState } from "react";
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";
import ReactPlayer from "react-player";

function Room() {
  const socket = useSocket();
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAns,
    sendStream,
    remoteStream,
  } = usePeer()!;
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteEmailId, setRemoteEmailId] = useState<string | null>(null);

  const handleNewUser = useCallback(
    async (emailId: string) => {
      try {
        const offer = await createOffer();
        socket?.emit("call-user", { emailId, offer });
        setRemoteEmailId(emailId);
      } catch (error) {
        console.error("Error handling new user:", error);
      }
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      try {
        const answer = await createAnswer(data.offer);
        socket?.emit("call-accepted", { emailId: data.from, ans: answer });
        setRemoteEmailId(data.from);
      } catch (error) {
        console.error("Error handling incoming call:", error);
      }
    },
    [createAnswer, socket]
  );

  const handleCallAccepted = useCallback(
    async (data: { ans: RTCSessionDescriptionInit; from: string }) => {
      try {
        await setRemoteAns(data.ans);
        setRemoteEmailId(data.from);
      } catch (error) {
        console.error("Error handling call acceptance:", error);
      }
    },
    [setRemoteAns]
  );

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMyStream(stream);
        sendStream(stream);
      } catch (error) {
        console.error("Media error:", error);
      }
    })();
  }, [sendStream]);

  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", (data: { emailId: string }) =>
      handleNewUser(data.emailId)
    );
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);

    return () => {
      socket.off("user-joined");
      socket.off("incoming-call");
      socket.off("call-accepted");
    };
  }, [socket, handleNewUser, handleIncomingCall, handleCallAccepted]);

  return (
    <div className="min-h-screen bg-black">
      <div className="text-white text-center p-4">
        {remoteEmailId
          ? `Connected with ${remoteEmailId}`
          : "Waiting for connection..."}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {myStream && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <ReactPlayer
              url={myStream}
              playing
              muted
              width="100%"
              height="100%"
            />
          </div>
        )}

        {remoteStream && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <ReactPlayer
              url={remoteStream}
              playing
              controls
              width="100%"
              height="100%"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Room;
