// Blue Compile – hero 3D particle torus knot (no dependencies)
(function () {
  var cv = document.getElementById('hero3d');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // torus knot (p=2, q=3) as a tube of points + outer dust
  var pts = [];
  var P = 2, Q = 3, N = 520, M = 7, R = 1.15, r = 0.42, tube = 0.16;
  function knot(t) {
    var c = R + r * Math.cos(Q * t);
    return [c * Math.cos(P * t), c * Math.sin(P * t), r * Math.sin(Q * t)];
  }
  for (var i = 0; i < N; i++) {
    var t = (i / N) * Math.PI * 2;
    var a = knot(t), b = knot(t + 0.001);
    var tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
    var tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
    var nx = ty, ny = -tx, nz = 0;
    var nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    var bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    for (var j = 0; j < M; j++) {
      var ang = (j / M) * Math.PI * 2 + i * 0.07;
      var cs = Math.cos(ang) * tube, sn = Math.sin(ang) * tube;
      pts.push({ x: a[0] + nx * cs + bx * sn, y: a[1] + ny * cs + by * sn, z: a[2] + nz * cs + bz * sn, k: 0 });
    }
  }
  for (var d = 0; d < 520; d++) {
    var u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1);
    var rad = 2.3 + Math.random() * 1.6;
    pts.push({ x: rad * Math.sin(v) * Math.cos(u), y: rad * Math.sin(v) * Math.sin(u), z: rad * Math.cos(v), k: 1 });
  }

  var mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) {
    var rc = cv.getBoundingClientRect();
    mouse.x = ((e.clientX - rc.left) / (rc.width || 1)) - 0.5;
    mouse.y = ((e.clientY - rc.top) / (rc.height || 1)) - 0.5;
  }, { passive: true });

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !raf && !paused) raf = requestAnimationFrame(frame);
    }).observe(cv);
  }

  var rx = 0, ry = 0, t0 = performance.now(), raf = 0;
  // Pause control (WCAG 2.2.2). Starts paused when the visitor prefers reduced motion.
  var paused = reduce, pausedTotal = 0, pauseStart = performance.now();
  var btn = document.getElementById('animToggle');
  function syncBtn() {
    if (!btn) return;
    btn.textContent = paused ? btn.getAttribute('data-play') : btn.getAttribute('data-pause');
    btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }
  if (btn) {
    btn.hidden = false;
    btn.addEventListener('click', function () {
      if (paused) {
        pausedTotal += performance.now() - pauseStart;
        paused = false;
        if (!raf && visible) raf = requestAnimationFrame(frame);
      } else {
        paused = true;
        pauseStart = performance.now();
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
      }
      syncBtn();
    });
    syncBtn();
  }
  var proj = new Array(pts.length);

  function frame(now) {
    raf = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var wide = w > 900;
    var rtl = document.documentElement.dir === "rtl";
    var cx = wide ? w * (rtl ? 0.3 : 0.7) : w * 0.5;
    var cy = wide ? h * 0.52 : h * 0.62;
    var scale = Math.min(wide ? w * 0.13 : w * 0.3, h * 0.2);
    ctx.globalAlpha = wide ? 1 : 0.2;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 2.6);
    g.addColorStop(0, 'rgba(47,91,255,0.28)');
    g.addColorStop(1, 'rgba(47,91,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    var t = (now - t0 - pausedTotal) / 1000;
    var tY = t * 0.32 + mouse.x * 0.9;
    var tX = 0.55 + Math.sin(t * 0.21) * 0.25 + mouse.y * 0.6;
    ry += (tY - ry) * 0.06; rx += (tX - rx) * 0.06;
    var cY = Math.cos(ry), sY = Math.sin(ry), cX = Math.cos(rx), sX = Math.sin(rx);

    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      var spin = p.k ? t * 0.05 : 0;
      var c = Math.cos(spin), s = Math.sin(spin);
      var x = p.x * c - p.y * s, y = p.x * s + p.y * c, z = p.z;
      var x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
      var y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
      var persp = 4.2 / (4.2 + z2);
      proj[i] = { sx: cx + x1 * scale * persp, sy: cy + y1 * scale * persp, z: z2, s: persp, k: p.k };
    }
    proj.sort(function (a, b) { return b.z - a.z; });
    for (var k = 0; k < proj.length; k++) {
      var q = proj[k];
      var depth = Math.max(0, Math.min(1, (1.8 - q.z) / 3.6));
      if (q.k) {
        ctx.fillStyle = 'rgba(127,162,255,' + (0.12 + depth * 0.35).toFixed(3) + ')';
        var sz = 1.1 * q.s;
        ctx.fillRect(q.sx, q.sy, sz, sz);
      } else {
        var rr = Math.round(40 + depth * 110), gg = Math.round(80 + depth * 130);
        ctx.fillStyle = 'rgba(' + rr + ',' + gg + ',255,' + (0.25 + depth * 0.75).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(q.sx, q.sy, (1.2 + depth * 2.4) * q.s, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (!paused && visible) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
})();
