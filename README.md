# Pixel Office Simulation

A virtual isometric office simulation built with React, PixiJS, and TypeScript. This project creates a lively, interactive digital workspace populated by autonomous Q-style pixel art characters.

## 🔮 Future Ideas

- **Socket.io Integration**: Multiplayer support to see where other real users are sitting.
- **Day/Night Cycle**: Dimming the map and changing lighting based on local time.

## Next Step

- Require user signin with Google account, and get user's name from Google account, get himself NPC's name and situation when login. NPC name can not be duplicated, maximum 8 Charaters. Use Firebase.
- There will be always 15 NPCs in the office, and user login will replace one of the NPCs based on selection male or female, real user NPC name will have a color based on the situation Available, Busy or Away, and no dot following by the name.
- One NPC will be assigned to the user, and the user can drag and drop himself NPC, once drop a NPC, he will idle there for at least 30s.
- If user close the window, his NPC will be removed from the game.
- In the whole office, maximum 15 users can be logged in at the same time.

## 🌟 Core Concepts & Features

### 1. Immersive Isometric Environment

- **High-Fidelity Map**: Uses a detailed 1024x1024 isometric office layout (`map_large.png`) featuring wooden floors, desks, and office equipment.
- **Interactive Navigation**: The map retains its full resolution, allowing users to scroll around the office using native browser scrolling on smaller screens.
- **Depth Sorting**: Real-time z-indexing ensures characters properly walk behind or in front of objects and each other based on their Y-position.

### 2. Intelligent NPC System (The "Staff")

- **Diverse Workforce**:
  - Supports multiple character variants (Male 1-4, Female 1-4).
  - Randomized gender and appearance assignment upon spawn.
- **Smart Pathfinding (The "Red Carpet" Logic)**:
  - NPCs constrained to logical walking zones (aisles and connectors).
  - Defined via `MapLogic.ts` as vertical and horizontal coordinate zones to prevent walking through desks.
- **Behavioral Loop**:
  - **Idle**: Characters pause for random durations (approx 5-8 minutes) to simulate working or chatting.
  - **Walk**: Characters pick a random valid target on the "red carpet" and move towards it.
  - **Animation**: Subtle bounce effect while walking to mimic footsteps.
- **Identity**: Each NPC has a floating name tag with a randomly assigned name (e.g., "Alice", "Bob").

### 3. Modern UI Overlay

- **HUD Design**: sleek, glassmorphism-style interface overlaying the game canvas.
- **Live Stats**:
  - **Active Staff Count**: Real-time tracking of NPCs in the scene.
  - **Real-Time Clock**: Displays the user's local time, making the office feel synchronized with reality.
  - **Weather Widget**: Adds atmosphere with current weather status (e.g., "Sunny 24°C").

### 4. Technical Architecture (PRD Ready)

The codebase is structured for scalability and maintainability:

- **`src/game/`**: Dedicated module for game logic.
  - `constants.ts`: Centralized configuration for map size, asset paths, and NPC behaviors.
  - `NPC.ts`: Factory and class logic for character sprites, movement, and rendering.
  - `MapLogic.ts`: Geometric definitions for walkable areas.
- **`OfficeGame.tsx`**: Clean React component acting as the view layer and bridge to the PixiJS Application.

## 🚀 Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Rendering**: PixiJS (v8)
- **UI/Animations**: Framer Motion, Lucide React (Icons)
- **Styling**: Vanilla CSS (with modern variables and backdrop-filters)

## 🛠 Project Structure

```
src/
├── assets/          # Static images
├── components/
│   ├── OfficeGame.tsx   # Main Game Component
│   └── OfficeGame.css   # Game-specific styles
├── game/
│   ├── constants.ts     # Config (Assets, Speeds, Dimensions)
│   ├── MapLogic.ts      # Pathfinding zones
│   └── NPC.ts           # Character logic & Factory
├── App.tsx          # Root Component
└── main.tsx         # Entry Point
```
