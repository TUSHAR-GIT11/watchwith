"use client";

import { useState, use, useRef } from "react";
import VideoPlayer from "@/components/VideoPlayer";

export default function RoomPage({ params }: any) {
  const { id } = use(params) as { id: string };
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [urlInput, setUrlInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const emitVideoChangeRef = useRef<((vid: string) => void) | null>(null);

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleLoad = () => {
    const extracted = extractVideoId(urlInput);
    if (extracted) {
      setVideoId(extracted);
      emitVideoChangeRef.current?.(extracted); // socket emit via VideoPlayer
      setUrlInput("");
    } else {
      alert("Invalid YouTube URL");
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f7f7f9",
      color: "#111",
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: "60px",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #ebebeb",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
      }}>
        {/* Logo */}
        <a href="/" style={{
          display: "flex", alignItems: "center", gap: "8px",
          textDecoration: "none", flexShrink: 0,
        }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
          }}>🎬</div>
          <span style={{ fontWeight: "700", fontSize: "16px", color: "#111", letterSpacing: "-0.3px" }}>WatchWith</span>
        </a>

        {/* URL Input */}
        <div style={{
          display: "flex", gap: "8px", flex: 1, maxWidth: "480px", margin: "0 24px",
        }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            background: inputFocused ? "#fff" : "#f2f2f5",
            border: inputFocused ? "1.5px solid #7c3aed" : "1.5px solid #e0e0e0",
            borderRadius: "10px", padding: "0 12px",
            transition: "all 0.2s",
            boxShadow: inputFocused ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
          }}>
            <span style={{ fontSize: "12px", marginRight: "7px", opacity: 0.4 }}>🔗</span>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Paste YouTube URL..."
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#111", fontSize: "13px", outline: "none", padding: "9px 0",
              }}
            />
          </div>
          <button onClick={handleLoad} style={{
            padding: "0 18px",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "white", border: "none", borderRadius: "10px",
            cursor: "pointer", fontWeight: "700", fontSize: "13px",
            boxShadow: "0 2px 10px rgba(124,58,237,0.3)",
            whiteSpace: "nowrap",
          }}>▶ Load</button>
        </div>

        {/* Room chip */}
        <div onClick={copyRoomId} style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "7px 14px",
          background: copied ? "#f3f0ff" : "#f2f2f5",
          border: copied ? "1.5px solid #c4b5fd" : "1.5px solid #e0e0e0",
          borderRadius: "10px", cursor: "pointer", fontSize: "13px",
          transition: "all 0.2s", flexShrink: 0,
        }}>
          <span style={{ color: "#aaa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Room</span>
          <span style={{ color: "#111", fontWeight: "700", letterSpacing: "0.5px" }}>{id}</span>
          <span style={{ fontSize: "12px" }}>{copied ? "✅" : "📋"}</span>
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, padding: "20px 24px" }}>
        <VideoPlayer roomId={id} videoId={videoId} onVideoChange={setVideoId} onEmitReady={(fn) => { emitVideoChangeRef.current = fn; }} />
      </div>
    </div>
  );
}
