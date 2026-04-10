"use client";

import { useState, use, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import VideoPlayer from "@/components/VideoPlayer";

export default function RoomPage({ params }: any) {
  const { id } = use(params) as { id: string };
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [urlInput, setUrlInput] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:3002");
    socketRef.current.emit("join-room", id);

    socketRef.current.on("video-change", (newVideoId: string) => {
      setVideoId(newVideoId);
    });

    return () => { socketRef.current?.disconnect(); };
  }, [id]);

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const changeVideo = () => {
    const extracted = extractVideoId(urlInput);
    if (extracted) {
      setVideoId(extracted);
      socketRef.current?.emit("video-change", id, extracted);
      setUrlInput("");
    } else {
      alert("Invalid YouTube URL");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      color: "white",
      fontFamily: "'Segoe UI', sans-serif",
      padding: "20px",
    }}>
      <h2 style={{ margin: "0 0 16px", color: "#888", fontSize: "14px" }}>
        Room: <span style={{ color: "white" }}>{id}</span>
      </h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", maxWidth: "700px" }}>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && changeVideo()}
          placeholder="Paste YouTube URL..."
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "#1e1e1e",
            border: "1px solid #333",
            borderRadius: "8px",
            color: "white",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={changeVideo}
          style={{
            padding: "10px 18px",
            background: "#ff0000",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Load
        </button>
      </div>

      <VideoPlayer roomId={id} videoId={videoId} />
    </div>
  );
}
