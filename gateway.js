/* ═══════════════════════════════════════════════════════════════════
   FIGMIRA GATEWAY  —  "The Figment Rift"
   ───────────────────────────────────────────────────────────────────
   What this does, in plain English:
   • Paints a living "world" behind your whole website using WebGL
     (the graphics chip in the visitor's computer or phone).
   • Each of your four pillars (Play, Envision, Forge, Expand) and your
     Brands section gets its OWN world.
   • As the visitor scrolls toward the next pillar, a tiny ✦ (your star)
     appears in the center of the screen, then tears open like a rift.
     The next world is visible through it, and it keeps opening until
     the visitor has "passed through" into that world.
   • Golden dust flies toward the camera and speeds up while the visitor
     is passing through, so it feels like travelling.

   Libraries used:
   • three.js: a well-known, free library that makes WebGL much easier.
     It is loaded from a CDN (a public file server), so there's nothing
     to install.
   ═══════════════════════════════════════════════════════════════════ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/* ───────────────────────────────────────────────────────────────────
   SETTINGS YOU CAN SAFELY CHANGE
   ─────────────────────────────────────────────────────────────────── */
const CONFIG = {
  // Which parts of the page open a new world, in order.
  // (These match the class names and IDs already on figmira.com.)
  gatewaySelectors: ['.value-card', '#brands', '#finale'],

  // Which world each stop on the journey shows (numbers match the list below).
  // The last stop, the finale, returns to world 0: the journey ends where it began.
  journey: [0, 1, 2, 3, 4, 5, 0],

  // Where on the screen the rift starts and finishes opening:
  // 0.95 = the pillar's top edge is near the bottom of the screen
  // 0.35 = the pillar's top edge is about a third of the way down
  riftStart: 0.95,
  riftEnd: 0.35,

  // Adds a small "World I · Play" label above each pillar. Set to false to turn off.
  chapterLabels: true,

  // Number of flying dust particles (fewer on phones for speed).
  particlesDesktop: 1400,
  particlesMobile: 600,

  // Colors of the flying dust in each world, as [color A, color B].
  // Order: Home, Play, Envision, Forge, Expand, Brands
  dustColors: [
    ['#c084fc', '#f0c040'], // 0 Home: the Figment sky
    ['#b48cff', '#fde68a'], // 1 Play: the spiral galaxy
    ['#00dcb4', '#c084fc'], // 2 Envision: aurora mist
    ['#ffd36b', '#ff8a3c'], // 3 Forge: radiance
    ['#e879f9', '#fde68a'], // 4 Expand: the multiverse
    ['#fde68a', '#c084fc'], // 5 Brands: the Figmira universe
  ],
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// One color per stop on the journey: Home, Play, Envision, Forge, Expand, Studio, Finale.
// The FIGMIRA letters (title and menu) light up in these colors.
const LETTER_COLORS = ['#c084fc', '#f0c040', '#2ee6c8', '#ff9a3c', '#e879f9', '#b9b4ff', '#fff1c1'];
const WORLD_COUNT = 6; // number of worlds drawn in the shader below

/* ───────────────────────────────────────────────────────────────────
   1. CHECK THE VISITOR'S SETTINGS
   ─────────────────────────────────────────────────────────────────── */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
const root = document.documentElement;

/* ───────────────────────────────────────────────────────────────────
   2. GLOWING BRAND BUTTERFLIES (plain HTML/CSS/SVG; they work even without WebGL)
   Your Figmira butterfly sits on each brand card. Its body glows like
   a pillar of light, sparks drift up from it, and the wings flutter
   gently. Each brand has its own color (set in gateway.css).
   ─────────────────────────────────────────────────────────────────── */

// The butterfly drawing, taken from the logo in your navigation bar.
// "n" gives each copy its own color-gradient names so the three don't clash.
function butterflySVG(n) {
  return `
  <svg class="gw-fly-svg" viewBox="0 0 200 180" fill="none">
    <defs>
      <radialGradient id="gwWL${n}" cx="25%" cy="35%" r="75%">
        <stop offset="0%" class="gw-s1"/><stop offset="50%" class="gw-s2"/><stop offset="100%" class="gw-s3"/>
      </radialGradient>
      <radialGradient id="gwWR${n}" cx="75%" cy="35%" r="75%">
        <stop offset="0%" class="gw-s1"/><stop offset="50%" class="gw-s2"/><stop offset="100%" class="gw-s3"/>
      </radialGradient>
      <linearGradient id="gwBody${n}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" class="gw-b1"/><stop offset="50%" stop-color="#ffffff"/><stop offset="100%" class="gw-b1"/>
      </linearGradient>
    </defs>
    <g class="gw-wings">
      <path class="gw-wing-top" d="M97,88 C86,72 62,48 36,30 C16,16 4,18 4,36 C4,56 22,76 46,86 C68,96 88,92 97,88Z" fill="url(#gwWL${n})"/>
      <path class="gw-wing-top" d="M103,88 C114,72 138,48 164,30 C184,16 196,18 196,36 C196,56 178,76 154,86 C132,96 112,92 103,88Z" fill="url(#gwWR${n})"/>
      <path class="gw-wing-low" d="M97,94 C80,102 52,114 32,128 C14,140 8,156 18,162 C30,170 56,160 76,144 C94,130 100,112 97,94Z"/>
      <path class="gw-wing-low" d="M103,94 C120,102 148,114 168,128 C186,140 192,156 182,162 C170,170 144,160 124,144 C106,130 100,112 103,94Z"/>
    </g>
    <ellipse class="gw-fly-body" cx="100" cy="100" rx="5.5" ry="40" fill="url(#gwBody${n})"/>
  </svg>`;
}

function addButterflies() {
  const cards = document.querySelectorAll('.brand-card');
  if (!cards.length) return;

  // When a card scrolls into view, its butterfly's light "ignites"
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const fly = entry.target.querySelector('.gw-fly');
      if (fly) fly.classList.toggle('gw-lit', entry.isIntersecting);
    });
  }, { threshold: 0.3 });

  cards.forEach((card, n) => {
    if (card.querySelector('.gw-fly')) return; // don't add twice
    const fly = document.createElement('div');
    fly.className = 'gw-fly';
    fly.setAttribute('aria-hidden', 'true'); // decoration only: screen readers skip it

    // Light sparks that float up from the butterfly's body, each with its own path and timing
    let sparks = '';
    for (let i = 0; i < 9; i++) {
      const dx = ((Math.random() - 0.5) * 70).toFixed(0);
      const rise = (60 + Math.random() * 60).toFixed(0);
      const dur = (2.6 + Math.random() * 2.4).toFixed(2);
      const del = (Math.random() * 3).toFixed(2);
      const size = (2 + Math.random() * 2.5).toFixed(1);
      sparks += `<i style="--dx:${dx}px;--rise:${rise}px;--dur:${dur}s;--del:${del}s;--sz:${size}px"></i>`;
    }

    fly.innerHTML = `
      <span class="gw-fly-halo"></span>
      <span class="gw-fly-beam"></span>
      ${butterflySVG(n)}
      <span class="gw-fly-sparks">${sparks}</span>`;
    card.prepend(fly);
    io.observe(card);
  });
}
addButterflies();

/* ───────────────────────────────────────────────────────────────────
   2b. "COMING SOON" LABELS
   The arrows promised a click that went nowhere. Until a brand page
   exists, the label stays but stops pretending to be a link.
   (Give a link a real address in index.html and it works normally again.)
   ─────────────────────────────────────────────────────────────────── */
document.querySelectorAll('.brand-link').forEach((link) => {
  const href = link.getAttribute('href');
  if (href && href !== '#') return; // a real link: leave it alone
  link.textContent = link.textContent.replace(/\s*→\s*/, '').trim();
  link.classList.add('gw-soon');
  link.removeAttribute('href');       // no longer clickable
  link.setAttribute('aria-disabled', 'true');
});

/* ───────────────────────────────────────────────────────────────────
   2b+. LATEST RESEARCH NOTE
   Reads the list of notes from the Research page and shows the newest
   one on the Studios card. When you publish a new note, this updates
   by itself. (If the list can't be read, nothing is shown.)
   ─────────────────────────────────────────────────────────────────── */
async function showLatestNote() {
  const card = document.getElementById('card-studios');
  if (!card || !location.protocol.startsWith('http')) return;
  try {
    const res = await fetch('/research/notes.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const notes = await res.json();
    if (!notes.length) return;
    const line = document.createElement('p');
    line.className = 'gw-latest';
    const label = document.createElement('span');
    label.textContent = 'Latest note';
    const link = document.createElement('a');
    link.href = notes[0].url;
    link.textContent = notes[0].title;
    line.append(label, link);
    const button = card.querySelector('.brand-link');
    card.insertBefore(line, button || null);
  } catch (e) { /* no Research page yet: leave the card as it is */ }
}
showLatestNote();

/* ───────────────────────────────────────────────────────────────────
   2d. THE FIGMIRA LETTERS
   • On page load, the title's letters flare one by one, each in the
     color of the world it stands for.
   • The FIGMIRA wordmark in the menu becomes a journey tracker: each
     letter lights up once you reach its world (F = Home ... A = Finale).
   ─────────────────────────────────────────────────────────────────── */
const titleLetters = Array.from(document.querySelectorAll('#gwLetters .gw-letter'));
const navLogo = document.querySelector('.nav-logo');
let navLetters = [];
if (navLogo && !navLogo.querySelector('span')) {
  const word = navLogo.textContent.trim();
  navLogo.setAttribute('aria-label', word);
  navLogo.textContent = '';
  navLetters = Array.from(word).map((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--c', LETTER_COLORS[i % LETTER_COLORS.length]);
    navLogo.appendChild(s);
    return s;
  });
  navLogo.classList.add('fg-track');
}
function flare(el) {
  if (!el || reducedMotion) return;
  el.classList.remove('fg-flare');
  void el.offsetWidth;                       // restart the animation
  el.classList.add('fg-flare');
}
let litStops = -1;
// Called whenever the journey reaches a new world (stop = 0 for Home ... 6 for Finale)
function lightLetters(stop) {
  if (stop === litStops) return;
  const forward = stop > litStops;
  titleLetters.forEach((l, i) => l.classList.toggle('fg-on', i <= stop));
  navLetters.forEach((l, i) => l.classList.toggle('fg-on', i <= stop));
  if (forward && litStops >= 0) { flare(navLetters[stop]); flare(titleLetters[stop]); }
  litStops = stop;
}
// The opening: letters flare left to right while the world blooms open
titleLetters.forEach((l, i) => setTimeout(() => flare(l), 900 + i * 150));
lightLetters(0);

/* ───────────────────────────────────────────────────────────────────
   2c. RELEASE IT (the finale)
   Clicking "Release it" bursts the ✦ into glowing wisps. They fly
   outward, slow down, and weave across the screen with flowing tails
   as if exploring the universe, then fade into the distance. A few seconds
   later, light gathers and the ✦ re-forms so it can be released again.
   ─────────────────────────────────────────────────────────────────── */
const FIGMENT_COLORS = ['#f0c040', '#fde68a', '#e879f9', '#c084fc', '#5eead4', '#ffb450'];
const rand = (a, b) => a + Math.random() * (b - a);

function setupRelease() {
  const btn = document.getElementById('gwRelease');
  const star = document.querySelector('.gw-finale-star');
  const msg = document.getElementById('gwReleaseMsg');
  if (!btn || !star) return;

  // One see-through layer over the whole screen where the figments fly
  let layer = document.getElementById('gwFigmentLayer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'gwFigmentLayer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }

  let busy = false;
  btn.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    btn.disabled = true;

    // Where the star is on screen right now
    const r = star.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    star.classList.remove('gw-reform');
    star.classList.add('gw-burst');
    window.dispatchEvent(new CustomEvent('figmira:figment')); // a rush of golden dust in the sky
    releaseFigments(layer, cx, cy);
    if (msg) msg.textContent = 'Your figments are off exploring the universe.';

    // Light gathers and the star re-forms
    setTimeout(() => reformStar(star, layer), 4200);
    setTimeout(() => {
      busy = false;
      btn.disabled = false;
      if (msg) msg.textContent = 'Release another?';
    }, 5800);
  });
}

// Figments are wisps: soft glowing lights with flowing tails, drawn on a
// see-through canvas (a drawing surface) that covers the screen while they fly.
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function releaseFigments(layer, cx, cy) {
  const canvas = document.createElement('canvas');
  layer.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const fit = () => {
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  };
  fit();
  window.addEventListener('resize', fit);

  const count = isMobile ? 16 : 28;
  const wisps = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand(-0.3, 0.3);
    const burst = reducedMotion ? 0 : rand(260, 620);          // speed of the burst, pixels per second
    wisps.push({
      x: reducedMotion ? cx + Math.cos(angle) * rand(50, 280) : cx,
      y: reducedMotion ? cy + Math.sin(angle) * rand(40, 200) : cy,
      vx: Math.cos(angle) * burst,
      vy: Math.sin(angle) * burst,
      heading: angle,                     // the direction it wanders toward
      turn: rand(-0.6, 0.6),              // how much it curves as it explores
      drift: reducedMotion ? 0 : rand(30, 75),
      sway: rand(0.8, 1.6),               // how much it weaves side to side
      swayRate: rand(1.4, 2.8),
      phase: rand(0, 6.28),
      age: 0,
      life: rand(8, 14),                  // seconds before it fades away
      tailLength: rand(80, 170),          // length of its glowing tail, in pixels
      size: rand(2.2, 4.2),
      rgb: hexToRgb(FIGMENT_COLORS[i % FIGMENT_COLORS.length]),
      trail: [],
    });
  }

  let last = performance.now();
  function step(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = 'lighter';   // overlapping light adds up and glows
    ctx.lineCap = 'round';

    let alive = 0;
    for (const w of wisps) {
      w.age += dt;
      const k = w.age / w.life;
      if (k >= 1) continue;
      alive++;

      // Ease from the fast burst into a slow, weaving glide
      w.heading += w.turn * dt;
      const tx = Math.cos(w.heading) * w.drift;
      const ty = Math.sin(w.heading) * w.drift - 8;                 // a gentle upward float
      const ease = 1 - Math.exp(-dt * 1.4);
      w.vx += (tx - w.vx) * ease;
      w.vy += (ty - w.vy) * ease;
      const swing = Math.sin(w.age * w.swayRate + w.phase) * w.sway * w.drift;
      w.x += (w.vx - Math.sin(w.heading) * swing) * dt;             // weave sideways...
      w.y += (w.vy + Math.cos(w.heading) * swing) * dt;             // ...while moving forward

      // Remember where it has been, to draw the tail
      const head = w.trail[0];
      if (!head || Math.hypot(w.x - head.x, w.y - head.y) > 2.5) w.trail.unshift({ x: w.x, y: w.y });
      let length = 0;
      const maxLength = w.tailLength * (1 - 0.4 * k);               // tails shorten as they fade
      for (let i = 1; i < w.trail.length; i++) {
        length += Math.hypot(w.trail[i].x - w.trail[i - 1].x, w.trail[i].y - w.trail[i - 1].y);
        if (length > maxLength) { w.trail.length = i + 1; break; }
      }

      const fadeIn = Math.min(1, w.age / 0.2);
      const fadeOut = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
      const flicker = 0.8 + 0.2 * Math.sin(w.age * 6 + w.phase);
      const alpha = fadeIn * fadeOut * flicker;

      // The tail: a soft wide glow, then a bright thin core, both tapering away
      const pts = w.trail;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < pts.length - 1; i++) {
          const t = i / Math.max(1, pts.length - 1);                // 0 at the head, 1 at the tip
          const taper = 1 - t;
          ctx.strokeStyle = pass === 0
            ? `rgba(${w.rgb}, ${(alpha * taper * 0.18).toFixed(3)})`
            : `rgba(${w.rgb}, ${(alpha * taper * taper * 0.75).toFixed(3)})`;
          ctx.lineWidth = pass === 0 ? w.size * 4 * taper + 1 : w.size * taper + 0.4;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
          ctx.stroke();
        }
      }

      // The head: a small bright light with a soft halo
      const r = w.size * 7;
      const g = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, r);
      g.addColorStop(0, `rgba(255, 255, 255, ${(alpha * 0.95).toFixed(3)})`);
      g.addColorStop(0.18, `rgba(${w.rgb}, ${(alpha * 0.8).toFixed(3)})`);
      g.addColorStop(1, `rgba(${w.rgb}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (alive) requestAnimationFrame(step);
    else { window.removeEventListener('resize', fit); canvas.remove(); }
  }
  requestAnimationFrame(step);
}

function reformStar(star, layer) {
  const r = star.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  // A few sparks of light drift in from around the star...
  if (!reducedMotion) {
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('span');
      s.className = 'gw-gather';
      const a = (i / 12) * Math.PI * 2;
      const d = rand(90, 160);
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      layer.appendChild(s);
      const anim = s.animate([
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) translate(-50%, -50%)`, opacity: 0 },
        { opacity: 1, offset: 0.4 },
        { transform: 'translate(0, 0) translate(-50%, -50%)', opacity: 0 },
      ], { duration: 1100, easing: 'cubic-bezier(0.5, 0, 0.2, 1)', delay: i * 25 });
      anim.onfinish = () => s.remove();
    }
  }
  // ...and the ✦ forms again
  setTimeout(() => {
    star.classList.remove('gw-burst');
    star.classList.add('gw-reform');
    setTimeout(() => star.classList.remove('gw-reform'), 1400); // back to its gentle breathing
  }, reducedMotion ? 0 : 700);
}
setupRelease();

/* ───────────────────────────────────────────────────────────────────
   3. START WEBGL (or fall back gracefully)
   ─────────────────────────────────────────────────────────────────── */
const canvas = document.createElement('canvas');
canvas.id = 'gw-world';
canvas.setAttribute('aria-hidden', 'true');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
} catch (err) {
  // This device can't draw WebGL. Show the calm static sky instead and stop here.
  root.classList.add('gw-nowebgl');
  console.info('[Figmira Gateway] WebGL unavailable, using static background.');
}

function startGateway() {
  document.body.prepend(canvas);
  root.classList.add('gw-on');

  // The gateway triggers (each one opens the next world)
  const triggers = CONFIG.gatewaySelectors
    .flatMap((sel) => Array.from(document.querySelectorAll(sel)))
    .slice(0, CONFIG.journey.length - 1);

  // Chapter labels: "World I · Play", read from your existing card titles
  if (CONFIG.chapterLabels) {
    document.querySelectorAll('.value-card').forEach((card, i) => {
      if (card.querySelector('.gw-chapter')) return;
      const title = card.querySelector('.value-label');
      const label = document.createElement('p');
      label.className = 'gw-chapter';
      label.textContent = `World ${ROMAN[i] || i + 1}${title ? ' · ' + title.textContent.trim() : ''}`;
      card.prepend(label);
    });
  }

  /* ── Sharpness vs. speed ──
     "Pixel ratio" = how many real pixels we draw per screen point.
     Lower = faster. We cap it, and lower it more if the device struggles. */
  let qualityScale = 1;
  const pixelRatio = () =>
    Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5) * qualityScale;
  renderer.setPixelRatio(pixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.autoClear = false;

  /* ── LAYER A: the worlds + the rift (one full-screen "shader") ──
     A shader is a small program that runs on the graphics chip and
     decides the color of every pixel, 60 times a second. */
  const bgScene = new THREE.Scene();
  const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const bgUniforms = {
    uRes:     { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uTime:    { value: 0 },
    uA:       { value: 0 },   // the world you're in
    uB:       { value: 1 },   // the world behind the rift
    uOpen:    { value: 0 },   // 0 = rift is a tiny star, 1 = fully open
    uSeed:    { value: 1 },   // show the tiny star? (hidden after the last world)
    uSpin:    { value: 0 },
    uIntro:   { value: reducedMotion ? 1 : 0 }, // the opening "entrance" animation
    uReduced: { value: reducedMotion ? 1 : 0 },
  };
  const bgMaterial = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    defines: { OCTAVES: isMobile ? 3 : 5 }, // less detail on phones = faster
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: WORLD_SHADER,
    depthTest: false,
    depthWrite: false,
  });
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial));

  /* ── LAYER B: golden dust flying toward you ── */
  const fxScene = new THREE.Scene();
  const fxCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  const COUNT = isMobile ? CONFIG.particlesMobile : CONFIG.particlesDesktop;
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    // Place each speck in a ring around the center, so the middle stays clear for your text
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.6 + Math.pow(Math.random(), 0.7) * 9;
    positions[i * 3]     = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = Math.random() * 65;
    seeds[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const dustUniforms = {
    uTravel: { value: 0 },
    uSize:   { value: isMobile ? 5.0 : 6.0 },
    uPR:     { value: renderer.getPixelRatio() },
    uC1:     { value: new THREE.Color(CONFIG.dustColors[0][0]) },
    uC2:     { value: new THREE.Color(CONFIG.dustColors[0][1]) },
    uBoost:  { value: 0 },
  };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: dustUniforms,
    vertexShader: /* glsl */`
      attribute float aSeed;
      uniform float uTravel, uSize, uPR, uBoost;
      varying float vAlpha; varying float vSeed;
      void main() {
        vec3 p = position;
        // Move every speck toward the camera, looping back to the far end
        p.z = mod(p.z + uTravel * (0.6 + aSeed * 0.8), 65.0) - 60.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float depth = -mv.z;
        gl_PointSize = uSize * uPR * (0.5 + aSeed) * (1.0 + uBoost * 0.8) * (10.0 / max(depth, 0.5));
        vAlpha = smoothstep(60.0, 22.0, depth) * smoothstep(0.4, 3.0, depth);
        vSeed = aSeed;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uC1, uC2; uniform float uBoost;
      varying float vAlpha; varying float vSeed;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d); a *= a;
        vec3 col = mix(uC1, uC2, step(0.5, vSeed));
        gl_FragColor = vec4(col, a * vAlpha * (0.45 + uBoost * 0.55));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  fxScene.add(dust);

  /* ── Pre-made colors for the dust in every world ── */
  const palettes = CONFIG.dustColors.map(([a, b]) => [new THREE.Color(a), new THREE.Color(b)]);

  /* ───────────────────────────────────────────────────────────────
     4. READ THE SCROLL POSITION → "JOURNEY"
     journey = 0 on the home screen, 1 in Play, 2 in Envision, and so on.
     The part after the decimal point is how far the rift has opened.
     ─────────────────────────────────────────────────────────────── */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function readJourney() {
    const vh = window.innerHeight;
    let j = 0;
    for (const el of triggers) {
      const top = el.getBoundingClientRect().top;
      j += clamp((vh * CONFIG.riftStart - top) / (vh * (CONFIG.riftStart - CONFIG.riftEnd)), 0, 1);
    }
    return j;
  }

  let journey = readJourney();
  let lastJourney = journey;
  let lastScrollY = window.scrollY;
  let travel = 0;
  let boost = 0;
  let flare = 0;
  // When a visitor releases a figment, send a rush of golden dust through the sky
  window.addEventListener('figmira:figment', () => { flare = 1; });
  let clockStart = performance.now();
  let lastTime = clockStart;
  let introStart = null;
  let needsRender = true;

  /* ── Screen size changes (rotating a phone, resizing a window) ── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderer.setPixelRatio(pixelRatio());
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      bgUniforms.uRes.value.set(window.innerWidth, window.innerHeight);
      fxCamera.aspect = window.innerWidth / window.innerHeight;
      fxCamera.updateProjectionMatrix();
      dustUniforms.uPR.value = renderer.getPixelRatio();
      needsRender = true;
    }, 150);
  });
  window.addEventListener('scroll', () => { needsRender = true; }, { passive: true });

  /* ── Automatic quality: if the first ~2 seconds run slowly, draw fewer pixels ── */
  let frameCount = 0, frameTimeSum = 0, qualityChecked = false;

  /* ───────────────────────────────────────────────────────────────
     5. THE ANIMATION LOOP (runs about 60 times per second)
     ─────────────────────────────────────────────────────────────── */
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Smoothly follow the scroll position
    const target = readJourney();
    journey += (target - journey) * (1 - Math.exp(-dt * 9));
    const journeySpeed = Math.abs(journey - lastJourney) / Math.max(dt, 0.001);
    const scrollSpeed = Math.abs(window.scrollY - lastScrollY) / Math.max(dt, 0.001);
    lastJourney = journey;
    lastScrollY = window.scrollY;

    // Which world are we in, and how open is the rift to the next one?
    // (a "stop" is a place on the journey; each stop shows one of the worlds)
    const lastStop = Math.min(triggers.length, CONFIG.journey.length - 1);
    const j = clamp(journey, 0, lastStop);
    const current = Math.min(Math.floor(j), lastStop);
    const open = current >= lastStop ? 0 : j - current;
    const worldNow = CONFIG.journey[current] % WORLD_COUNT;
    const worldNext = CONFIG.journey[Math.min(current + 1, lastStop)] % WORLD_COUNT;

    // Reduced-motion visitors: only redraw when something actually changed
    if (reducedMotion) {
      if (!needsRender && Math.abs(target - journey) < 0.0005) return;
      needsRender = false;
    }

    bgUniforms.uA.value = worldNow;
    bgUniforms.uB.value = worldNext;
    bgUniforms.uOpen.value = open;
    // The little ✦ only appears once the next rift starts to open (so it never sits on your text)
    bgUniforms.uSeed.value = current >= lastStop ? 0 : Math.min(1, open / 0.06);
    lightLetters(open > 0.5 ? current + 1 : current);
    bgUniforms.uTime.value = reducedMotion ? 12.0 : (now - clockStart) / 1000;
    bgUniforms.uSpin.value = reducedMotion ? 0 : bgUniforms.uTime.value * 0.05;

    // The entrance: your world blooms open from a ✦ when the page loads
    if (!reducedMotion && bgUniforms.uIntro.value < 1) {
      if (introStart === null) introStart = now + 250;
      const k = clamp((now - introStart) / 2600, 0, 1);
      bgUniforms.uIntro.value = 1 - Math.pow(1 - k, 3); // ease-out
    }

    // Dust: faster while scrolling, fastest while passing through a rift
    if (!reducedMotion) {
      const passing = Math.sin(Math.PI * open); // peaks mid-way through a rift
      flare = Math.max(0, flare - dt * 0.5); // the burst from releasing a figment fades out
      const wantBoost = Math.max(clamp(journeySpeed * 1.2 + scrollSpeed / 2500, 0, 1) * (0.4 + passing), flare);
      boost += (wantBoost - boost) * (1 - Math.exp(-dt * 4));
      travel += dt * (1.4 + boost * 22);
    }
    dustUniforms.uTravel.value = travel;
    dustUniforms.uBoost.value = boost;
    const pa = palettes[worldNow];
    const pb = palettes[worldNext];
    dustUniforms.uC1.value.copy(pa[0]).lerp(pb[0], open);
    dustUniforms.uC2.value.copy(pa[1]).lerp(pb[1], open);

    renderer.clear();
    renderer.render(bgScene, bgCamera);
    renderer.render(fxScene, fxCamera);

    // Automatic quality check (once)
    if (!qualityChecked && !reducedMotion) {
      frameCount++; frameTimeSum += dt;
      if (frameCount === 120) {
        qualityChecked = true;
        const avgMs = (frameTimeSum / frameCount) * 1000;
        if (avgMs > 24) { // slower than ~40 frames per second
          qualityScale = 0.65;
          renderer.setPixelRatio(pixelRatio());
          renderer.setSize(window.innerWidth, window.innerHeight, false);
          dustUniforms.uPR.value = renderer.getPixelRatio();
          console.info('[Figmira Gateway] Lowered quality for smoother motion.');
        }
      }
    }
  }
  requestAnimationFrame(frame);
}

/* ═══════════════════════════════════════════════════════════════════
   THE WORLD SHADER
   This is the "painting" of every world and the ✦ rift. It is written
   in GLSL, the language graphics chips understand.
   To swap in real artwork later: see "SWAP IN ARTWORK" at the bottom
   of this file.
═══════════════════════════════════════════════════════════════════ */
const WORLD_SHADER = /* glsl */`
  uniform vec2  uRes;
  uniform float uTime, uA, uB, uOpen, uSeed, uSpin, uIntro, uReduced;
  varying vec2  vUv;

  // ── Random numbers and soft "cloud" noise ──
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < OCTAVES; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
    return v;
  }
  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  // ── Twinkling stars ──
  float starLayer(vec2 p, float scale, float t) {
    vec2 g = p * scale;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash(id);
    vec2 o = vec2(hash(id + 3.1), hash(id + 9.7)) - 0.5;
    float d = length(f - o * 0.7);
    float tw = 0.55 + 0.45 * sin(t * 1.7 + h * 60.0);
    return smoothstep(0.07, 0.0, d) * step(0.86, h) * tw;
  }
  float stars(vec2 p, float t) { return starLayer(p, 16.0, t) + 0.7 * starLayer(p + 7.3, 30.0, t * 1.3); }

  // ── The six worlds ──
  vec3 world(vec2 p, float id, float t) {
    vec3 col;
    float r = length(p);
    float a = atan(p.y, p.x);

    if (id < 0.5) {
      // 0 · HOME: "The Figment": a violet dusk sky with drifting gold
      float n  = fbm(p * 1.8 + vec2(t * 0.015, -t * 0.01));
      float n2 = fbm(p * 3.5 - n + t * 0.02);
      col  = mix(vec3(0.024, 0.016, 0.06), vec3(0.17, 0.08, 0.34), smoothstep(0.25, 0.85, n));
      col += vec3(0.94, 0.75, 0.25) * pow(n2, 4.0) * 0.35;
      col += vec3(0.48, 0.23, 0.93) * 0.16 * exp(-r * 2.0);
    } else if (id < 1.5) {
      // 1 · PLAY: a spiral galaxy, violet arms and a golden heart
      float sw   = a + 2.6 * log(r + 0.08) - t * 0.05;
      float arms = pow(0.5 + 0.5 * cos(2.0 * sw), 3.0);
      float n    = fbm(vec2(cos(sw), sin(sw)) * r * 4.0 + t * 0.02 + 3.0);
      col  = vec3(0.03, 0.015, 0.08);
      col += vec3(0.47, 0.24, 0.85) * arms * n * exp(-r * 1.6) * 1.5;
      col += vec3(0.99, 0.85, 0.50) * exp(-r * 9.0) * 0.8;
      col += vec3(0.75, 0.52, 0.99) * n * 0.10;
    } else if (id < 2.5) {
      // 2 · ENVISION: aurora ribbons over a teal mist
      float y  = p.y + 0.12 * sin(p.x * 2.2 + t * 0.25) + 0.25 * (fbm(vec2(p.x * 1.5, t * 0.05)) - 0.5);
      float b1 = exp(-abs(y - 0.10) * 9.0);
      float b2 = exp(-abs(y + 0.14 + 0.05 * sin(p.x * 3.0 - t * 0.3)) * 12.0);
      float curtain = fbm(vec2(p.x * 6.0 + t * 0.1, p.y * 1.5));
      col  = mix(vec3(0.01, 0.03, 0.05), vec3(0.03, 0.02, 0.08), p.y + 0.5);
      col += vec3(0.00, 0.86, 0.70) * b1 * curtain * 0.8;
      col += vec3(0.75, 0.52, 0.99) * b2 * curtain * 0.7;
      col += vec3(0.00, 0.50, 0.45) * 0.18 * smoothstep(0.1, -0.5, p.y) * fbm(p * 3.0 + t * 0.05);
    } else if (id < 3.5) {
      // 3 · FORGE: radiance, golden rays and rising embers
      float n    = fbm(vec2(a * 3.0, r * 2.0 - t * 0.2));
      float rays = pow(0.5 + 0.5 * cos(a * 14.0 + t * 0.15 + n * 2.0), 10.0);
      col  = vec3(0.05, 0.02, 0.01);
      col += vec3(1.00, 0.72, 0.25) * rays * exp(-r * 1.4) * 0.55;
      col += vec3(1.00, 0.86, 0.50) * exp(-r * 5.0) * 0.6;
      col += vec3(0.90, 0.30, 0.08) * fbm(p * 3.0 + vec2(0.0, -t * 0.15)) * 0.28 * smoothstep(0.6, -0.5, p.y);
    } else if (id < 4.5) {
      // 4 · EXPAND: the multiverse, a kaleidoscope of mirrored realms
      float seg = 6.2831853 / 6.0;
      float ka  = mod(a + t * 0.03, seg); ka = abs(ka - seg * 0.5);
      vec2  q   = vec2(cos(ka), sin(ka)) * r;
      float n   = fbm(q * 3.0 + t * 0.03);
      float rings = pow(0.5 + 0.5 * sin(log(r + 0.02) * 7.0 - t * 0.6), 6.0);
      col  = vec3(0.04, 0.01, 0.07);
      col += mix(vec3(0.49, 0.23, 0.93), vec3(0.91, 0.47, 0.98), n) * n * 0.7;
      col += vec3(0.99, 0.90, 0.54) * rings * 0.25 * exp(-r * 1.2);
    } else {
      // 5 · BRANDS: "The Figmira Universe", a calm sea of stars
      float n = fbm(p * 1.2 + t * 0.01);
      col  = vec3(0.024, 0.024, 0.05);
      col += vec3(0.48, 0.23, 0.93) * 0.14 * smoothstep(0.4, 0.9, n);
      col += vec3(0.94, 0.75, 0.25) * 0.07 * smoothstep(0.5, 1.0, fbm(p * 2.0 - 5.0));
    }
    col += vec3(1.0, 0.95, 0.85) * stars(p, t) * 0.9;
    return col;
  }

  // ── The ✦ shape. k < 1 makes a pointed star; k > 1 makes it bulge open. ──
  float starShape(vec2 q, float k) {
    q = abs(q) + 1e-5;
    return pow(pow(q.x, k) + pow(q.y, k), 1.0 / k);
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);   // centered, not stretched
    float t = uTime;
    float o = clamp(uOpen, 0.0, 1.0);
    vec3 gold = vec3(1.0, 0.82, 0.42);
    vec3 col;

    if (uReduced > 0.5) {
      // Reduced motion: a simple, gentle cross-fade between worlds
      col = mix(world(p, uA, t), world(p, uB, t), smoothstep(0.3, 0.7, o));
    } else {
      // The rift grows from a tiny star to bigger than the screen
      float R = mix(0.018, 3.4, o * o);
      float k = mix(0.55, 1.6, smoothstep(0.25, 1.0, o));
      vec2  q = rot(uSpin + o * 0.9) * p;
      float d = starShape(q, k);
      float w = max(0.004, R * 0.025);
      float inside = (1.0 - smoothstep(R - w, R, d)) * uSeed;

      // Outside the rift: the current world, drifting toward you
      vec3 colA = vec3(0.0);
      if (inside < 0.999) colA = world(p / (1.0 + 1.2 * o), uA, t);
      // Inside the rift: the next world, far away at first, then all around you
      vec3 colB = vec3(0.0);
      if (inside > 0.001) colB = world(p * (1.0 + 1.8 * (1.0 - o)), uB, t) * (1.0 + 0.6 * (1.0 - o));
      col = mix(colA, colB, inside);

      // The glowing golden edge of the rift
      float rim = exp(-abs(d - R) / (0.006 + R * 0.035)) * (1.0 - smoothstep(0.75, 1.0, o));
      col += gold * rim * 1.1 * uSeed;

      // The little "figment" star's light streaks (strongest when the rift is small)
      float pulse = 0.8 + 0.2 * sin(t * 2.0);
      float flare = 0.0022 / (abs(q.x) + 0.004) * exp(-abs(q.y) * 30.0)
                  + 0.0022 / (abs(q.y) + 0.004) * exp(-abs(q.x) * 30.0);
      col += gold * flare * pow(1.0 - o, 2.0) * 0.3 * pulse * uSeed;
    }

    // The entrance: everything starts dark and blooms open from a ✦
    if (uIntro < 1.0) {
      float ri = mix(0.0, 3.4, uIntro * uIntro);
      float ki = mix(0.55, 1.6, smoothstep(0.25, 1.0, uIntro));
      vec2  qi = rot(-0.8 * (1.0 - uIntro)) * p;
      float di = starShape(qi, ki);
      float ins = 1.0 - smoothstep(ri - 0.01, ri, di);
      float rimI = exp(-abs(di - ri) / (0.006 + ri * 0.035)) * (1.0 - smoothstep(0.75, 1.0, uIntro));
      col = mix(vec3(0.012, 0.01, 0.025), col, ins) + gold * rimI;
    }

    // Soft darkening at the screen edges, gentle tone curve, and tiny noise to prevent color banding
    col *= 1.0 - 0.45 * pow(length(vUv - 0.5) * 1.25, 2.2);
    col = 1.0 - exp(-col * 1.35);
    col += (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ═══════════════════════════════════════════════════════════════════
   SWAP IN ARTWORK LATER (optional)
   Each world above is painted with math, so there are no image files
   to load. When you have real artwork (for example, AI-generated
   paintings of each world), a developer (or Claude) can load them with
   THREE.TextureLoader and replace the matching "world" branch with
   texture2D(yourImage, uv). Keep the rift and entrance code as they are.
═══════════════════════════════════════════════════════════════════ */

// Everything is defined, so start the effect (only if WebGL is available)
if (renderer) startGateway();
