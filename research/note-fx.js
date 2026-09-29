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
})();
