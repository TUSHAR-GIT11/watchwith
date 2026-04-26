# 🎬 WatchWith

A real-time YouTube watch party app — create a room, share the link, and watch videos in perfect sync with friends.

**Live Demo → [watchwith-beta.vercel.app](https://watchwith-beta.vercel.app)**

---

## Features

- 🔄 Real-time video sync (play, pause, seek)
- 💬 Live chat with typing indicators
- � Host control mode (host only / everyone)
- 🎵 Video queue system
- � YouTube search built-in
- 😂 Floating emoji reactions
- � Synchronized 3...2...1 countdown
- �🌙 Dark / Light mode
- � No signup needed

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, TypeScript |
| Real-time | Socket.io |
| Styling | Inline CSS (theme-aware) |
| Testing | Jest |
| Containerization | Docker |
| CI Pipeline | GitHub Actions |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

## Architecture

```
Browser (Next.js) ──── Vercel
       │
       └── Socket.io ── Railway (Node.js server)
```

## Run Locally

**With Docker (recommended):**
```bash
git clone https://github.com/TUSHAR-GIT11/watchwith
cd watchwith
cp .env.example .env   # add your YouTube API key
docker-compose up --build
```

Open `http://localhost:3001`

**Without Docker:**
```bash
npm install
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
YOUTUBE_API_KEY=your_youtube_api_key
```

Get a YouTube API key from [Google Cloud Console](https://console.cloud.google.com).

## CI Pipeline

GitHub Actions runs on every push to `main`:
- TypeScript type check
- Jest tests
- Next.js build
- Docker image build
