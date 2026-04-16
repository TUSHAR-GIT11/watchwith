"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const D = theme === "dark";

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
      background: D ? "#0d0d14" : "#fafafa",
      display: "flex", flexDirection: "column",
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      color: D ? "#f0eeff" : "#111",
      transition: "background 0.3s, color 0.3s",
    }}>
      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "60px",
        borderBottom: `1px solid ${D ? "rgba(255,255,255,0.08)" : "#ebebeb"}`,
        background: D ? "rgba(13,13,20,0.9)" : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
          }}>🎬</div>
          <span style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.3px" }}>WatchWith</span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{
            width: "36px", height: "36px",
            background: D ? "rgba(255,255,255,0.08)" : "#f2f2f5",
            border: `1px solid ${D ? "rgba(255,255,255,0.1)" : "#e0e0e0"}`,
            borderRadius: "10px", cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>
            {D ? "☀️" : "🌙"}
          </button>

          <a href="https://github.com/TUSHAR-GIT11/watchwith" target="_blank" style={{
            padding: "7px 16px", fontSize: "13px", fontWeight: "500",
            color: D ? "#aaa" : "#555", textDecoration: "none",
            border: `1px solid ${D ? "rgba(255,255,255,0.1)" : "#e0e0e0"}`,
            borderRadius: "8px",
            background: D ? "rgba(255,255,255,0.05)" : "white",
          }}>GitHub ↗</a>
        </div>
      </nav>

      {/* Hero */}
      <main style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "60px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: "460px" }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 12px",
            background: D ? "rgba(124,58,237,0.15)" : "#f3f0ff",
            border: `1px solid ${D ? "rgba(124,58,237,0.3)" : "#ddd6fe"}`,
            borderRadius: "20px", fontSize: "12px", fontWeight: "600",
            color: "#7c3aed", marginBottom: "24px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7c3aed", display: "inline-block" }} />
            Real-time sync · No signup needed
          </div>

          <h1 style={{
            fontSize: "48px", fontWeight: "800", margin: "0 0 16px",
            letterSpacing: "-1.5px", lineHeight: "1.1",
          }}>
            Watch together,<br />
            <span style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>anywhere.</span>
          </h1>

          <p style={{ color: D ? "#666" : "#888", fontSize: "16px", margin: "0 0 40px", lineHeight: "1.6" }}>
            Create a room, share the link, and watch YouTube videos perfectly in sync with your friends.
          </p>

          {/* Create Room */}
          <button onClick={createRoom} style={{
            width: "100%", padding: "15px",
            fontSize: "15px", fontWeight: "700",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "white", border: "none", borderRadius: "14px",
            cursor: "pointer", marginBottom: "12px",
            boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
          }}>
            + Create New Room
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", background: D ? "rgba(255,255,255,0.08)" : "#ebebeb" }} />
            <span style={{ color: D ? "#444" : "#bbb", fontSize: "13px" }}>or join existing</span>
            <div style={{ flex: 1, height: "1px", background: D ? "rgba(255,255,255,0.08)" : "#ebebeb" }} />
          </div>

          {/* Join Room */}
          <div style={{
            display: "flex", gap: "8px",
            background: focused ? (D ? "rgba(124,58,237,0.08)" : "#fff") : (D ? "rgba(255,255,255,0.05)" : "#f5f5f5"),
            border: focused ? "1.5px solid #7c3aed" : `1.5px solid ${D ? "rgba(255,255,255,0.1)" : "#e0e0e0"}`,
            borderRadius: "14px", padding: "5px 5px 5px 16px",
            transition: "all 0.2s",
            boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
          }}>
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Enter Room ID..."
              style={{
                flex: 1, background: "transparent", border: "none",
                color: D ? "#f0eeff" : "#111", fontSize: "15px", outline: "none", padding: "9px 0",
              }}
            />
            <button onClick={joinRoom} style={{
              padding: "10px 20px", fontSize: "14px", fontWeight: "700",
              background: roomId.trim() ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : (D ? "rgba(255,255,255,0.08)" : "#e0e0e0"),
              color: roomId.trim() ? "white" : (D ? "#444" : "#aaa"),
              border: "none", borderRadius: "10px", cursor: roomId.trim() ? "pointer" : "default",
              transition: "all 0.2s",
            }}>Join →</button>
          </div>

          {/* Features */}
          <div style={{ display: "flex", gap: "12px", marginTop: "40px" }}>
            {[
              { icon: "⚡", label: "Instant sync" },
              { icon: "💬", label: "Live chat" },
              { icon: "🔗", label: "Easy sharing" },
            ].map((f) => (
              <div key={f.label} style={{
                flex: 1, padding: "12px",
                background: D ? "rgba(255,255,255,0.04)" : "white",
                border: `1px solid ${D ? "rgba(255,255,255,0.08)" : "#ebebeb"}`,
                borderRadius: "12px", textAlign: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>{f.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: D ? "#888" : "#555" }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "20px",
        borderTop: `1px solid ${D ? "rgba(255,255,255,0.06)" : "#ebebeb"}`,
        fontSize: "12px", color: D ? "#333" : "#ccc",
      }}>
        Built with Next.js · Socket.io · Made with ❤️
      </footer>
    </div>
  );
}
