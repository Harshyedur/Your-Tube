"use client";

import { useRef, useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  SkipForward,
  Loader2,
} from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  nextVideoId?: string;
}

export default function VideoPlayer({ video, nextVideoId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();

  const [limitReached, setLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gestureFeedback, setGestureFeedback] = useState<"forward" | "rewind" | null>(null);

  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // 1. Limit Status Checking
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

  // 2. Watchtime Tracking
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

    const handleTimeUpdateTracking = () => {
      const current = videoEl.currentTime;
      const elapsed = current - lastReportedTime;
      if (elapsed >= 5) {
        sendTick(elapsed);
        lastReportedTime = current;
      }
    };

    const handlePlayTracking = () => {
      lastReportedTime = videoEl.currentTime;
    };

    const handlePauseOrEndTracking = () => {
      const current = videoEl.currentTime;
      const elapsed = current - lastReportedTime;
      if (elapsed > 0) {
        sendTick(elapsed);
      }
      lastReportedTime = current;
    };

    videoEl.addEventListener("timeupdate", handleTimeUpdateTracking);
    videoEl.addEventListener("play", handlePlayTracking);
    videoEl.addEventListener("pause", handlePauseOrEndTracking);
    videoEl.addEventListener("ended", handlePauseOrEndTracking);

    return () => {
      videoEl.removeEventListener("timeupdate", handleTimeUpdateTracking);
      videoEl.removeEventListener("play", handlePlayTracking);
      videoEl.removeEventListener("pause", handlePauseOrEndTracking);
      videoEl.removeEventListener("ended", handlePauseOrEndTracking);
    };
  }, [user]);

  // 3. Player Events & Controls
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const updateMetadata = () => {
      if (vid.duration && !isNaN(vid.duration) && vid.duration !== Infinity) {
        setDuration(vid.duration);
      }
      setIsLoading(false);
    };

    if (vid.readyState >= 1) {
      updateMetadata();
    }

    const handleTimeUpdate = () => {
      setCurrentTime(vid.currentTime);
      if ((!duration || isNaN(duration)) && vid.duration && !isNaN(vid.duration)) {
        setDuration(vid.duration);
      }
    };

    const handleCanPlay = () => {
      updateMetadata();
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (nextVideoId) {
        router.push(`/watch/${nextVideoId}`);
      }
    };

    vid.addEventListener("timeupdate", handleTimeUpdate);
    vid.addEventListener("loadedmetadata", updateMetadata);
    vid.addEventListener("durationchange", updateMetadata);
    vid.addEventListener("canplay", handleCanPlay);
    vid.addEventListener("waiting", handleWaiting);
    vid.addEventListener("playing", handlePlaying);
    vid.addEventListener("pause", handlePause);
    vid.addEventListener("ended", handleEnded);

    return () => {
      vid.removeEventListener("timeupdate", handleTimeUpdate);
      vid.removeEventListener("loadedmetadata", updateMetadata);
      vid.removeEventListener("durationchange", updateMetadata);
      vid.removeEventListener("canplay", handleCanPlay);
      vid.removeEventListener("waiting", handleWaiting);
      vid.removeEventListener("playing", handlePlaying);
      vid.removeEventListener("pause", handlePause);
      vid.removeEventListener("ended", handleEnded);
    };
  }, [nextVideoId, router, video?.filepath, duration]);

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.code === "Space" || e.code === "KeyK") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight" || e.code === "KeyL") {
        seekBy(10);
      } else if (e.code === "ArrowLeft" || e.code === "KeyJ") {
        seekBy(-10);
      } else if (e.code === "KeyF") {
        toggleFullscreen();
      } else if (e.code === "KeyM") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, volume, isMuted, duration]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid || limitReached) return;
    if (vid.paused) {
      vid.play().catch(console.error);
    } else {
      vid.pause();
    }
  };

  const seekBy = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      Math.max(videoRef.current.currentTime + seconds, 0),
      duration || videoRef.current.duration || 0
    );
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    videoRef.current.muted = newMuteState;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // Mobile Double Tap
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();

    if (!rect) return;
    const touchX = touch.clientX - rect.left;
    const width = rect.width;

    if (now - lastTapRef.current.time < 300) {
      if (touchX < width * 0.35) {
        seekBy(-10);
        triggerGestureFeedback("rewind");
      } else if (touchX > width * 0.65) {
        seekBy(10);
        triggerGestureFeedback("forward");
      }
    }

    lastTapRef.current = { time: now, x: touchX };
  };

  const triggerGestureFeedback = (type: "forward" | "rewind") => {
    setGestureFeedback(type);
    setTimeout(() => setGestureFeedback(null), 600);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds === Infinity) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      className="relative group w-full bg-black rounded-lg overflow-hidden select-none aspect-video flex items-center justify-center"
    >
      <video
        ref={videoRef}
        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${video?.filepath}`}
        poster="/placeholder.svg?height=480&width=854"
        className="w-full h-full cursor-pointer object-contain"
        onClick={togglePlay}
        onCanPlay={() => {
          setIsLoading(false);
          if (videoRef.current?.duration) setDuration(videoRef.current.duration);
        }}
        onLoadedData={() => {
          setIsLoading(false);
          if (videoRef.current?.duration) setDuration(videoRef.current.duration);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current?.duration) setDuration(videoRef.current.duration);
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Mobile Gesture Overlay */}
      {gestureFeedback && (
        <div
          className={`absolute top-0 bottom-0 w-1/3 flex items-center justify-center bg-white/20 z-20 pointer-events-none transition-opacity ${
            gestureFeedback === "rewind" ? "left-0 rounded-r-full" : "right-0 rounded-l-full"
          }`}
        >
          <div className="flex flex-col items-center text-white font-bold text-sm">
            {gestureFeedback === "rewind" ? (
              <>
                <RotateCcw className="w-8 h-8 mb-1" />
                -10s
              </>
            ) : (
              <>
                <RotateCw className="w-8 h-8 mb-1" />
                +10s
              </>
            )}
          </div>
        </div>
      )}

      {/* Controls Overlay Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
        <input
          type="range"
          min="0"
          max={duration || videoRef.current?.duration || 0}
          value={currentTime}
          onChange={handleSeekChange}
          className="w-full h-1 bg-gray-600 appearance-none rounded cursor-pointer accent-red-600 mb-3 pointer-events-auto"
        />

        <div className="flex items-center justify-between text-white text-sm pointer-events-auto">
          {/* Left Side Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="hover:text-red-500 transition-colors p-1"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                seekBy(-10);
              }}
              className="hover:text-red-500 transition-colors p-1"
              title="Rewind 10s"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                seekBy(10);
              }}
              className="hover:text-red-500 transition-colors p-1"
              title="Skip 10s"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="hover:text-red-500 transition-colors p-1"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-600 appearance-none rounded cursor-pointer accent-red-600"
              />
            </div>

            <div className="text-xs text-gray-300 font-mono ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            {nextVideoId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/watch/${nextVideoId}`);
                }}
                className="hover:text-red-500 transition-colors flex items-center gap-1 text-xs p-1"
                title="Next Video"
              >
                <span>Next</span>
                <SkipForward className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="hover:text-red-500 transition-colors p-1"
              title="Full Screen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}