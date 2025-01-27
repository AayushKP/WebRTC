import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import React from "react";
import Room from "./pages/Room";
import { SocketProvider } from "./providers/Socket";

function App(): React.ReactElement {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;
