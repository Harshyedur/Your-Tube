import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { ThumbsUp, ThumbsDown, Flag } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  likes?: number;
  dislikes?: number;
  likedBy?: string[];
  dislikedBy?: string[];
  reportCount?: number;
  isFlagged?: boolean;
  showLocation?: boolean;
  location?: string;
}

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [shareLocation, setShareLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [translatedText, setTranslatedText] = useState<{ [key: string]: string }>({});
  const [translating, setTranslating] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  const getCityName = async (): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve("");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.state ||
              "";
            resolve(city);
          } catch {
            resolve("");
          }
        },
        () => resolve(""),
        { timeout: 5000 }
      );
    });
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      let location = "";
      if (shareLocation) {
        location = await getCityName();
      }

      const payload: any = {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        showLocation: shareLocation,
        location: location,
      };
      const res = await axiosInstance.post("/comment/postcomment", payload);
      if (res.data.comment) {
        loadComments();
      }
      setNewComment("");
      setShareLocation(false);
    } catch (error: any) {
      if (error?.response?.status === 400) {
        alert(error.response.data.message || "Comment rejected");
      }
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, commentbody: editText } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleLike = async (id: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/like/${id}`, {
        userid: user._id,
      });
      setComments((prev) =>
        prev.map((c) => (c._id === id ? { ...c, ...res.data } : c))
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleDislike = async (id: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/dislike/${id}`, {
        userid: user._id,
      });
      setComments((prev) =>
        prev.map((c) => (c._id === id ? { ...c, ...res.data } : c))
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleReport = async (id: string) => {
    if (!user) return;
    try {
      await axiosInstance.post(`/comment/report/${id}`, {
        userid: user._id,
      });
      alert("Comment reported. Our team will review it.");
      setComments((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isFlagged: true } : c))
      );
    } catch (error: any) {
      alert(error?.response?.data?.message || "Could not report comment");
    }
  };

  const detectLangCode = (text: string): string => {
    if (/[\u0900-\u097F]/.test(text)) return "hi"; // Devanagari (Hindi)
    if (/[\u0600-\u06FF]/.test(text)) return "ar"; // Arabic
    if (/[\u4E00-\u9FFF]/.test(text)) return "zh"; // Chinese
    if (/[\u3040-\u30FF]/.test(text)) return "ja"; // Japanese
    if (/[\uAC00-\uD7AF]/.test(text)) return "ko"; // Korean
    if (/[\u0400-\u04FF]/.test(text)) return "ru"; // Russian/Cyrillic
    return "en"; // default fallback
  };

  const handleTranslate = async (comment: Comment) => {
    const id = comment._id;

    if (translatedText[id]) {
      setTranslatedText((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      return;
    }

    setTranslating((prev) => ({ ...prev, [id]: true }));
    try {
      const sourceLang = detectLangCode(comment.commentbody);
      const targetLang = sourceLang === "en" ? "hi" : "en";

      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          comment.commentbody
        )}&langpair=${sourceLang}|${targetLang}`
      );
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      setTranslatedText((prev) => ({
        ...prev,
        [id]: translated || "Translation unavailable",
      }));
    } catch (error) {
      console.log(error);
      setTranslatedText((prev) => ({
        ...prev,
        [id]: "Translation failed",
      }));
    } finally {
      setTranslating((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={shareLocation}
                onChange={(e) => setShareLocation(e.target.checked)}
              />
              Share my location with this comment
            </label>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const userLiked = user && comment.likedBy?.includes(user._id);
            const userDisliked = user && comment.dislikedBy?.includes(user._id);

            return (
              <div key={comment._id} className="flex gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback>{comment.usercommented[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.usercommented}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatDistanceToNow(new Date(comment.commentedon))} ago
                    </span>
                    {comment.showLocation && comment.location && (
                      <span className="text-xs text-gray-400">
                        · {comment.location}
                      </span>
                    )}
                    {comment.isFlagged && (
                      <span className="text-xs text-red-500">
                        · Under review
                      </span>
                    )}
                  </div>

                  {editingCommentId === comment._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={handleUpdateComment}
                          disabled={!editText.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{comment.commentbody}</p>

                      {translatedText[comment._id] && (
                        <p className="text-sm text-gray-500 italic mt-1">
                          Translated: {translatedText[comment._id]}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <button
                          onClick={() => handleLike(comment._id)}
                          className={`flex items-center gap-1 ${
                            userLiked ? "text-blue-600" : ""
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {comment.likes || 0}
                        </button>
                        <button
                          onClick={() => handleDislike(comment._id)}
                          className={`flex items-center gap-1 ${
                            userDisliked ? "text-blue-600" : ""
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          {comment.dislikes || 0}
                        </button>
                        <button
                          onClick={() => handleReport(comment._id)}
                          className="flex items-center gap-1"
                        >
                          <Flag className="w-4 h-4" />
                          Report
                        </button>
                        <button
                          onClick={() => handleTranslate(comment)}
                          className="flex items-center gap-1"
                          disabled={translating[comment._id]}
                        >
                          {translating[comment._id]
                            ? "Translating..."
                            : translatedText[comment._id]
                            ? "Show original"
                            : "Translate"}
                        </button>

                        {comment.userid === user?._id && (
                          <>
                            <button onClick={() => handleEdit(comment)}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(comment._id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Comments;