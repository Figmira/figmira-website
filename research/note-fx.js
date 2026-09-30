/* ═══════════════════════════════════════════════════════════════════
   FIGMIRA RESEARCH: living notes
   • A living night sky behind every note, shifting color with each section
   • A ✦ that travels across the top as you read, lighting each section
   • Numbers that count up and bars that fill in as you reach them
   • "Where would you stand?": a slider that places you among real founders
   Visitors who turn off animations see everything, already finished.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const article = document.querySelector('.rs-note');
  if (!article) return;
  const body = article.querySelector('.rs-body');
  const sections = body ? Array.from(body.querySelectorAll('h2')) : [];

  // One sky color per section, the same world colors as the home page
  const SKY = ['#7c3aed', '#c084fc', '#2ee6c8', '#ff9a3c', '#e879f9', '#f0c040', '#b9b4ff'];

  /* ── 1. THE LIVING SKY ─────────────────────────────────────────── */
  const sky = document.createElement('canvas');
  sky.className = 'fx-sky';
  sky.setAttribute('aria-hidden', 'true');
  const staticSky = document.querySelector('.rs-sky');
  if (staticSky) staticSky.after(sky); else document.body.prepend(sky);
  const ctx = sky.getContext('2d');
  let W = 0, H = 0, dpr = 1, stars = [];
  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    sky.width = Math.round(W * dpr); sky.height = Math.round(H * dpr);
    const n = Math.round((W * H) / 5200);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H * 1.6,
      r: Math.random() < 0.9 ? Math.random() * 0.9 + 0.3 : Math.random() * 1.4 + 1,
      depth: Math.random() * 0.8 + 0.2,              // far stars move less when you scroll
      tw: Math.random() * Math.PI * 2, sp: 0.6 + Math.random() * 1.6,
    }));
  }
  fit();
  window.addEventListener('resize', fit);

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  let tint = hex(SKY[0]), tintTarget = hex(SKY[0]);
  function currentSection() {
    let idx = 0;
    sections.forEach((h, i) => { if (h.getBoundingClientRect().top < window.innerHeight * 0.45) idx = i + 1; });
    return idx;
  }
  let last = performance.now();
  function drawSky(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    tintTarget = hex(SKY[currentSection() % SKY.length]);
    tint = tint.map((v, i) => v + (tintTarget[i] - v) * (1 - Math.exp(-dt * 2)));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // two soft glows of color that drift slowly
    const t = now / 1000;
    [[0.25 + 0.05 * Math.sin(t * 0.07), 0.15, 0.55], [0.8 + 0.04 * Math.cos(t * 0.05), 0.85, 0.35]].forEach(([fx, fy, a]) => {
      const g = ctx.createRadialGradient(W * fx, H * fy, 0, W * fx, H * fy, Math.max(W, H) * 0.6);
      g.addColorStop(0, `rgba(${tint.map(Math.round).join(',')}, ${0.22 * a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    // stars, drifting with the scroll (deeper ones move less) and twinkling
    const sy = window.scrollY;
    for (const s of stars) {
      const y = ((s.y - sy * 0.12 * s.depth) % (H * 1.6) + H * 1.6) % (H * 1.6) - H * 0.3;
      if (y < -4 || y > H + 4) continue;
      const a = reduced ? 0.7 : 0.45 + 0.55 * Math.abs(Math.sin(t * s.sp + s.tw));
      ctx.fillStyle = `rgba(255, 248, 235, ${a * (0.5 + s.depth * 0.5)})`;
      ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduced) requestAnimationFrame(drawSky);
  }
  requestAnimationFrame(drawSky);
  if (reduced) window.addEventListener('scroll', () => requestAnimationFrame(drawSky), { passive: true });

  /* ── 2. THE ✦ READING PROGRESS ────────────────────────────────── */
  const bar = document.createElement('div');
  bar.className = 'fx-progress';
  bar.innerHTML = '<div class="fx-progress-fill"></div><div class="fx-progress-star" aria-hidden="true">✦</div>';
  const nav = document.querySelector('.rs-nav');
  (nav || document.body).appendChild(bar);
  const fill = bar.querySelector('.fx-progress-fill');
  const tip = bar.querySelector('.fx-progress-star');
  // one dot per section; click a dot to jump there
  const dots = sections.map((h, i) => {
    if (!h.id) h.id = 'section-' + (i + 1);
    const d = document.createElement('a');
    d.className = 'fx-progress-dot';
    d.href = '#' + h.id;
    d.setAttribute('aria-label', 'Jump to: ' + h.textContent.trim());
    d.title = h.textContent.trim();
    d.style.setProperty('--c', SKY[(i + 1) % SKY.length]);
    bar.appendChild(d);
    return d;
  });
  function progress() {
    const r = article.getBoundingClientRect();
    const total = r.height - window.innerHeight * 0.6;
    const p = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.2) / Math.max(1, total)));
    fill.style.width = (p * 100) + '%';
    tip.style.left = (p * 100) + '%';
    const artTop = r.top + window.scrollY;
    sections.forEach((h, i) => {
      const at = (h.getBoundingClientRect().top + window.scrollY - artTop + window.innerHeight * 0.2) / Math.max(1, total + window.innerHeight * 0.2);
      dots[i].style.left = Math.min(98, Math.max(2, at * 100)) + '%';
      dots[i].classList.toggle('is-lit', h.getBoundingClientRect().top < window.innerHeight * 0.45);
    });
  }
  window.addEventListener('scroll', progress, { passive: true });
  window.addEventListener('resize', progress);
  progress();

  /* ── 3. NUMBERS THAT COUNT UP, BARS THAT FILL ─────────────────── */
  const fmt = (v, el) => {
    const dec = Number(el.dataset.decimals || 0);
    let s = v.toFixed(dec);
    if (el.dataset.sep) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return (el.dataset.prefix || '') + s + (el.dataset.suffix || '');
  };
  function countUp(el, targets, done) {
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const render = (k) => {
      el.textContent = targets.map((to, i) => {
        const piece = fmt(to * k, el);
        // for ranges like "11–15%", only the last number carries the suffix
        return targets.length > 1 && i < targets.length - 1 ? piece.replace(el.dataset.suffix || '\u0000', '') : piece;
      }).join('–');
    };
    if (reduced) { render(1); done && done(); return; }
    const start = performance.now(), dur = 1400;
    (function step(now) {
      const k = Math.min(1, (now - start) / dur);
      render(ease(k));
      if (k < 1) requestAnimationFrame(step); else done && done();
    })(start);
  }

  // Build each bar chart: label, track, fill, value (and a hover tooltip)
  document.querySelectorAll('.fx-chart[data-fx="bars"]').forEach((chart) => {
    chart.querySelectorAll('.fx-row').forEach((row) => {
      // data-w lets a row show "$1T" while its bar is sized on the same scale as "$581B"
      const v = Number(row.dataset.value), w = Number(row.dataset.w || v), max = Number(row.dataset.max || 100);
      const fc = row.dataset.forecast != null;
      if (fc) row.classList.add('is-forecast');
      row.innerHTML =
        `<span class="fx-row-label">${row.dataset.label}${fc ? ' <em class="fx-tag">forecast</em>' : ''}</span>` +
        `<span class="fx-track"><span class="fx-fill"></span></span>` +
        `<span class="fx-row-value">${fmt(0, row)}</span>`;
      row.dataset.pct = String(Math.max(1.5, (w / max) * 100));
      const tip = `${row.dataset.label}${fc ? ' (forecast)' : ''}: ${fmt(v, row)}`;
      row.setAttribute('role', 'img');
      row.setAttribute('aria-label', tip);
      row.title = tip;
    });
    // Label which layer this chart is: Fact, or Fact + Forecast
    const pills = document.createElement('span');
    pills.className = 'fx-chart-layers';
    pills.innerHTML = '<span class="fx-layer fx-layer--fact"><b>Fact</b></span>' +
      (chart.querySelector('.is-forecast') ? '<span class="fx-layer fx-layer--forecast"><b>Forecast</b></span>' : '');
    chart.prepend(pills);
  });
  document.querySelectorAll('.fx-num').forEach((n) => { n.textContent = '0'; });

  const seen = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      seen.unobserve(e.target);
      const el = e.target;
      if (el.classList.contains('fx-chart')) {
        el.classList.add('is-in');
        el.querySelectorAll('.fx-row').forEach((row, i) => {
          setTimeout(() => {
            row.querySelector('.fx-fill').style.width = row.dataset.pct + '%';
            countUp(row.querySelector('.fx-row-value'), [Number(row.dataset.value)], null);
            // the value element needs the row's formatting settings
          }, reduced ? 0 : i * 220);
        });
      } else if (el.classList.contains('fx-num')) {
        countUp(el, el.dataset.to.split(',').map(Number));
      } else {
        el.classList.add('is-in'); // pull quotes glow in
      }
    });
  }, { threshold: 0.45 });
  // value spans inherit formatting from their row
  document.querySelectorAll('.fx-row').forEach((row) => {
    const val = row.querySelector('.fx-row-value');
    ['prefix', 'suffix', 'decimals', 'sep'].forEach((k) => { if (row.dataset[k]) val.dataset[k] = row.dataset[k]; });
  });
  document.querySelectorAll('.fx-chart[data-fx="bars"], .fx-num, .fx-pull, .fx-figment, .fx-whatif').forEach((el) => seen.observe(el));

  /* ── 4. "WHERE WOULD YOU STAND?" ──────────────────────────────── */
  // From the 1988 study of 2,994 new founders: 33% said 10 out of 10,
  // 48% said 7 to 9 (81% said 7 or better), and 19% said 6 or lower.
  document.querySelectorAll('.fx-odds').forEach((box) => {
    const groups = [
      { from: 0, to: 6, share: 19, label: '6 or lower', msg: 'Only 19% of new founders were this cautious. Careful is good, but a dream you only half believe in rarely gets built.',
        back: 'Earlier you rated your odds {v} out of 10. That caution is useful. Point it at the road, not the destination.' },
      { from: 7, to: 9, share: 48, label: '7 to 9', msg: 'You’re with 48% of founders: confident, but keeping one eye on the risks. That’s the Stockdale balance.',
        back: 'Earlier you rated your odds {v} out of 10, right alongside nearly half of those 1988 founders. Keep the belief. Bring the discipline.' },
      { from: 10, to: 10, share: 33, label: 'a perfect 10', msg: 'You’re with the 33% who said 10 out of 10. Delusional? Maybe. It’s the same belief that launches rockets.',
        back: 'Earlier you rated your odds a perfect 10. The math says most founders fall short. Believe it anyway, and be ruthless about the facts.' },
    ];
    // The ending of the article calls back to the reader's answer
    const callbacks = document.querySelectorAll('.fx-callback');
    let touched = false;
    let dotsHtml = '';
    groups.forEach((g, gi) => { for (let i = 0; i < g.share; i++) dotsHtml += `<span class="fx-dot" data-g="${gi}"></span>`; });
    box.innerHTML = `
      <label class="fx-odds-q" for="fxOdds">How likely is <em>your</em> dream to succeed?</label>
      <div class="fx-odds-row">
        <input id="fxOdds" class="fx-odds-slider" type="range" min="0" max="10" step="1" value="5" aria-describedby="fxOddsMsg">
        <output class="fx-odds-val" for="fxOdds">5 / 10</output>
      </div>
      <div class="fx-odds-dots" aria-hidden="true">${dotsHtml}</div>
      <div class="fx-odds-key">
        ${groups.map((g, gi) => `<span class="fx-key" data-g="${gi}"><i></i>${g.label}: ${g.share}%</span>`).join('')}
      </div>
      <p class="fx-odds-msg" id="fxOddsMsg" aria-live="polite"></p>
      <p class="fx-src">Each dot is about 30 of the 2,994 founders in the 1988 study.</p>`;
    const slider = box.querySelector('.fx-odds-slider');
    const out = box.querySelector('.fx-odds-val');
    const msg = box.querySelector('.fx-odds-msg');
    function update() {
      const v = Number(slider.value);
      const gi = groups.findIndex((g) => v >= g.from && v <= g.to);
      out.textContent = v + ' / 10';
      box.querySelectorAll('.fx-dot, .fx-key').forEach((d) => d.classList.toggle('is-you', Number(d.dataset.g) === gi));
      msg.textContent = groups[gi].msg;
      slider.style.setProperty('--p', (v * 10) + '%');
      callbacks.forEach((c) => {
        c.hidden = false;
        c.textContent = touched ? groups[gi].back.replace('{v}', v)
          : 'You never set your odds up there. Maybe that’s the most optimistic answer of all: you’re not waiting for permission.';
      });
    }
    slider.addEventListener('input', () => { touched = true; update(); });
    update();
  });

  /* ── 5. STOCK NOTE VISUALS ─────────────────────────────────────── */
  // Each visual is written in the note as plain HTML with data-* settings,
  // and carries a readable text version inside it (for no-JS and screen readers).
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); reveal.unobserve(e.target); } });
  }, { threshold: 0.3 });
  const parsePairs = (str) => (str || '').split('|').map((kv) => { const [k, v, c] = kv.split(':'); return { k: k.trim(), v: Number(v), c: (c || '').trim() }; });
  const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const money = (v, pre, unit, dec) => (v < 0 ? '−' : '') + (pre || '') + Math.abs(v).toFixed(dec) + (unit || '');

  // 5a. COLUMNS THAT CAN GO BELOW ZERO (for boom-and-bust cycles)
  document.querySelectorAll('.fx-cols[data-fx="columns"]').forEach((fig) => {
    const rows = [...fig.querySelectorAll('.fx-col')].map((el) => ({ el, v: Number(el.dataset.value), label: el.dataset.label, fc: el.dataset.forecast != null, note: el.dataset.note || '' }));
    const max = Math.max(...rows.map((r) => r.v), 0), min = Math.min(...rows.map((r) => r.v), 0);
    const range = max - min || 1;
    const pre = fig.dataset.prefix || '', unit = fig.dataset.unit || '', dec = Number(fig.dataset.decimals || 0);
    const grid = fig.querySelector('.fx-cols-grid');
    grid.style.setProperty('--zero', ((max / range) * 100).toFixed(2) + '%');
    rows.forEach((r) => {
      const txt = money(r.v, pre, unit, dec);
      r.el.classList.toggle('is-neg', r.v < 0);
      r.el.classList.toggle('is-forecast', r.fc);
      r.el.style.setProperty('--h', ((Math.abs(r.v) / range) * 100).toFixed(2) + '%');
      r.el.innerHTML = `<span class="fx-col-bar"><span class="fx-col-val">${txt}</span></span><span class="fx-col-label">${esc(r.label)}${r.note ? `<small>${esc(r.note)}</small>` : ''}</span>`;
      r.el.setAttribute('role', 'img');
      r.el.setAttribute('aria-label', `${r.label}${r.note ? ' ' + r.note : ''}: ${txt}`);
      r.el.title = `${r.label}${r.note ? ' (' + r.note + ')' : ''}: ${txt}`;
    });
    reveal.observe(fig);
  });

  // 5b. SPLIT BARS: one bar split into labeled parts (market share, "of every $100")
  document.querySelectorAll('.fx-share[data-fx="share"]').forEach((fig) => {
    fig.querySelectorAll('.fx-share-row').forEach((row) => {
      const parts = parsePairs(row.dataset.parts), pre = row.dataset.prefix || '', suf = row.dataset.suffix ?? '%';
      row.innerHTML = `<span class="fx-share-when">${esc(row.dataset.label)}</span><span class="fx-share-track">` +
        parts.map((d) => `<span class="fx-share-seg" style="--w:${d.v}%;--c:${d.c}" title="${esc(d.k)}: ${pre}${d.v}${suf}"><b>${esc(d.k)}</b> ${pre}${d.v}${suf}</span>`).join('') + '</span>';
      row.setAttribute('role', 'img');
      row.setAttribute('aria-label', row.dataset.label + ': ' + parts.map((d) => `${d.k} ${pre}${d.v}${suf}`).join(', '));
    });
    reveal.observe(fig);
  });

  // 5c. DONUT: a ring split into parts; hover or tap a part to read it in the middle
  document.querySelectorAll('.fx-donut[data-fx="donut"]').forEach((box) => {
    const parts = parsePairs(box.dataset.parts), total = parts.reduce((a, d) => a + d.v, 0);
    const R = 42, C = 2 * Math.PI * R, gapLen = 1.2;
    let off = 0;
    const segs = parts.map((d, i) => {
      const len = (d.v / total) * C;
      const seg = `<circle class="fx-donut-seg" data-i="${i}" r="${R}" cx="60" cy="60" style="--c:${d.c};--len:${Math.max(0, len - gapLen)};--off:${-off};--gap:${C}" tabindex="0" role="img" aria-label="${esc(d.k)}: ${d.v}%"></circle>`;
      off += len;
      return seg;
    }).join('');
    box.querySelector('.fx-donut-draw').innerHTML =
      `<svg viewBox="0 0 120 120" class="fx-donut-svg">${segs}</svg><div class="fx-donut-mid"><b>${parts[0].v}%</b><span>${esc(parts[0].k)}</span></div>`;
    const mid = box.querySelector('.fx-donut-mid');
    const show = (i) => {
      mid.innerHTML = `<b>${parts[i].v}%</b><span>${esc(parts[i].k)}</span>`;
      box.querySelectorAll('.fx-donut-seg').forEach((c) => c.classList.toggle('is-on', Number(c.dataset.i) === i));
    };
    box.querySelectorAll('.fx-donut-seg').forEach((c) => {
      const i = Number(c.dataset.i);
      c.addEventListener('mouseenter', () => show(i));
      c.addEventListener('focus', () => show(i));
      c.addEventListener('click', () => show(i));
    });
    show(0);
    reveal.observe(box);
  });

  // 5d. SNAPSHOT TILES: tap a tile to jump to the section that explains it
  document.querySelectorAll('.fx-snap [data-jump], .fx-snap [data-href]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      if (el.dataset.href) { window.location.href = el.dataset.href; return; }
      const t = document.getElementById(el.dataset.jump);
      if (t) t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  });
  document.querySelectorAll('.fx-snap').forEach((el) => reveal.observe(el));

  // 5e. TIMELINE: each moment lights up as it scrolls into view
  document.querySelectorAll('.fx-tl-item').forEach((el) => reveal.observe(el));

  // 5f. LAUNCH LOG: rockets lift off one after another; some burst, one reaches orbit
  const rocketSvg = '<svg viewBox="0 0 24 48" aria-hidden="true"><path d="M12 1c5 6 6 14 6 22v14H6V23C6 15 7 7 12 1z" fill="currentColor"/><path d="M6 30l-5 8v5l5-3zM18 30l5 8v5l-5-3z" fill="currentColor" opacity=".7"/><circle cx="12" cy="18" r="3" fill="#06060d"/><path class="fx-flame" d="M8 38h8l-4 9z"/></svg>';
  document.querySelectorAll('.fx-launches[data-fx="launches"]').forEach((box) => {
    const cards = [...box.querySelectorAll('.fx-launch')];
    cards.forEach((c) => {
      const pad = document.createElement('div');
      pad.className = 'fx-launch-sky';
      pad.setAttribute('aria-hidden', 'true');
      pad.innerHTML = `<span class="fx-launch-rocket">${rocketSvg}</span><span class="fx-launch-end">${c.classList.contains('is-win') ? '✦' : '✕'}</span>`;
      c.prepend(pad);
    });
    const go = () => cards.forEach((c, i) => setTimeout(() => c.classList.add('is-go'), reduced ? 0 : i * 1100));
    new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { ob.disconnect(); go(); } }, { threshold: 0.4 }).observe(box);
    const replay = box.querySelector('.fx-launch-replay');
    if (replay) replay.addEventListener('click', () => { cards.forEach((c) => c.classList.remove('is-go')); void box.offsetWidth; setTimeout(go, 60); });
  });


  /* ── 6. ESSAY VISUALS (driven by how far you've scrolled through each one) ── */
  // progress of an element through the screen: 0 when it enters at the bottom, 1 when it leaves at the top
  const progressOf = (el) => {
    const r = el.getBoundingClientRect(), vh = window.innerHeight;
    return Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh)));
  };
  // progress through a tall "scene" whose inner part stays pinned: 0 at pin start, 1 at pin end
  const pinnedProgress = (el) => {
    const r = el.getBoundingClientRect(), vh = window.innerHeight;
    return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
  };
  const scrollers = [];

  // 6a. DELUSIONAL → VISION → OBVIOUS: one word, rewritten as time passes
  document.querySelectorAll('.fx-morph').forEach((box) => {
    const words = box.dataset.words.split('|'), notes = (box.dataset.notes || '').split('|');
    const wordEl = box.querySelector('.fx-morph-word'), noteEl = box.querySelector('.fx-morph-note');
    const dots = box.querySelector('.fx-morph-steps');
    dots.innerHTML = words.map(() => '<i></i>').join('');
    let shown = -1;
    const show = (i) => {
      if (i === shown) return;
      shown = i;
      wordEl.setAttribute('aria-label', words[i]);
      wordEl.innerHTML = [...words[i]].map((ch, k) => {
        const dx = (Math.random() - 0.5) * 120, dy = (Math.random() - 0.5) * 80;
        return `<span style="--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--d:${k * 45}ms" aria-hidden="true">${ch}</span>`;
      }).join('');
      wordEl.className = 'fx-morph-word is-' + i;
      noteEl.textContent = notes[i] || '';
      dots.querySelectorAll('i').forEach((d, k) => d.classList.toggle('is-on', k <= i));
    };
    if (reduced) { box.classList.add('is-static'); show(words.length - 1); return; }
    show(0);
    scrollers.push(() => {
      const p = pinnedProgress(box);
      show(Math.min(words.length - 1, Math.floor(p * words.length * 0.999)));
    });
  });

  // 6b. THE CROWD AND THE ONE: a crowd drifts as one; some stop; one gold light takes its own path
  document.querySelectorAll('.fx-crowd').forEach((box) => {
    const cv = box.querySelector('canvas'), ctx = cv.getContext('2d');
    const N = 150, seed = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
    const people = Array.from({ length: N }, (_, i) => ({ lane: seed(i) * 2 - 1, off: seed(i + 99), speed: 0.035 + seed(i + 7) * 0.02, stopAt: seed(i + 31) }));
    let W = 0, H = 0, t = 0, visible = false, prog = 0, trail = [];
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = box.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); window.addEventListener('resize', size);
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(box);
    const streamY = (x, lane) => H * 0.62 + Math.sin(x / W * 5 + t * 0.6) * H * 0.08 + lane * H * 0.13;
    function frame() {
      if (visible) {
        t += reduced ? 0 : 0.016;
        prog = reduced ? 0.8 : progressOf(box);
        ctx.clearRect(0, 0, W, H);
        const gone = Math.min(0.7, Math.max(0, (prog - 0.25) * 1.3)); // share of the crowd that has stopped
        people.forEach((d) => {
          const x = ((d.off + t * d.speed) % 1) * (W + 40) - 20;
          const stopped = d.stopAt < gone;
          const y = streamY(x, d.lane);
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = stopped ? 'rgba(185,180,255,0.08)' : 'rgba(196,181,253,0.55)';
          ctx.fill();
        });
        // the one: starts inside the crowd, then breaks away upward on its own curve
        const lead = Math.min(1, Math.max(0, (prog - 0.3) * 1.8));
        const ox = W * (0.18 + 0.64 * Math.min(1, prog * 1.2));
        const oy = streamY(ox, 0) - lead * lead * H * 0.52;
        trail.push([ox, oy]); if (trail.length > 70) trail.shift();
        ctx.beginPath();
        trail.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.strokeStyle = 'rgba(240,192,64,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 18);
        g.addColorStop(0, 'rgba(255,241,193,1)'); g.addColorStop(0.3, 'rgba(240,192,64,0.8)'); g.addColorStop(1, 'rgba(240,192,64,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, 18, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  // 6c. LIVING IN THE GAP: two horizons, the doubts in between, and the moment they meet
  document.querySelectorAll('.fx-gap').forEach((box) => {
    const scene = box.querySelector('.fx-gap-scene');
    const lines = [...box.querySelectorAll('.fx-gap-voice')];
    const end = box.querySelector('.fx-gap-end');
    if (reduced) { box.classList.add('is-static'); return; }
    scrollers.push(() => {
      const p = pinnedProgress(box);
      const gap = 1 - Math.min(1, Math.max(0, (p - 0.1) / 0.8));          // 1 = wide apart, 0 = met
      scene.style.setProperty('--gap', gap.toFixed(3));
      lines.forEach((l, i) => {
        const at = 0.1 + (i + 0.5) * (0.75 / lines.length);
        const o = Math.max(0, 1 - Math.abs(p - at) / (0.75 / lines.length * 0.7)); // one voice at a time
        l.style.opacity = o.toFixed(2);
        l.style.transform = `translateY(${((at - p) * 60).toFixed(1)}px)`;
      });
      box.classList.toggle('is-met', gap < 0.02);
      end.style.opacity = gap < 0.02 ? 1 : 0;
    });
  });

  if (scrollers.length) {
    let ticking = false;
    const run = () => { ticking = false; scrollers.forEach((f) => f()); };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    window.addEventListener('resize', run);
    run();
  }
})();
