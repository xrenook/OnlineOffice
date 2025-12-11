import React, { useState } from "react";
import { signInWithPopup, type User } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import {
  NPC_STATUS,
  STATUS_COLORS,
  type NPCStatusType,
} from "../game/constants";
import "./LoginScreen.css";

interface LoginScreenProps {
  onJoin: (
    user: User,
    name: string,
    gender: "male" | "female",
    status: NPCStatusType
  ) => void;
  existingNames: string[];
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onJoin, existingNames }) => {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [status, setStatus] = useState<NPCStatusType>(NPC_STATUS.AVAILABLE);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);

      // Default name from Google
      if (result.user.displayName) {
        // Take first name, max 8 chars
        let defaultName = result.user.displayName.split(" ")[0];
        defaultName = defaultName.substring(0, 8);
        setName(defaultName);
      }
    } catch (err: any) {
      console.error(err);
      // Show full error message to help debug
      setError("Failed to sign in: " + (err.message || "Unknown error"));
    }
  };

  const handleJoin = () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (name.length > 8) {
      setError("Name max 8 characters.");
      return;
    }
    if (existingNames.includes(name)) {
      // Simple client-side check if we have the list
      setError("Name already taken. Please choose another.");
      return;
    }

    if (existingNames.length >= 15) {
      setError("The office is full (Max 15 users).");
      return;
    }

    if (user) {
      onJoin(user, name, gender, status);
    }
  };

  if (!user) {
    return (
      <div className="login-overlay">
        <div className="login-card">
          <h1 className="login-title">Pixel Office</h1>
          <p className="login-subtitle">Sign in to join the workspace</p>
          <button className="btn-google" onClick={handleGoogleLogin}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              width="20"
              height="20"
              alt="G"
            />
            Sign in with Google
          </button>
          {error && (
            <p style={{ color: "#ef4444", marginTop: "1rem" }}>{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        <h1 className="login-title">Setup Profile</h1>
        <p className="login-subtitle">Customize your in-game avatar</p>

        <div className="form-group">
          <label className="form-label">Display Name (Max 8)</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={8}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Avatar Style</label>
          <div className="gender-select">
            <div
              className={`gender-option ${gender === "male" ? "selected" : ""}`}
              onClick={() => setGender("male")}
            >
              🧔‍♂️ Male
            </div>
            <div
              className={`gender-option ${
                gender === "female" ? "selected" : ""
              }`}
              onClick={() => setGender("female")}
            >
              👩‍🦰 Female
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Current Status</label>
          <div className="status-grid">
            {(Object.values(NPC_STATUS) as NPCStatusType[]).map((s) => (
              <div
                key={s}
                className={`status-item ${status === s ? "selected" : ""}`}
                style={{
                  color: STATUS_COLORS[s],
                  borderColor: status === s ? STATUS_COLORS[s] : "transparent",
                }}
                onClick={() => setStatus(s)}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</p>
        )}

        <button className="btn-primary" onClick={handleJoin}>
          Enter Office
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
