"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useRef, useState } from "react";

export default function VideoCard({ video }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<string>("");

  const handleLoadedMetadata = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const totalSeconds = Math.floor(videoEl.duration);
    if (!isFinite(totalSeconds)) return;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    setDuration(`${minutes}:${seconds.toString().padStart(2, "0")}`);
  };

  return (
    <Link href={`/watch/${video?._id}`} className="group">
      <div className="space-y-3">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <video
            ref={videoRef}
            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${video?.filepath}`}
            className="object-cover group-hover:scale-105 transition-transform duration-200 w-full h-full"
            preload="metadata"
            muted
            onLoadedMetadata={handleLoadedMetadata}
          />
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
              {duration}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback>{video?.videochanel[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
              {video?.videotitle}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{video?.videochanel}</p>
            <p className="text-sm text-gray-600">
              {video?.views.toLocaleString()} views •{" "}
              {formatDistanceToNow(new Date(video?.createdAt))} ago
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}