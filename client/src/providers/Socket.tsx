import { createContext, useMemo, ReactNode, useContext } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const socket = useMemo(() => io("http://localhost:3001"), []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;
