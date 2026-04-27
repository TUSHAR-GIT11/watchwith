"use client";

import { useState, use, useRef } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { useTheme } from "@/components/ThemeContext";

export default function RoomPage({ params }: any) {
  const { id } = use(params) as { id: string };
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [urlInput, setUrlInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<{videoId: string; title:string; thumbnail:string; channel:string}[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults,setShowResults] = useState(false)
  const [shared, setShared] = useState(false)
  const { theme, toggleTheme } = useTheme();
  const emitVideoChangeRef = useRef<((vid: string) => void) | null>(null);
  const addToQueueRef = useRef<((vid: string) => void) | null>(null);

  const D = theme === "dark";

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleSearch = async ()=>{
     if(!urlInput.trim()) return;
     const extracted = extractVideoId(urlInput)
     if(extracted){
       handleLoad();
       return
     }
     setSearching(true)
     const res = await fetch(`/api/search?q=${encodeURIComponent(urlInput)}`)
     const data = await res.json()
     setSearchResults(data.videos || [])
     setShowResults(true)
     setSearching(false)
  }

  const selectVideo = (vid: string) => {
    setVideoId(vid);
    if (emitVideoChangeRef.current) {
      emitVideoChangeRef.current(vid);
    }
    setUrlInput("");
    setShowResults(false);
    setSearchResults([]);
  };

  const handleLoad = () => {
    const extracted = extractVideoId(urlInput);
    if (extracted) {
      setVideoId(extracted);
      emitVideoChangeRef.current?.(extracted);
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

  const roomUrl = typeof window !== "undefined"
    ? `${window.location.origin}/room/${id}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=Watch%20with%20me%20on%20WatchWith!%20${encodeURIComponent(roomUrl)}`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: D ? "#0d0d14" : "#f7f7f9",
      color: D ? "#f0eeff" : "#111",
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex", flexDirection: "column",
      transition: "background 0.3s, color 0.3s",
    }}>
      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: "60px",
        background: D ? "rgba(13,13,20,0.95)" : "rgba(255,255,255,0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${D ? "rgba(255,255,255,0.07)" : "#ebebeb"}`,
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
          <span style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.3px" }}>WatchWith</span>
        </a>

        {/* URL Input */}
        <div style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "480px", margin: "0 24px", position: "relative" }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            background: inputFocused ? (D ? "rgba(124,58,237,0.08)" : "#fff") : (D ? "rgba(255,255,255,0.05)" : "#f2f2f5"),
            border: inputFocused ? "1.5px solid #7c3aed" : `1.5px solid ${D ? "rgba(255,255,255,0.1)" : "#e0e0e0"}`,
            borderRadius: "10px", padding: "0 12px", transition: "all 0.2s",
            boxShadow: inputFocused ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
          }}>
            <span style={{ fontSize: "12px", marginRight: "7px", opacity: 0.4 }}>�</span>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Search or paste YouTube URL..."
              style={{
                flex: 1, background: "transparent", border: "none",
                color: D ? "#f0eeff" : "#111", fontSize: "13px", outline: "none", padding: "9px 0",
              }}
            />
            {urlInput && (
              <span onClick={() => { setUrlInput(""); setShowResults(false); }}
                style={{ cursor: "pointer", opacity: 0.4, fontSize: "14px", padding: "0 4px" }}>✕</span>
            )}
          </div>

          <button onClick={handleSearch} style={{
            padding: "0 18px",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "white", border: "none", borderRadius: "10px",
            cursor: "pointer", fontWeight: "700", fontSize: "13px",
            boxShadow: "0 2px 10px rgba(124,58,237,0.3)", whiteSpace: "nowrap",
            minWidth: "80px",
          }}>{searching ? "⏳" : "🔍 Search"}</button>

          <button onClick={() => {
            const extracted = extractVideoId(urlInput);
            if (!extracted) { alert("Paste a YouTube URL first to queue"); return; }
            if (!addToQueueRef.current) { alert("Join the room first!"); return; }
            addToQueueRef.current(extracted);
            setUrlInput("");
          }} style={{
            padding: "0 16px",
            background: D ? "rgba(124,58,237,0.15)" : "#f3f0ff",
            border: `1.5px solid ${D ? "rgba(124,58,237,0.3)" : "#ddd6fe"}`,
            color: "#7c3aed", borderRadius: "10px",
            cursor: "pointer", fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap",
          }}>+ Queue</button>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: "absolute", top: "52px", left: 0, right: 0,
              background: D ? "#1a1a2e" : "white",
              border: `1px solid ${D ? "rgba(255,255,255,0.1)" : "#ebebeb"}`,
              borderRadius: "14px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
              zIndex: 200, overflow: "hidden",
            }}
              onMouseDown={(e) => e.preventDefault()} // blur se pehle click register karo
            >
              {searchResults.map((v, i) => (
                <div key={`${v.videoId}-${i}`} onClick={() => selectVideo(v.videoId)} style={{
                  display: "flex", gap: "12px", padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: i < searchResults.length - 1 ? `1px solid ${D ? "rgba(255,255,255,0.06)" : "#f5f5f5"}` : "none",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = D ? "rgba(124,58,237,0.1)" : "#f9f9f9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <img src={v.thumbnail} alt={v.title} style={{ width: "80px", height: "45px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: D ? "#f0eeff" : "#111", lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</div>
                    <div style={{ fontSize: "11px", color: D ? "#666" : "#999", marginTop: "3px" }}>{v.channel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side — theme toggle + room chip */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{
            width: "36px", height: "36px",
            background: D ? "rgba(255,255,255,0.08)" : "#f2f2f5",
            border: `1px solid ${D ? "rgba(255,255,255,0.1)" : "#e0e0e0"}`,
            borderRadius: "10px", cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {D ? "☀️" : "🌙"}
          </button>

          {/* Room chip */}
          <div onClick={copyRoomId} style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "7px 14px",
            background: copied ? (D ? "rgba(124,58,237,0.2)" : "#f3f0ff") : (D ? "rgba(255,255,255,0.06)" : "#f2f2f5"),
            border: copied ? "1.5px solid #c4b5fd" : `1.5px solid ${D ? "rgba(255,255,255,0.1)" : "#e0e0e0"}`,
            borderRadius: "10px", cursor: "pointer", fontSize: "13px", transition: "all 0.2s",
          }}>
            <span style={{ color: D ? "#555" : "#aaa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Room</span>
            <span style={{ fontWeight: "700", letterSpacing: "0.5px" }}>{id}</span>
            <span style={{ fontSize: "12px" }}>{copied ? "✅" : "📋"}</span>
          </div>

          {/* Share buttons */}
          <button onClick={copyLink} style={{
            padding: "7px 14px",
            background: shared ? "#f0fdf4" : (D ? "rgba(255,255,255,0.06)" : "#f2f2f5"),
            border: `1.5px solid ${shared ? "#bbf7d0" : (D ? "rgba(255,255,255,0.1)" : "#e0e0e0")}`,
            borderRadius: "10px", cursor: "pointer",
            fontSize: "12px", fontWeight: "600",
            color: shared ? "#15803d" : (D ? "#aaa" : "#555"),
            transition: "all 0.2s",
          }}>
            {shared ? "✅ Copied!" : "🔗 Copy Link"}
          </button>

          <button onClick={shareWhatsApp} style={{
            padding: "7px 14px",
            background: "#f0fdf4",
            border: "1.5px solid #bbf7d0",
            borderRadius: "10px", cursor: "pointer",
            fontSize: "12px", fontWeight: "600",
            color: "#15803d",
          }}>
            💬 WhatsApp
          </button>
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, padding: "20px 24px" }}>
        <VideoPlayer
          roomId={id}
          videoId={videoId}
          onVideoChange={setVideoId}
          onEmitReady={(fn) => { emitVideoChangeRef.current = fn; }}
          onQueueReady={(fn) => { addToQueueRef.current = fn; }}
          theme={theme}
        />
      </div>
    </div>
  );
}
