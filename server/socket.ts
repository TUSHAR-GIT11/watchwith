
import { Server } from "socket.io";

const io = new Server(3001, {
    cors: {
        origin: "*"
    }
})

console.log("🚀 Socket server running on port 3001");

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);
    
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`🚪 ${socket.id} joined room: ${roomId}`);
    });
    
    socket.on("play", (roomId, time) => {
        console.log(`▶️ Play event in room ${roomId} at ${time}`);
        socket.to(roomId).emit("play", time);
    });
    
    socket.on("pause", (roomId, time) => {
        console.log(`⏸️ Pause event in room ${roomId} at ${time}`);
        socket.to(roomId).emit("pause", time);
    });
    
    socket.on("seek", (roomId, time) => {
        console.log(`⏩ Seek event in room ${roomId} to ${time}`);
        socket.to(roomId).emit("seek", time);
    });
    
    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});