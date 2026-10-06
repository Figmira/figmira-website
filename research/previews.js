/* ═══════════════════════════════════════════════════════════════════
   FIGMIRA · NOTE PREVIEWS
   A small, looping version of each note's signature visual, shown
   beside it in the research list.

   To give a note a preview, add one line to its front matter:
     preview: edge      (the cliff and the edge)
     preview: skhy      (stacked memory and the road to $780)
     preview: morph     (DELUSIONAL → VISION → OBVIOUS)
     preview: worlds    (the studio and its four worlds)
   Notes without one get "worlds".
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  // A few faint background stars, placed the same way every time
  function stars(n, seed) {
    var out = '', s = seed;
    function r() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    for (var i = 0; i < n; i++) {
      var x = (r() * 300).toFixed(1), y = (r() * 120).toFixed(1), o = (0.25 + r() * 0.5).toFixed(2), d = (2 + r() * 3).toFixed(1);
      out += '<circle cx="' + x + '" cy="' + y + '" r="0.9" fill="#fff" opacity="' + o + '">' +
             '<animate attributeName="opacity" values="' + o + ';0.08;' + o + '" dur="' + d + 's" repeatCount="indefinite"/></circle>';
    }
    return out;
  }

  // A glowing traveler (gold dot with a soft halo)
  function glow(fill) {
    return '<circle r="13" fill="' + fill + '" opacity="0.16"/><circle r="6.5" fill="' + fill + '" opacity="0.4"/><circle r="2.8" fill="#fff6dc"/>';
  }

  var VIZ = {
    // ─── The Edge, Not the Cliff: the torch-bearer from the essay climbs to the edge ───
    edge: {
      ground: function (x) {                       // the height of the ground at x (matches the drawn hill)
        if (x <= 95) return 148;
        if (x >= 205) return 80;
        var t = (x - 95) / 110; return 148 - 68 * t * t * (3 - 2 * t);
      },
      build: function (id) {
        var d = 'M0 148', x;
        for (x = 95; x <= 205; x += 5) d += ' L' + x + ' ' + this.ground(x).toFixed(1);
        d += ' L205 190 L0 190 Z';
        return stars(14, 7) +
          '<path d="' + d + '" fill="rgba(76,52,150,0.38)" stroke="rgba(196,176,255,0.6)" stroke-width="1.2" stroke-linejoin="round"/>' +
          '<path d="M205 190 L205 177 L215 168 L225 177 L236 166 L246 177 L256 167 L266 178 L277 166 L288 177 L300 168 L300 190 Z" fill="rgba(192,132,252,0.12)" stroke="rgba(192,132,252,0.55)" stroke-width="1"/>' +
          '<text x="48" y="172" class="v-lab" fill="#fff1c1" opacity="0.75">COMFORT</text>' +
          '<text x="252" y="156" class="v-lab" fill="#c084fc" opacity="0.6">PANIC</text>' +
          '<text x="205" y="30" class="v-lab v-big v-edge-t" fill="#f0c040" opacity="0.35">THE EDGE</text>' +
          '<g class="v-fig" opacity="0" stroke="#ebe4d4" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
            '<circle class="v-halo" r="16" fill="#ffb84a" stroke="none" opacity="0.14"/>' +
            '<circle class="v-flare" r="0" fill="#f0c040" stroke="none" opacity="0"/>' +
            '<polyline class="v-legB" opacity="0.75"/><polyline class="v-armF" opacity="0.75"/><line class="v-torso"/>' +
            '<polyline class="v-legA"/><circle class="v-head" r="3.8" fill="#06060d"/><polyline class="v-armT"/>' +
            '<line class="v-torch" stroke="#b8891f"/>' +
            '<g class="v-flame"><circle r="6" fill="#ffc35a" stroke="none" opacity="0.35"/>' +
              '<path d="M0,-5 C2.5,-1.7 3,1.3 0,3.4 C-3,1.3 -2.5,-1.7 0,-5 Z" fill="#ffd27a" stroke="none"/></g>' +
          '</g>';
      },
      // The walk is posed by code every frame (the same gait as the torch walk in the essay)
      run: function (svg) {
        var self = this, q = function (c) { return svg.querySelector('.' + c); };
        var fig = q('v-fig'), legA = q('v-legA'), legB = q('v-legB'), armF = q('v-armF'), armT = q('v-armT'),
            torso = q('v-torso'), head = q('v-head'), torch = q('v-torch'), flame = q('v-flame'),
            halo = q('v-halo'), flare = q('v-flare'), label = q('v-edge-t');
        var S = 0.42, L = 15 * S, X0 = 20, X1 = 197;
        var pt = function (x, y) { return x.toFixed(1) + ',' + y.toFixed(1); };
        var slope = function (x) { return (self.ground(x - 2) - self.ground(x + 2)) / 4; };   // rise per unit, uphill = positive
        var leg = function (hx, hy, ph, amp) {
          var a = amp * 0.5 * Math.sin(ph) + (1 - amp) * 0.07 * (Math.sign(Math.sin(ph)) || 1);
          var bend = amp * 0.9 * Math.max(0, Math.cos(ph));
          var kx = hx + L * Math.sin(a), ky = hy + L * Math.cos(a);
          var fx = kx + L * Math.sin(a - bend), fy = ky + L * Math.cos(a - bend);
          fy -= (self.ground(hx) - self.ground(fx));          // keep each foot on the slope
          return pt(hx, hy) + ' ' + pt(kx, ky) + ' ' + pt(fx, fy);
        };
        var x = X0, phase = 0, amp = 0, stage = 'walk', t0 = 0, last = 0, raf = 0, glowK = 0;
        function draw(now) {
          var gy = self.ground(x), aA = amp * 0.5 * Math.sin(phase), aB = amp * 0.5 * Math.sin(phase + Math.PI);
          var hipY = gy - 2 * L * Math.cos(Math.cos(phase) <= 0 ? aA : aB) + 0.6;
          var lean = amp * 0.08 + slope(x) * 0.3, T = 30 * S;
          var nx = x + Math.sin(lean) * T, ny = hipY - T * Math.cos(lean);
          legA.setAttribute('points', leg(x, hipY, phase, amp));
          legB.setAttribute('points', leg(x, hipY, phase + Math.PI, amp));
          torso.setAttribute('x1', x); torso.setAttribute('y1', hipY); torso.setAttribute('x2', nx); torso.setAttribute('y2', ny);
          head.setAttribute('cx', nx + 0.4); head.setAttribute('cy', ny - 11 * S);
          var sx = nx - 0.2, sy = ny + 6 * S, sw = -amp * 0.55 * Math.sin(phase), u = 8 * S;
          armF.setAttribute('points', pt(sx, sy) + ' ' + pt(sx + u * Math.sin(sw), sy + u * Math.cos(sw)) + ' ' +
            pt(sx + u * Math.sin(sw) + u * Math.sin(sw + 0.5), sy + u * Math.cos(sw) + u * Math.cos(sw + 0.5)));
          var ex = sx + 9 * S, ey = sy + 2 * S, hx = ex + 6 * S, hy = ey - 10 * S;
          armT.setAttribute('points', pt(sx, sy) + ' ' + pt(ex, ey) + ' ' + pt(hx, hy));
          var tx = hx + 7 * S, ty = hy - 28 * S, fl = 1 + 0.08 * Math.sin(now / 70) + 0.05 * Math.sin(now / 37);
          torch.setAttribute('x1', hx - 0.4); torch.setAttribute('y1', hy + 6 * S); torch.setAttribute('x2', tx); torch.setAttribute('y2', ty);
          var f = 'translate(' + tx.toFixed(1) + ',' + (ty - 2.5).toFixed(1) + ')';
          flame.setAttribute('transform', f + ' scale(' + (fl * (1 + glowK * 0.35)).toFixed(3) + ')');
          halo.setAttribute('transform', f); halo.setAttribute('r', (16 + glowK * 10) * fl);
          halo.setAttribute('opacity', (0.14 + glowK * 0.12).toFixed(3));
          flare.setAttribute('transform', f);
        }
        function tick(now) {
          var dt = Math.min(0.05, (now - last) / 1000 || 0), e = (now - t0) / 1000; last = now;
          if (stage === 'walk') {
            fig.setAttribute('opacity', Math.min(1, e / 0.4).toFixed(2));
            var v = 44 * (1 - 0.4 * Math.min(1, Math.max(0, slope(x)))), dx = Math.min(v * dt, X1 - x);
            x += dx; phase += dx / (30 * S) * Math.PI; amp = Math.min(1, amp + dt * 5);
            if (X1 - x < 0.3) { x = X1; stage = 'edge'; t0 = now; }
          } else if (stage === 'edge') {
            amp = Math.max(0, amp - dt * 4);
            glowK = Math.min(1, e / 0.6);
            label.setAttribute('opacity', (0.35 + 0.65 * glowK).toFixed(2));
            var k = Math.min(1, e / 1.2);                       // one soft burst of light at the edge
            flare.setAttribute('r', (6 + 30 * k).toFixed(1)); flare.setAttribute('opacity', (0.4 * (1 - k)).toFixed(3));
            if (e > 2.4) { stage = 'out'; t0 = now; }
          } else {
            fig.setAttribute('opacity', Math.max(0, 1 - e / 0.6).toFixed(2));
            label.setAttribute('opacity', (0.35 + 0.65 * Math.max(0, 1 - e / 0.6)).toFixed(2));
            if (e > 0.9) { stage = 'walk'; t0 = now; x = X0; phase = 0; amp = 0; glowK = 0; }
          }
          draw(now);
          raf = requestAnimationFrame(tick);
        }
        return {
          play: function () { if (!raf) { last = performance.now(); t0 = t0 || last; raf = requestAnimationFrame(tick); } },
          pause: function () { cancelAnimationFrame(raf); raf = 0; },
          still: function () { x = X1; amp = 0; glowK = 1; fig.setAttribute('opacity', 1); label.setAttribute('opacity', 1); draw(0); }
        };
      }
    },

    // ─── SK hynix: stacked memory, then the road to $780 ───
    skhy: { dur: 8, still: 6.6, build: function (id) {
      var d = this.dur + 's', out = stars(10, 3), n = 8;
      for (var i = 0; i < n; i++) {
        var y = 160 - i * 12, t = 0.03 + i * 0.05, top = i === n - 1;
        out += '<g opacity="0"><rect x="30" y="' + y + '" width="80" height="9" rx="2" fill="rgba(240,192,64,' + (top ? 0.4 : 0.16) + ')" stroke="#f0c040" stroke-opacity="0.75" stroke-width="1"/>' +
          '<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;' + t.toFixed(2) + ';' + (t + 0.05).toFixed(2) + ';0.92;1" dur="' + d + '" repeatCount="indefinite"/>' +
          '<animateTransform attributeName="transform" type="translate" values="0 -22;0 -22;0 0;0 0;0 0" keyTimes="0;' + t.toFixed(2) + ';' + (t + 0.05).toFixed(2) + ';0.92;1" dur="' + d + '" repeatCount="indefinite"/></g>';
      }
      out += '<text x="70" y="184" class="v-lab" fill="#fff1c1" opacity="0.6">MEMORY</text>' +
        '<line x1="135" y1="168" x2="290" y2="168" stroke="rgba(255,241,193,0.18)" stroke-width="1"/>' +
        '<clipPath id="' + id + 'c"><rect x="140" y="20" width="0" height="160">' +
          '<animate attributeName="width" values="0;0;150;150;150" keyTimes="0;0.45;0.75;0.92;1" dur="' + d + '" repeatCount="indefinite"/></rect></clipPath>' +
        '<path clip-path="url(#' + id + 'c)" d="M150 142 C200 138 236 104 276 46" fill="none" stroke="#f0c040" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>' +
        '<circle cx="150" cy="142" r="3.2" fill="#f0c040"/>' +
        '<text x="150" y="160" class="v-lab" fill="#fff1c1" opacity="0.75">$192 TODAY</text>' +
        '<g opacity="0" transform="translate(276 46)">' + glow('#f0c040') +
          '<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.74;0.78;0.92;1" dur="' + d + '" repeatCount="indefinite"/></g>' +
        '<text x="240" y="30" class="v-lab v-big" fill="#f0c040" opacity="0">$780<tspan class="v-sub" fill="#fff1c1" dx="5">2032</tspan>' +
          '<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.76;0.8;0.92;1" dur="' + d + '" repeatCount="indefinite"/></text>';
      return out;
    } },

    // ─── Out of My Mind: the word that rewrites itself, and one light leaving the crowd ───
    morph: { dur: 9, still: 7.2, build: function (id) {
      var d = this.dur + 's', out = stars(10, 11), s = 5;
      function r() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
      out += '<g>';
      for (var i = 0; i < 22; i++) {
        var x = (20 + r() * 200).toFixed(1), y = (128 + r() * 44).toFixed(1);
        out += '<circle cx="' + x + '" cy="' + y + '" r="' + (1.4 + r() * 1.2).toFixed(1) + '" fill="#c9bfff" opacity="' + (0.25 + r() * 0.35).toFixed(2) + '"/>';
      }
      out += '<animateTransform attributeName="transform" type="translate" values="0 0;46 0" dur="' + d + '" repeatCount="indefinite"/></g>';
      out += '<path d="M90 150 C150 150 196 128 284 92" fill="none" stroke="#f0c040" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="2 4"/>' +
        '<g opacity="0">' + glow('#f0c040') +
          '<animateMotion path="M90 150 C150 150 196 128 284 92" keyPoints="0;0;1;1" keyTimes="0;0.2;0.8;1" calcMode="linear" dur="' + d + '" repeatCount="indefinite"/>' +
          '<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.9;1" dur="' + d + '" repeatCount="indefinite"/></g>';
      var words = [
        ['DELUSIONAL', '#c084fc', '1;1;0;0;1', '0;0.27;0.33;0.94;1'],
        ['VISION', '#f5e9ff', '0;0;1;1;0;0', '0;0.27;0.33;0.6;0.66;1'],
        ['OBVIOUS', '#f0c040', '0;0;1;1;0', '0;0.6;0.66;0.94;1']
      ];
      words.forEach(function (w) {
        out += '<text x="150" y="78" class="v-word" fill="' + w[1] + '" opacity="0">' + w[0] +
          '<animate attributeName="opacity" values="' + w[2] + '" keyTimes="' + w[3] + '" dur="' + d + '" repeatCount="indefinite"/></text>';
      });
      return out;
    } },

    // ─── Why Figmira Studios Starts With Research: the studio and its four worlds ───
    worlds: { dur: 8, still: 6, build: function (id) {
      var d = this.dur + 's', out = stars(16, 19);
      var c = [150, 95];
      var W = [[66, 48, '#2ee6c8', 'AI'], [234, 48, '#7cc4ff', 'BLOCKCHAIN'], [234, 142, '#ff9a3c', 'ROBOTICS'], [66, 142, '#f0c040', 'INVESTING']];
      out += '<ellipse cx="150" cy="95" rx="96" ry="56" fill="none" stroke="rgba(255,241,193,0.14)" stroke-width="1"/>';
      W.forEach(function (w, i) {
        var t = 0.08 + i * 0.12;
        out += '<line x1="' + c[0] + '" y1="' + c[1] + '" x2="' + w[0] + '" y2="' + w[1] + '" stroke="' + w[2] + '" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="100" stroke-dashoffset="100">' +
          '<animate attributeName="stroke-dashoffset" values="100;100;0;0;100" keyTimes="0;' + t.toFixed(2) + ';' + (t + 0.1).toFixed(2) + ';0.9;1" dur="' + d + '" repeatCount="indefinite"/></line>' +
          '<circle r="2" fill="#fff6dc" opacity="0"><animateMotion path="M' + c[0] + ' ' + c[1] + ' L' + w[0] + ' ' + w[1] + '" keyPoints="0;0;1;1" keyTimes="0;' + (t + 0.1).toFixed(2) + ';' + (t + 0.3).toFixed(2) + ';1" calcMode="linear" dur="' + d + '" repeatCount="indefinite"/>' +
          '<animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;' + (t + 0.1).toFixed(2) + ';' + (t + 0.2).toFixed(2) + ';' + (t + 0.3).toFixed(2) + ';1" dur="' + d + '" repeatCount="indefinite"/></circle>' +
          '<circle cx="' + w[0] + '" cy="' + w[1] + '" r="9" fill="' + w[2] + '" opacity="0.15"><animate attributeName="r" values="8;12;8" dur="' + (2.6 + i * 0.4) + 's" repeatCount="indefinite"/></circle>' +
          '<circle cx="' + w[0] + '" cy="' + w[1] + '" r="4" fill="' + w[2] + '"/>' +
          '<text x="' + w[0] + '" y="' + (w[1] + (w[1] < 95 ? -14 : 22)) + '" class="v-lab" fill="' + w[2] + '" opacity="0.8">' + w[3] + '</text>';
      });
      out += '<g transform="translate(150 95)">' + glow('#fff1c1') + '</g>';
      return out;
    } }
  };

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var boxes = document.querySelectorAll('.rs-list .rs-viz');
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var box = e.target, svg = box.querySelector('svg');
      if (!svg || reduce) return;
      if (e.isIntersecting) { svg.unpauseAnimations(); box._run && box._run.play(); }
      else { svg.pauseAnimations(); box._run && box._run.pause(); }
    });
  }, { rootMargin: '80px' }) : null;

  function mount(box) {
    if (box.querySelector('svg')) return;
    var v = VIZ[box.dataset.viz] || VIZ.worlds;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 300 190');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.innerHTML = v.build('rsv' + (uid++));
    box.appendChild(svg);
    if (v.run) box._run = v.run(svg);
    try {
      svg.pauseAnimations();
      if (reduce) { if (box._run) box._run.still(); else svg.setCurrentTime(v.still); }   // a single, settled frame
      else if (io) io.observe(box); else { svg.unpauseAnimations(); box._run && box._run.play(); }
    } catch (err) { /* very old browsers: the drawing still shows */ }
  }
  boxes.forEach(mount);
  window.rsMountPreview = mount;   // the 3D brain's note cards reuse these previews
})();
