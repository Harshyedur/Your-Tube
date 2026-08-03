"use client";

import { useState } from "react";
import { useUser } from "@/lib/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function OtpVerificationModal() {
  const { otpPending, verifyOtp, cancelOtp } = useUser() as any;
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  if (!otpPending) return null;

  const handleVerify = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setIsVerifying(true);
    setError("");
    const result = await verifyOtp(otp);
    setIsVerifying(false);
    if (!result.success) {
      setError(result.message || "Invalid code, please try again");
    }
  };

  const handleCancel = () => {
    setOtp("");
    setError("");
    cancelOtp();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background text-foreground rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Verify it's you</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {otpPending.message ||
              "We noticed a login from a new location or device. Enter the code we sent to your email."}
          </p>
        </div>

        <Input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, ""));
            setError("");
          }}
          className="text-center text-lg tracking-widest"
          autoFocus
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
            disabled={isVerifying}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleVerify}
            disabled={isVerifying || otp.length !== 6}
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </div>
    </div>
  );
}