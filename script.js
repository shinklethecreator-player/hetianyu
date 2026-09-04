const hero = document.querySelector(".hero");
const cloud = document.querySelector(".ascii-cloud");
const canvas = document.getElementById("attention-canvas");
const ctx = canvas.getContext("2d", { alpha: true });

const pointer = { x: 0, y: 0, active: false };
const nodes = [
  { x: 0.28, y: 0.34, phase: 0.4 },
  { x: 0.36, y: 0.66, phase: 1.6 },
  { x: 0.42, y: 0.28, phase: 2.2 },
  { x: 0.52, y: 0.45, phase: 3.1 },
  { x: 0.58, y: 0.25, phase: 4.3 },
  { x: 0.66, y: 0.57, phase: 5.1 },
  { x: 0.74, y: 0.36, phase: 0.9 },
  { x: 0.81, y: 0.62, phase: 2.8 },
  { x: 0.86, y: 0.43, phase: 4.9 },
];
const edges = [
  [0, 2],
  [0, 3],
  [1, 3],
  [1, 5],
  [2, 3],
  [2, 4],
  [3, 5],
  [4, 6],
  [5, 6],
  [5, 7],
  [6, 8],
  [7, 8],
];

let width = 0;
let height = 0;
let dpr = 1;
let scrollProgress = 0;
let targetProgress = 0;
let lastTime = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function resize() {
  const rect = hero.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = rect.width;
  height = rect.height;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function updateProgress() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  targetProgress = clamp(window.scrollY / maxScroll, 0, 1);
}

function localNodes(time) {
  const zoom = 1 + scrollProgress * 0.18;
  return nodes.map((node) => ({
    x: width * (0.5 + (node.x - 0.5) * zoom) + Math.sin(time * 0.00032 + node.phase) * 5,
    y: height * (0.5 + (node.y - 0.5) * zoom) + Math.cos(time * 0.00029 + node.phase) * 4,
    phase: node.phase,
  }));
}

function drawLine(a, b, alpha) {
  const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.3})`);
  gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
  gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.24})`);
  ctx.strokeStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawStar(point, time, strength) {
  const pulse = 1 + Math.sin(time * 0.0024 + point.phase) * 0.16;
  const radius = mix(1.7, 2.8, strength) * pulse;
  const ray = mix(8, 15, strength) * pulse;

  ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = `rgba(255, 255, 255, ${mix(0.66, 0.92, strength)})`;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 8;
  ctx.strokeStyle = `rgba(255, 255, 255, ${mix(0.24, 0.45, strength)})`;
  ctx.beginPath();
  ctx.moveTo(point.x - ray, point.y);
  ctx.lineTo(point.x + ray, point.y);
  ctx.moveTo(point.x, point.y - ray);
  ctx.lineTo(point.x, point.y + ray);
  ctx.stroke();
}

function draw(time = 0) {
  const delta = lastTime ? Math.min(40, time - lastTime) : 16;
  lastTime = time;
  scrollProgress += (targetProgress - scrollProgress) * Math.min(1, delta * 0.01);

  const zoom = mix(1, 1.55, scrollProgress);
  const breath = 1 + Math.sin(time * 0.0004) * 0.012;
  cloud.style.setProperty("--cloud-zoom", String(zoom * breath));

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineWidth = mix(0.75, 1.25, scrollProgress);

  const points = localNodes(time);
  for (const [start, end] of edges) {
    drawLine(points[start], points[end], mix(0.12, 0.28, scrollProgress));
  }

  if (pointer.active) {
    const nearest = points
      .slice()
      .sort(
        (a, b) =>
          Math.hypot(pointer.x - a.x, pointer.y - a.y) -
          Math.hypot(pointer.x - b.x, pointer.y - b.y),
      )
      .slice(0, 4);

    nearest.forEach((point, index) => {
      const distance = Math.hypot(pointer.x - point.x, pointer.y - point.y);
      const alpha = (1 - clamp(distance / 360, 0, 1)) * (0.28 - index * 0.04);
      if (alpha > 0.02) drawLine(point, pointer, alpha);
    });
  }

  points.forEach((point) => drawStar(point, time, scrollProgress));
  ctx.restore();
  requestAnimationFrame(draw);
}

function onPointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
  pointer.active = true;
}

function onPointerLeave() {
  pointer.active = false;
}

resize();
updateProgress();
window.addEventListener("resize", resize);
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerleave", onPointerLeave);
requestAnimationFrame(draw);
