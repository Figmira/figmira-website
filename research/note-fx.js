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

  // On phones, fold "The short version" closed so the story starts on the first screen (tap to open)
  if (window.matchMedia('(max-width: 640px)').matches) document.querySelectorAll('details.fx-tldr').forEach((d) => { d.open = false; });

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

  /* ── 7. THE EDGE: one landscape that explains the whole essay ── */
  // The ground is the idea: a flat plateau (comfort), a climb (learning), a lip (the edge), a drop (panic).
  const SVGNS = 'http://www.w3.org/2000/svg';
  const terrain = (s) => {
    const E = 620 + 180 * s, C = 300 + 330 * s, base = 400, ridge = 190;
    const y = (x) => {
      if (x <= C) return base;
      if (x <= E) { const t = (x - C) / (E - C); return base - (base - ridge) * (t * t * (3 - 2 * t)); }
      return 600;
    };
    let d = 'M0,600 L0,' + base;
    for (let x = 0; x <= E; x += 4) d += ` L${x},${y(x).toFixed(1)}`;
    d += ` L${E},${ridge} L${E + 6},600 Z`;
    let rocks = `M${E + 6},600`;
    for (let x = E + 6, k = 0; x <= 1010; x += 22, k++) rocks += ` L${x},${(k % 2 ? 520 : 548) + ((k * 37) % 17)}`;
    rocks += ' L1010,600 Z';
    return { E, C, base, ridge, y, ground: d, rocks };
  };
  const mk = (tag, attrs, parent) => { const el = document.createElementNS(SVGNS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); if (parent) parent.appendChild(el); return el; };
  const defsFor = (svg, id) => {
    const defs = mk('defs', {}, svg);
    defs.innerHTML = `
      <linearGradient id="${id}-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f4d"/><stop offset="1" stop-color="#0b0918"/></linearGradient>
      <radialGradient id="${id}-glow"><stop offset="0" stop-color="#fff1c1"/><stop offset=".35" stop-color="#f0c040" stop-opacity=".9"/><stop offset="1" stop-color="#f0c040" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-edge"><stop offset="0" stop-color="#f0c040" stop-opacity=".55"/><stop offset="1" stop-color="#f0c040" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-panic" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e879f9" stop-opacity=".45"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/></linearGradient>`;
  };
  const drawWanderer = (svg, id) => {
    const g = mk('g', { class: 'fx-edge-me' }, svg);
    mk('circle', { r: 34, fill: `url(#${id}-glow)`, opacity: 0.6 }, g);
    mk('circle', { r: 6, fill: '#fff6dc' }, g);
    return g;
  };

  // 7a. The landscape, pinned while you scroll through six stages
  document.querySelectorAll('.fx-edge').forEach((box, n) => {
    const id = 'edge' + n;
    const svg = box.querySelector('svg');
    const caps = [...box.querySelectorAll('.fx-edge-cap')];
    const dots = box.querySelector('.fx-edge-steps');
    dots.innerHTML = caps.map(() => '<i></i>').join('');
    defsFor(svg, id);
    const zones = mk('g', {}, svg);
    const zComfort = mk('rect', { class: 'fx-ez fx-ez-comfort', y: 0, height: 600 }, zones);
    const zLearn = mk('rect', { class: 'fx-ez fx-ez-learn', y: 0, height: 600 }, zones);
    const zPanic = mk('rect', { class: 'fx-ez fx-ez-panic', y: 0, height: 600, fill: `url(#${id}-panic)` }, zones);
    const ground = mk('path', { fill: `url(#${id}-ground)`, stroke: '#c4b5fd', 'stroke-width': 2, 'stroke-opacity': 0.5 }, svg);
    const rocks = mk('path', { class: 'fx-edge-rocks' }, svg);
    const edgeGlow = mk('ellipse', { rx: 70, ry: 110, fill: `url(#${id}-edge)`, class: 'fx-edge-glow' }, svg);
    const curve = mk('path', { class: 'fx-edge-curve', fill: 'none' }, svg);
    const axes = mk('g', { class: 'fx-edge-axes' }, svg);
    axes.innerHTML = '<path d="M40,560 L960,560 M950,552 L962,560 L950,568 M40,560 L40,80 M32,92 L40,80 L48,92"/><text x="955" y="590" text-anchor="end">More pressure →</text><text x="52" y="76">Better performance</text>';
    const labels = {};
    [['comfort', 'Comfort'], ['learn', 'Learning'], ['edge', 'The edge'], ['panic', 'Panic']].forEach(([k, t]) => {
      labels[k] = mk('text', { class: 'fx-edge-label fx-el-' + k, 'text-anchor': 'middle' }, svg);
      labels[k].textContent = t;
    });
    const ghost = mk('g', { class: 'fx-edge-ghost' }, svg);
    const ghostDot = mk('circle', { r: 5 }, ghost);
    const ghostTxt = mk('text', { 'text-anchor': 'middle', class: 'fx-edge-ghost-t' }, ghost);
    ghostTxt.textContent = 'yesterday’s edge';
    const me = drawWanderer(svg, id);

    let lastStage = -1;
    const render = (p) => {
      const stage = Math.min(caps.length - 1, Math.floor(p * caps.length * 0.9999));
      const local = p * caps.length - stage;
      const s = stage === 5 ? Math.min(1, local * 1.3) : 0;
      const T = terrain(s);
      ground.setAttribute('d', T.ground);
      rocks.setAttribute('d', T.rocks);
      zComfort.setAttribute('x', 0); zComfort.setAttribute('width', T.C);
      zLearn.setAttribute('x', T.C); zLearn.setAttribute('width', T.E - T.C);
      zPanic.setAttribute('x', T.E + 6); zPanic.setAttribute('width', 1000 - T.E);
      edgeGlow.setAttribute('cx', T.E - 6); edgeGlow.setAttribute('cy', T.ridge);
      // where the traveler stands
      let w;
      if (stage === 0) w = 120 + local * 140;
      else if (stage === 1) w = 270 + local * (T.E - 12 - 270);
      else w = 608;
      me.setAttribute('transform', `translate(${w},${T.y(w) - 10})`);
      // labels sit on their part of the ground
      labels.comfort.setAttribute('x', T.C / 2); labels.comfort.setAttribute('y', T.base + 60);
      const lx = (T.C + T.E) / 2; labels.learn.setAttribute('x', lx); labels.learn.setAttribute('y', T.y(lx) + (stage === 5 ? 120 : 70));
      labels.edge.setAttribute('x', T.E - 10); labels.edge.setAttribute('y', T.ridge - 46);
      labels.panic.setAttribute('x', Math.min(930, (T.E + 1000) / 2 + 10)); labels.panic.setAttribute('y', 470);
      // Yerkes–Dodson: performance rises with pressure, peaks at the edge, then falls off
      let c = '';
      for (let x = 40; x <= 960; x += 8) {
        const yy = 520 - 330 * Math.exp(-Math.pow((x - T.E) / 230, 2));
        c += (x === 40 ? 'M' : ' L') + x + ',' + yy.toFixed(1);
      }
      curve.setAttribute('d', c);
      ghost.setAttribute('transform', `translate(620,${T.y(620) - 10})`);
      box.dataset.stage = stage;
      if (stage !== lastStage) {
        lastStage = stage;
        caps.forEach((cEl, i) => cEl.classList.toggle('is-on', i === stage));
        dots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('is-on', i <= stage));
        dots.dataset.label = `${stage + 1} of ${caps.length}`;
      }
    };
    if (reduced) { box.classList.add('is-static'); render(0.88); return; }
    render(0);
    scrollers.push(() => render(pinnedProgress(box)));
  });

  // 7b. Action produces information: a walk in the dark, lit one lantern-step at a time
  document.querySelectorAll('.fx-walk').forEach((box, n) => {
    const id = 'walk' + n;
    const svg = box.querySelector('svg');
    const btn = box.querySelector('.fx-walk-btn');
    const log = box.querySelector('.fx-walk-log');
    const count = box.querySelector('.fx-walk-count');
    const notes = box.querySelector('template').content.textContent.trim().split('\n').map((t) => t.trim()).filter(Boolean);
    const defs = mk('defs', {}, svg);
    defs.innerHTML = `
      <linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a5c"/><stop offset="1" stop-color="#120d24"/></linearGradient>
      <radialGradient id="${id}-lamp"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset=".5" stop-color="#ff9a3c" stop-opacity=".18"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-flame"><stop offset="0" stop-color="#fff6dc"/><stop offset=".4" stop-color="#ffc35a"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
      <filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"/></filter>`;
    // the ground: flat, rocks, a step up, a gap with a plank, a climb, a ledge
    const groundY = (x) => {
      if (x < 340) return 430;
      if (x < 700) return 380;
      if (x < 820) return 380 - (x - 700) / 120 * 90;
      return 290;
    };
    const sky = mk('g', {}, svg);
    for (let k = 0; k < 60; k++) mk('circle', { cx: (k * 173) % 1000, cy: (k * 67) % 260 + 10, r: k % 7 ? 1.2 : 2, fill: '#fff', opacity: 0.6 }, sky);
    mk('path', { d: 'M0,430 L340,430 L340,380 L470,380 L470,600 L0,600 Z', fill: `url(#${id}-g)` }, svg);
    mk('path', { d: 'M560,600 L560,380 L700,380 L820,290 L1000,290 L1000,600 Z', fill: `url(#${id}-g)` }, svg);
    mk('path', { d: 'M0,430 L340,430 L340,380 L470,380 M560,380 L700,380 L820,290 L1000,290', fill: 'none', stroke: '#c4b5fd', 'stroke-opacity': 0.45, 'stroke-width': 2 }, svg);
    [[205, 430, 20], [232, 430, 14], [252, 430, 9]].forEach(([x, y, r]) => mk('path', { d: `M${x - r},${y} L${x - r * 0.4},${y - r} L${x + r * 0.5},${y - r * 0.8} L${x + r},${y} Z`, fill: '#4b3a72', stroke: '#c4b5fd', 'stroke-opacity': 0.4 }, svg));
    mk('rect', { x: 462, y: 374, width: 106, height: 10, rx: 2, fill: '#b8891f', stroke: '#fde68a', 'stroke-opacity': 0.5 }, svg);
    mk('text', { x: 515, y: 470, 'text-anchor': 'middle', class: 'fx-walk-gaptxt' }, svg).textContent = 'the gap';
    // the dark, with light wherever the lantern has been
    const mask = mk('mask', { id: id + '-mask' }, defs);
    mk('rect', { x: 0, y: 0, width: 1000, height: 600, fill: 'white' }, mask);
    const lit = mk('g', { filter: `url(#${id}-soft)` }, mask);
    const dark = mk('rect', { x: 0, y: 0, width: 1000, height: 600, fill: '#05040b', mask: `url(#${id}-mask)`, class: 'fx-walk-dark' }, svg);
    const lamp = mk('circle', { r: 150, fill: `url(#${id}-lamp)`, class: 'fx-walk-lamp' }, svg);
    // a stick figure carrying a torch, posed by code every frame so the walk looks natural
    const me = mk('g', { class: 'fx-walker', stroke: '#ebe4d4', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, svg);
    const legB = mk('polyline', { opacity: 0.75 }, me);       // far leg, slightly dimmer
    const armFree = mk('polyline', { opacity: 0.75 }, me);
    const torso = mk('line', {}, me);
    const legA = mk('polyline', {}, me);
    const head = mk('circle', { r: 9, fill: '#06060d' }, me);
    const armTorch = mk('polyline', {}, me);
    const torch = mk('line', { stroke: '#b8891f' }, me);
    const flameAt = mk('g', {}, me);
    const flameIn = mk('g', { class: 'fx-walker-flame' }, flameAt);
    mk('circle', { r: 20, fill: `url(#${id}-flame)`, stroke: 'none' }, flameIn);
    mk('path', { d: 'M0,-12 C6,-4 7,3 0,8 C-7,3 -6,-4 0,-12 Z', fill: '#ffd27a', stroke: 'none' }, flameIn);

    const xs = [60, 205, 380, 515, 640, 760, 900];
    // the height of the ground under the feet (a quick step up at the stair, the plank over the gap)
    const feetY = (x) => {
      if (x > 183 && x < 264) return 430 - 17 * Math.sin((x - 183) / 81 * Math.PI); // step up and over the rocks
      if (x < 326) return 430;
      if (x < 348) return 430 - (x - 326) / 22 * 50;
      if (x > 466 && x < 564) return 374;
      return groundY(x);
    };
    const L = 15;                                  // thigh and shin length
    const pt = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;
    const leg = (hx, hy, ph, amp) => {
      const a = amp * 0.5 * Math.sin(ph) + (1 - amp) * 0.07 * Math.sign(Math.sin(ph) || 1); // swing of the thigh (feet slightly apart when standing)
      const bend = amp * 0.9 * Math.max(0, Math.cos(ph));       // the knee folds while the leg swings forward
      const kx = hx + L * Math.sin(a), ky = hy + L * Math.cos(a);
      const fx = kx + L * Math.sin(a - bend), fy = ky + L * Math.cos(a - bend);
      return { d: `${pt(hx, hy)} ${pt(kx, ky)} ${pt(fx, fy)}`, a };
    };
    let x = xs[0], phase = 0, amp = 0, target = x, moving = false, onArrive = null, last = 0, raf = 0;
    const draw = () => {
      const gy = feetY(x);
      // the leg on the ground is straight; the hip rides on it, which gives a natural bob
      const aA = amp * 0.5 * Math.sin(phase), aB = amp * 0.5 * Math.sin(phase + Math.PI);
      const stanceA = Math.cos(phase) <= 0;
      const hipY = gy - 2 * L * Math.cos(stanceA ? aA : aB);
      const lean = amp * 0.08;
      const hx = x, nx = x + Math.sin(lean) * 30, ny = hipY - 30 * Math.cos(lean);
      legA.setAttribute('points', leg(hx, hipY, phase, amp).d);
      legB.setAttribute('points', leg(hx, hipY, phase + Math.PI, amp).d);
      torso.setAttribute('x1', hx); torso.setAttribute('y1', hipY); torso.setAttribute('x2', nx); torso.setAttribute('y2', ny);
      head.setAttribute('cx', nx + 1); head.setAttribute('cy', ny - 11);
      const sx = nx - 0.5, sy = ny + 6;
      const s = -amp * 0.55 * Math.sin(phase);                // free arm swings opposite the near leg
      armFree.setAttribute('points', `${pt(sx, sy)} ${pt(sx + 8 * Math.sin(s), sy + 8 * Math.cos(s))} ${pt(sx + 8 * Math.sin(s) + 8 * Math.sin(s + 0.5), sy + 8 * Math.cos(s) + 8 * Math.cos(s + 0.5))}`);
      const ex = sx + 9, ey = sy + 2, hxT = ex + 6, hyT = ey - 10;          // torch arm, raised and steady
      armTorch.setAttribute('points', `${pt(sx, sy)} ${pt(ex, ey)} ${pt(hxT, hyT)}`);
      const tx = hxT + 7, ty = hyT - 28;
      torch.setAttribute('x1', hxT - 1); torch.setAttribute('y1', hyT + 6); torch.setAttribute('x2', tx); torch.setAttribute('y2', ty);
      flameAt.setAttribute('transform', `translate(${tx.toFixed(1)},${(ty - 6).toFixed(1)})`);
      lamp.setAttribute('transform', `translate(${tx.toFixed(1)},${(ty - 6).toFixed(1)})`);
    };
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (moving) {
        const dx = Math.min(110 * dt, target - x);
        x += dx;
        phase += dx / 30 * Math.PI;                             // one step per ~30 units, matching the leg swing so feet don't slide
        amp = Math.min(1, amp + dt * 5);
        if (target - x < 0.5) { x = target; moving = false; const f = onArrive; onArrive = null; f && f(); }
      } else {
        amp = Math.max(0, amp - dt * 4);                        // settle into a standing pose
      }
      draw();
      raf = (moving || amp > 0) ? requestAnimationFrame(tick) : 0;
    };
    const go = (to, done) => {
      if (reduced) { x = to; amp = 0; draw(); done(); return; }
      target = to; moving = true; onArrive = done;
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    };

    let step = 0, timer = null, current = null;
    const light = (lx, r, shade) => {
      const c = mk('circle', { cx: lx + 20, cy: feetY(lx) - 70, r: 0, fill: shade }, lit);
      requestAnimationFrame(() => { c.style.transition = reduced ? 'none' : 'r 0.8s ease'; c.style.r = r; c.setAttribute('r', r); });
      return c;
    };
    const arrive = () => {
      count.textContent = `Steps taken: ${step} · Things you now know: ${step}`;
      if (current) current.setAttribute('fill', '#3a3a3a');     // the path behind stays faintly lit
      current = light(xs[step], 130, 'black');
    };
    const say = (text, cls) => { log.innerHTML = ''; const li = document.createElement('li'); if (cls) li.className = cls; li.textContent = text; log.appendChild(li); };
    const reset = () => {
      clearTimeout(timer); cancelAnimationFrame(raf); raf = 0; moving = false;
      lit.innerHTML = ''; current = null; step = 0; x = xs[0]; amp = 0; phase = 0;
      box.classList.remove('is-done', 'is-walking');
      draw(); arrive();
      say('It’s dark. Your torch lights a few feet. Everything past that is a guess.');
      btn.textContent = 'Take the first step'; btn.disabled = false;
    };
    const finish = () => {
      // look back: the whole path you walked is lit
      lit.querySelectorAll('circle').forEach((c) => c.setAttribute('fill', '#141414'));
      light(450, 520, '#202020');
      box.classList.add('is-done');
      say(notes[notes.length - 1], 'is-edge');
      btn.textContent = 'Walk it again'; btn.disabled = false;
      box.classList.remove('is-walking');
    };
    const walk = () => {
      step++;
      go(xs[step], () => {
        arrive();
        say(notes[step - 1]);
        timer = setTimeout(step < xs.length - 1 ? walk : finish, reduced ? 700 : 450);
      });
    };
    btn.addEventListener('click', () => {
      if (box.classList.contains('is-walking')) return;
      if (box.classList.contains('is-done')) reset();
      box.classList.add('is-walking');
      btn.textContent = 'Walking…'; btn.disabled = true;
      walk();
    });
    reset();
  });

  /* ── 8. READING THE SIGNAL: pick the feeling, see where you're standing ── */
  document.querySelectorAll('.fx-signal').forEach((box, n) => {
    const id = 'sig' + n;
    const svg = box.querySelector('svg');
    const out = box.querySelector('.fx-signal-out');
    defsFor(svg, id);
    const T = terrain(0);
    mk('path', { d: T.ground, fill: `url(#${id}-ground)`, stroke: '#c4b5fd', 'stroke-width': 2, 'stroke-opacity': 0.5 }, svg);
    mk('path', { d: T.rocks, class: 'fx-edge-rocks' }, svg);
    const glow = mk('ellipse', { cx: T.E - 6, cy: T.ridge, rx: 70, ry: 110, fill: `url(#${id}-edge)`, opacity: 0 }, svg);
    const me = drawWanderer(svg, id);
    const spots = { comfort: 160, edge: 608, cliff: 700 };
    const put = (k) => {
      const x = spots[k], y = k === 'cliff' ? 470 : T.y(x) - 10;
      me.style.transform = `translate(${x}px,${y}px)`;
      me.classList.toggle('is-falling', k === 'cliff');
      glow.setAttribute('opacity', k === 'edge' ? 1 : 0);
    };
    box.querySelectorAll('.fx-signal-opt').forEach((b) => {
      b.addEventListener('click', () => {
        box.querySelectorAll('.fx-signal-opt').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
        put(b.dataset.k);
        out.textContent = b.dataset.say;
        out.className = 'fx-signal-out is-' + b.dataset.k;
      });
    });
    me.style.transform = `translate(-60px,${T.base - 10}px)`;
  });

  /* ── 9. COMMIT CHANGES: the button the whole essay has been about ── */
  document.querySelectorAll('.fx-commit').forEach((box) => {
    const btn = box.querySelector('.fx-commit-btn');
    const msg = box.querySelector('.fx-commit-msg');
    btn.addEventListener('click', () => {
      if (box.classList.contains('is-done')) return;
      box.classList.add('is-done');
      btn.innerHTML = '<span aria-hidden="true">✓</span> Changes committed';
      btn.disabled = true;
      msg.hidden = false;
      if (reduced) return;
      const r = btn.getBoundingClientRect(), br = box.getBoundingClientRect();
      for (let i = 0; i < 26; i++) {
        const sp = document.createElement('span');
        sp.className = 'fx-commit-spark';
        sp.textContent = '✦';
        const a = (Math.random() * Math.PI) + Math.PI, d = 90 + Math.random() * 220;
        sp.style.left = (r.left - br.left + r.width / 2) + 'px';
        sp.style.top = (r.top - br.top + r.height / 2) + 'px';
        sp.style.setProperty('--tx', Math.cos(a) * d + 'px');
        sp.style.setProperty('--ty', Math.sin(a) * d - 40 + 'px');
        sp.style.setProperty('--c', ['#fff1c1', '#f0c040', '#c084fc', '#e879f9', '#2ee6c8'][i % 5]);
        sp.style.animationDelay = (Math.random() * 0.25) + 's';
        sp.style.fontSize = (10 + Math.random() * 14) + 'px';
        box.appendChild(sp);
        setTimeout(() => sp.remove(), 2200);
      }
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
