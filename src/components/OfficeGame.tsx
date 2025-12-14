import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { motion } from "framer-motion";
import { Users, Clock } from "lucide-react";
import "./OfficeGame.css";
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  ASSETS,
  NPC_NAMES,
  CONVERSATIONS,
} from "../game/constants";
import { createNPC, type NPCContainer, type NPCTextures } from "../game/NPC";
import { getRandomPointOnRedCarpet } from "../game/MapLogic";
import type { User } from "firebase/auth";
import type { Player } from "../hooks/useGameSync";

interface OfficeGameProps {
  currentUser: User;
  players: Record<string, Player>;
  onMove: (x: number, y: number, isIdle?: boolean) => void;
}

const TOTAL_NPCS = 15;

const OfficeGame: React.FC<OfficeGameProps> = ({
  currentUser,
  players,
  onMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const previousPlayerCountRef = useRef(0);

  // References to keep inside Pixi loop
  const appRef = useRef<PIXI.Application | null>(null);
  const npcMapRef = useRef<Map<string, NPCContainer>>(new Map()); // Key: 'player-uid' or 'bot-idx'
  const botNamesRef = useRef<string[]>([]); // Keep consistent names for bots
  const myNPCRef = useRef<NPCContainer | null>(null); // Reference to current user's NPC
  const playersRef = useRef(players); // Store latest players data for ticker

  // Update playersRef when players prop changes
  useEffect(() => {
    playersRef.current = players;

    // Force NPC creation/update when players data changes
  }, [players]);

  // Detect new players joining or leaving
  useEffect(() => {
    const currentPlayerCount = Object.keys(players).length;
    const previousCount = previousPlayerCountRef.current;

    // Only notify if we had players before (avoid initial load spam) or if it's a genuine update
    // Actually, checking previousCount is defined is safer, but 0 is a valid previous count if everyone left.
    // Let's assume on mount previousPlayerCountRef is 0.
    // If we go 0 -> 1 (me), we don't need toast.
    // If we go 1 -> 2, someone else joined.

    if (currentPlayerCount !== previousCount && previousCount !== 0) {
      if (currentPlayerCount > previousCount) {
        setToastMessage(`New user joined!`);
        setShowToast(true);
      } else if (currentPlayerCount < previousCount) {
        setToastMessage(`A user left the office.`);
        setShowToast(true);
      }

      // Auto-hide toast after 4 seconds
      setTimeout(() => setShowToast(false), 4000);
    }

    previousPlayerCountRef.current = currentPlayerCount;
  }, [players]);

  // Create static bot names once
  useEffect(() => {
    // Shuffle names for random bot names
    botNamesRef.current = [...NPC_NAMES].sort(() => Math.random() - 0.5);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let app: PIXI.Application | null = null;
    let world: PIXI.Container | null = null;
    let isInitializing = true;
    let shouldDestroy = false;
    let npcTextures: NPCTextures | null = null;

    // We store the drag state here
    const dragState = {
      isDragging: false,
      dragTarget: null as NPCContainer | null,
    };

    const initGame = async () => {
      try {
        const _app = new PIXI.Application();
        app = _app;
        appRef.current = _app;

        await _app.init({
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
          backgroundColor: 0x222222,
          antialias: true,
          autoStart: false,
          resolution: window.devicePixelRatio || 1,
        });

        isInitializing = false;
        if (shouldDestroy) {
          _app.destroy(true, { children: true, texture: true });
          return;
        }

        if (containerRef.current && _app.canvas) {
          containerRef.current.appendChild(_app.canvas);
        }

        world = new PIXI.Container();
        world.sortableChildren = true;
        _app.stage.addChild(world);

        // Interactive background to catch drag end?
        world.eventMode = "static";
        world.hitArea = new PIXI.Rectangle(0, 0, MAP_WIDTH, MAP_HEIGHT);

        world.on("pointerup", (e) => {
          if (dragState.isDragging && dragState.dragTarget) {
            dragState.isDragging = false;
            const pos = e.getLocalPosition(world!);

            // Force NPC to stay idle for 30 seconds
            dragState.dragTarget.forceIdle(1800); // 30 seconds at 60fps = 1800 frames

            // Sync to Firebase
            onMove(pos.x, pos.y, true);
            dragState.dragTarget = null;
          }
        });

        world.on("pointerupoutside", () => {
          if (dragState.isDragging && dragState.dragTarget) {
            dragState.isDragging = false;
            // Sync final position? Or revert?
            // Reverting is safer if outside
            dragState.dragTarget = null;
          }
        });

        world.on("pointermove", (e) => {
          if (dragState.isDragging && dragState.dragTarget) {
            const pos = e.getLocalPosition(world!);
            dragState.dragTarget.x = pos.x;
            dragState.dragTarget.y = pos.y;
            dragState.dragTarget.zIndex = pos.y;
          }
        });

        // Load Map
        const mapTexture = await PIXI.Assets.load(ASSETS.MAP);
        const mapSprite = new PIXI.Sprite(mapTexture);
        mapSprite.width = MAP_WIDTH;
        mapSprite.height = MAP_HEIGHT;
        world!.addChild(mapSprite);

        // Load NPC textures
        const maleTextures = await Promise.all(
          ASSETS.MALES.map((path) => PIXI.Assets.load(path))
        );
        const femaleTextures = await Promise.all(
          ASSETS.FEMALES.map((path) => PIXI.Assets.load(path))
        );

        npcTextures = { males: maleTextures, females: femaleTextures };

        // Chat Bubble Manager
        const bubbleManager = {
          activeBubbles: 0,
          lastBubbleCheck: 0,
        };

        console.log("Starting Ticker...");
        _app.ticker.add((ticker) => {
          if (!world || !npcTextures) return;

          // Chat Bubble Logic (every 5 seconds, increased from 2)
          bubbleManager.lastBubbleCheck += ticker.deltaTime;
          if (bubbleManager.lastBubbleCheck > 300) {
            // ~5 seconds at 60fps
            bubbleManager.lastBubbleCheck = 0;

            if (bubbleManager.activeBubbles < 2) {
              // Get all NPCs (both players and bots)
              const allNPCs = Array.from(npcMapRef.current.values());
              const now = Date.now();
              const CHAT_COOLDOWN = 30000; // 30 seconds cooldown per NPC

              const candidates = allNPCs.filter(
                (n) =>
                  n.status === "Available" &&
                  n.mode === "idle" &&
                  now - n.lastChatTime > CHAT_COOLDOWN // Check cooldown
              );

              if (candidates.length >= 2) {
                // Try to find a close pair
                for (let i = 0; i < candidates.length; i++) {
                  const npc1 = candidates[i];
                  for (let j = i + 1; j < candidates.length; j++) {
                    const npc2 = candidates[j];

                    const dx = npc1.x - npc2.x;
                    const dy = npc1.y - npc2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                      // Found a pair! Start conversation
                      bubbleManager.activeBubbles++;

                      // Update last chat time for both NPCs
                      npc1.lastChatTime = now;
                      npc2.lastChatTime = now;

                      const conversation =
                        CONVERSATIONS[
                          Math.floor(Math.random() * CONVERSATIONS.length)
                        ];

                      // Lock them in place
                      if (npc1.setChatting) npc1.setChatting(true);
                      if (npc2.setChatting) npc2.setChatting(true);

                      // Face each other
                      if (npc1.sprite && npc2.sprite) {
                        npc1.sprite.scale.x =
                          npc1.x < npc2.x
                            ? Math.abs(npc1.sprite.scale.x)
                            : -Math.abs(npc1.sprite.scale.x);
                        npc2.sprite.scale.x =
                          npc2.x < npc1.x
                            ? Math.abs(npc2.sprite.scale.x)
                            : -Math.abs(npc2.sprite.scale.x);
                      }

                      let turn = 0;
                      const speakers = [npc1, npc2];

                      const playTurn = () => {
                        if (turn >= conversation.length) {
                          bubbleManager.activeBubbles--;
                          if (npc1.setChatting) npc1.setChatting(false);
                          if (npc2.setChatting) npc2.setChatting(false);
                          return;
                        }

                        const text = conversation[turn];
                        const speaker = speakers[turn % 2];
                        turn++;

                        speaker.showBubble(text, () => {
                          setTimeout(playTurn, 500);
                        });
                      };

                      playTurn();
                      break; // Only one conversation per check
                    }
                  }
                  if (bubbleManager.activeBubbles > 0) break;
                }
              }
            }
          }

          // RECONCILIATION LOOP
          // 1. Players
          const currentPlayers = playersRef.current;
          const playerIds = Object.keys(currentPlayers);
          const currentPlayersCount = playerIds.length;

          playerIds.forEach((uid) => {
            const key = `player-${uid}`;
            const pData = currentPlayers[uid];
            let npc = npcMapRef.current.get(key);

            if (!npc) {
              // Create Player NPC
              const start = { x: pData.x, y: pData.y };
              npc = createNPC(
                getRandomPointOnRedCarpet,
                start,
                npcTextures!,
                pData.name,
                {
                  isUser: true,
                  gender: pData.gender,
                  initialStatus: pData.status,
                }
              );
              npc.zIndex = npc.y;
              world!.addChild(npc);
              npcMapRef.current.set(key, npc);

              // Enable interaction if it's ME
              if (uid === currentUser.uid) {
                // Store reference to my NPC
                myNPCRef.current = npc;

                npc.eventMode = "static";
                npc.cursor = "pointer";
                npc.on("pointerdown", () => {
                  dragState.isDragging = true;
                  dragState.dragTarget = npc!;
                });
              }
            }

            // Update logic
            if (uid === currentUser.uid) {
              // My Player - Auto-walk like bots
              if (dragState.isDragging && dragState.dragTarget === npc) {
                // Being dragged by mouse, position controlled by drag handler
              } else {
                // Auto-walk behavior (same as bots)
                npc.updateNPC(ticker.deltaTime);

                // Sync position to Firebase every ~60 frames (about once per second)
                if (ticker.lastTime % 60 < 1) {
                  onMove(npc.x, npc.y, npc.mode === "idle");
                }
              }

              // Always update status (check both local and DB)
              if (npc.status !== pData.status) {
                npc.updateStatus(pData.status);
              }
            } else {
              // Remote Player - Auto-walk like bots (don't sync position)
              npc.updateNPC(ticker.deltaTime);

              // Update Status
              if (npc.status !== pData.status) {
                npc.updateStatus(pData.status);
              }
            }

            npc.zIndex = npc.y;
          });

          // 2. Bots
          const botsNeeded = Math.max(0, TOTAL_NPCS - currentPlayersCount);
          for (let i = 0; i < TOTAL_NPCS; i++) {
            const key = `bot-${i}`;
            let npc = npcMapRef.current.get(key);

            if (i < botsNeeded) {
              // Should exist
              if (!npc) {
                const start = getRandomPointOnRedCarpet();
                // Name logic: Ensure distinct from current players?
                // We just pick from shuffled list
                const name = botNamesRef.current[i] || "Bot";

                npc = createNPC(
                  getRandomPointOnRedCarpet,
                  start,
                  npcTextures!,
                  name,
                  { isUser: false }
                );
                npc.zIndex = npc.y;
                world!.addChild(npc);
                npcMapRef.current.set(key, npc);
              }
              // Update Bot
              npc.updateNPC(ticker.deltaTime);
            } else {
              // Should NOT exist
              if (npc) {
                world!.removeChild(npc);
                npc.destroy();
                npcMapRef.current.delete(key);
              }
            }
          }

          // Remove players that left
          npcMapRef.current.forEach((val, key) => {
            if (key.startsWith("player-")) {
              const uid = key.replace("player-", "");
              // FIX: Use playersRef.current to get latest data, not stale 'players' closure
              if (!playersRef.current[uid]) {
                world!.removeChild(val);
                val.destroy();
                npcMapRef.current.delete(key);
              }
            }
          });

          world!.sortChildren();
        });

        _app.start();
      } catch (e: any) {
        console.error("Critical Pixi Error:", e);
        if (!shouldDestroy) setError(e.message || "Unknown Pixi init error");
        isInitializing = false;
      }
    };

    initGame();

    return () => {
      shouldDestroy = true;
      if (app && !isInitializing) {
        app.destroy(true, { children: true, texture: true });
      }
    };
  }, []); // Re-run if mount changed? No, empty deps. We rely on Refs for data.

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 bg-black">
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Game Container */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* UI Overlay */}
      <div className="game-overlay">
        {/* Toast Notification */}
        {showToast && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="toast-notification"
          >
            <div className="toast-content">
              <Users size={18} />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="header"
        >
          <div className="glass-card title-card">
            <div>
              <h1>Online Office</h1>
              <div className="current-user-info">
                <span className="user-label">Logged in as:</span>
                <span
                  className="user-name"
                  style={{
                    color:
                      players[currentUser.uid]?.status === "Available"
                        ? "#22c55e"
                        : players[currentUser.uid]?.status === "Busy"
                        ? "#ef4444"
                        : "#eab308",
                  }}
                >
                  {players[currentUser.uid]?.name || "Loading..."}
                </span>
                <span className="user-status">
                  ({players[currentUser.uid]?.status || "Available"})
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card stats-card">
            <div className="icon-box">
              <Users size={20} />
            </div>
            <div>
              <div className="stat-label">Active Staff</div>
              <div className="stat-value">
                {Object.keys(players).length} / {TOTAL_NPCS}
              </div>
            </div>
          </div>

          {/* Online Users List */}
          <div className="glass-card online-users-card">
            <div className="online-users-header">
              <Users size={16} />
              <span>Online Users</span>
            </div>
            <div className="online-users-list">
              {Object.values(players).map((player) => (
                <div key={player.id} className="online-user-item">
                  <div
                    className="status-dot"
                    style={{
                      backgroundColor:
                        player.status === "Available"
                          ? "#22c55e"
                          : player.status === "Busy"
                          ? "#ef4444"
                          : "#eab308",
                    }}
                  />
                  <span className="online-user-name">{player.name}</span>
                  {player.id === currentUser.uid && (
                    <span className="you-badge">(You)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer Stats / Controls */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="footer"
        >
          <div className="glass-card footer-bar">
            <div className="footer-item">
              <Clock size={16} className="text-purple" />
              <span className="footer-text">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OfficeGame;
