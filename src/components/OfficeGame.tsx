import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { motion } from "framer-motion";
import { Users, Clock, Sun } from "lucide-react";
import "./OfficeGame.css";
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  ASSETS,
  CONVERSATIONS,
  NPC_NAMES,
} from "../game/constants";
import { createNPC, type NPCContainer } from "../game/NPC";
import { getRandomPointOnRedCarpet } from "../game/MapLogic";

const OfficeGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [npcCount] = useState(12);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  // Chat Bubble Manager
  const activeBubblesRef = useRef(0);
  const npcsRef = useRef<NPCContainer[]>([]);

  useEffect(() => {
    // Attempt to spawn a bubble every 2 seconds
    // Attempt to spawn a bubble every 2 seconds
    const bubbleInterval = setInterval(() => {
      // Find candidate NPCs
      // Criteria: Available + Idle + Close to another Available+Idle NPC
      if (activeBubblesRef.current < 2 && npcsRef.current.length > 0) {
        const npcs = npcsRef.current;
        // Check if currently not chatting (mode checked is 'idle', but we also check our custom flag if we could access it,
        // but since we don't expose isChatting state easily on the container type without casting, we rely on them staying idle)
        const candidates = npcs.filter(
          (n) => n.status === "Available" && n.mode === "idle"
        );

        if (candidates.length < 2) return;

        // Try to find a close pair
        for (let i = 0; i < candidates.length; i++) {
          const npc1 = candidates[i];
          for (let j = i + 1; j < candidates.length; j++) {
            const npc2 = candidates[j];

            const dx = npc1.x - npc2.x;
            const dy = npc1.y - npc2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // If close (~1.5 tiles), start chat
            if (dist < 150) {
              // Found a pair! Start conversation.
              activeBubblesRef.current++; // Mark conversation active (counts as 1 "bubble stream")

              // Pick a random conversation
              const conversation =
                CONVERSATIONS[Math.floor(Math.random() * CONVERSATIONS.length)];

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
                  // End conversation
                  activeBubblesRef.current--;
                  if (npc1.setChatting) npc1.setChatting(false);
                  if (npc2.setChatting) npc2.setChatting(false);
                  return;
                }

                const text = conversation[turn];
                const speaker = speakers[turn % 2];
                turn++;

                speaker.showBubble(text, () => {
                  // Small delay between bubbles
                  setTimeout(playTurn, 500);
                });
              };

              playTurn();

              // Stop looking after 1 conversation starts per tick
              return;
            }
          }
        }
      }
    }, 1000); // Check every 1s

    return () => clearInterval(bubbleInterval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let app: PIXI.Application | null = null;
    let isInitializing = true;
    let shouldDestroy = false;

    const initGame = async () => {
      try {
        console.log("Initializing Pixi App...");
        const _app = new PIXI.Application();
        app = _app;

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

        const world = new PIXI.Container();
        world.sortableChildren = true;
        _app.stage.addChild(world);

        console.log("Loading Map Asset...");
        const texture = await PIXI.Assets.load(ASSETS.MAP);

        if (shouldDestroy) {
          _app.destroy(true, { children: true, texture: true });
          return;
        }

        const mapSprite = new PIXI.Sprite(texture);
        mapSprite.width = MAP_WIDTH;
        mapSprite.height = MAP_HEIGHT;
        mapSprite.zIndex = -99999;
        world.addChild(mapSprite);

        // Pre-process NPC textures
        console.log("Processing NPC textures...");

        // Load all variants
        const maleTextures = await Promise.all(
          ASSETS.MALES.map((path) => PIXI.Assets.load(path))
        );
        const femaleTextures = await Promise.all(
          ASSETS.FEMALES.map((path) => PIXI.Assets.load(path))
        );

        const npcTextures = { males: maleTextures, females: femaleTextures };

        // Create NPCs
        const npcs: NPCContainer[] = [];

        // Shuffle names to ensure uniqueness
        const shuffledNames = [...NPC_NAMES].sort(() => Math.random() - 0.5);

        for (let i = 0; i < npcCount; i++) {
          const startPos = getRandomPointOnRedCarpet();
          // Use modulo just in case counts exceed names, but aim for unique
          const name = shuffledNames[i % shuffledNames.length];

          const npc = createNPC(
            getRandomPointOnRedCarpet,
            startPos,
            npcTextures,
            name
          );
          world.addChild(npc);
          npcs.push(npc);
        }

        // Share with manager
        npcsRef.current = npcs;

        console.log("Starting Ticker...");
        _app.ticker.add((ticker) => {
          const delta = ticker.deltaTime;
          npcs.forEach((npc) => npc.updateNPC(delta));
          world.sortChildren();
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
  }, [npcCount]);

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
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="header"
        >
          <div className="glass-card title-card">
            <h1>Online Office</h1>
          </div>

          <div className="glass-card stats-card">
            <div className="icon-box">
              <Users size={20} />
            </div>
            <div>
              <div className="stat-label">Active Staff</div>
              <div className="stat-value">{npcCount}</div>
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
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#e5e7eb",
                }}
              >
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="divider" />
            <div className="footer-item">
              <Sun size={16} className="text-orange" />
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#e5e7eb",
                }}
              >
                Sunny 24°C
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OfficeGame;
