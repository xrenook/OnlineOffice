import * as PIXI from 'pixi.js';
import { NPC_CONFIG, NPC_STATUS, STATUS_COLORS, type NPCStatusType } from './constants';

export interface NPCTextures {
  males: PIXI.Texture[];
  females: PIXI.Texture[];
}

export interface NPCContainer extends PIXI.Container {
  updateNPC: (delta: number) => void;
  showBubble: (text: string, onComplete: () => void) => void;
  setChatting: (isChatting: boolean) => void;
  updateStatus: (status: NPCStatusType) => void;
  forceIdle: (duration: number) => void;
  sprite?: PIXI.Sprite;
  status: NPCStatusType;
  mode: 'idle' | 'walking';
  lastChatTime: number; // Timestamp of last chat
}

export interface NPCOptions {
    isUser?: boolean;
    gender?: 'male' | 'female';
    initialStatus?: NPCStatusType;
}

export const createNPC = (
  getValidTarget: () => { x: number; y: number },
  startPos: { x: number; y: number },
  textures: NPCTextures,
  name: string,
  options: NPCOptions = {}
): NPCContainer => {
  const container = new PIXI.Container() as NPCContainer;
  const isUser = !!options.isUser;
  const gender = options.gender || (Math.random() > 0.5 ? 'male' : 'female');
  const isMale = gender === 'male';

  // Status Logic
  const statuses = Object.values(NPC_STATUS);
  // Default to random if not specified
  let currentStatus: NPCStatusType = options.initialStatus || statuses[Math.floor(Math.random() * statuses.length)];
  container.status = currentStatus;

  // Internal state
  const state = {
    targetX: 0,
    targetY: 0,
    speed: 0,
    mode: 'idle' as 'idle' | 'walking',
    idleTime: 0,
    walkTime: 0,
    bubbleTime: 0,
    isChatting: false,
    lastChatTime: 0, // Track last chat time
  };
  container.mode = state.mode;
  container.lastChatTime = 0;

  // Shadow
  const shadow = new PIXI.Graphics();
  shadow.ellipse(0, 0, 20, 10).fill({ color: 0x000000, alpha: 0.2 });
  shadow.y = 45; 
  container.addChild(shadow);

  // Character Sprite
  const textureOpts = isMale ? textures.males : textures.females;
  const pickedTexture = textureOpts[Math.floor(Math.random() * textureOpts.length)];
  const sprite = new PIXI.Sprite(pickedTexture);
  sprite.anchor.set(0.5, 0.5); 
  
  sprite.width = NPC_CONFIG.SIZE;
  sprite.height = NPC_CONFIG.SIZE;
  
  container.addChild(sprite);
  container.sprite = sprite;

  // Name Label
  // Name is passed in as argument
  // const randomName = names[Math.floor(Math.random() * names.length)];
  
  const nameStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 12,
    fill: '#ffffff',
    stroke: { color: '#000000', width: 2 },
    align: 'center',
  });
  
  // Format: Name only
  const nameText = new PIXI.Text({ text: name, style: nameStyle });
  nameText.anchor.set(0.5, 1);
  nameText.y = -50; 
  container.addChild(nameText);

  // Status Dot (Only for non-users)
  const statusDot = new PIXI.Graphics();
  if (!isUser) {
    statusDot.circle(0, 0, 4);
    // Add a white stroke to make the dot pop
    statusDot.stroke({ width: 1, color: 0xFFFFFF });
    
    // Position to the right of the name
    statusDot.x = nameText.width / 2 + 8; 
    statusDot.y = -58; // Align with text center approx
    container.addChild(statusDot);
  }

  // Update Visuals based on status
  const updateVisuals = (status: NPCStatusType) => {
      const color = STATUS_COLORS[status];
      
      if (isUser) {
          // User: Name text color changes
          nameText.style.fill = color;
      } else {
          // Bot: Dot color changes
          statusDot.clear();
          statusDot.circle(0, 0, 4);
          statusDot.fill({ color: color });
          statusDot.stroke({ width: 1, color: 0xFFFFFF });
      }
  };

  // Initial update
  updateVisuals(currentStatus);

  // Add updateStatus method
  container.updateStatus = (newStatus: NPCStatusType) => {
      container.status = newStatus;
      updateVisuals(newStatus);
  };

  // Chat Bubble Container
  const bubbleContainer = new PIXI.Container();
  bubbleContainer.y = -80;
  container.addChild(bubbleContainer);

  // Initial Position
  container.x = startPos.x;
  container.y = startPos.y;

  // Logic methods
  const pickNewTarget = () => {
    const target = getValidTarget();
    state.targetX = target.x;
    state.targetY = target.y;
    state.speed = NPC_CONFIG.WALK_SPEED_MIN + Math.random() * NPC_CONFIG.WALK_SPEED_VAR;
    state.mode = 'walking';
  };

  pickNewTarget();

  // Show Bubble Method
  container.showBubble = (text: string, onComplete: () => void) => {
      // Clear existing
      bubbleContainer.removeChildren();
      
      const bubble = new PIXI.Graphics();
      const padding = 10;
      const textStyle = new PIXI.TextStyle({
          fontFamily: 'Arial',
          fontSize: 14,
          fill: '#000000',
          breakWords: true, // v8 property? or wordWrap
          wordWrap: true,
          wordWrapWidth: 150,
      });
      
      const message = new PIXI.Text({ text, style: textStyle });
      message.x = padding;
      message.y = padding;
      
      const w = message.width + padding * 2;
      const h = message.height + padding * 2;
      
      // Draw bubble background
      bubble.roundRect(0, 0, w, h, 10);
      bubble.fill({ color: 0xFFFFFF });
      
      // Little tail
      bubble.moveTo(w/2 - 5, h);
      bubble.lineTo(w/2, h + 10);
      bubble.lineTo(w/2 + 5, h);
      bubble.fill({ color: 0xFFFFFF }); // Fill tail
      
      // Shadow/Stroke for bubble
      bubble.stroke({ width: 2, color: 0x000000 });
      
      bubble.addChild(message);
      
      // Center bubble horizontally above head
      bubble.pivot.x = w / 2;
      bubble.pivot.y = h + 10; // at the tail tip
      
      bubbleContainer.addChild(bubble);
      
      // Animate pop in
      bubble.scale.set(0);
      
      // Simple scaling animation
      let scale = 0;
      const popInterval = setInterval(() => {
          scale += 0.2;
          if (scale >= 1) {
              scale = 1;
              clearInterval(popInterval);
          }
           bubble.scale.set(scale);
      }, 16);
      
      // Remove after 4 seconds
      setTimeout(() => {
          bubbleContainer.removeChildren();
          onComplete();
      }, 4000);
  };

  // Set Chatting Status
  container.setChatting = (val: boolean) => {
    state.isChatting = val;
  };

  // Force Idle (for drag and drop)
  container.forceIdle = (duration: number) => {
    state.mode = 'idle';
    state.idleTime = duration;
    state.isChatting = false;
  };

  // Update function
  container.updateNPC = (delta: number) => {
    if (state.mode === 'walking') {
      const dx = state.targetX - container.x;
      const dy = state.targetY - container.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        state.mode = 'idle';
        state.idleTime = NPC_CONFIG.IDLE_TIME_BASE + Math.random() * NPC_CONFIG.IDLE_TIME_VAR;
      } else {
        container.x += (dx / dist) * state.speed * delta;
        container.y += (dy / dist) * state.speed * delta;
        
        state.walkTime += delta * 0.15;
        
        // Bounce effect
        if (container.sprite) {
             container.sprite.y = -Math.abs(Math.sin(state.walkTime)) * NPC_CONFIG.BOUNCE_AMPLITUDE;
        }
        
        // Face direction
        if (container.sprite) {
            const absScaleX = Math.abs(container.sprite.scale.x);
            if (dx > 0) container.sprite.scale.x = absScaleX;
            else container.sprite.scale.x = -absScaleX;
        }
      }
    } else {
      if (!state.isChatting) {
        state.idleTime -= delta;
        if (state.idleTime <= 0) pickNewTarget();
      }
      if (container.sprite) container.sprite.y = 0;
    }
    container.zIndex = container.y;
  };

  return container;
};
