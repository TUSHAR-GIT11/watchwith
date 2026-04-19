import { createServer } from "http";
import { Server } from "socket.io";
import { io as Client } from "socket.io-client";

describe("Socket.io Server Tests", () => {
  let ioServer: Server;
  let serverUrl: string;

  beforeAll((done) => {
    const httpServer = createServer();
    ioServer = new Server(httpServer, { cors: { origin: "*" } });

    // Same logic as socket.ts
    const roomState: Record<string, any> = {};
    const roomUsers: Record<string, Record<string, string>> = {};

    ioServer.on("connection", (socket) => {
      let socketRoomId = "";
      let socketUsername = "";

      socket.on("join-room", (roomId) => {
        socket.join(roomId);
        socketRoomId = roomId;
        const count = ioServer.sockets.adapter.rooms.get(roomId)?.size || 0;
        ioServer.to(roomId).emit("user-count", count);
        if (roomState[roomId]) {
          socket.emit("sync-state", roomState[roomId]);
        }
      });

      socket.on("set-username", (roomId, username) => {
        socketUsername = username;
        if (!roomUsers[roomId]) roomUsers[roomId] = {};
        roomUsers[roomId][socket.id] = username;
        socket.to(roomId).emit("user-joined", username);
      });

      socket.on("play", (roomId, time) => {
        if (roomState[roomId]) roomState[roomId].time = time;
        socket.to(roomId).emit("play", time);
      });

      socket.on("pause", (roomId, time) => {
        socket.to(roomId).emit("pause", time);
      });

      socket.on("chat-message", (roomId, username, message) => {
        socket.to(roomId).emit("chat-message", username, message);
      });

      socket.on("video-change", (roomId, videoId) => {
        roomState[roomId] = { videoId, time: 0, isPlaying: false };
        socket.to(roomId).emit("video-change", videoId);
      });

      socket.on("disconnect", () => {
        if (socketRoomId && roomUsers[socketRoomId]) {
          delete roomUsers[socketRoomId][socket.id];
          ioServer.to(socketRoomId).emit("user-left", socketUsername);
        }
      });
    });

    httpServer.listen(() => {
      const addr = httpServer.address() as any;
      serverUrl = `http://localhost:${addr.port}`;
      done();
    });
  });

  afterAll(() => {
    ioServer.close();
  });

  // ── Test 1: User join kare toh user-count mile ──
  test("user joins room and receives user-count", (done) => {
    const client = Client(serverUrl);
    client.on("connect", () => {
      client.emit("join-room", "room1");
    });
    client.on("user-count", (count) => {
      expect(count).toBeGreaterThan(0);
      client.disconnect();
      done();
    });
  });

  // ── Test 2: Play event sync hota hai ──
  test("play event syncs to other users", (done) => {
    const client1 = Client(serverUrl);
    const client2 = Client(serverUrl);
    let connected = 0;

    const tryJoin = () => {
      connected++;
      if (connected === 2) {
        client1.emit("join-room", "room2");
        client2.emit("join-room", "room2");
        setTimeout(() => {
          client1.emit("play", "room2", 42.5);
        }, 100);
      }
    };

    client1.on("connect", tryJoin);
    client2.on("connect", tryJoin);

    client2.on("play", (time) => {
      expect(time).toBe(42.5);
      client1.disconnect();
      client2.disconnect();
      done();
    });
  });

  // ── Test 3: Chat message dusre user ko milta hai ──
  test("chat message received by other user", (done) => {
    const client1 = Client(serverUrl);
    const client2 = Client(serverUrl);
    let connected = 0;

    const tryJoin = () => {
      connected++;
      if (connected === 2) {
        client1.emit("join-room", "room3");
        client2.emit("join-room", "room3");
        setTimeout(() => {
          client1.emit("chat-message", "room3", "Tushar", "Hello!");
        }, 100);
      }
    };

    client1.on("connect", tryJoin);
    client2.on("connect", tryJoin);

    client2.on("chat-message", (user, text) => {
      expect(user).toBe("Tushar");
      expect(text).toBe("Hello!");
      client1.disconnect();
      client2.disconnect();
      done();
    });
  });

  // ── Test 4: Video change sync hota hai ──
  test("video-change syncs to other users", (done) => {
    const client1 = Client(serverUrl);
    const client2 = Client(serverUrl);
    let connected = 0;

    const tryJoin = () => {
      connected++;
      if (connected === 2) {
        client1.emit("join-room", "room4");
        client2.emit("join-room", "room4");
        setTimeout(() => {
          client1.emit("video-change", "room4", "dQw4w9WgXcQ");
        }, 100);
      }
    };

    client1.on("connect", tryJoin);
    client2.on("connect", tryJoin);

    client2.on("video-change", (videoId) => {
      expect(videoId).toBe("dQw4w9WgXcQ");
      client1.disconnect();
      client2.disconnect();
      done();
    });
  });

  // ── Test 5: User leave hone pe notification aata hai ──
  test("user-left event fires when user disconnects", (done) => {
    const client1 = Client(serverUrl);
    const client2 = Client(serverUrl);
    let connected = 0;

    const tryJoin = () => {
      connected++;
      if (connected === 2) {
        client1.emit("join-room", "room5");
        client2.emit("join-room", "room5");
        // join-room process hone ke baad username set karo
        setTimeout(() => {
          client1.emit("set-username", "room5", "Rohit");
          // username set hone ke baad disconnect karo
          setTimeout(() => {
            client1.disconnect();
          }, 200);
        }, 200);
      }
    };

    client1.on("connect", tryJoin);
    client2.on("connect", tryJoin);

    client2.on("user-left", (username) => {
      expect(username).toBe("Rohit");
      client2.disconnect();
      done();
    });
  }, 10000); // timeout 10s
});
