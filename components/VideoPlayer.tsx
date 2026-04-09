"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function VideoPlayer({ roomId }: { roomId: string }) {
  const playerRef = useRef<any>(null);
  const isSyncing = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Socket connection
    console.log("🔌 Connecting to socket...");
    socketRef.current = io("http://localhost:3001");

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected:", socketRef.current?.id);
      setConnected(true);
      socketRef.current?.emit("join-room", roomId);
      console.log("🚪 Joined room:", roomId);
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setConnected(false);
    });

    // Load YouTube API
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log("🎥 YouTube API ready");
      playerRef.current = new (window as any).YT.Player("player", {
        height: "390",
        width: "640",
        videoId: "dQw4w9WgXcQ",
        events: {
          onReady: () => console.log("▶️ Player ready"),
          onStateChange: (event: any) => {
            if (isSyncing.current) return;

            const time = playerRef.current?.getCurrentTime() || 0;

            if (event.data === 1) {
              console.log("▶️ Playing at", time);
              socketRef.current?.emit("play", roomId, time);
            }

            if (event.data === 2) {
              console.log("⏸️ Paused at", time);
              socketRef.current?.emit("pause", roomId, time);
            }
          },
        },
      });
    };

    // Receive PLAY
    socketRef.current.on("play", (time) => {
      console.log("📥 Received play event at", time);
      if (!playerRef.current) return;
      
      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.playVideo();
      setTimeout(() => (isSyncing.current = false), 500);
    });

    // Receive PAUSE
    socketRef.current.on("pause", (time) => {
      console.log("📥 Received pause event at", time);
      if (!playerRef.current) return;
      
      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.pauseVideo();
      setTimeout(() => (isSyncing.current = false), 500);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        Status: {connected ? "🟢 Connected" : "🔴 Disconnected"} | Room: {roomId}
      </div>
      <div id="player"></div>
    </div>
  );
}