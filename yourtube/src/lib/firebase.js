// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3AeuhgXJwOJbbCvpDmtZihBGq6QkP04o",
  authDomain: "your-tube-harsh.firebaseapp.com",
  projectId: "your-tube-harsh",
  storageBucket: "your-tube-harsh.firebasestorage.app",
  messagingSenderId: "183887531020",
  appId: "1:183887531020:web:2696fabc1386772b2f7229",
  measurementId: "G-L7Y870ZJ7L",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };