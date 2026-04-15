"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

const V = "#7c3aed";
const V2 = "#6d28d9";
const CARD = "#ffffff";
const BORDER = "#ebebeb";
const TEXT = "#111111";
const MUTED = "#999999";
const SUBTLE = "#f2f2f5";

export default function VideoPlayer({ roomId, videoId, onVideoChange, onEmitReady }: {
  roomId: string;
  videoId: string;
  onVideoChange: (videoId: string) => void;
  onEmitReady?: (fn: (videoId: string) => void) => void;
}) {
  const playerRef = useRef<any>(null);
  const isSyncing = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const videoIdRef = useRef(videoId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const playerReady = useRef(false);
  const typingTimerRef = useRef<any>(null);

  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [username, setUserName] = useState("");
  const [messages, setMessages] = useState<{ user: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [reactions, setReactions] = useState<{ id: number; emoji: string; left: number, user: string }[]>([]);
  const router = useRouter()

  const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const myName = username.trim() || "Anonymous";

  const emitVideoChange = (newVideoId: string) => {
    socketRef.current?.emit("video-change", roomId, newVideoId);
    videoIdRef.current = newVideoId;
    onVideoChange(newVideoId);
  };

  const sendReaction = (emoji: string) => {
    const id = Date.now();
    const left = Math.random() * 60 + 20;
    const name = username.trim() || "Anonymous";
    setReactions(prev => [...prev, { id, emoji, left, user: name }]);
    socketRef.current?.emit("reaction", roomId, emoji, name);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  const leaveRoom = () => {
    socketRef.current?.disconnect()
    router.push("/")
  }

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socketRef.current?.emit("chat-message", roomId, myName, chatInput);
    setMessages((prev) => [...prev, { user: myName, text: chatInput, time: getTime() }]);
    setChatInput("");
  };

  const handleTyping = (val: string) => {
    setChatInput(val);
    socketRef.current?.emit("typing", roomId, myName);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinRoom = () => {
    setJoined(true);
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002");

    socketRef.current.on("disconnect", () => setConnected(false));

    socketRef.current.on("chat-message", (user, text) => {
      setMessages((prev) => [...prev, { user, text, time: getTime() }]);
    });

    socketRef.current.on("user-count", (count) => setUserCount(count));

    socketRef.current.on("video-change", (newVideoId: string) => {
      videoIdRef.current = newVideoId;
      onVideoChange(newVideoId);
    });

    socketRef.current.on("sync-state", (state: { videoId: string; time: number; isPlaying: boolean }) => {
      if (!state) return;
      videoIdRef.current = state.videoId;
      onVideoChange(state.videoId);
    });

    socketRef.current.on("typing", (user: string) => {
      setTypingUser(user);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingUser(""), 1500);
    });

    socketRef.current.on("reaction", (emoji: string, user: string) => {
      const id = Date.now();
      const left = Math.random() * 60 + 20;
      setReactions(prev => [...prev, { id, emoji, left, user }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
    });

    socketRef.current.on("play", (time) => {
      if (!playerRef.current || !playerReady.current) return;
      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.playVideo();
      setTimeout(() => (isSyncing.current = false), 500);
    });

    socketRef.current.on("pause", (time) => {
      if (!playerRef.current || !playerReady.current) return;
      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.pauseVideo();
      setTimeout(() => (isSyncing.current = false), 500);
    });

    socketRef.current.on("seek", (time) => {
      if (!playerRef.current || !playerReady.current) return;
      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      setTimeout(() => (isSyncing.current = false), 500);
    });

    // connect LAST — sabhi listeners ready hone ke baad
    socketRef.current.on("connect", () => {
      setConnected(true);
      setUserCount(1); // khud toh hai hi room mein
      socketRef.current?.emit("join-room", roomId);
      socketRef.current?.emit("set-username", roomId, myName);
      onEmitReady?.(emitVideoChange);
    });

    const initPlayer = () => {
      playerRef.current = new (window as any).YT.Player("yt-player", {
        height: "100%", width: "100%", videoId: videoIdRef.current,
        playerVars: { origin: window.location.origin, enablejsapi: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { playerReady.current = true; },
          onStateChange: (event: any) => {
            if (isSyncing.current) return;
            const time = playerRef.current?.getCurrentTime() || 0;
            if (event.data === 1) socketRef.current?.emit("play", roomId, time);
            if (event.data === 2) socketRef.current?.emit("pause", roomId, time);
            if (event.data === 3) socketRef.current?.emit("seek", roomId, time);
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  };

  useEffect(() => {
    videoIdRef.current = videoId;
    if (playerRef.current && joined && playerReady.current) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);

  useEffect(() => { return () => { socketRef.current?.disconnect(); }; }, []);

  // ── Join Screen ────────────────────────────────────────────────
  if (!joined) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: "100%", maxWidth: "400px", background: CARD, borderRadius: "20px",
          padding: "44px 36px", textAlign: "center",
          boxShadow: "0 4px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          border: `1px solid ${BORDER}`,
        }}>
          <div style={{
            width: "68px", height: "68px", background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
            borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", margin: "0 auto 20px", boxShadow: "0 4px 16px rgba(124,58,237,0.15)",
          }}>🎬</div>
          <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: "800", color: TEXT, letterSpacing: "-0.4px" }}>
            Ready to watch?
          </h2>
          <p style={{ color: MUTED, fontSize: "14px", margin: "0 0 28px", lineHeight: "1.5" }}>
            Enter your name to join room <span style={{ color: V, fontWeight: "700" }}>{roomId}</span>
          </p>
          <input
            placeholder="Your name..."
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: "12px",
              border: nameFocused ? `1.5px solid ${V}` : `1.5px solid ${BORDER}`,
              background: nameFocused ? "#fdfcff" : SUBTLE,
              color: TEXT, fontSize: "14px", outline: "none",
              marginBottom: "12px", boxSizing: "border-box",
              boxShadow: nameFocused ? `0 0 0 3px rgba(124,58,237,0.1)` : "none",
              transition: "all 0.2s",
            }}
          />
          <button onClick={joinRoom} style={{
            width: "100%", padding: "13px", fontSize: "14px", fontWeight: "700",
            background: `linear-gradient(135deg, ${V}, ${V2})`,
            color: "white", border: "none", borderRadius: "12px", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
          }}>
            Enter Room →
          </button>
          <p style={{ color: "#ddd", fontSize: "12px", marginTop: "16px" }}>
            No account needed · Free forever
          </p>
        </div>
      </div>
    );
  }

  // ── Main Room ──────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", gap: "16px", height: "calc(100vh - 100px)" }}>

      {/* Left: Video */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
        {/* Status bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 14px", background: CARD, border: `1px solid ${BORDER}`,
          borderRadius: "12px", fontSize: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            background: connected ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${connected ? "#bbf7d0" : "#fecaca"}`,
            color: connected ? "#15803d" : "#dc2626",
            padding: "3px 10px", borderRadius: "20px", fontWeight: "600", fontSize: "11px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: connected ? "#15803d" : "#dc2626", display: "inline-block" }} />
            {connected ? "Live" : "Disconnected"}
          </span>
          <span style={{ color: "#e0e0e0" }}>|</span>
          <span style={{
            background: "#f3f0ff", border: "1px solid #ddd6fe",
            color: V, padding: "3px 10px", borderRadius: "20px", fontWeight: "600", fontSize: "11px",
          }}>👤 {myName}</span>
          <span style={{ color: "#e0e0e0" }}>|</span>
          <span style={{
            background: SUBTLE, border: `1px solid ${BORDER}`,
            color: MUTED, padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
          }}>👥 {userCount} watching</span>
          <span style={{ marginLeft: "auto", color: MUTED, fontSize: "11px" }}>
            Room: <span style={{ color: TEXT, fontWeight: "600" }}>{roomId}</span>
          </span>
          <button onClick={leaveRoom} style={{
            padding: "3px 12px",
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: "20px", color: "#dc2626",
            fontSize: "11px", fontWeight: "600", cursor: "pointer",
          }}>Leave</button>
        </div>

        {/* Floating Reactions */}
        {reactions.map(r => (
          <div key={r.id} style={{
            position: "fixed", bottom: "140px", left: `${r.left}%`,
            pointerEvents: "none", zIndex: 9999,
            animation: "floatUp 2.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            userSelect: "none",
          }}>
            <div style={{ fontSize: "36px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}>
              {r.emoji}
            </div>
            <div style={{
              fontSize: "10px", fontWeight: "700", color: "white",
              background: "rgba(0,0,0,0.5)", padding: "2px 6px",
              borderRadius: "10px", whiteSpace: "nowrap",
            }}>
              {r.user === myName ? "You" : r.user}
            </div>
          </div>
        ))}


        {/* Reaction Bar */}
        <div style={{
          display: "flex", gap: "6px", alignItems: "center",
          padding: "8px 12px",
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: "14px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          width: "fit-content",
        }}>
          <span style={{ fontSize: "11px", color: MUTED, fontWeight: "600", marginRight: "4px" }}>React</span>
          {["👍", "❤️", "😂", "😮", "🔥", "👏"].map(emoji => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              style={{
                fontSize: "20px",
                background: "transparent",
                border: "none",
                borderRadius: "10px",
                padding: "4px 8px",
                cursor: "pointer",
                transition: "background 0.15s",
                lineHeight: 1,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = SUBTLE;
                e.currentTarget.style.animation = "reactionBtnPop 0.3s ease";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.animation = "";
              }}
            >{emoji}</button>
          ))}
        </div>

        {/* Player */}
        <div style={{
          flex: 1, borderRadius: "16px", overflow: "hidden", background: "#000",
          boxShadow: "0 4px 32px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
          border: `1px solid ${BORDER}`, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "3px",
            background: `linear-gradient(90deg, ${V}, #a78bfa, ${V2})`, zIndex: 2,
          }} />
          <div id="yt-player" style={{ width: "100%", height: "100%" }} />
        </div>
      </div>

      {/* Right: Chat */}
      <div style={{
        width: "290px", flexShrink: 0, display: "flex", flexDirection: "column",
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 16px", borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", gap: "10px", background: "#fdfcff",
        }}>
          <div style={{
            width: "34px", height: "34px", background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
            border: "1px solid #c4b5fd", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px",
          }}>💬</div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "13px", color: TEXT }}>Live Chat</div>
            <div style={{ fontSize: "11px", color: MUTED }}>{userCount} in room</div>
          </div>
          <div style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px",
            fontSize: "11px", color: connected ? "#15803d" : "#dc2626", fontWeight: "600",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: connected ? "#15803d" : "#dc2626",
              boxShadow: connected ? "0 0 5px #15803d" : "none", display: "inline-block",
            }} />
            {connected ? "Live" : "Off"}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "12px 10px",
          display: "flex", flexDirection: "column", gap: "8px", background: "#fafafa",
          scrollbarWidth: "thin", scrollbarColor: "#e0e0e0 transparent",
        }}>
          {messages.length === 0 && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: "8px",
            }}>
              <div style={{ fontSize: "36px" }}>👋</div>
              <div style={{ fontSize: "13px", color: MUTED, textAlign: "center", lineHeight: "1.6" }}>
                No messages yet<br />
                <span style={{ color: "#ccc", fontSize: "12px" }}>Say hi to your friends!</span>
              </div>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.user === myName;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px",
                  paddingLeft: isMe ? 0 : "2px", paddingRight: isMe ? "2px" : 0,
                }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: isMe ? V : "#f59e0b" }}>
                    {isMe ? "You" : msg.user}
                  </span>
                  <span style={{ fontSize: "10px", color: "#ccc" }}>{msg.time}</span>
                </div>
                <div style={{
                  maxWidth: "88%", padding: "8px 12px",
                  borderRadius: isMe ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                  background: isMe ? `linear-gradient(135deg, ${V}, ${V2})` : CARD,
                  border: isMe ? "none" : `1px solid ${BORDER}`,
                  fontSize: "13px", color: isMe ? "white" : TEXT,
                  lineHeight: "1.5", wordBreak: "break-word",
                  boxShadow: isMe ? "0 2px 10px rgba(124,58,237,0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          {typingUser && (
            <div style={{ fontSize: "11px", color: MUTED, fontStyle: "italic", paddingLeft: "4px" }}>
              {typingUser} is typing...
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "10px", borderTop: `1px solid ${BORDER}`, background: CARD }}>
          <div style={{
            display: "flex", gap: "6px",
            background: inputFocused ? "#fdfcff" : SUBTLE,
            border: inputFocused ? `1.5px solid ${V}` : `1.5px solid ${BORDER}`,
            borderRadius: "12px", padding: "4px 4px 4px 12px", transition: "all 0.2s",
            boxShadow: inputFocused ? `0 0 0 3px rgba(124,58,237,0.1)` : "none",
          }}>
            <input
              value={chatInput}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Type a message..."
              style={{
                flex: 1, background: "transparent", border: "none",
                color: TEXT, fontSize: "13px", outline: "none", padding: "7px 0",
              }}
            />
            <button onClick={sendMessage} style={{
              width: "34px", height: "34px",
              background: chatInput.trim() ? `linear-gradient(135deg, ${V}, ${V2})` : "#ebebeb",
              border: "none", borderRadius: "9px",
              cursor: chatInput.trim() ? "pointer" : "default",
              color: chatInput.trim() ? "white" : "#ccc", fontSize: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", flexShrink: 0,
              boxShadow: chatInput.trim() ? "0 2px 8px rgba(124,58,237,0.25)" : "none",
            }}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}
