"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    features: ["1 download / day", "Standard watch time", "Ads shown"],
  },
  {
    key: "bronze",
    name: "Bronze",
    price: 99,
    features: ["3 downloads / day", "Extended watch time", "Ad-free"],
  },
  {
    key: "silver",
    name: "Silver",
    price: 199,
    features: ["7 downloads / day", "Longer watch time", "Ad-free"],
    popular: true,
  },
  {
    key: "gold",
    name: "Gold",
    price: 499,
    features: ["Unlimited downloads", "Unlimited watch time", "Ad-free"],
  },
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PricingCards() {
  const { user, login } = useUser();
  const [currentPlan, setCurrentPlan] = useState(user?.plan || "free");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPlan(user?.plan || "free");
  }, [user]);

  const handleUpgrade = async (planKey: string) => {
    if (!user) {
      alert("Please sign in to upgrade your plan.");
      return;
    }
    if (planKey === "free") return;

    setProcessingPlan(planKey);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Could not load payment gateway. Check your internet connection.");
        setProcessingPlan(null);
        return;
      }

      const orderRes = await axiosInstance.post("/payment/create-order", {
        userid: user._id,
        plan: planKey,
      });

      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "YourTube",
        description: `Upgrade to ${planKey} plan`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await axiosInstance.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userid: user._id,
              plan: planKey,
            });
            login(verifyRes.data.user);
            setCurrentPlan(planKey);
            alert(`Successfully upgraded to ${planKey} plan! A confirmation email has been sent.`);
          } catch (error) {
            console.error(error);
            alert("Payment succeeded but verification failed. Please contact support.");
          } finally {
            setProcessingPlan(null);
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: { color: "#000000" },
        modal: {
          ondismiss: function () {
            setProcessingPlan(null);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Could not start payment. Please try again.");
      setProcessingPlan(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.key;
        return (
          <div
            key={plan.key}
            className={`rounded-xl border p-5 bg-white relative ${
              plan.popular ? "border-2 border-blue-500" : "border-gray-200"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-4 bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold mt-2">{plan.name}</h3>
            <p className="text-2xl font-bold mt-1">
              ₹{plan.price}
              {plan.price > 0 && (
                <span className="text-sm font-normal text-gray-500">/mo</span>
              )}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {plan.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Button
              className="w-full mt-5"
              disabled={isCurrent || processingPlan === plan.key}
              onClick={() => handleUpgrade(plan.key)}
              variant={isCurrent ? "outline" : "default"}
            >
              {isCurrent
                ? "Current plan"
                : processingPlan === plan.key
                ? "Processing..."
                : `Upgrade`}
            </Button>
          </div>
        );
      })}
    </div>
  );
}