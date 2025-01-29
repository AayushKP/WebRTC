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
  const [remoteEmailId, setRemoteEmailId] = useState<string | null>();

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
      setRemoteEmailId(emailId);
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
      setRemoteEmailId(from);
    },
    [createAnswer, socket]
  );

  const handleCallAccepted = useCallback(
    async ({ ans, from }: { ans: RTCSessionDescriptionInit; from: string }) => {
      console.log("Call got accepted from:", from, ans);
      await setRemoteAns(ans);
      setRemoteEmailId((prev) => prev ?? from); // Set email if not already set
    },
    [setRemoteAns]
  );

  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setMyStream(stream);
  }, []);

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

  const handleNegotiation = useCallback(async () => {
    console.log("Oops! Negotiation needed");
    if (!remoteEmailId) {
      console.error("Remote Email ID is not set yet!");
      return;
    }
    const localOffer = peer?.localDescription;
    if (localOffer) {
      socket?.emit("call-user", { emailId: remoteEmailId, offer: localOffer });
    } else {
      console.error("localDescription is null");
    }
  }, [peer, socket, remoteEmailId]);

  useEffect(() => {
    peer.addEventListener("negotiationneeded", handleNegotiation);
    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [handleNegotiation]);

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  return (
    <div className="min-h-screen bg-[#000000]">
      <div className="text-white font-bold text-3xl p-10 w-full text-center">
        <div>Room</div>
        <div className="text-white">You are connected to {remoteEmailId}</div>
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
