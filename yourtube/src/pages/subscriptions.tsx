import { PlaySquare } from "lucide-react";
import { useUser } from "@/lib/AuthContext";

export default function SubscriptionsPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="text-center py-12 px-4">
        <PlaySquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Don't miss new videos
        </h2>
        <p className="text-gray-600">
          Sign in to see updates from your favorite channels.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12 px-4">
      <PlaySquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h2 className="text-xl font-semibold mb-2">No subscriptions yet</h2>
      <p className="text-gray-600">
        Channels you subscribe to will appear here.
      </p>
    </div>
  );
}