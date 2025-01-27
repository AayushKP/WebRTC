import { Socket } from "socket.io-client";
import { useSocket } from "../providers/Socket";
import { useEffect, useCallback, useState } from "react";
import { usePeer } from "../providers/Peer";
import ReactPlayer from "react-player";

interface NewUserData {
  emailId: string;
}

function Room() {
  const socket = useSocket() as Socket | null;
  const peerContext = usePeer();
  const [myStream, setMyStream] = useState<MediaStream | null>(null);

  if (!peerContext) {
    throw new Error("usePeer must be used within a PeerProvider");
  }

  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAns,
    sendStream,
    remoteStream,
  } = peerContext;

  const handleNewUserJoined = useCallback(
    async ({ emailId }: NewUserData) => {
      console.log("New user joined:", emailId);
      const offer: RTCSessionDescriptionInit = await createOffer();
      socket?.emit("call-user", { emailId, offer });
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async ({
      from,
      offer,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      console.log("Incoming call from:", from, offer);
      const ans = await createAnswer(offer);
      socket?.emit("call-accepted", { emailId: from, ans });
    },
    [createAnswer, socket]
  );

  const handleCallAccepted = useCallback(
    async ({ ans }: { ans: RTCSessionDescriptionInit }) => {
      console.log("Call got accepted:", ans);
      await setRemoteAns(ans);
    },
    [setRemoteAns]
  );

  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setMyStream(stream);
    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });
  }, [peer]);

  useEffect(() => {
    socket?.on("user-joined", handleNewUserJoined);
    socket?.on("incoming-call", handleIncomingCall);
    socket?.on("call-accepted", handleCallAccepted);

    return () => {
      socket?.off("user-joined", handleNewUserJoined);
      socket?.off("incoming-call", handleIncomingCall);
      socket?.off("call-accepted", handleCallAccepted);
    };
  }, [socket, handleNewUserJoined, handleIncomingCall, handleCallAccepted]);

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  return (
    <div className="min-h-screen bg-[#000000]">
      <div className="text-white font-bold text-3xl p-10 w-full text-center">
        <div>Room</div>
      </div>
      {myStream && (
        <>
          <button
            onClick={() => myStream && sendStream(myStream)}
            className="text-black p-3 bg-[#FFFFFF] m-10 cursor-pointer rounded-lg"
          >
            Send My Video
          </button>
          <ReactPlayer url={myStream} playing muted />
        </>
      )}
      {remoteStream && <ReactPlayer url={remoteStream} playing />}
    </div>
  );
}

export default Room;
