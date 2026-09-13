import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase.init.js";

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    throw error;
  }
};
