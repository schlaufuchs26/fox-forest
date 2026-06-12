// Pure game logic extracted from game.ts for testability.
// No DOM access, no canvas. Just types and pure(ish) functions.

// ── Types ──────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

export type Direction = "up" | "down" | "left" | "right";

export interface Fox {
  x: number;
  y: number;
  size: number;
  speed: number;
  dir: Direction;
}

export interface Wolf {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
}

export interface Mushroom {
  x: number;
  y: number;
}

export interface GameState {
  fox: Fox;
  mushrooms: Mushroom[];
  wolves: Wolf[];
  score: number;
  lives: number;
  gameOver: boolean;
  spawnTimer: number;
  wolfTimer: number;
}

export interface Bounds {
  width: number;
  height: number;
}

// ── Constants ──────────────────────────────────────────

export const FOX_SIZE = 20;
export const FOX_SPEED = 3;
export const WOLF_SIZE = 18;
export const INITIAL_LIVES = 3;
export const MUSHROOM_SCORE = 10;
const MAX_MUSHROOMS = 12;
const MUSHROOM_SPAWN_INTERVAL = 60;
const MAX_WOLVES = 6;
const MUSHROOM_COLLISION_RADIUS = FOX_SIZE + 10;
const WOLF_COLLISION_RADIUS = FOX_SIZE + WOLF_SIZE - 8;

// ── Factory ────────────────────────────────────────────

export function createInitialState(bounds: Bounds): GameState {
  return {
    fox: createFox(bounds),
    mushrooms: [],
    wolves: [],
    score: 0,
    lives: INITIAL_LIVES,
    gameOver: false,
    spawnTimer: 0,
    wolfTimer: 0,
  };
}

export function createFox(bounds: Bounds): Fox {
  return {
    x: bounds.width / 2,
    y: bounds.height / 2,
    size: FOX_SIZE,
    speed: FOX_SPEED,
    dir: "down",
  };
}

// ── Spawning ───────────────────────────────────────────

export function spawnMushroom(
  bounds: Bounds,
  mushrooms: Mushroom[],
  rng: () => number = Math.random,
): Mushroom[] {
  if (mushrooms.length >= MAX_MUSHROOMS) return mushrooms;
  return [
    ...mushrooms,
    {
      x: rng() * (bounds.width - 40) + 20,
      y: rng() * (bounds.height - 40) + 20,
    },
  ];
}

export function spawnWolf(
  bounds: Bounds,
  wolves: Wolf[],
  _score: number,
  rng: () => number = Math.random,
): Wolf[] {
  if (wolves.length >= MAX_WOLVES) return wolves;

  const side = Math.floor(rng() * 4);
  let x: number;
  let y: number;
  if (side === 0) {
    x = -20;
    y = rng() * bounds.height;
  } else if (side === 1) {
    x = bounds.width + 20;
    y = rng() * bounds.height;
  } else if (side === 2) {
    x = rng() * bounds.width;
    y = -20;
  } else {
    x = rng() * bounds.width;
    y = bounds.height + 20;
  }

  const angle = rng() * Math.PI * 2;
  const speed = 1 + rng() * 1.5;
  return [
    ...wolves,
    {
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: WOLF_SIZE,
    },
  ];
}

// ── Movement ───────────────────────────────────────────

export function updateFoxPosition(
  fox: Fox,
  keys: Set<string>,
  bounds: Bounds,
): Fox {
  let { x, y } = fox;
  let dir = fox.dir;

  if (keys.has("ArrowUp") || keys.has("w")) {
    y -= fox.speed;
    dir = "up";
  }
  if (keys.has("ArrowDown") || keys.has("s")) {
    y += fox.speed;
    dir = "down";
  }
  if (keys.has("ArrowLeft") || keys.has("a")) {
    x -= fox.speed;
    dir = "left";
  }
  if (keys.has("ArrowRight") || keys.has("d")) {
    x += fox.speed;
    dir = "right";
  }

  // Clamp to bounds
  x = Math.max(fox.size, Math.min(bounds.width - fox.size, x));
  y = Math.max(fox.size, Math.min(bounds.height - fox.size, y));

  return { ...fox, x, y, dir };
}

export function updateWolves(wolves: Wolf[], bounds: Bounds): Wolf[] {
  return wolves.map((w) => {
    const x = w.x + w.dx;
    const y = w.y + w.dy;
    const dx = x < -10 || x > bounds.width + 10 ? -w.dx : w.dx;
    const dy = y < -10 || y > bounds.height + 10 ? -w.dy : w.dy;
    return { ...w, x, y, dx, dy };
  });
}

// ── Collision ──────────────────────────────────────────

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function checkMushroomCollision(
  fox: Vec2,
  mushrooms: Mushroom[],
): { collected: number; remaining: Mushroom[] } {
  const remaining: Mushroom[] = [];
  let collected = 0;
  for (const m of mushrooms) {
    if (distance(fox, m) < MUSHROOM_COLLISION_RADIUS) {
      collected++;
    } else {
      remaining.push(m);
    }
  }
  return { collected, remaining };
}

export function checkWolfCollision(
  fox: Vec2,
  wolves: Wolf[],
): { hit: boolean; survivingWolves: Wolf[] } {
  for (const w of wolves) {
    if (distance(fox, w) < WOLF_COLLISION_RADIUS) {
      return { hit: true, survivingWolves: wolves };
    }
  }
  return { hit: false, survivingWolves: wolves };
}

// ── Game flow ──────────────────────────────────────────

export function applyHit(state: GameState, bounds: Bounds): GameState {
  const newLives = state.lives - 1;
  if (newLives <= 0) {
    return { ...state, lives: 0, gameOver: true };
  }
  return {
    ...state,
    lives: newLives,
    fox: { ...state.fox, x: bounds.width / 2, y: bounds.height / 2 },
  };
}

export function restartGame(bounds: Bounds): GameState {
  return {
    ...createInitialState(bounds),
    mushrooms: spawnManyMushrooms(8, bounds),
  };
}

function spawnManyMushrooms(count: number, bounds: Bounds): Mushroom[] {
  const mushrooms: Mushroom[] = [];
  let state = mushrooms;
  for (let i = 0; i < count; i++) {
    state = spawnMushroom(bounds, state);
  }
  return state;
}

// ── Tick (full update, no rendering) ───────────────────

export function tick(
  state: GameState,
  keys: Set<string>,
  bounds: Bounds,
  rng: () => number = Math.random,
): GameState {
  if (state.gameOver) {
    if (keys.has("r")) {
      return restartGame(bounds);
    }
    return state;
  }

  let s = { ...state };

  // Move fox
  s.fox = updateFoxPosition(s.fox, keys, bounds);

  // Spawn mushrooms
  s.spawnTimer++;
  if (
    s.spawnTimer > MUSHROOM_SPAWN_INTERVAL &&
    s.mushrooms.length < MAX_MUSHROOMS
  ) {
    s.mushrooms = spawnMushroom(bounds, s.mushrooms, rng);
    s.spawnTimer = 0;
  }

  // Spawn wolves
  s.wolfTimer++;
  const wolfInterval = Math.max(80, 200 - s.score * 2);
  if (s.wolfTimer > wolfInterval && s.wolves.length < MAX_WOLVES) {
    s.wolves = spawnWolf(bounds, s.wolves, s.score, rng);
    s.wolfTimer = 0;
  }

  // Move wolves
  s.wolves = updateWolves(s.wolves, bounds);

  // Mushroom collisions
  const { collected, remaining } = checkMushroomCollision(s.fox, s.mushrooms);
  s.mushrooms = remaining;
  s.score += collected * MUSHROOM_SCORE;

  // Wolf collisions
  const { hit } = checkWolfCollision(s.fox, s.wolves);
  if (hit) {
    s = applyHit(s, bounds);
  }

  return s;
}
