import { Server } from "socket.io";

const io = new Server(3002, {
    cors: { origin: "*" }
});

console.log("🚀 Socket server running on port 3002");

const roomState: Record<string, { videoId: string; time: number; isPlaying: boolean }> = {};
const roomUsers: Record<string, Record<string, string>> = {};
const roomQueue: Record<string, string[]> = {};
const roomHost: Record<string, string> = {};
const roomControlMode: Record<string, "host" | "all"> = {};

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    let socketUsername = "";
    let socketRoomId = "";
    let lastAction = 0;

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        socketRoomId = roomId;
        console.log(`🚪 ${socket.id} joined room: ${roomId}`);

        // Pehla user = host
        if (!roomHost[roomId]) {
            roomHost[roomId] = socket.id;
            roomControlMode[roomId] = "host";
            console.log(`👑 ${socket.id} is now host of room: ${roomId}`);
        }

        const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        io.to(roomId).emit("user-count", count);

        // Sync state + host info bhejo naye user ko
        if (roomState[roomId]) {
            socket.emit("sync-state", roomState[roomId]);
        }

        socket.emit("host-info", {
            hostSocketId: roomHost[roomId],
            controlMode: roomControlMode[roomId] || "host",
        });
    });

    socket.on("set-control-mode", (roomId, mode: "host" | "all") => {
        // Sirf host change kar sakta hai
        if (roomHost[roomId] !== socket.id) return;
        roomControlMode[roomId] = mode;
        io.to(roomId).emit("control-mode-changed", {
            hostSocketId: roomHost[roomId],
            controlMode: mode,
        });
        console.log(`🎛️ Room ${roomId} control mode: ${mode}`);
    });

    socket.on("add-to-queue", (roomId, videoId) => {
        if (!roomQueue[roomId]) roomQueue[roomId] = [];
        roomQueue[roomId].push(videoId);
        io.to(roomId).emit("queue-update", roomQueue[roomId]);
    });

    socket.on("play-next", (roomId) => {
        if (!roomQueue[roomId] || roomQueue[roomId].length === 0) return;
        const nextVideo = roomQueue[roomId].shift();
        roomState[roomId] = { videoId: nextVideo!, time: 0, isPlaying: false };
        io.to(roomId).emit("video-change", nextVideo);
        io.to(roomId).emit("queue-update", roomQueue[roomId]);
    });

    socket.on("play", (roomId, time) => {
        if (Date.now() - lastAction < 500) return;
        lastAction = Date.now();

        // Guard: sirf host ya "all" mode mein allowed
        const mode = roomControlMode[roomId] || "host";
        if (mode === "host" && roomHost[roomId] !== socket.id) return;

        if (roomState[roomId]) {
            roomState[roomId].isPlaying = true;
            roomState[roomId].time = time;
        }
        socket.to(roomId).emit("play", time);
    });

    socket.on("pause", (roomId, time) => {
        const mode = roomControlMode[roomId] || "host";
        if (mode === "host" && roomHost[roomId] !== socket.id) return;

        if (roomState[roomId]) {
            roomState[roomId].isPlaying = false;
            roomState[roomId].time = time;
        }
        socket.to(roomId).emit("pause", time);
    });

    socket.on("seek", (roomId, time) => {
        const mode = roomControlMode[roomId] || "host";
        if (mode === "host" && roomHost[roomId] !== socket.id) return;

        if (roomState[roomId]) {
            roomState[roomId].time = time;
        }
        socket.to(roomId).emit("seek", time);
    });

    socket.on("video-change", (roomId, videoId) => {
        roomState[roomId] = { videoId, time: 0, isPlaying: false };
        console.log(`🎬 Video saved: room=${roomId} video=${videoId}`);
        socket.to(roomId).emit("video-change", videoId);
    });

    socket.on("reaction", (roomId, emoji, username) => {
        socket.to(roomId).emit("reaction", emoji, username);
    });

    socket.on("chat-message", (roomId, username, message) => {
        const msgData = {
            id: `${Date.now()}-${socket.id}`,
            user: username,
            text: message,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        socket.to(roomId).emit("chat-message", msgData.user, msgData.text);
    });

    socket.on("typing", (roomId, username) => {
        socket.to(roomId).emit("typing", username);
    });

    socket.on("set-username", (roomId, username) => {
        socketUsername = username;
        if (!roomUsers[roomId]) roomUsers[roomId] = {};
        roomUsers[roomId][socket.id] = username;

        const userList = Object.values(roomUsers[roomId]);
        io.to(roomId).emit("users-updated", userList);
        console.log(`👤 ${username} joined room ${roomId}`);
        socket.to(roomId).emit("user-joined", username);
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);

        if (socketRoomId && roomUsers[socketRoomId]) {
            delete roomUsers[socketRoomId][socket.id];
            const userList = Object.values(roomUsers[socketRoomId]);
            io.to(socketRoomId).emit("users-updated", userList);

            const count = io.sockets.adapter.rooms.get(socketRoomId)?.size || 0;
            io.to(socketRoomId).emit("user-count", count);

            // Agar host disconnect hua → next user ko host banao
            if (roomHost[socketRoomId] === socket.id) {
                const remaining = Object.keys(roomUsers[socketRoomId]);
                if (remaining.length > 0) {
                    roomHost[socketRoomId] = remaining[0];
                    io.to(socketRoomId).emit("control-mode-changed", {
                        hostSocketId: remaining[0],
                        controlMode: roomControlMode[socketRoomId] || "host",
                    });
                    console.log(`👑 New host: ${remaining[0]}`);
                } else {
                    delete roomHost[socketRoomId];
                    delete roomControlMode[socketRoomId];
                    delete roomState[socketRoomId];
                    delete roomQueue[socketRoomId];
                }
            }

            console.log(`👋 ${socketUsername} left room ${socketRoomId}`);
            io.to(socketRoomId).emit("user-left", socketUsername);
        }
    });
});
