import React, { createContext, useMemo, useContext } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = Socket | null;

interface SocketProviderProps {
  children: React.ReactNode;
}

const SocketContext = createContext<SocketContextType>(null);

export const useSocket = (): SocketContextType => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socket = useMemo(() => io("http://localhost:3001"), []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
