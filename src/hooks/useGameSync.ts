import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, update, onDisconnect } from 'firebase/database';
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

export const useGameSync = (userId: string | null) => {
  const [players, setPlayers] = useState<Record<string, Player>>({});

  useEffect(() => {
    // Don't set up listener if user is not authenticated
    if (!userId) {
      return;
    }
    
    const playersRef = ref(db, 'players');
    
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      setPlayers(data || {});
    }, (error) => {
      console.error("Firebase read error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

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
      onDisconnect(userRef).remove();
    } catch (error) {
      console.error("Firebase write failed:", error);
      throw error;
    }
  };

  const updatePosition = (x: number, y: number, isIdle = false) => {
    if (!userId) return;
    const updates: Partial<Player> = {
        x,
        y,
        lastActive: Date.now(),
        isIdle,
        idleUntil: isIdle ? Date.now() + 30000 : 0
    };
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
