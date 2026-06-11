function main() {
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  const W = canvas.width;
  const H = canvas.height;

  // --- Fox ---
  const fox = {
    x: W / 2,
    y: H / 2,
    size: 20,
    speed: 3,
    dir: "down" as "up" | "down" | "left" | "right",
  };

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

  // --- Game state ---
  let mushrooms: { x: number; y: number }[] = [];
  let wolves: { x: number; y: number; dx: number; dy: number; size: number }[] =
    [];
  let score = 0;
  let lives = 3;
  let gameOver = false;
  let spawnTimer = 0;
  let wolfTimer = 0;

  // --- HUD ---
  const scoreEl = document.getElementById("score") as HTMLElement;
  const livesEl = document.getElementById("lives") as HTMLElement;
  const msgEl = document.getElementById("message") as HTMLElement;

  function spawnMushroom() {
    mushrooms.push({
      x: Math.random() * (W - 40) + 20,
      y: Math.random() * (H - 40) + 20,
    });
  }

  function spawnWolf() {
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;
    if (side === 0) {
      x = -20;
      y = Math.random() * H;
    } else if (side === 1) {
      x = W + 20;
      y = Math.random() * H;
    } else if (side === 2) {
      x = Math.random() * W;
      y = -20;
    } else {
      x = Math.random() * W;
      y = H + 20;
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 1.5;
    wolves.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 18,
    });
  }

  for (let i = 0; i < 8; i++) spawnMushroom();

  function drawFox(x: number, y: number, size: number, dir: string) {
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

  function drawWolf(x: number, y: number, size: number) {
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

  function drawMushroom(x: number, y: number) {
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
      const gx = (i * 137 + 50) % W;
      const gy = (i * 251 + 50) % H;
      ctx.beginPath();
      ctx.arc(gx, gy, 3 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function update() {
    if (gameOver) return;

    if (keys.has("ArrowUp") || keys.has("w")) {
      fox.y -= fox.speed;
      fox.dir = "up";
    }
    if (keys.has("ArrowDown") || keys.has("s")) {
      fox.y += fox.speed;
      fox.dir = "down";
    }
    if (keys.has("ArrowLeft") || keys.has("a")) {
      fox.x -= fox.speed;
      fox.dir = "left";
    }
    if (keys.has("ArrowRight") || keys.has("d")) {
      fox.x += fox.speed;
      fox.dir = "right";
    }

    fox.x = Math.max(fox.size, Math.min(W - fox.size, fox.x));
    fox.y = Math.max(fox.size, Math.min(H - fox.size, fox.y));

    spawnTimer++;
    if (spawnTimer > 60 && mushrooms.length < 12) {
      spawnMushroom();
      spawnTimer = 0;
    }

    wolfTimer++;
    const wolfInterval = Math.max(80, 200 - score * 2);
    if (wolfTimer > wolfInterval && wolves.length < 6) {
      spawnWolf();
      wolfTimer = 0;
    }

    for (const w of wolves) {
      w.x += w.dx;
      w.y += w.dy;
      if (w.x < -10 || w.x > W + 10) w.dx *= -1;
      if (w.y < -10 || w.y > H + 10) w.dy *= -1;
    }

    mushrooms = mushrooms.filter((m) => {
      const dx = fox.x - m.x;
      const dy = fox.y - m.y;
      if (Math.sqrt(dx * dx + dy * dy) < fox.size + 10) {
        score += 10;
        scoreEl.textContent = String(score);
        return false;
      }
      return true;
    });

    for (const w of wolves) {
      const dx = fox.x - w.x;
      const dy = fox.y - w.y;
      if (Math.sqrt(dx * dx + dy * dy) < fox.size + w.size - 8) {
        lives--;
        livesEl.textContent = String(lives);
        if (lives <= 0) {
          gameOver = true;
          msgEl.textContent = `Game Over! 🍄 Score: ${score} — Press R to restart`;
        } else {
          fox.x = W / 2;
          fox.y = H / 2;
          msgEl.textContent = `Ouch! ${lives} lives left`;
          setTimeout(() => {
            if (!gameOver)
              msgEl.textContent =
                "Arrow keys to move · Collect mushrooms · Avoid wolves!";
          }, 1500);
        }
        break;
      }
    }

    if (gameOver && keys.has("r")) {
      score = 0;
      lives = 3;
      gameOver = false;
      mushrooms = [];
      wolves = [];
      fox.x = W / 2;
      fox.y = H / 2;
      scoreEl.textContent = "0";
      livesEl.textContent = "3";
      msgEl.textContent =
        "Arrow keys to move · Collect mushrooms · Avoid wolves!";
      for (let i = 0; i < 8; i++) spawnMushroom();
      keys.delete("r");
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f3460";
    ctx.fillRect(0, 0, W, H);
    drawForestFloor();

    for (const m of mushrooms) drawMushroom(m.x, m.y);
    for (const w of wolves) drawWolf(w.x, w.y, w.size);
    if (!gameOver || lives > 0) drawFox(fox.x, fox.y, fox.size, fox.dir);

    if (gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f0a040";
      ctx.font = "bold 32px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", W / 2, H / 2 - 10);
      ctx.font = "18px system-ui";
      ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 30);
    }
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}

main();
