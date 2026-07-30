"use client";

import { useRef, useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();
  const router = useRouter();
  const [limitReached, setLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setCheckingLimit(false);
        return;
      }
      try {
        const res = await axiosInstance.get(`/watchtime/status/${user._id}`);
        if (res.data.limitReached) {
          setLimitReached(true);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setCheckingLimit(false);
      }
    };
    checkStatus();
  }, [user]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !user) return;

    let lastReportedTime = 0;

    const sendTick = async (elapsedSeconds: number) => {
      if (elapsedSeconds <= 0) return;
      try {
        const res = await axiosInstance.post("/watchtime/track", {
          userid: user._id,
          secondsToAdd: elapsedSeconds,
        });
        if (res.data.limitReached) {
          setLimitReached(true);
          videoEl.pause();
        }
      } catch (error) {
        console.log(error);
      }
    };

    const handleTimeUpdate = () => {
      const current = videoEl.currentTime;
      const elapsed = current - lastReportedTime;
      if (elapsed >= 5) {
        sendTick(elapsed);
        lastReportedTime = current;
      }
    };

    const handlePlay = () => {
      lastReportedTime = videoEl.currentTime;
    };

    const handlePauseOrEnd = () => {
      const current = videoEl.currentTime;
      const elapsed = current - lastReportedTime;
      if (elapsed > 0) {
        sendTick(elapsed);
      }
      lastReportedTime = current;
    };

    videoEl.addEventListener("timeupdate", handleTimeUpdate);
    videoEl.addEventListener("play", handlePlay);
    videoEl.addEventListener("pause", handlePauseOrEnd);
    videoEl.addEventListener("ended", handlePauseOrEnd);

    return () => {
      videoEl.removeEventListener("timeupdate", handleTimeUpdate);
      videoEl.removeEventListener("play", handlePlay);
      videoEl.removeEventListener("pause", handlePauseOrEnd);
      videoEl.removeEventListener("ended", handlePauseOrEnd);
    };
  }, [user]);

  if (checkingLimit) {
    return (
      <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (limitReached) {
    return (
      <div className="aspect-video bg-black rounded-lg flex flex-col items-center justify-center text-white gap-4 p-6 text-center">
        <p className="text-lg font-semibold">
          You've reached your daily watch-time limit
        </p>
        <p className="text-sm text-gray-300">
          Upgrade your plan to keep watching without interruption.
        </p>
        <button
          onClick={() => router.push("/upgrade")}
          className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200"
        >
          Upgrade plan
        </button>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster={`/placeholder.svg?height=480&width=854`}
      >
        <source
          src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${video?.filepath}`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}