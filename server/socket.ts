
import { Server } from "socket.io";

const io = new Server(3002, {
    cors: {
        origin: "*"
    }
})

console.log("🚀 Socket server running on port 3002");

const roomVideos: Record<string, string> = {}; // room ka current video store karo

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);
    
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`🚪 ${socket.id} joined room: ${roomId}`);
        
        // Agar room mein pehle se video set hai toh naye user ko bhejo
        if (roomVideos[roomId]) {
            socket.emit("video-change", roomVideos[roomId]);
        }
    });
    
    socket.on("play", (roomId, time) => {
        socket.to(roomId).emit("play", time);
    });
    
    socket.on("pause", (roomId, time) => {
        socket.to(roomId).emit("pause", time);
    });
    
    socket.on("seek", (roomId, time) => {
        socket.to(roomId).emit("seek", time);
    });

    socket.on("video-change", (roomId, videoId) => {
        roomVideos[roomId] = videoId; // save karo
        socket.to(roomId).emit("video-change", videoId);
    });
    
    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});