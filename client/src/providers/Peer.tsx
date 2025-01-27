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

  const peer = useMemo<RTCPeerConnection>(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
            ],
          },
        ],
      }),
    []
  );

  const createOffer = async (): Promise<RTCSessionDescriptionInit> => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> => {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemoteAns = async (
    ans: RTCSessionDescriptionInit
  ): Promise<void> => {
    await peer.setRemoteDescription(ans);
  };

  const sendStream = async (stream: MediaStream): Promise<void> => {
    const tracks = stream.getTracks();
    tracks.forEach((track) => {
      const existingSender = peer
        .getSenders()
        .find((sender) => sender.track === track);
      if (!existingSender) {
        peer.addTrack(track, stream);
      }
    });
  };

  const handleTrackEvent = useCallback((ev: RTCTrackEvent) => {
    const streams = ev.streams;
    if (streams.length > 0) {
      setRemoteStream(streams[0]);
    }
  }, []);

  useEffect(() => {
    peer.addEventListener("track", handleTrackEvent);
    return () => {
      peer.removeEventListener("track", handleTrackEvent);
    };
  }, [handleTrackEvent]);

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
