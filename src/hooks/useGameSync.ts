import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, update } from 'firebase/database';
import type { NPCStatusType } from '../game/constants';

export interface Player {
  id: string;
  name: string;
  gender: 'male' | 'female';
  status: NPCStatusType;
  x: number;
  y: number;
  lastActive: number;
  isIdle: boolean;
  idleUntil: number; // timestamp
}

const TWO_MINUTES = 2 * 60 * 1000;

export const useGameSync = (userId: string | null) => {
  const [remotePlayers, setRemotePlayers] = useState<Record<string, Player>>({});
  const [localPlayer, setLocalPlayer] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    // Don't set up listener if user is not authenticated
    if (!userId) {
      setRemotePlayers({});
      return;
    }
    
    const playersRef = ref(db, 'players');
    
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      setRemotePlayers(data || {});
    }, (error) => {
      console.error("Firebase read error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Heartbeat to keep user alive in Firebase while window is open
  useEffect(() => {
    if (!userId) return;

    const userRef = ref(db, `players/${userId}`);
    // Update immediately to ensure freshness
    update(userRef, { lastActive: Date.now() });

    const interval = setInterval(() => {
      update(userRef, { lastActive: Date.now() });
    }, 30000); // 30 seconds heartbeat

    return () => clearInterval(interval);
  }, [userId]);

  // Derive final players list: Filter stale & Merge local position
  const players = { ...remotePlayers };
  const now = Date.now();

  // Filter out stale players (> 2 mins inactivity)
  Object.keys(players).forEach(key => {
    if (now - players[key].lastActive > TWO_MINUTES) {
      delete players[key];
    }
  });

  // Override local player's position if we have local updates
  if (userId && players[userId] && localPlayer) {
    players[userId] = {
      ...players[userId],
      x: localPlayer.x,
      y: localPlayer.y
    };
  }

  const joinGame = async (playerData: Omit<Player, 'lastActive' | 'isIdle' | 'idleUntil'>) => {
    if (!userId) {
      console.error("joinGame: No userId provided");
      return;
    }
    
    const userRef = ref(db, `players/${userId}`);
    const fullData: Player = {
        ...playerData,
        lastActive: Date.now(),
        isIdle: false,
        idleUntil: 0
    };
    
    try {
      await set(userRef, fullData);
      await set(userRef, fullData);
      setLocalPlayer({ x: playerData.x, y: playerData.y });
      // onDisconnect(userRef).remove(); // Removed as per requirement for delayed deletion (handled by client filtering)
    } catch (error) {
      console.error("Firebase write failed:", error);
      throw error;
    }
  };

  const updatePosition = (x: number, y: number, isIdle = false) => {
    if (!userId) return;
    const updates: Partial<Player> = {
        // x, // Don't sync x to firebase
        // y, // Don't sync y to firebase
        lastActive: Date.now(),
        isIdle,
        idleUntil: isIdle ? Date.now() + 30000 : 0
    };
    // Update local state for immediate feedback
    setLocalPlayer({ x, y });
    
    update(ref(db, `players/${userId}`), updates);
  };
  
  const updateStatus = (status: NPCStatusType) => {
      if (!userId) return;
      update(ref(db, `players/${userId}`), { status });
  };

  return {
    players,
    joinGame,
    updatePosition,
    updateStatus
  };
};
