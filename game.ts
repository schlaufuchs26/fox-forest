import {
  type Bounds,
  createInitialState,
  type Direction,
  type Fox,
  type GameState,
  type Mushroom,
  tick,
  type Wolf,
} from "./game-logic";

function main() {
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  const bounds: Bounds = { width: canvas.width, height: canvas.height };

  // --- Game state (from pure logic) ---
  let state: GameState = createInitialState(bounds);
  // Spawn initial mushrooms
  for (let i = 0; i < 8; i++) {
    state.mushrooms.push({
      x: Math.random() * (bounds.width - 40) + 20,
      y: Math.random() * (bounds.height - 40) + 20,
    });
  }

  // --- Keys ---
  const keys = new Set<string>();
  window.addEventListener("keydown", (e) => {
    keys.add(e.key);
    e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(e.key);
    e.preventDefault();
  });

  // --- HUD ---
  const scoreEl = document.getElementById("score") as HTMLElement;
  const livesEl = document.getElementById("lives") as HTMLElement;
  const msgEl = document.getElementById("message") as HTMLElement;

  function syncHUD(prev: GameState) {
    if (state.score !== prev.score) scoreEl.textContent = String(state.score);
    if (state.lives !== prev.lives) livesEl.textContent = String(state.lives);
    if (state.gameOver && !prev.gameOver) {
      msgEl.textContent = `Game Over! 🍄 Score: ${state.score} — Press R to restart`;
    } else if (state.lives < prev.lives && state.lives > 0) {
      msgEl.textContent = `Ouch! ${state.lives} lives left`;
      setTimeout(() => {
        if (!state.gameOver)
          msgEl.textContent =
            "Arrow keys to move · Collect mushrooms · Avoid wolves!";
      }, 1500);
    } else if (!state.gameOver && prev.gameOver) {
      msgEl.textContent =
        "Arrow keys to move · Collect mushrooms · Avoid wolves!";
    }
  }

  // ── Drawing ──────────────────────────────────────────

  function drawFox(fox: Fox) {
    const { x, y, size } = fox;
    const dir: Direction = fox.dir;
    ctx.save();
    ctx.translate(x, y);
    const angles: Record<string, number> = {
      up: -Math.PI / 2,
      down: Math.PI / 2,
      left: Math.PI,
      right: 0,
    };
    ctx.rotate(angles[dir] || 0);

    ctx.fillStyle = "#e87820";
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f09030";
    ctx.beginPath();
    ctx.arc(size * 0.7, 0, size * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e87820";
    ctx.beginPath();
    ctx.moveTo(size * 0.9, -size * 0.35);
    ctx.lineTo(size * 1.3, -size * 0.7);
    ctx.lineTo(size * 0.6, -size * 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.9, size * 0.35);
    ctx.lineTo(size * 1.3, size * 0.7);
    ctx.lineTo(size * 0.6, size * 0.3);
    ctx.fill();

    ctx.fillStyle = "#ffd0a0";
    ctx.beginPath();
    ctx.moveTo(size * 0.95, -size * 0.3);
    ctx.lineTo(size * 1.15, -size * 0.55);
    ctx.lineTo(size * 0.75, -size * 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.95, size * 0.3);
    ctx.lineTo(size * 1.15, size * 0.55);
    ctx.lineTo(size * 0.75, size * 0.25);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(size * 0.9, -size * 0.2, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.9, size * 0.2, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(size * 0.95, -size * 0.2, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.95, size * 0.2, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(size * 1.0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e87820";
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, 0);
    ctx.quadraticCurveTo(-size * 1.3, -size * 0.5, -size * 1.0, -size * 0.8);
    ctx.quadraticCurveTo(-size * 0.8, -size * 0.7, -size * 0.5, -size * 0.3);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-size * 1.0, -size * 0.7, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawWolf(w: Wolf) {
    const { x, y, size } = w;
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "#4a4a6a";
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.8, size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#5a5a7a";
    ctx.beginPath();
    ctx.arc(size * 0.6, 0, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3a3a5a";
    ctx.beginPath();
    ctx.ellipse(size * 0.9, 0, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.arc(size * 0.7, -size * 0.2, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.7, size * 0.2, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4a4a6a";
    ctx.beginPath();
    ctx.moveTo(size * 0.5, -size * 0.3);
    ctx.lineTo(size * 0.7, -size * 0.7);
    ctx.lineTo(size * 0.3, -size * 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.3);
    ctx.lineTo(size * 0.7, size * 0.7);
    ctx.lineTo(size * 0.3, size * 0.25);
    ctx.fill();

    ctx.restore();
  }

  function drawMushroom(m: Mushroom) {
    const { x, y } = m;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8d8c0";
    ctx.fillRect(x - 2, y - 2, 4, 8);

    ctx.fillStyle = "#c44";
    ctx.beginPath();
    ctx.arc(x, y - 2, 8, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x - 3, y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3, y - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawForestFloor() {
    ctx.fillStyle = "#1a3a1a";
    for (let i = 0; i < 40; i++) {
      const gx = (i * 137 + 50) % bounds.width;
      const gy = (i * 251 + 50) % bounds.height;
      ctx.beginPath();
      ctx.arc(gx, gy, 3 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, bounds.width, bounds.height);
    ctx.fillStyle = "#0f3460";
    ctx.fillRect(0, 0, bounds.width, bounds.height);
    drawForestFloor();

    for (const m of state.mushrooms) drawMushroom(m);
    for (const w of state.wolves) drawWolf(w);
    if (!state.gameOver || state.lives > 0) drawFox(state.fox);

    if (state.gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, bounds.width, bounds.height);
      ctx.fillStyle = "#f0a040";
      ctx.font = "bold 32px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", bounds.width / 2, bounds.height / 2 - 10);
      ctx.font = "18px system-ui";
      ctx.fillText(
        `Score: ${state.score}`,
        bounds.width / 2,
        bounds.height / 2 + 30,
      );
    }
  }

  // ── Game loop ────────────────────────────────────────

  function gameLoop() {
    const prev = state;
    state = tick(state, keys, bounds);
    syncHUD(prev);
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}

main();
