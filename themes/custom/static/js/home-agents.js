const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const palettes = {
  light: {
    grid: "rgba(8, 47, 73, 0.075)",
    link: "rgba(14, 116, 144, 0.18)",
    linkHot: "rgba(234, 88, 12, 0.16)",
    cursor: "rgba(8, 145, 178, 0.42)",
    cursorFill: "rgba(125, 211, 252, 0.08)",
    spawn: "rgba(20, 184, 166, 0.45)",
    erase: "rgba(244, 63, 94, 0.42)",
    text: "rgba(8, 47, 73, 0.58)",
    agents: [
      { core: "#0891b2", edge: "#164e63", glow: "rgba(34, 211, 238, 0.26)" },
      { core: "#ea580c", edge: "#7c2d12", glow: "rgba(251, 146, 60, 0.23)" },
      { core: "#4f46e5", edge: "#312e81", glow: "rgba(99, 102, 241, 0.22)" },
    ],
  },
  dark: {
    grid: "rgba(125, 211, 252, 0.075)",
    link: "rgba(125, 211, 252, 0.2)",
    linkHot: "rgba(251, 191, 36, 0.16)",
    cursor: "rgba(103, 232, 249, 0.5)",
    cursorFill: "rgba(34, 211, 238, 0.07)",
    spawn: "rgba(45, 212, 191, 0.52)",
    erase: "rgba(251, 113, 133, 0.48)",
    text: "rgba(224, 242, 254, 0.62)",
    agents: [
      { core: "#67e8f9", edge: "#155e75", glow: "rgba(34, 211, 238, 0.34)" },
      { core: "#fbbf24", edge: "#92400e", glow: "rgba(251, 191, 36, 0.28)" },
      { core: "#fb7185", edge: "#9f1239", glow: "rgba(251, 113, 133, 0.27)" },
    ],
  },
};

const INTERACTION = [
  [0.12, 0.28, -0.42],
  [0.24, -0.08, -0.34],
  [0.36, 0.22, -0.12],
];
const SPEED_LIMITS = [2.35, 1.85, 2.55];
const POINTER_PULL = [0.062, 0.045, 0.032];

let cleanup = null;

function getPalette() {
  return document.body.classList.contains("dark") ? palettes.dark : palettes.light;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function weightedAgentType() {
  const roll = Math.random();
  if (roll < 0.47) return 0;
  if (roll < 0.82) return 1;
  return 2;
}

function createAgent(state, x = Math.random() * state.width, y = Math.random() * state.height, type = weightedAgentType()) {
  const angle = Math.random() * Math.PI * 2;
  const speed = randomBetween(0.45, 1.35);

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    type,
    size: randomBetween(2.8, 4.9) + type * 0.35,
    phase: Math.random() * Math.PI * 2,
    spin: randomBetween(-0.022, 0.022),
  };
}

function spawnBurst(state, x, y, count = 12) {
  for (let i = 0; i < count && state.agents.length < state.maxAgents; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * 48;
    const agent = createAgent(
      state,
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius,
      weightedAgentType(),
    );

    agent.vx += Math.cos(angle) * randomBetween(0.8, 2.4);
    agent.vy += Math.sin(angle) * randomBetween(0.8, 2.4);
    state.agents.push(agent);
  }

}

function despawnNear(state, x, y, radius = 20, count = 9) {
  const candidates = state.agents
    .map((agent, index) => ({
      index,
      distance: Math.hypot(agent.x - x, agent.y - y),
    }))
    .filter((candidate) => candidate.distance < radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map((candidate) => candidate.index)
    .sort((a, b) => b - a);

  if (candidates.length === 0 && state.agents.length > 24) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    state.agents.forEach((agent, index) => {
      const distance = Math.hypot(agent.x - x, agent.y - y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex >= 0 && nearestDistance < radius * 1.75) {
      candidates.push(nearestIndex);
    }
  }

  candidates.forEach((index) => state.agents.splice(index, 1));
}

function resizeCanvas(state) {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.canvas.width = Math.max(1, Math.floor(state.width * state.dpr));
  state.canvas.height = Math.max(1, Math.floor(state.height * state.dpr));
  state.canvas.style.width = `${state.width}px`;
  state.canvas.style.height = `${state.height}px`;
  state.ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  state.maxAgents = Math.min(500, Math.max(150, Math.floor((state.width * state.height) / 6200)));

  while (state.agents.length < Math.min(state.maxAgents, Math.floor(state.maxAgents * 0.62))) {
    state.agents.push(createAgent(state));
  }
}

function setPointerFromEvent(state, event) {
  state.pointer.x = event.clientX;
  state.pointer.y = event.clientY;
  state.pointer.active = true;
}

function updateAgents(state, dt, now) {
  const agents = state.agents;
  const pointer = state.pointer;
  const margin = 52;

  if (pointer.downLeft && now - state.lastSpawnAt > 76) {
    spawnBurst(state, pointer.x, pointer.y, 2);
    state.lastSpawnAt = now;
  }

  if (pointer.downRight && now - state.lastEraseAt > 66) {
    despawnNear(state, pointer.x, pointer.y, 20, 4);
    state.lastEraseAt = now;
  }

  for (let i = 0; i < agents.length; i += 1) {
    const agent = agents[i];
    agent.phase += (0.018 + Math.abs(agent.spin)) * dt;

    const wander = agent.phase + Math.sin(now * 0.00017 + i) * 0.8;
    agent.vx += Math.cos(wander) * 0.018 * dt;
    agent.vy += Math.sin(wander * 1.17) * 0.018 * dt;

    if (pointer.active) {
      const dx = pointer.x - agent.x;
      const dy = pointer.y - agent.y;
      const distance = Math.hypot(dx, dy) || 1;
      const reach = pointer.downLeft ? 260 : 210;

      if (distance < reach) {
        const falloff = 1 - distance / reach;
        const pull = POINTER_PULL[agent.type] * falloff * dt;
        const swirl = (0.032 + agent.type * 0.009) * falloff * dt;
        const direction = pointer.downRight ? -1 : 1;

        agent.vx += (dx / distance) * pull * direction + (-dy / distance) * swirl;
        agent.vy += (dy / distance) * pull * direction + (dx / distance) * swirl;
      }
    }
  }

  for (let i = 0; i < agents.length; i += 1) {
    const a = agents[i];

    for (let j = i + 1; j < agents.length; j += 1) {
      const b = agents[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distanceSquared = dx * dx + dy * dy;
      const reach = 94 - Math.abs(a.type - b.type) * 8;

      if (distanceSquared > reach * reach || distanceSquared < 0.01) continue;

      const distance = Math.sqrt(distanceSquared);
      const nx = dx / distance;
      const ny = dy / distance;
      const falloff = 1 - distance / reach;
      const separation = distance < 20 ? (20 - distance) * 0.018 : 0;
      const forceA = (INTERACTION[a.type][b.type] * falloff * 0.052 - separation) * dt;
      const forceB = (INTERACTION[b.type][a.type] * falloff * 0.052 - separation) * dt;

      a.vx += nx * forceA;
      a.vy += ny * forceA;
      b.vx -= nx * forceB;
      b.vy -= ny * forceB;

      if (a.type === b.type && distance < 58) {
        const alignment = 0.0045 * falloff * dt;
        const avx = a.vx;
        const avy = a.vy;
        a.vx += (b.vx - avx) * alignment;
        a.vy += (b.vy - avy) * alignment;
        b.vx += (avx - b.vx) * alignment;
        b.vy += (avy - b.vy) * alignment;
      }
    }
  }

  for (const agent of agents) {
    if (agent.x < margin) agent.vx += (margin - agent.x) * 0.0035 * dt;
    if (agent.x > state.width - margin) agent.vx -= (agent.x - (state.width - margin)) * 0.0035 * dt;
    if (agent.y < margin) agent.vy += (margin - agent.y) * 0.0035 * dt;
    if (agent.y > state.height - margin) agent.vy -= (agent.y - (state.height - margin)) * 0.0035 * dt;

    agent.vx *= 0.988;
    agent.vy *= 0.988;

    const speed = Math.hypot(agent.vx, agent.vy) || 1;
    const limit = SPEED_LIMITS[agent.type] * (state.pointer.downRight ? 1.18 : 1);
    if (speed > limit) {
      agent.vx = (agent.vx / speed) * limit;
      agent.vy = (agent.vy / speed) * limit;
    }

    agent.x += agent.vx * dt;
    agent.y += agent.vy * dt;

    if (agent.x < -120) agent.x = state.width + 80;
    if (agent.x > state.width + 120) agent.x = -80;
    if (agent.y < -120) agent.y = state.height + 80;
    if (agent.y > state.height + 120) agent.y = -80;
  }
}

function drawField(state, palette, time) {
  const { ctx, width, height } = state;
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  // ctx.lineWidth = 1;
  // ctx.strokeStyle = palette.grid;
  //
  // const step = Math.max(62, Math.min(96, width / 15));
  // for (let x = -step; x < width + step; x += step) {
  //   ctx.beginPath();
  //   for (let y = -step; y < height + step; y += step) {
  //     const wave = Math.sin(y * 0.012 + time * 0.00028) * 11 + Math.cos((x + y) * 0.006) * 5;
  //     const px = x + wave;
  //     if (y === -step) ctx.moveTo(px, y);
  //     else ctx.lineTo(px, y);
  //   }
  //   ctx.stroke();
  // }
  //
  // for (let y = -step; y < height + step; y += step) {
  //   ctx.beginPath();
  //   for (let x = -step; x < width + step; x += step) {
  //     const wave = Math.cos(x * 0.011 + time * 0.00024) * 10 + Math.sin((x - y) * 0.007) * 4;
  //     const py = y + wave;
  //     if (x === -step) ctx.moveTo(x, py);
  //     else ctx.lineTo(x, py);
  //   }
  //   ctx.stroke();
  // }
  ctx.restore();
}

function drawLinks(state, palette) {
  const { ctx, agents } = state;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 0.85;

  for (let i = 0; i < agents.length; i += 1) {
    const a = agents[i];

    for (let j = i + 1; j < agents.length; j += 1) {
      const b = agents[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distanceSquared = dx * dx + dy * dy;
      const linkDistance = a.type === b.type ? 76 : 58;

      if (distanceSquared > linkDistance * linkDistance) continue;

      const distance = Math.sqrt(distanceSquared);
      const alpha = (1 - distance / linkDistance) * (a.type === b.type ? 0.55 : 0.38);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = a.type === 2 || b.type === 2 ? palette.linkHot : palette.link;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawAgent(ctx, agent, palette) {
  const colors = palette.agents[agent.type];
  const angle = Math.atan2(agent.vy, agent.vx);
  const pulse = 1 + Math.sin(agent.phase * 1.7) * 0.11;
  const size = agent.size * pulse;

  ctx.save();
  ctx.translate(agent.x, agent.y);
  ctx.rotate(angle);

  // const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 5.2);
  // glow.addColorStop(0, colors.glow);
  // glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  // ctx.fillStyle = glow;
  // ctx.beginPath();
  // ctx.arc(0, 0, size * 5.2, 0, Math.PI * 2);
  // ctx.fill();

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = colors.edge;
  ctx.fillStyle = colors.core;

  if (agent.type === 0) {
    ctx.beginPath();
    ctx.moveTo(size * 3.1, 0);
    ctx.quadraticCurveTo(-size * 0.8, -size * 1.75, -size * 2.4, -size * 0.32);
    ctx.quadraticCurveTo(-size * 0.75, 0, -size * 2.4, size * 0.32);
    ctx.quadraticCurveTo(-size * 0.8, size * 1.75, size * 3.1, 0);
    ctx.fill();
    ctx.stroke();
  } else if (agent.type === 1) {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 2.1, size * 1.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
  } else {
    ctx.beginPath();
    ctx.moveTo(size * 2.7, 0);
    ctx.lineTo(-size * 0.4, -size * 1.8);
    ctx.lineTo(-size * 2.3, 0);
    ctx.lineTo(-size * 0.4, size * 1.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-size * 1.8, 0);
    ctx.lineTo(-size * 4.2, Math.sin(agent.phase) * size * 0.8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPointer(state, palette, time) {
  const { ctx, pointer } = state;
  if (!pointer.active) return;

  const modeColor = pointer.downRight ? palette.erase : pointer.downLeft ? palette.spawn : palette.cursor;
  const baseRadius = 25;
  const breathe = Math.sin(time * 0.006) * 1.5;

  ctx.save();
  ctx.translate(pointer.x, pointer.y);
  ctx.strokeStyle = modeColor;
  ctx.fillStyle = palette.cursorFill;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius + breathe, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * 0.48 - breathe * 0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHud(state, palette) {
  const { ctx, width, height } = state;
  const text = `${state.agents.length} fish  ·  LMB spawn  ·  RMB remove  ·  mouse attracts`;

  ctx.save();
  ctx.font = "600 11px 'IBM Plex Mono', monospace";
  ctx.fillStyle = palette.text;
  ctx.textAlign = "right";
  ctx.fillText(text, width - 18, height - 18);
  ctx.restore();
}

function render(state, time) {
  const palette = state.palette;
  drawField(state, palette, time);
  drawLinks(state, palette);

  state.ctx.save();
  state.ctx.globalCompositeOperation = "source-over";
  state.agents.forEach((agent) => drawAgent(state.ctx, agent, palette));
  state.ctx.restore();

  drawPointer(state, palette, time);
  drawHud(state, palette);
}

function initAgents() {
  const canvas = document.getElementById("home-agents-canvas");
  if (!canvas || canvas.dataset.initialized === "true" || reducedMotionQuery.matches) {
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  canvas.dataset.initialized = "true";

  const state = {
    canvas,
    ctx,
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: 1,
    maxAgents: 200,
    agents: [],
    pointer: {
      x: window.innerWidth * 0.74,
      y: window.innerHeight * 0.42,
      active: false,
      downLeft: false,
      downRight: false,
    },
    palette: getPalette(),
    frame: 0,
    lastTime: performance.now(),
    lastSpawnAt: 0,
    lastEraseAt: 0,
  };

  resizeCanvas(state);

  const onPointerMove = (event) => setPointerFromEvent(state, event);
  const releasePointer = () => {
    state.pointer.active = false;
    state.pointer.downLeft = false;
    state.pointer.downRight = false;
  };
  const onPointerDown = (event) => {
    setPointerFromEvent(state, event);

    if (event.button === 2 || (event.button === 0 && event.ctrlKey)) {
      event.preventDefault();
      state.pointer.downRight = true;
      despawnNear(state, state.pointer.x, state.pointer.y, 20, 14);
      state.lastEraseAt = performance.now();
      return;
    }

    if (event.button === 0) {
      event.preventDefault();
      state.pointer.downLeft = true;
      spawnBurst(state, state.pointer.x, state.pointer.y, 18);
      state.lastSpawnAt = performance.now();
    }
  };
  const onPointerUp = (event) => {
    if (event.button === 0) {
      state.pointer.downLeft = false;
      state.pointer.downRight = false;
    }
    if (event.button === 2) state.pointer.downRight = false;
  };
  const onContextMenu = (event) => event.preventDefault();
  const onResize = () => resizeCanvas(state);
  const onVisibilityChange = () => {
    state.lastTime = performance.now();
  };

  const themeObserver = new MutationObserver(() => {
    state.palette = getPalette();
  });

  themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", releasePointer);
  window.addEventListener("resize", onResize);
  window.addEventListener("blur", releasePointer);
  document.addEventListener("visibilitychange", onVisibilityChange);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("contextmenu", onContextMenu);

  const animate = (time) => {
    const dt = Math.min(1.8, Math.max(0.35, (time - state.lastTime) / 16.67));
    state.lastTime = time;

    updateAgents(state, dt, time);
    render(state, time);
    state.frame = requestAnimationFrame(animate);
  };

  state.frame = requestAnimationFrame(animate);

  cleanup = () => {
    cancelAnimationFrame(state.frame);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", releasePointer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("blur", releasePointer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("contextmenu", onContextMenu);
    themeObserver.disconnect();
    canvas.dataset.initialized = "false";
  };
}

function teardownAgents() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}

if (typeof reducedMotionQuery.addEventListener === "function") {
  reducedMotionQuery.addEventListener("change", (event) => {
    if (event.matches) {
      teardownAgents();
    } else {
      initAgents();
    }
  });
}

document.addEventListener("DOMContentLoaded", initAgents);
document.addEventListener("turbo:load", initAgents);
document.addEventListener("turbo:before-cache", teardownAgents);
window.addEventListener("pagehide", teardownAgents);

initAgents();
