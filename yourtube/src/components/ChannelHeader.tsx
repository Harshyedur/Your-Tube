import React, { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

const ChannelHeader = ({ channel, user }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [plan, setPlan] = useState(channel?.plan || "free");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { login } = useUser();

  const isOwnChannel = user && user?._id === channel?._id;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const newPlan = plan === "free" ? "premium" : "free";
      const res = await axiosInstance.patch(
        `/user/updateplan/${channel._id}`,
        { plan: newPlan }
      );
      setPlan(res.data.result.plan);
      login(res.data.result);
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Could not update plan. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden"></div>

      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="w-20 h-20 md:w-32 md:h-32">
            <AvatarFallback className="text-2xl">
              {channel?.channelname[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">{channel?.channelname}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>@{channel?.channelname.toLowerCase().replace(/\s+/g, "")}</span>
            </div>
            {channel?.description && (
              <p className="text-sm text-gray-700 max-w-2xl">
                {channel?.description}
              </p>
            )}

            {isOwnChannel && (
              <div className="flex items-center gap-3 pt-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${plan === "premium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-700"
                    }`}
                >
                  {plan === "premium" ? "Premium plan" : "Free plan"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="bg-white text-black border-gray-300 hover:bg-gray-50"
                >
                  {isUpgrading
                    ? "Updating..."
                    : plan === "free"
                      ? "Upgrade to Premium"
                      : "Switch to Free"}
                </Button>
              </div>
            )}
          </div>

          {user && !isOwnChannel && (
            <div className="flex gap-2">
              <Button
                onClick={() => setIsSubscribed(!isSubscribed)}
                variant={isSubscribed ? "outline" : "default"}
                className={
                  isSubscribed ? "bg-gray-100" : "bg-red-600 hover:bg-red-700"
                }
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;