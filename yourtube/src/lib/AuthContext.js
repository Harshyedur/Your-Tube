import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [otpPending, setOtpPending] = useState(null); // { userid, message } or null

  const login = (userdata) => {
    setUser(userdata);
    setOtpPending(null);
    localStorage.setItem("user", JSON.stringify(userdata));
  };

  const logout = async () => {
    setUser(null);
    setOtpPending(null);
    localStorage.removeItem("user");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const handleLoginResponse = async (response) => {
    if (response.data.otpRequired) {
      setOtpPending({
        userid: response.data.userid,
        message: response.data.message,
      });
    } else {
      login(response.data.result);
    }
  };

  const verifyOtp = async (otp) => {
    if (!otpPending) return { success: false, message: "No pending verification" };
    try {
      const res = await axiosInstance.post("/user/verifyloginotp", {
        userid: otpPending.userid,
        otp,
      });
      login(res.data.result);
      return { success: true };
    } catch (error) {
      const message = error?.response?.data?.message || "Verification failed";
      return { success: false, message };
    }
  };

  const cancelOtp = async () => {
    setOtpPending(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;
      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      };
      const response = await axiosInstance.post("/user/login", payload);
      await handleLoginResponse(response);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        try {
          const payload = {
            email: firebaseuser.email,
            name: firebaseuser.displayName,
            image: firebaseuser.photoURL || "https://github.com/shadcn.png",
          };
          const response = await axiosInstance.post("/user/login", payload);
          await handleLoginResponse(response);
        } catch (error) {
          console.error(error);
          logout();
        }
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        handlegooglesignin,
        otpPending,
        verifyOtp,
        cancelOtp,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);