import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider, useUser } from "../lib/AuthContext";
import { useEffect } from "react";
import OtpVerificationModal from "@/components/OtpVerificationModal";

function ThemedApp({ Component, pageProps }: AppProps) {
  const { user } = useUser();
  const isDark = user?.theme === "dark" || !user;

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <title>Your-Tube Clone</title>
      <Header />
      <Toaster />
      <OtpVerificationModal />
      <div className="flex">
        <Sidebar />
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default function App(props: AppProps) {
  return (
    <UserProvider>
      <ThemedApp {...props} />
    </UserProvider>
  );
}