"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 8);
    router.push(`/room/${id}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) router.push(`/room/${roomId.trim()}`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      color: "white",
    }}>
      <div style={{ textAlign: "center", maxWidth: "480px", width: "100%", padding: "0 20px" }}>
        
        {/* Logo */}
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎬</div>
        <h1 style={{ fontSize: "48px", fontWeight: "800", margin: "0 0 8px", background: "linear-gradient(90deg, #ff0000, #ff6b6b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          WatchWith
        </h1>
        <p style={{ color: "#888", fontSize: "16px", marginBottom: "48px" }}>
          Watch YouTube videos in sync with your friends
        </p>

        {/* Create Room */}
        <button
          onClick={createRoom}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: "16px",
            fontWeight: "700",
            background: "linear-gradient(90deg, #ff0000, #cc0000)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            marginBottom: "16px",
            letterSpacing: "0.5px",
            boxShadow: "0 4px 20px rgba(255,0,0,0.3)",
          }}
        >
          + Create New Room
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ flex: 1, height: "1px", background: "#333" }} />
          <span style={{ color: "#555", fontSize: "14px" }}>or join existing</span>
          <div style={{ flex: 1, height: "1px", background: "#333" }} />
        </div>

        {/* Join Room */}
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e)=> e.key === "Enter" && joinRoom()}
            placeholder="Enter Room ID..."
            style={{
              flex: 1,
              padding: "14px 16px",
              fontSize: "15px",
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "12px",
              color: "white",
              outline: "none",
            }}
          />
          <button
            onClick={joinRoom}
            style={{
              padding: "14px 20px",
              fontSize: "15px",
              fontWeight: "600",
              background: "#1e1e1e",
              color: "white",
              border: "1px solid #444",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            Join
          </button>
        </div>

        <p style={{ color: "#444", fontSize: "13px", marginTop: "32px" }}>
          Share the room ID with friends to watch together
        </p>
      </div>
    </div>
  );
}
