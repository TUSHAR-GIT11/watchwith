"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function VideoPlayer({ roomId, videoId }: { roomId: string, videoId: string }) {
  const playerRef = useRef<any>(null);
  const isSyncing = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  const joinRoom = () => {
    setJoined(true);
    socketRef.current = io("http://localhost:3002");

    socketRef.current.on("connect", () => {
      setConnected(true);
      socketRef.current?.emit("join-room", roomId);
    });

    socketRef.current.on("disconnect", () => setConnected(false));

    socketRef.current.on("play", (time) => {
      if (!playerRef.current) return;
      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.playVideo();
      setTimeout(() => (isSyncing.current = false), 500);
    });

    socketRef.current.on("pause", (time) => {
      if (!playerRef.current) return;
      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.pauseVideo();
      setTimeout(() => (isSyncing.current = false), 500);
    });

    const initPlayer = () => {
      playerRef.current = new (window as any).YT.Player("player", {
        height: "390",
        width: "640",
        videoId: videoId,
        playerVars: { origin: window.location.origin, enablejsapi: 1 },
        events: {
          onStateChange: (event: any) => {
            if (isSyncing.current) return;
            const time = playerRef.current?.getCurrentTime() || 0;
            if (event.data === 1) socketRef.current?.emit("play", roomId, time);
            if (event.data === 2) socketRef.current?.emit("pause", roomId, time);
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      // API already loaded
      initPlayer();
    } else {
      // Load API
      (window as any).onYouTubeIframeAPIReady = initPlayer;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  };

  useEffect(() => {
    if (playerRef.current && joined) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);

  useEffect(() => {
    return () => { socketRef.current?.disconnect(); };
  }, []);

  if (!joined) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Room: {roomId}</h2>
        <button
          onClick={joinRoom}
          style={{ padding: "12px 24px", fontSize: "18px", cursor: "pointer", background: "#ff0000", color: "white", border: "none", borderRadius: "8px" }}
        >
          🎬 Join Room
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        Status: {connected ? "🟢 Connected" : "🔴 Disconnected"} | Room: {roomId}
      </div>
      <div id="player"></div>
    </div>
  );
}