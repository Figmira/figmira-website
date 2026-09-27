/* ═══════════════════════════════════════════════════════════════════
   FIGMIRA WISP CURSOR
   The mouse pointer becomes a small glowing wisp with a soft flowing
   tail, like the wisps released in the finale.
   • Over links and buttons it grows brighter and warmer.
   • Clicking sends out a tiny burst of sparks.
   • Only on computers with a mouse. Phones, tablets, and visitors who
     turn off animations keep their normal pointer.
   Works on every page that includes this file (home and research).
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!hasMouse || reduced) return; // keep the normal pointer

  // Things that count as "clickable", so the wisp reacts to them
  const CLICKABLE = 'a, button, .btn, [role="button"], label, summary, .rs-chip, .brand-card, .value-card, .door-letter';

  // ── Hide the normal pointer (text boxes keep their typing cursor) ──
  const style = document.createElement('style');
  style.textContent =
    'html.fg-cursor-on, html.fg-cursor-on * { cursor: none !important; }' +
    'html.fg-cursor-on input, html.fg-cursor-on textarea { cursor: text !important; }' +
    '#fg-cursor { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 2147483000; }';
  document.head.appendChild(style);

  // ── The drawing surface: a see-through canvas over the whole screen ──
  const canvas = document.createElement('canvas');
  canvas.id = 'fg-cursor';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }

  // ── Where things are ──
  let mx = -100, my = -100;          // the real mouse position
  let hx = -100, hy = -100;          // the wisp's head (glides after the mouse)
  let seen = false;                  // has the mouse moved over the page yet?
  let visible = 0;                   // 0 = hidden, 1 = fully shown
  let inside = false;
  let hover = 0, hoverTarget = 0;    // 0 = normal, 1 = over something clickable
  let press = 0;                     // brief squeeze while the button is held
  const trail = [];                  // recent head positions, newest first
  const sparks = [];                 // tiny sparks from clicks
  const TRAIL_MS = 320;              // how long the tail lasts, in milliseconds

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; hx = mx; hy = my; start(); }
    inside = true;
  }, { passive: true });
  document.addEventListener('mouseleave', () => { inside = false; });
  document.addEventListener('mouseenter', () => { inside = true; });
  document.addEventListener('mouseover', (e) => {
    hoverTarget = e.target.closest && e.target.closest(CLICKABLE) ? 1 : 0;
  }, { passive: true });
  window.addEventListener('mousedown', () => {
    press = 1;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
      const s = 60 + Math.random() * 90;
      sparks.push({ x: hx, y: hy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, age: 0, life: 0.45 + Math.random() * 0.3 });
    }
  });
  window.addEventListener('mouseup', () => { press = 0; });
  window.addEventListener('resize', fit);

  // Mix two colors (as [r, g, b]) by k
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k].map(Math.round).join(',');
  const GOLD = [240, 192, 64], VIOLET = [192, 132, 252], PINK = [232, 121, 249], WHITE = [255, 246, 222];

  let running = false, last = 0;
  function start() {
    if (running) return;
    running = true;
    fit();
    document.body.appendChild(canvas);
    document.documentElement.classList.add('fg-cursor-on');
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    // Glide the head toward the mouse, and ease the hover/visibility values
    const follow = 1 - Math.exp(-dt * 28);
    hx += (mx - hx) * follow;
    hy += (my - hy) * follow;
    hover += (hoverTarget - hover) * (1 - Math.exp(-dt * 10));
    visible += ((inside ? 1 : 0) - visible) * (1 - Math.exp(-dt * 8));

    trail.unshift({ x: hx, y: hy, t: now });
    while (trail.length && now - trail[trail.length - 1].t > TRAIL_MS) trail.pop();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (visible < 0.01 && !sparks.length) return;
    ctx.globalCompositeOperation = 'lighter';   // overlapping light adds up and glows
    ctx.lineCap = 'round';

    const size = 3 + hover * 1.6 - press * 0.8;
    const tailColor = (k) => mix(mix(GOLD, PINK, hover).split(',').map(Number), VIOLET, k);

    // The tail: a soft wide glow, then a bright thin core, both tapering away
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < trail.length - 1; i++) {
        const k = i / Math.max(1, trail.length - 1);          // 0 at the head, 1 at the tip
        const taper = 1 - k;
        const a = visible * taper * (pass === 0 ? 0.16 : 0.7 * taper);
        if (a < 0.01) continue;
        ctx.strokeStyle = `rgba(${tailColor(k)}, ${a.toFixed(3)})`;
        ctx.lineWidth = pass === 0 ? size * 3.2 * taper + 1 : size * 0.9 * taper + 0.3;
        ctx.beginPath();
        ctx.moveTo(trail[i].x, trail[i].y);
        ctx.lineTo(trail[i + 1].x, trail[i + 1].y);
        ctx.stroke();
      }
    }

    // The head: a small bright light with a soft halo that breathes
    const breathe = 1 + 0.08 * Math.sin(now / 420);
    const r = (size * 5.5 + hover * 10) * breathe;
    const halo = mix(GOLD, PINK, hover);
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
    g.addColorStop(0, `rgba(${WHITE.join(',')}, ${(0.95 * visible).toFixed(3)})`);
    g.addColorStop(0.16, `rgba(${halo}, ${(0.75 * visible).toFixed(3)})`);
    g.addColorStop(0.5, `rgba(${halo}, ${(0.16 * visible).toFixed(3)})`);
    g.addColorStop(1, `rgba(${halo}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.fill();

    // Over something clickable: a thin ring of light around the wisp
    if (hover > 0.02) {
      ctx.strokeStyle = `rgba(${mix(GOLD, WHITE, 0.3)}, ${(0.45 * hover * visible).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hx, hy, 14 + hover * 6 * breathe, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Click sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age += dt;
      if (s.age >= s.life) { sparks.splice(i, 1); continue; }
      s.vx *= Math.exp(-dt * 4); s.vy *= Math.exp(-dt * 4);
      s.x += s.vx * dt; s.y += s.vy * dt;
      const a = 1 - s.age / s.life;
      ctx.fillStyle = `rgba(${mix(GOLD, WHITE, a)}, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.6 * a + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
})();
