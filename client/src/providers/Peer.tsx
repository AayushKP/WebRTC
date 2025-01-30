// peer.tsx (updated)
import {
  createContext,
  useMemo,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export interface PeerContextType {
  peer: RTCPeerConnection;
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: (
    offer: RTCSessionDescriptionInit
  ) => Promise<RTCSessionDescriptionInit>;
  setRemoteAns: (ans: RTCSessionDescriptionInit) => Promise<void>;
  sendStream: (stream: MediaStream) => Promise<void>;
  remoteStream: MediaStream | null;
}

const PeerContext = createContext<PeerContextType | null>(null);

export const usePeer = () => {
  return useContext(PeerContext);
};

interface PeerProviderProps {
  children: ReactNode;
}

export const PeerProvider = ({ children }: PeerProviderProps) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [makingOffer, setMakingOffer] = useState(false);

  const peer = useMemo<RTCPeerConnection>(
    () =>
      new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      }),
    []
  );

  const createOffer =
    useCallback(async (): Promise<RTCSessionDescriptionInit> => {
      try {
        setMakingOffer(true);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        return offer;
      } finally {
        setMakingOffer(false);
      }
    }, [peer]);

  const createAnswer = useCallback(
    async (
      offer: RTCSessionDescriptionInit
    ): Promise<RTCSessionDescriptionInit> => {
      try {
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        return answer;
      } catch (error) {
        console.error("Error creating answer:", error);
        throw error;
      }
    },
    [peer]
  );

  const setRemoteAns = useCallback(
    async (ans: RTCSessionDescriptionInit): Promise<void> => {
      try {
        await peer.setRemoteDescription(ans);
      } catch (error) {
        console.error("Error setting remote answer:", error);
        throw error;
      }
    },
    [peer]
  );

  const sendStream = useCallback(
    async (stream: MediaStream): Promise<void> => {
      const senders = peer.getSenders();
      stream.getTracks().forEach((track) => {
        const existingSender = senders.find(
          (s) => s.track?.kind === track.kind
        );
        existingSender
          ? existingSender.replaceTrack(track)
          : peer.addTrack(track, stream);
      });
    },
    [peer]
  );

  const handleTrackEvent = useCallback((event: RTCTrackEvent) => {
    setRemoteStream((prev) => {
      const newStream = new MediaStream();
      if (prev) prev.getTracks().forEach((track) => newStream.addTrack(track));
      event.track && newStream.addTrack(event.track);
      return newStream;
    });
  }, []);

  const handleNegotiationNeeded = useCallback(async () => {
    try {
      setMakingOffer(true);
      const offer = await peer.createOffer();
      if (peer.signalingState !== "stable") return;
      await peer.setLocalDescription(offer);
    } catch (error) {
      console.error("Negotiation error:", error);
    } finally {
      setMakingOffer(false);
    }
  }, [peer]);

  useEffect(() => {
    peer.addEventListener("track", handleTrackEvent);
    peer.addEventListener("negotiationneeded", handleNegotiationNeeded);

    return () => {
      peer.removeEventListener("track", handleTrackEvent);
      peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
    };
  }, [handleTrackEvent, handleNegotiationNeeded, peer]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAns,
        sendStream,
        remoteStream,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};
