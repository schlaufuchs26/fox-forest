import { describe, expect, test } from "bun:test";
import {
  applyHit,
  type Bounds,
  checkMushroomCollision,
  checkWolfCollision,
  createFox,
  createInitialState,
  distance,
  FOX_SIZE,
  FOX_SPEED,
  type Fox,
  INITIAL_LIVES,
  MUSHROOM_SCORE,
  restartGame,
  spawnMushroom,
  spawnWolf,
  tick,
  updateFoxPosition,
  updateWolves,
  WOLF_SIZE,
} from "../game-logic";

const bounds: Bounds = { width: 800, height: 600 };

// Deterministic RNG for testing
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── createInitialState ─────────────────────────────────

describe("createInitialState", () => {
  test("returns zero score and full lives", () => {
    const state = createInitialState(bounds);
    expect(state.score).toBe(0);
    expect(state.lives).toBe(INITIAL_LIVES);
    expect(state.gameOver).toBe(false);
  });

  test("places fox at center", () => {
    const state = createInitialState(bounds);
    expect(state.fox.x).toBe(bounds.width / 2);
    expect(state.fox.y).toBe(bounds.height / 2);
    expect(state.fox.dir).toBe("down");
  });

  test("starts with empty entities", () => {
    const state = createInitialState(bounds);
    expect(state.mushrooms).toEqual([]);
    expect(state.wolves).toEqual([]);
  });
});

// ── updateFoxPosition ──────────────────────────────────

describe("updateFoxPosition", () => {
  test("moves up with ArrowUp", () => {
    const fox = updateFoxPosition(
      createFox(bounds),
      new Set(["ArrowUp"]),
      bounds,
    );
    expect(fox.y).toBe(bounds.height / 2 - FOX_SPEED);
    expect(fox.dir).toBe("up");
  });

  test("moves up with w key", () => {
    const fox = updateFoxPosition(createFox(bounds), new Set(["w"]), bounds);
    expect(fox.y).toBe(bounds.height / 2 - FOX_SPEED);
  });

  test("moves down", () => {
    const fox = updateFoxPosition(
      createFox(bounds),
      new Set(["ArrowDown"]),
      bounds,
    );
    expect(fox.y).toBe(bounds.height / 2 + FOX_SPEED);
    expect(fox.dir).toBe("down");
  });

  test("moves left", () => {
    const fox = updateFoxPosition(
      createFox(bounds),
      new Set(["ArrowLeft"]),
      bounds,
    );
    expect(fox.x).toBe(bounds.width / 2 - FOX_SPEED);
    expect(fox.dir).toBe("left");
  });

  test("moves right", () => {
    const fox = updateFoxPosition(
      createFox(bounds),
      new Set(["ArrowRight"]),
      bounds,
    );
    expect(fox.x).toBe(bounds.width / 2 + FOX_SPEED);
    expect(fox.dir).toBe("right");
  });

  test("diagonal movement (up+right)", () => {
    const fox = updateFoxPosition(
      createFox(bounds),
      new Set(["ArrowUp", "ArrowRight"]),
      bounds,
    );
    expect(fox.x).toBeGreaterThan(bounds.width / 2);
    expect(fox.y).toBeLessThan(bounds.height / 2);
  });

  test("clamped to top-left bounds", () => {
    const cornerFox: Fox = {
      x: FOX_SIZE,
      y: FOX_SIZE,
      size: FOX_SIZE,
      speed: FOX_SPEED,
      dir: "up",
    };
    const result = updateFoxPosition(
      cornerFox,
      new Set(["ArrowUp", "ArrowLeft"]),
      bounds,
    );
    expect(result.x).toBe(FOX_SIZE);
    expect(result.y).toBe(FOX_SIZE);
  });

  test("clamped to bottom-right bounds", () => {
    const cornerFox: Fox = {
      x: bounds.width - FOX_SIZE,
      y: bounds.height - FOX_SIZE,
      size: FOX_SIZE,
      speed: FOX_SPEED,
      dir: "down",
    };
    const result = updateFoxPosition(
      cornerFox,
      new Set(["ArrowDown", "ArrowRight"]),
      bounds,
    );
    expect(result.x).toBe(bounds.width - FOX_SIZE);
    expect(result.y).toBe(bounds.height - FOX_SIZE);
  });

  test("no keys — fox stays still", () => {
    const fox = createFox(bounds);
    const result = updateFoxPosition(fox, new Set(), bounds);
    expect(result.x).toBe(fox.x);
    expect(result.y).toBe(fox.y);
  });
});

// ── distance ───────────────────────────────────────────

describe("distance", () => {
  test("zero distance for same point", () => {
    expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });

  test("horizontal distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
  });

  test("diagonal (3-4-5 triangle)", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

// ── checkMushroomCollision ─────────────────────────────

describe("checkMushroomCollision", () => {
  test("collects mushroom within radius", () => {
    const fox = { x: 50, y: 50 };
    const mushrooms = [{ x: 52, y: 52 }]; // very close
    const { collected, remaining } = checkMushroomCollision(fox, mushrooms);
    expect(collected).toBe(1);
    expect(remaining).toEqual([]);
  });

  test("does not collect distant mushroom", () => {
    const fox = { x: 50, y: 50 };
    const mushrooms = [{ x: 500, y: 500 }];
    const { collected, remaining } = checkMushroomCollision(fox, mushrooms);
    expect(collected).toBe(0);
    expect(remaining).toEqual(mushrooms);
  });

  test("collects one, leaves another", () => {
    const fox = { x: 50, y: 50 };
    const close = { x: 52, y: 52 };
    const far = { x: 500, y: 500 };
    const { collected, remaining } = checkMushroomCollision(fox, [close, far]);
    expect(collected).toBe(1);
    expect(remaining).toEqual([far]);
  });
});

// ── checkWolfCollision ─────────────────────────────────

describe("checkWolfCollision", () => {
  test("detects hit when fox overlaps wolf", () => {
    const fox = { x: 50, y: 50 };
    const wolf = { x: 50, y: 50, dx: 1, dy: 1, size: WOLF_SIZE };
    const { hit } = checkWolfCollision(fox, [wolf]);
    expect(hit).toBe(true);
  });

  test("no hit when wolf is far away", () => {
    const fox = { x: 50, y: 50 };
    const wolf = { x: 500, y: 500, dx: 1, dy: 1, size: WOLF_SIZE };
    const { hit } = checkWolfCollision(fox, [wolf]);
    expect(hit).toBe(false);
  });

  test("no hit with empty wolves", () => {
    const fox = { x: 50, y: 50 };
    const { hit } = checkWolfCollision(fox, []);
    expect(hit).toBe(false);
  });
});

// ── spawnMushroom ──────────────────────────────────────

describe("spawnMushroom", () => {
  test("adds one mushroom", () => {
    const before = [{ x: 100, y: 100 }];
    const after = spawnMushroom(bounds, before, seededRng(42));
    expect(after.length).toBe(2);
    expect(after[1].x).toBeGreaterThanOrEqual(20);
    expect(after[1].x).toBeLessThanOrEqual(bounds.width - 20);
  });

  test("does not exceed max", () => {
    const full = Array.from({ length: 12 }, (_, i) => ({
      x: 100 + i * 10,
      y: 100,
    }));
    const after = spawnMushroom(bounds, full, seededRng(42));
    expect(after.length).toBe(12);
    expect(after).toBe(full); // same reference when full
  });
});

// ── spawnWolf ──────────────────────────────────────────

describe("spawnWolf", () => {
  test("adds one wolf (left side)", () => {
    const after = spawnWolf(bounds, [], 0, seededRng(123));
    expect(after.length).toBe(1);
    expect(after[0].size).toBe(WOLF_SIZE);
    expect(after[0].x).toBe(-20);
    expect(after[0].y).toBeGreaterThanOrEqual(0);
    expect(after[0].y).toBeLessThanOrEqual(bounds.height);
  });

  test("spawns from right side (side 1)", () => {
    const after = spawnWolf(bounds, [], 0, seededRng(31944));
    expect(after.length).toBe(1);
    expect(after[0].x).toBe(bounds.width + 20);
    expect(after[0].y).toBeGreaterThanOrEqual(0);
    expect(after[0].y).toBeLessThanOrEqual(bounds.height);
  });

  test("spawns from top side (side 2)", () => {
    const after = spawnWolf(bounds, [], 0, seededRng(63887));
    expect(after.length).toBe(1);
    expect(after[0].y).toBe(-20);
    expect(after[0].x).toBeGreaterThanOrEqual(0);
    expect(after[0].x).toBeLessThanOrEqual(bounds.width);
  });

  test("spawns from bottom side (side 3)", () => {
    const after = spawnWolf(bounds, [], 0, seededRng(95830));
    expect(after.length).toBe(1);
    expect(after[0].y).toBe(bounds.height + 20);
    expect(after[0].x).toBeGreaterThanOrEqual(0);
    expect(after[0].x).toBeLessThanOrEqual(bounds.width);
  });

  test("does not exceed max", () => {
    const full = Array.from({ length: 6 }, () => ({
      x: 100,
      y: 100,
      dx: 0,
      dy: 0,
      size: WOLF_SIZE,
    }));
    const after = spawnWolf(bounds, full, 0, seededRng(123));
    expect(after.length).toBe(6);
    expect(after).toBe(full);
  });
});

// ── updateWolves ───────────────────────────────────────

describe("updateWolves", () => {
  test("wolf moves by its velocity", () => {
    const wolf = { x: 100, y: 100, dx: 2, dy: -1, size: WOLF_SIZE };
    const [updated] = updateWolves([wolf], bounds);
    expect(updated.x).toBe(102);
    expect(updated.y).toBe(99);
  });

  test("wolf bounces off left edge", () => {
    const wolf = { x: -9, y: 100, dx: -2, dy: 0, size: WOLF_SIZE };
    const [updated] = updateWolves([wolf], bounds);
    // -9 + (-2) = -11, which is < -10, so dx flips
    expect(updated.dx).toBe(2);
  });

  test("wolf bounces off right edge", () => {
    const wolf = {
      x: bounds.width + 9,
      y: 100,
      dx: 2,
      dy: 0,
      size: WOLF_SIZE,
    };
    const [updated] = updateWolves([wolf], bounds);
    // 809 + 2 = 811, which is > 810, so dx flips
    expect(updated.dx).toBe(-2);
  });
});

// ── applyHit ───────────────────────────────────────────

describe("applyHit", () => {
  test("reduces lives by 1", () => {
    const state = createInitialState(bounds);
    const after = applyHit(state, bounds);
    expect(after.lives).toBe(INITIAL_LIVES - 1);
    expect(after.gameOver).toBe(false);
  });

  test("resets fox to center", () => {
    const state = createInitialState(bounds);
    state.fox.x = 100;
    state.fox.y = 100;
    const after = applyHit(state, bounds);
    expect(after.fox.x).toBe(bounds.width / 2);
    expect(after.fox.y).toBe(bounds.height / 2);
  });

  test("game over when lives reach 0", () => {
    const state = createInitialState(bounds);
    state.lives = 1;
    const after = applyHit(state, bounds);
    expect(after.lives).toBe(0);
    expect(after.gameOver).toBe(true);
  });
});

// ── restartGame ────────────────────────────────────────

describe("restartGame", () => {
  test("resets to initial state with mushrooms", () => {
    const state = restartGame(bounds);
    expect(state.score).toBe(0);
    expect(state.lives).toBe(INITIAL_LIVES);
    expect(state.gameOver).toBe(false);
    expect(state.mushrooms.length).toBe(8);
    expect(state.wolves).toEqual([]);
    expect(state.fox.x).toBe(bounds.width / 2);
  });
});

// ── tick (full tick) ───────────────────────────────────

describe("tick", () => {
  test("moves fox based on keys", () => {
    const state = createInitialState(bounds);
    const after = tick(state, new Set(["ArrowRight"]), bounds, seededRng(1));
    expect(after.fox.x).toBe(bounds.width / 2 + FOX_SPEED);
  });

  test("increases score on mushroom collection", () => {
    const state = createInitialState(bounds);
    // Place a mushroom right on the fox
    state.mushrooms = [{ x: bounds.width / 2, y: bounds.height / 2 }];
    const after = tick(state, new Set(), bounds, seededRng(1));
    expect(after.score).toBe(MUSHROOM_SCORE);
    expect(after.mushrooms).toEqual([]);
  });

  test("fox hit by wolf reduces lives", () => {
    const state = createInitialState(bounds);
    // Place a wolf right on the fox
    state.wolves = [
      {
        x: bounds.width / 2,
        y: bounds.height / 2,
        dx: 0,
        dy: 0,
        size: WOLF_SIZE,
      },
    ];
    const after = tick(state, new Set(), bounds, seededRng(1));
    expect(after.lives).toBe(INITIAL_LIVES - 1);
  });

  test("no state change when game over", () => {
    const state = createInitialState(bounds);
    state.gameOver = true;
    state.score = 42;
    const after = tick(state, new Set(["ArrowRight"]), bounds, seededRng(1));
    // Fox should not move
    expect(after.fox.x).toBe(bounds.width / 2);
    expect(after.score).toBe(42);
  });

  test("game over + R key restarts", () => {
    const state = createInitialState(bounds);
    state.gameOver = true;
    state.score = 99;
    state.lives = 0;
    const after = tick(state, new Set(["r"]), bounds, seededRng(1));
    expect(after.gameOver).toBe(false);
    expect(after.score).toBe(0);
    expect(after.lives).toBe(INITIAL_LIVES);
    expect(after.mushrooms.length).toBe(8);
  });

  test("spawns mushroom when spawnTimer exceeds interval", () => {
    const state = createInitialState(bounds);
    state.spawnTimer = 61;
    state.mushrooms = [];
    const after = tick(state, new Set(), bounds, seededRng(1));
    expect(after.mushrooms.length).toBe(1);
    expect(after.spawnTimer).toBe(0);
  });

  test("spawns wolf when wolfTimer exceeds interval", () => {
    const state = createInitialState(bounds);
    state.wolfTimer = 250;
    state.wolves = [];
    state.score = 0;
    const after = tick(state, new Set(), bounds, seededRng(1));
    expect(after.wolves.length).toBe(1);
    expect(after.wolfTimer).toBe(0);
  });

  test("does not spawn mushroom when at max", () => {
    const state = createInitialState(bounds);
    state.spawnTimer = 61;
    state.mushrooms = Array.from({ length: 12 }, () => ({ x: 10, y: 10 }));
    const after = tick(state, new Set(), bounds, seededRng(1));
    expect(after.mushrooms.length).toBe(12);
  });

  test("does not spawn wolf when at max", () => {
    const state = createInitialState(bounds);
    state.wolfTimer = 250;
    state.wolves = Array.from({ length: 6 }, () => ({
      x: 100,
      y: 100,
      dx: 1,
      dy: 1,
      size: WOLF_SIZE,
    }));
    const after = tick(state, new Set(), bounds, seededRng(1));
    expect(after.wolves.length).toBe(6);
  });
});
