import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import React from "react";
import Room from "./pages/Room";
import { SocketProvider } from "./providers/Socket";
import { PeerProvider } from "./providers/Peer";

function App(): React.ReactElement {
  return (
    <SocketProvider>
      <PeerProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </PeerProvider>
    </SocketProvider>
  );
}

export default App;
