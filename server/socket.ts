import { Server } from "socket.io";

const io = new Server(3002, {
    cors: { origin: "*" }
});

console.log("🚀 Socket server running on port 3002");

// Room state: videoId + current time + isPlaying
const roomState: Record<string, { videoId: string; time: number; isPlaying: boolean }> = {};

// Room users: socketId -> username
const roomUsers: Record<string, Record<string, string>> = {};

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    let socketUsername = "";
    let socketRoomId = "";
    let lastAction = 0; // rate limit tracker

    // ── JOIN ROOM ──────────────────────────────────────────────
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        socketRoomId = roomId;
        console.log(`🚪 ${socket.id} joined room: ${roomId}`);

        // user count
        const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        io.to(roomId).emit("user-count", count);

        // send full room state to new user (video + time + isPlaying)
        if (roomState[roomId]) {
            console.log(`📺 Syncing state to new user: ${JSON.stringify(roomState[roomId])}`);
            socket.emit("sync-state", roomState[roomId]);
        } else {
            console.log(`⚠️ No saved state for room: ${roomId}`);
        }
    });

    // ── PLAY ──────────────────────────────────────────────────
    socket.on("play", (roomId, time) => {
        // rate limit: max 1 play event per 500ms per socket
        if (Date.now() - lastAction < 500) return;
        lastAction = Date.now();

        if (roomState[roomId]) {
            roomState[roomId].isPlaying = true;
            roomState[roomId].time = time;
        }
        socket.to(roomId).emit("play", time);
    });

    // ── PAUSE ─────────────────────────────────────────────────
    socket.on("pause", (roomId, time) => {
        if (roomState[roomId]) {
            roomState[roomId].isPlaying = false;
            roomState[roomId].time = time;
        }
        socket.to(roomId).emit("pause", time);
    });

    // ── SEEK ──────────────────────────────────────────────────
    socket.on("seek", (roomId, time) => {
        if (roomState[roomId]) {
            roomState[roomId].time = time;
        }
        socket.to(roomId).emit("seek", time);
    });

    // ── VIDEO CHANGE ──────────────────────────────────────────
    socket.on("video-change", (roomId, videoId) => {
        roomState[roomId] = { videoId, time: 0, isPlaying: false };
        console.log(`🎬 Video saved: room=${roomId} video=${videoId}`);
        socket.to(roomId).emit("video-change", videoId);
    });

    socket.on("reaction",(roomId,emoji,username)=>{
        socket.to(roomId).emit("reaction", emoji, username)
    })

    // ── CHAT MESSAGE ──────────────────────────────────────────
    socket.on("chat-message", (roomId, username, message) => {
        const msgData = {
            id: `${Date.now()}-${socket.id}`,
            user: username,
            text: message,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        socket.to(roomId).emit("chat-message", msgData.user, msgData.text);
    });

    // ── TYPING INDICATOR ─────────────────────────────────────
    socket.on("typing", (roomId, username) => {
        socket.to(roomId).emit("typing", username);
    });

    // ── SET USERNAME ──────────────────────────────────────────
    socket.on("set-username", (roomId, username) => {
        socketUsername = username;
        if (!roomUsers[roomId]) roomUsers[roomId] = {};
        roomUsers[roomId][socket.id] = username;

        const userList = Object.values(roomUsers[roomId]);
        io.to(roomId).emit("users-updated", userList);
        console.log(`👤 ${username} joined room ${roomId}`);
    });

    // ── DISCONNECT ────────────────────────────────────────────
    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);

        if (socketRoomId && roomUsers[socketRoomId]) {
            delete roomUsers[socketRoomId][socket.id]; // remove by socketId — no duplicates
            const userList = Object.values(roomUsers[socketRoomId]);
            io.to(socketRoomId).emit("users-updated", userList);

            const count = io.sockets.adapter.rooms.get(socketRoomId)?.size || 0;
            io.to(socketRoomId).emit("user-count", count);

            console.log(`👋 ${socketUsername} left room ${socketRoomId}`);
        }
    });
});
