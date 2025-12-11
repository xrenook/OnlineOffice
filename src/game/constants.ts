export const MAP_WIDTH = 1024;
export const MAP_HEIGHT = 1024;
export const DEFAULT_NPC_COUNT = 10;

export const ASSETS = {
  MAP: '/map_large.png',
  MALES: [
    '/male1.png',
    '/male2.png',
    '/male3.png',
    '/male4.png',
  ],
  FEMALES: [
    '/female1.png',
    '/female2.png',
    '/female3.png',
    '/female4.png',
  ],
};

export const NPC_CONFIG = {
  WALK_SPEED_MIN: 0.8,
  WALK_SPEED_VAR: 1.2,
  IDLE_TIME_BASE: 300,
  IDLE_TIME_VAR: 500,
  SIZE: 80,
  BOUNCE_AMPLITUDE: 5,
};

// Simple dialogues for 2 peope (A -> B -> A -> B...)
export const CONVERSATIONS = [
  ["Any new emails?", "Just spam.", "Ugh, same here."],
  ["Coffee break?", "I just had one.", "One more won't hurt!"],
  ["Did you see the game?", "Yeah! unbelievable.", "Total nail biter."],
  ["Where is the printer?", "Second floor.", "Thanks!"],
  ["Nice weather today!", "Finally some sun.", "Perfect for a walk."],
  ["Is it Friday yet?", "Only Tuesday...", "Don't remind me."],
  ["Working hard!", "Hardly working.", "Haha, keep it up."],
  ["Need to sync up.", "Sure, when?", "In 10 mins?"],
  ["Lunch time soon?", "Starving!", "Let's get pizza."],
  ["Who broke the build?", "Not me!", "Likely story."],
  ["Meeting in 5.", "Which room?", "Room 302, hurry!"],
];

export const NPC_STATUS = {
  AVAILABLE: "Available",
  BUSY: "Busy",
  AWAY: "Away",
} as const;

export type NPCStatusType = typeof NPC_STATUS[keyof typeof NPC_STATUS];

export const STATUS_COLORS = {
  [NPC_STATUS.AVAILABLE]: '#22c55e', // Green
  [NPC_STATUS.BUSY]: '#ef4444',      // Red
  [NPC_STATUS.AWAY]: '#eab308',      // Yellow
};

export const NPC_NAMES = [
  "Alice", "Bob", "Charlie", "David", "Eve", 
  "Frank", "Grace", "Heidi", "Ivan", "Judy", 
  "Kevin", "Leo", "Mia", "Nick", "Olivia", 
  "Paul", "Quinn", "Rose", "Sam", "Tina",
  "Ursula", "Victor", "Wendy", "Xander", "Yara", "Zack"
];
