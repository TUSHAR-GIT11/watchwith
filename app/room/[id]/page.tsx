import VideoPlayer from "@/components/VideoPlayer";

export default async function RoomPage({ params }: any) {
  const { id } = await params;
  
  return (
    <div>
      <h1>Room: {id}</h1>
      <VideoPlayer roomId={id} />
    </div>
  );
}