import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannelVideos = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        // filter to only this channel's videos
        const channelVideos = res.data.filter(
          (v: any) => v.uploader === id
        );
        setVideos(channelVideos);
      } catch (error) {
        console.error("Error fetching channel videos:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchChannelVideos();
    }
  }, [id]);

  const channel = user;

  return (
    <div className="flex-1 min-h-screen bg-white">
      <div className="max-w-full mx-auto">
        <ChannelHeader channel={channel} user={user} />
        <Channeltabs />
        <div className="px-4 pb-8">
          <VideoUploader channelId={id} channelName={channel?.channelname} />
        </div>
        <div className="px-4 pb-8">
          {loading ? (
            <div>Loading videos...</div>
          ) : (
            <ChannelVideos videos={videos} />
          )}
        </div>
      </div>
    </div>
  );
};

export default index;