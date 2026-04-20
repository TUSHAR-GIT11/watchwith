import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get("q");
    if (!query) {
        return NextResponse.json({ error: "No query" }, { status: 400 });
    }

    const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data = await res.json();

    const videos = data.items?.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channel: item.snippet.channelTitle
    })) || [];

    return NextResponse.json({ videos });
}
