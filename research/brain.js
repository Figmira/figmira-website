/* ═══════════════════════════════════════════════════════════════════
   ✦ FIGMIRA: THE RESEARCH BRAIN ✦
   A slowly turning brain made of stars. Every note is a glowing neuron
   in its world's part of the brain. Every section inside a note is a
   small violet spark (a "figment") orbiting that neuron. Notes connect
   automatically: by world, by time, and by the ideas they share.
   Nothing to fill in. Each new note simply makes the brain grow.

   If the visitor's device can't draw 3D, this file does nothing and the
   flat star map underneath stays in place.
   ═══════════════════════════════════════════════════════════════════ */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

(function () {
  const map = document.getElementById('rsMap');
  const dataEl = document.getElementById('rsNotes');
  if (!map || !dataEl) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── The notes (written into the page by Jekyll) ──
  const decode = (s) => { const t = document.createElement('textarea'); t.innerHTML = s || ''; return t.value; };
  let notes = [];
  try { notes = JSON.parse(dataEl.textContent); } catch (e) { return; }
  notes.forEach((n) => { n.title = decode(n.title); n.sections = (n.sections || []).map(decode).filter(Boolean); });
  notes.sort((a, b) => (a.date < b.date ? -1 : 1)); // oldest first

  // ── Each world lives in its own part of the brain ──
  // AI: the front (thinking). Blockchain: the top (connecting). Robotics: the
  // cerebellum at the back (movement). Investing: the side (memory and value).
  // Studio: the very center, where everything meets.
  const WORLDS = {
    studio: { c: [0, -0.05, 0.1], color: '#fff1c1' },
    ai: { c: [0, 0.45, 1.35], color: '#2ee6c8' },
    blockchain: { c: [0, 1.0, -0.45], color: '#7cc4ff' },
    robotics: { c: [0, -0.95, -1.3], color: '#ff9a3c' },
    investing: { c: [-1.45, -0.3, 0.2], color: '#f0c040' },
  };

  // ── Set up the 3D scene (bail out quietly if WebGL isn't available) ──
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }
  if (!renderer.getContext()) return;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.className = 'rs-brain';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  map.prepend(renderer.domElement);
  map.classList.add('is-3d');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const brain = new THREE.Group();
  const galaxy = new THREE.Group();
  scene.add(galaxy, brain);
  brain.rotation.set(0.22, -1.75, 0); // start with a side view of the brain

  // A repeatable random number generator, so the brain looks the same on every visit
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = rng(1988);
  const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

  // ── Glowing, twinkling points (one shader used for every kind of star) ──
  const uniforms = { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uScale: { value: 1 } };
  function starMaterial(opacity) {
    return new THREE.ShaderMaterial({
      uniforms: { ...uniforms, uOpacity: { value: opacity } },
      vertexShader: `
        attribute float size; attribute float phase; attribute vec3 color;
        uniform float uTime, uPR, uScale;
        varying vec3 vColor; varying float vTw;
        void main() {
          vColor = color;
          vTw = 0.65 + 0.35 * sin(uTime * 1.4 + phase);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPR * uScale * (60.0 / -mv.z) * smoothstep(1.5, 4.5, -mv.z); // fade stars that drift too close
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor; varying float vTw;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          a = a * a;
          gl_FragColor = vec4(vColor, a * vTw * uOpacity);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      // three.js shares these objects; point each material at the live ones
    });
  }
  function makePoints(list, opacity) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(list.length * 3), col = new Float32Array(list.length * 3);
    const size = new Float32Array(list.length), phase = new Float32Array(list.length);
    list.forEach((p, i) => {
      pos.set(p.p, i * 3); col.set([p.c.r, p.c.g, p.c.b], i * 3);
      size[i] = p.s; phase[i] = p.ph ?? rand() * 6.28;
    });
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    g.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
    const m = starMaterial(opacity);
    m.uniforms.uTime = uniforms.uTime; m.uniforms.uPR = uniforms.uPR; m.uniforms.uScale = uniforms.uScale;
    return new THREE.Points(g, m);
  }

  // ── 1. The brain itself: two wrinkled hemispheres, a cerebellum and a stem ──
  const violet = new THREE.Color('#8b5cf6'), lilac = new THREE.Color('#c4b5fd'), gold = new THREE.Color('#f0c040');
  const worldColors = Object.fromEntries(Object.entries(WORLDS).map(([k, w]) => [k, new THREE.Color(w.color)]));
  const brainPts = [];

  function tint(x, y, z, base) {
    // blend in the color of whichever world's region this star sits in
    const c = base.clone();
    for (const [k, w] of Object.entries(WORLDS)) {
      if (k === 'studio') continue;
      const cx = k === 'investing' ? Math.sign(x || -1) * Math.abs(w.c[0]) : w.c[0]; // investing: both sides
      const d2 = (x - cx) ** 2 + (y - w.c[1]) ** 2 + (z - w.c[2]) ** 2;
      c.lerp(worldColors[k], 0.62 * Math.exp(-d2 / 0.55));
    }
    return c;
  }
  const baseColor = () => (rand() < 0.05 ? gold : rand() < 0.5 ? lilac : violet);

  const starCount = Math.min(9000, 4600 + notes.length * 450); // more notes, brighter brain
  for (let i = 0; i < starCount; i++) {
    const kind = rand();
    let x, y, z, s = 0.55 + rand() * 0.6;
    if (kind < 0.8) {
      // cerebrum: a point on (or just inside) one hemisphere's wrinkled surface
      const side = rand() < 0.5 ? -1 : 1;
      const u = rand() * 2 - 1, th = rand() * Math.PI * 2, r0 = Math.sqrt(1 - u * u);
      let dx = r0 * Math.cos(th), dy = u, dz = r0 * Math.sin(th);
      if (side * dx < -0.55) dx *= 0.35; // flatten the inner wall where the halves meet
      const folds = 1 + 0.07 * Math.sin(7 * dx + 2) * Math.sin(6 * dy + 1) * Math.sin(8 * dz)
        + 0.05 * Math.sin(12 * dx + 10 * dy + 9 * dz) + 0.03 * Math.sin(19 * dy - 14 * dz);
      const depth = rand() < 0.82 ? 1 : 0.55 + rand() * 0.4;
      x = side * 0.7 + dx * 1.02 * folds * depth;
      y = dy * 1.06 * folds * depth;
      z = dz * 1.62 * folds * depth;
      if (y < -0.35) y = -0.35 + (y + 0.35) * 0.62; // flatter underside
      if (depth < 1) s *= 0.7;
    } else if (kind < 0.94) {
      // cerebellum: tucked under the back, with fine horizontal ridges
      const u = rand() * 2 - 1, th = rand() * Math.PI * 2, r0 = Math.sqrt(1 - u * u);
      const ridge = 1 + 0.08 * Math.sin(u * 38);
      x = r0 * Math.cos(th) * 1.05 * ridge; y = -0.95 + u * 0.46 * ridge; z = -1.25 + r0 * Math.sin(th) * 0.62 * ridge;
      s *= 0.85;
    } else {
      // brain stem
      const t = rand(), a = rand() * Math.PI * 2, r = 0.2 * (1 - t * 0.3) * Math.sqrt(rand());
      x = Math.cos(a) * r; y = -0.75 - t * 1.15; z = -0.55 + t * 0.15 + Math.sin(a) * r;
      s *= 0.8;
    }
    brainPts.push({ p: [x, y, z], c: tint(x, y, z, baseColor()), s });
  }
  brain.add(makePoints(brainPts, 0.62));

  // ── 2. A galaxy of dust around the brain that widens as notes are added ──
  const dust = [];
  const reach = Math.min(9, 4.2 + notes.length * 0.35);
  for (let i = 0; i < 900 + notes.length * 120; i++) {
    const r = 2.6 + Math.pow(rand(), 0.7) * reach, a = rand() * Math.PI * 2;
    const arm = Math.sin(a * 2 + r * 0.9) * 0.5;
    dust.push({ p: [Math.cos(a + arm) * r, (rand() - 0.5) * 0.5 * (r / 3), Math.sin(a + arm) * r], c: rand() < 0.3 ? lilac : rand() < 0.1 ? gold : new THREE.Color('#6d5ba8'), s: 0.35 + rand() * 0.5 });
  }
  galaxy.add(makePoints(dust, 0.45));
  galaxy.rotation.x = 0.35;

  // ── 3. Neurons (notes) and their figments (sections) ──
  const neurons = [];
  const perWorld = {};
  notes.forEach((n) => {
    const w = (n.topic || 'studio').toLowerCase();
    const W = WORLDS[w] || WORLDS.studio;
    const k = (perWorld[w] = (perWorld[w] || 0) + 1) - 1;
    const r = rng(hash(n.url));
    // spread notes of one world in a small spiral around its region
    const ang = k * 2.4, rad = 0.18 + 0.16 * Math.sqrt(k);
    const pos = new THREE.Vector3(
      W.c[0] + Math.cos(ang) * rad * (w === 'investing' ? 0.4 : 1) + (r() - 0.5) * 0.1,
      W.c[1] + Math.sin(ang) * rad * 0.8 + (w === 'studio' ? 0.1 : 0.25) + (r() - 0.5) * 0.1,
      W.c[2] + (w === 'investing' ? Math.cos(ang) * rad : (r() - 0.5) * 0.3)
    );
    const sparks = n.sections.map((title, i) => {
      const a = (i / Math.max(1, n.sections.length)) * Math.PI * 2 + r() * 0.5;
      const e = (r() - 0.5) * 1.4;
      const d = 0.34 + r() * 0.2;
      return new THREE.Vector3(pos.x + Math.cos(a) * Math.cos(e) * d, pos.y + Math.sin(e) * d, pos.z + Math.sin(a) * Math.cos(e) * d);
    });
    neurons.push({ note: n, world: w, color: worldColors[w] || worldColors.studio, pos, sparks });
  });

  const neuronPts = [], sparkPts = [];
  neurons.forEach((nn) => {
    neuronPts.push({ p: nn.pos.toArray(), c: nn.color, s: 7, ph: 0 });            // glow
    neuronPts.push({ p: nn.pos.toArray(), c: new THREE.Color('#ffffff'), s: 1.8, ph: 1.5 }); // core
    nn.sparks.forEach((sp) => sparkPts.push({ p: sp.toArray(), c: new THREE.Color('#d8b4fe'), s: 2.1 }));
  });
  brain.add(makePoints(neuronPts, 1));
  brain.add(makePoints(sparkPts, 0.95));

  // ── 4. Threads: dendrites, figment links, and connections between notes ──
  const curves = []; // [{pts:[Vector3...], color}]
  const bend = (a, b, pull) => {
    const mid = a.clone().add(b).multiplyScalar(0.5).multiplyScalar(pull);
    return new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(18);
  };
  const threadCol = { time: new THREE.Color('#f0c040'), idea: new THREE.Color('#c084fc'), spark: new THREE.Color('#b794f6') };

  neurons.forEach((nn) => {
    // each section is a spark on a short thread
    nn.sparks.forEach((sp) => curves.push({ pts: bend(nn.pos, sp, 1.0), color: threadCol.spark, a: 0.55 }));
    // a few dendrites reaching into the surrounding brain
    const near = brainPts.filter((p) => nn.pos.distanceTo(new THREE.Vector3(...p.p)) < 0.75);
    for (let i = 0; i < Math.min(7, near.length); i++) {
      const t = new THREE.Vector3(...near[Math.floor(rand() * near.length)].p);
      curves.push({ pts: bend(nn.pos, t, 0.97), color: nn.color, a: 0.3 });
    }
  });

  // connections between notes, found automatically
  const STOP = new Set('about after again against being below between could every first from have here into just more most other over really right should still their there these they thing things think this those through today under until very what when where which while with without would your yours world worlds figmira research notes note studio anyway'.split(' '));
  const words = (n) => new Set((n.title + ' ' + (n.whatif || '') + ' ' + n.sections.join(' '))
    .toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 4 && !STOP.has(w)).map((w) => w.replace(/(ing|ers|er|ed|s)$/, '')));
  const wordSets = neurons.map((nn) => words(nn.note));
  let links = 0;
  for (let i = 0; i < neurons.length; i++) {
    for (let j = i + 1; j < neurons.length; j++) {
      const a = neurons[i], b = neurons[j];
      const shared = [...wordSets[i]].filter((w) => wordSets[j].has(w)).length;
      const sameWorld = a.world === b.world;
      const nextInTime = j === i + 1;
      if (!shared && !sameWorld && !nextInTime) continue;
      const color = shared ? threadCol.idea : sameWorld ? a.color : threadCol.time;
      curves.push({ pts: bend(a.pos, b.pos, 0.55), color, a: 0.75, main: true });
      links++;
    }
  }

  // draw all threads as one set of line segments
  {
    const seg = [], col = [];
    curves.forEach((cv) => {
      for (let i = 0; i < cv.pts.length - 1; i++) {
        seg.push(...cv.pts[i].toArray(), ...cv.pts[i + 1].toArray());
        const c = cv.color.clone().multiplyScalar(cv.a);
        col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    brain.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })));
  }

  // pulses: little sparks of light that travel along the main threads, like neurons firing
  const pulseCurves = curves.filter((c) => c.main || c.color === threadCol.spark);
  const pulses = pulseCurves.map((c) => ({ c, t: rand(), v: 0.12 + rand() * 0.2 }));
  const pulsePts = makePoints(pulses.map((p) => ({ p: p.c.pts[0].toArray(), c: new THREE.Color('#fff4d6'), s: 2.4 })), 1);
  brain.add(pulsePts);

  // ── 5. Floating labels: world names and note stars sit on top of the 3D brain ──
  const worldBtns = [...map.querySelectorAll('.rs-world')].map((el) => {
    const W = WORLDS[el.dataset.world];
    if (!W) return null;
    // world names float just outside their part of the brain; Studio sits under the center
    const v = el.dataset.world === 'studio' ? new THREE.Vector3(0, -0.45, 0.2) : new THREE.Vector3(...W.c).multiplyScalar(1.45);
    return { el, v };
  }).filter(Boolean);
  const noteStars = [...map.querySelectorAll('.rs-star')].map((el) => {
    const nn = neurons.find((x) => x.note.url === el.getAttribute('href'));
    return nn ? { el, v: nn.pos } : null;
  }).filter(Boolean);

  const hint = map.querySelector('.rs-map-hint');
  const ideas = neurons.reduce((s, n) => s + n.sparks.length, 0);
  if (hint) hint.textContent = `${notes.length} ${notes.length === 1 ? 'note' : 'notes'} · ${ideas} figments · ${links} ${links === 1 ? 'connection' : 'connections'}, and growing. Drag to turn the brain.`;

  const tmp = new THREE.Vector3();
  function placeLabels() {
    const toScreen = (v, el, lift, keepIn) => {
      tmp.copy(v).applyMatrix4(brain.matrixWorld);
      const depth = tmp.z; // toward the camera is positive
      tmp.project(camera);
      let x = ((tmp.x + 1) / 2) * 100, y = ((1 - tmp.y) / 2) * 100;
      if (keepIn) { // keep names fully inside the frame
        const half = (el._half || 60) / map.clientWidth * 100;
        x = Math.max(half + 1, Math.min(99 - half, x)); y = Math.max(8, Math.min(86, y));
      }
      el.style.setProperty('--x', x + '%');
      el.style.setProperty('--y', y + '%');
      el.style.setProperty('--depth', Math.max(0.35, Math.min(1, 0.7 + depth * 0.25)).toFixed(2));
      el.style.zIndex = String(Math.max(1, Math.round(20 + depth * 8)) + lift); // always above the 3D canvas
    };
    worldBtns.forEach((w) => toScreen(w.v, w.el, 0, true));
    noteStars.forEach((s) => toScreen(s.v, s.el, 40, false));
  }

  // ── 6. Sizing, dragging, and the animation loop ──
  function resize() {
    const w = map.clientWidth, h = map.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0.1, w / h < 1.2 ? 8.6 : 6.4);
    camera.lookAt(0, -0.15, 0);
    camera.updateProjectionMatrix();
    uniforms.uScale.value = h / 520;
    worldBtns.forEach((b) => { b.el._half = b.el.offsetWidth / 2; });
    render();
  }

  // the brain turns slowly, and slows to a stop while the pointer is over it (so notes are easy to click)
  const SPIN = reduced ? 0 : 0.12;
  let dragging = false, lastX = 0, lastY = 0, spin = SPIN, spinTarget = SPIN, tiltTarget = 0.22;
  map.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') spinTarget = 0; });
  map.addEventListener('pointerleave', () => { spinTarget = SPIN; });
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); map.classList.add('is-dragging'); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    brain.rotation.y += (e.clientX - lastX) * 0.008;
    // on phones, up/down swipes scroll the page, so only sideways swipes turn the brain
    if (e.pointerType !== 'touch') tiltTarget = Math.max(-0.6, Math.min(0.9, tiltTarget + (e.clientY - lastY) * 0.005));
    lastX = e.clientX; lastY = e.clientY;
    if (reduced) render();
  });
  const endDrag = () => { dragging = false; map.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  function render() {
    brain.rotation.x += (tiltTarget - brain.rotation.x) * 0.1;
    brain.updateMatrixWorld();
    renderer.render(scene, camera);
    placeLabels();
  }

  let visible = true, last = performance.now();
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(map);
  function loop(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    if (visible && !document.hidden) {
      uniforms.uTime.value += dt;
      spin += (spinTarget - spin) * Math.min(1, dt * 3);
      if (!dragging) brain.rotation.y += spin * dt;
      galaxy.rotation.y -= spin * 0.25 * dt;
      // move each pulse along its thread
      const arr = pulsePts.geometry.attributes.position.array;
      pulses.forEach((p, i) => {
        p.t = (p.t + p.v * dt) % 1;
        const pts = p.c.pts, f = p.t * (pts.length - 1), k = Math.floor(f), m = f - k;
        const a = pts[k], b = pts[Math.min(k + 1, pts.length - 1)];
        arr[i * 3] = a.x + (b.x - a.x) * m; arr[i * 3 + 1] = a.y + (b.y - a.y) * m; arr[i * 3 + 2] = a.z + (b.z - a.z) * m;
      });
      pulsePts.geometry.attributes.position.needsUpdate = true;
      render();
    }
    requestAnimationFrame(loop);
  }

  new ResizeObserver(resize).observe(map);
  resize();
  if (reduced) render(); else requestAnimationFrame(loop);
})();
