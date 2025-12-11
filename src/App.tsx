import { useState, useEffect } from "react";
import OfficeGame from "./components/OfficeGame";
import LoginScreen from "./components/LoginScreen";
import { auth } from "./firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useGameSync } from "./hooks/useGameSync";
import type { NPCStatusType } from "./game/constants";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  // Game Sync Hook
  const { players, joinGame, updatePosition } = useGameSync(user?.uid ?? null);

  // Check for existing session on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // User is logged in, check if we have saved profile
        const savedProfile = localStorage.getItem("userProfile");
        const lastActive = localStorage.getItem("lastActive");

        if (savedProfile && lastActive) {
          const timeSinceLastActive = Date.now() - parseInt(lastActive);
          const ONE_MINUTE = 60 * 1000;

          // If less than 1 minute since last active, auto-rejoin
          if (timeSinceLastActive < ONE_MINUTE) {
            const profile = JSON.parse(savedProfile);

            // Wait a bit to ensure joinGame is ready
            setTimeout(() => {
              joinGame({
                id: currentUser.uid,
                name: profile.name,
                gender: profile.gender,
                status: profile.status,
                x: 500,
                y: 500,
              })
                .then(() => {
                  setHasJoined(true);
                })
                .catch((e) => {
                  console.error("Auto-rejoin failed:", e);
                  localStorage.removeItem("userProfile");
                });
            }, 100);
          } else {
            // More than 1 minute, clear session
            localStorage.removeItem("userProfile");
            localStorage.removeItem("lastActive");
          }
        }
      } else {
        // User logged out, reset state
        setHasJoined(false);
        localStorage.removeItem("userProfile");
        localStorage.removeItem("lastActive");
      }
    });

    return unsubscribe;
  }, [joinGame]);

  // Update lastActive timestamp periodically
  useEffect(() => {
    if (user && hasJoined) {
      // Update lastActive every 10 seconds
      const interval = setInterval(() => {
        localStorage.setItem("lastActive", Date.now().toString());
      }, 10000);

      // Update on page visibility change
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          localStorage.setItem("lastActive", Date.now().toString());
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [user, hasJoined]);

  const handleJoin = (
    u: User,
    name: string,
    gender: "male" | "female",
    status: NPCStatusType
  ) => {
    if (!user) {
      console.error("App: User state not ready but Join triggered");
      return;
    }

    // Save profile to localStorage
    const profile = { name, gender, status };
    localStorage.setItem("userProfile", JSON.stringify(profile));
    localStorage.setItem("lastActive", Date.now().toString());

    joinGame({
      id: u.uid,
      name,
      gender,
      status,
      x: 500,
      y: 500,
    })
      .then(() => {
        setHasJoined(true);
      })
      .catch((e) => {
        console.error("Join Game Failed:", e);
        // Clear profile on failure
        localStorage.removeItem("userProfile");
      });
  };

  if (authLoading) {
    return (
      <div
        style={{
          background: "black",
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        Loading...
      </div>
    );
  }

  // If not authenticated OR not joined yet, show login/setup
  if (!user || !hasJoined) {
    return (
      <div style={{ width: "100%", minHeight: "100vh" }}>
        <LoginScreen
          onJoin={handleJoin}
          existingNames={Object.values(players).map((p) => p.name)}
        />
      </div>
    );
  }

  // Wait for players data to be loaded before showing game
  const hasPlayersData = Object.keys(players).length > 0;

  if (!hasPlayersData) {
    return (
      <div
        style={{
          background: "black",
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        Loading game data...
      </div>
    );
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      <OfficeGame
        currentUser={user}
        players={players}
        onMove={updatePosition}
      />
    </div>
  );
}

export default App;
