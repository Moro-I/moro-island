const WORKS_URL = "https://designmoro.imweb.me/work";

const LEGEND = {
  poster: "▲",
  branding: "●",
  package: "◎",
  logo: "◉",
  exhibition: "■",
  character: "◆",
  book: "□",
};

/**
 * Major works — SVG coords in island viewBox (1200×784).
 * Sampled from white fill pixels far from contour strokes.
 */
const WORK_MARKERS = [
  { id: "w1", category: "poster", x: 169, y: 255, title: "Poster field" },
  { id: "w2", category: "branding", x: 206, y: 388, title: "Brand system" },
  { id: "w3", category: "package", x: 164, y: 522, title: "Package design" },
  { id: "w4", category: "logo", x: 299, y: 389, title: "Logo mark" },
  { id: "w5", category: "exhibition", x: 375, y: 513, title: "Space exhibit" },
  { id: "w6", category: "branding", x: 405, y: 447, title: "Identity kit" },
  { id: "w7", category: "poster", x: 411, y: 576, title: "Campaign poster" },
  { id: "w8", category: "character", x: 535, y: 303, title: "Character set" },
  { id: "w9", category: "book", x: 667, y: 159, title: "Lookbook" },
  { id: "w10", category: "branding", x: 635, y: 448, title: "Studio brand" },
  { id: "w11", category: "package", x: 621, y: 519, title: "Product pack" },
  { id: "w12", category: "logo", x: 794, y: 303, title: "Symbol mark" },
  { id: "w13", category: "poster", x: 814, y: 383, title: "Poster series" },
  { id: "w14", category: "branding", x: 839, y: 451, title: "Retail brand" },
  { id: "w15", category: "package", x: 871, y: 516, title: "Gift set" },
  { id: "w16", category: "exhibition", x: 917, y: 602, title: "Gallery wall" },
  { id: "w17", category: "logo", x: 995, y: 261, title: "Wordmark" },
  { id: "w18", category: "character", x: 1045, y: 401, title: "Mascot" },
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatLocal(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const sec = pad(date.getSeconds());
  return { date: `${y}.${m}.${d}`, time: `${h}:${min}:${sec}` };
}

function initClock() {
  const clock = document.getElementById("clock");
  const dateEl = document.getElementById("clock-date");
  const timeEl = document.getElementById("clock-time");
  if (!clock || !dateEl || !timeEl) return;

  const tick = () => {
    const now = formatLocal(new Date());
    dateEl.textContent = now.date;
    timeEl.textContent = now.time;
    clock.setAttribute("datetime", `${now.date}T${now.time}`);
  };

  tick();

  const msToNextSecond = 1000 - (Date.now() % 1000) + 20;
  setTimeout(() => {
    tick();
    setInterval(tick, 1000);
  }, msToNextSecond);
}

function initMarkers() {
  const svg = document.getElementById("markers");
  if (!svg) return;

  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const NS = "http:" + "/" + "/www.w3.org/2000/svg";

  WORK_MARKERS.forEach((marker) => {
    // Outer link = position only (never scaled — avoids hover jump)
    const g = document.createElementNS(NS, "a");
    g.setAttribute("class", "marker");
    g.setAttribute("transform", `translate(${marker.x} ${marker.y})`);
    g.setAttribute("href", WORKS_URL);
    g.setAttribute("target", "_top");
    g.dataset.category = marker.category;
    g.setAttribute("aria-label", `${marker.title} (${marker.category})`);

    const scale = document.createElementNS(NS, "g");
    scale.setAttribute("class", "marker-scale");

    const hit = document.createElementNS(NS, "circle");
    hit.setAttribute("r", "22");
    hit.setAttribute("class", "marker-hit");

    const text = document.createElementNS(NS, "text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("class", "marker-symbol");
    text.textContent = LEGEND[marker.category] ?? "●";

    const title = document.createElementNS(NS, "title");
    title.textContent = marker.title;

    scale.appendChild(hit);
    scale.appendChild(text);
    g.appendChild(title);
    g.appendChild(scale);
    svg.appendChild(g);
  });
}

const LOADER_SEEN_KEY = "moro-loader-seen";

function initReveal() {
  const scene = document.getElementById("scene");
  const loader = document.getElementById("loader");
  const progressEl = document.getElementById("loader-progress");
  const boatEl = document.getElementById("loader-boat");
  const needle = document.getElementById("loader-needle");
  if (!scene) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let alreadySeen = false;
  try {
    alreadySeen = sessionStorage.getItem(LOADER_SEEN_KEY) === "1";
  } catch (_) {
    /* private mode etc. */
  }

  const markSeen = () => {
    try {
      sessionStorage.setItem(LOADER_SEEN_KEY, "1");
    } catch (_) {
      /* ignore */
    }
  };

  const finishMap = (instant = false) => {
    if (reduced || instant) {
      scene.classList.add("skip", "ready");
      return;
    }
    scene.classList.remove("ready", "skip");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scene.classList.add("ready");
      });
    });
  };

  let closed = false;
  const hideLoader = (instant = false) => {
    if (closed) return;
    closed = true;
    markSeen();
    if (!loader) {
      finishMap(instant);
      return;
    }
    if (instant) {
      loader.remove();
      finishMap(true);
      return;
    }
    loader.classList.add("is-done");
    loader.setAttribute("aria-busy", "false");
    window.setTimeout(
      () => {
        loader.remove();
        finishMap();
      },
      reduced ? 40 : 800
    );
  };

  // Returning from contact/about (same tab session): skip the shipwreck loader
  if (alreadySeen) {
    hideLoader(true);
    return;
  }

  // Empty sea: boat rocks above compass; needle wanders, then jolts
  if (boatEl) boatEl.classList.add("is-on");

  let needleAngle = -12;
  let nextJoltAt = performance.now() + 1800 + Math.random() * 2200;
  let joltUntil = 0;
  let joltVel = 0;

  const tickNeedle = (t) => {
    if (!loader || loader.classList.contains("is-done")) return;

    if (needle) {
      // Slow unsettled drift — never calmly locks on north
      const wander =
        Math.sin(t / 2100) * 22 +
        Math.sin(t / 1300) * 11 +
        Math.sin(t / 700) * 5;

      if (t >= nextJoltAt && t >= joltUntil) {
        // Short wrong-way snap — broken / confused
        joltVel = (Math.random() < 0.5 ? -1 : 1) * (55 + Math.random() * 70);
        joltUntil = t + 140 + Math.random() * 120;
        nextJoltAt = t + 2400 + Math.random() * 4200;
      }

      if (t < joltUntil) {
        needleAngle += joltVel * 0.016;
        joltVel *= 0.86;
      } else {
        const target = wander;
        needleAngle += (target - needleAngle) * 0.045;
      }

      needle.style.transform = `rotate(${needleAngle}deg)`;
    }

    requestAnimationFrame(tickNeedle);
  };

  if (!reduced) requestAnimationFrame(tickNeedle);

  if (reduced) {
    if (progressEl) progressEl.setAttribute("aria-valuenow", "100");
    window.setTimeout(() => hideLoader(true), 0);
    return;
  }

  if (!loader) {
    finishMap();
    return;
  }

  const MIN_MS = 5500;
  if (progressEl) progressEl.setAttribute("aria-valuenow", "0");
  window.setTimeout(() => {
    if (progressEl) progressEl.setAttribute("aria-valuenow", "100");
    hideLoader();
  }, MIN_MS);
}

function initRoutesDrift() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const group = document.getElementById("routes-group");
  if (!group) return;

  const animate = (t) => {
    // gentle sway — visible but still clear of islands
    const y = Math.sin(t / 1800) * 1.1;
    const x = Math.cos(t / 2200) * 0.85;
    group.setAttribute("transform", `translate(${x} ${y})`);
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function formatCoord(value, pos, neg) {
  const abs = Math.abs(value).toFixed(4);
  return `${abs}° ${value >= 0 ? pos : neg}`;
}

function initFix() {
  const root = document.getElementById("fix");
  const coordsEl = document.getElementById("fix-coords");
  if (!root || !coordsEl || !navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      coordsEl.textContent = `${formatCoord(latitude, "N", "S")}  ·  ${formatCoord(longitude, "E", "W")}`;
      root.hidden = false;
    },
    () => {
      /* permission denied / unavailable — stay hidden */
    },
    {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000,
    }
  );
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * Land mask from real island SVG <img> silhouettes (screen space).
 * Opaque SVG pixels = land; dilated so the boat stays clear of coasts / pier.
 */
function createLandMask() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const scale = 0.65;
  let land = null;
  let cw = 0;
  let ch = 0;
  let dirty = true;
  let maskOff = false;

  const selectors = [
    ".moro-block .island-img",
    ".sat.contact .sat-island",
    ".sat.about .sat-island",
  ];

  function markDirty() {
    dirty = true;
  }

  function drawIslandImg(img, expand = 1) {
    const r = img.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;

    // Use the on-screen box so mask matches what the user sees
    const w = r.width;
    const h = r.height;
    const cx = r.left + w / 2;
    const cy = r.top + h / 2;
    const transform = getComputedStyle(img).transform;

    ctx.save();
    ctx.translate(cx, cy);
    if (transform && transform !== "none") {
      const m = new DOMMatrixReadOnly(transform);
      ctx.transform(m.a, m.b, m.c, m.d, 0, 0);
    }

    const dw = w * expand;
    const dh = h * expand;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  function rebuild() {
    if (maskOff) {
      land = null;
      dirty = false;
      return;
    }

    const imgs = selectors
      .map((sel) => document.querySelector(sel))
      .filter((img) => img && img.complete && img.naturalWidth > 0);

    cw = Math.max(1, Math.ceil(window.innerWidth * scale));
    ch = Math.max(1, Math.ceil(window.innerHeight * scale));
    canvas.width = cw;
    canvas.height = ch;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    for (const img of imgs) {
      drawIslandImg(img, 1);
    }

    let pixels;
    try {
      pixels = ctx.getImageData(0, 0, cw, ch).data;
    } catch (err) {
      // Imweb CDN images are cross-origin, so the canvas cannot be read.
      maskOff = true;
      land = null;
      dirty = false;
      return;
    }
    const raw = new Uint8Array(cw * ch);
    for (let i = 0; i < raw.length; i++) {
      raw[i] = pixels[i * 4 + 3] > 28 ? 1 : 0;
    }

    // Minimal edge only (~3–4 CSS px) so water near the pier stays open
    const rad = Math.max(2, Math.round(4 * scale));
    const out = new Uint8Array(cw * ch);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        let hit = 0;
        loop: for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            if (dx * dx + dy * dy > rad * rad) continue;
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= cw || yy >= ch) continue;
            if (raw[yy * cw + xx]) {
              hit = 1;
              break loop;
            }
          }
        }
        out[y * cw + x] = hit;
      }
    }

    land = out;
    dirty = false;
  }

  function ensure() {
    if (dirty || !land) rebuild();
  }

  function isLand(x, y) {
    if (maskOff) return false;
    ensure();
    if (maskOff || !land) return false;
    const sx = (x * scale) | 0;
    const sy = (y * scale) | 0;
    if (sx < 0 || sy < 0 || sx >= cw || sy >= ch) return false;
    return land[sy * cw + sx] === 1;
  }

  function segmentHitsLand(a, b) {
    const len = dist(a, b);
    const steps = Math.max(2, Math.ceil(len / 4));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (isLand(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return true;
    }
    return false;
  }

  function nearestWater(x, y, maxR = 520) {
    if (!isLand(x, y)) return { x, y };
    for (let r = 3; r <= maxR; r += r < 40 ? 2 : 6) {
      const samples = Math.max(10, Math.min(48, (r / 3) | 0));
      for (let i = 0; i < samples; i++) {
        const ang = (i / samples) * Math.PI * 2;
        const px = x + Math.cos(ang) * r;
        const py = y + Math.sin(ang) * r;
        if (!isLand(px, py)) return { x: px, y: py };
      }
    }
    return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.82 };
  }

  function cast(origin, ang, maxDist) {
    const step = 4;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    let traveled = 0;
    while (traveled < maxDist) {
      traveled += step;
      if (isLand(origin.x + cos * traveled, origin.y + sin * traveled)) {
        return Math.max(0, traveled - step);
      }
    }
    return maxDist;
  }

  function softAvoidance(pos) {
    let fx = 0;
    let fy = 0;
    let hits = 0;
    const radius = 22;
    const samples = 16;
    for (let i = 0; i < samples; i++) {
      const ang = (i / samples) * Math.PI * 2;
      const px = pos.x + Math.cos(ang) * radius;
      const py = pos.y + Math.sin(ang) * radius;
      if (!isLand(px, py)) continue;
      fx -= Math.cos(ang);
      fy -= Math.sin(ang);
      hits += 1;
    }
    if (!hits) return { x: 0, y: 0 };
    const s = 220 * (hits / samples);
    const n = Math.hypot(fx, fy) || 1;
    return { x: (fx / n) * s, y: (fy / n) * s };
  }

  function seekPoint(boat, cursor) {
    const goal = nearestWater(cursor.x, cursor.y);
    if (!segmentHitsLand(boat, goal) && !isLand(boat.x, boat.y)) return goal;

    const base = Math.atan2(goal.y - boat.y, goal.x - boat.x);
    let best = null;
    let bestScore = -Infinity;

    for (let i = 0; i <= 20; i++) {
      const spread = (i / 20) * Math.PI * 0.95;
      const signs = i === 0 ? [0] : [-1, 1];
      for (const sign of signs) {
        const ang = base + sign * spread;
        const reach = cast(boat, ang, 240);
        if (reach < 16) continue;
        const px = boat.x + Math.cos(ang) * reach * 0.82;
        const py = boat.y + Math.sin(ang) * reach * 0.82;
        if (isLand(px, py)) continue;
        const score = reach * 0.55 - dist({ x: px, y: py }, goal);
        if (score > bestScore) {
          bestScore = score;
          best = { x: px, y: py };
        }
      }
    }

    return best || nearestWater(boat.x, boat.y);
  }

  window.addEventListener("resize", markDirty);
  window.addEventListener("scroll", markDirty, { passive: true });

  for (const sel of selectors) {
    const img = document.querySelector(sel);
    if (!img) continue;
    if (img.complete) markDirty();
    else img.addEventListener("load", markDirty, { once: true });
    if ("ResizeObserver" in window) {
      new ResizeObserver(markDirty).observe(img);
    }
  }

  const stage = document.querySelector(".map-stage");
  if (stage && "ResizeObserver" in window) {
    new ResizeObserver(markDirty).observe(stage);
  }

  const scene = document.getElementById("scene");
  if (scene && "MutationObserver" in window) {
    new MutationObserver(markDirty).observe(scene, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  return {
    markDirty,
    isLand,
    nearestWater,
    softAvoidance,
    seekPoint,
    ensure,
  };
}

function initBoat() {
  const boat = document.getElementById("boat");
  const scene = document.getElementById("scene");
  if (!boat || !scene) return;

  const fine = window.matchMedia("(pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduced) return;

  boat.hidden = false;

  const mask = createLandMask();
  const pos = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.72 };
  const cursor = { x: pos.x, y: pos.y };
  const vel = { x: 0, y: 0 };
  let angle = -12;
  let visible = false;

  const MAX_SPEED = 70;
  const ACCEL = 320;
  const DECEL_DIST = 100;
  let lastT = performance.now();
  let frames = 0;

  function spawnInWater(x, y) {
    mask.markDirty();
    mask.ensure();
    const water = mask.nearestWater(x, y);
    pos.x = water.x;
    pos.y = water.y;
    vel.x = 0;
    vel.y = 0;
  }

  function showBoat(x, y) {
    cursor.x = x;
    cursor.y = y;
    if (visible) return;
    visible = true;
    boat.classList.add("is-on");
    spawnInWater(x, y);
  }

  const onPointer = (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
    showBoat(e.clientX, e.clientY);
  };

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onPointer, { passive: true });
  // Don't hide on leave — reappearing on an island click was spawning on land

  const tick = (t) => {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    frames += 1;
    // layout can settle after first paint / font load
    if (frames === 1 || frames === 8 || frames === 24 || frames === 60) {
      mask.markDirty();
    }

    const target = mask.seekPoint(pos, cursor);
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const d = Math.hypot(dx, dy);

    let desiredVx = 0;
    let desiredVy = 0;

    if (d > 1) {
      const cruise = MAX_SPEED * smoothstep(d / DECEL_DIST);
      desiredVx = (dx / d) * cruise;
      desiredVy = (dy / d) * cruise;
    }

    const avoid = mask.softAvoidance(pos);
    desiredVx += avoid.x;
    desiredVy += avoid.y;

    const desiredSpeed = Math.hypot(desiredVx, desiredVy);
    if (desiredSpeed > MAX_SPEED) {
      desiredVx = (desiredVx / desiredSpeed) * MAX_SPEED;
      desiredVy = (desiredVy / desiredSpeed) * MAX_SPEED;
    }

    const dvx = desiredVx - vel.x;
    const dvy = desiredVy - vel.y;
    const dv = Math.hypot(dvx, dvy);
    if (dv > 1e-4) {
      const maxDelta = ACCEL * dt;
      const step = Math.min(1, maxDelta / dv);
      vel.x += dvx * step;
      vel.y += dvy * step;
    } else {
      vel.x = desiredVx;
      vel.y = desiredVy;
    }

    pos.x += vel.x * dt;
    pos.y += vel.y * dt;

    if (mask.isLand(pos.x, pos.y)) {
      const water = mask.nearestWater(pos.x, pos.y);
      pos.x = water.x;
      pos.y = water.y;
      vel.x *= 0.75;
      vel.y *= 0.75;
    }

    const speed = Math.hypot(vel.x, vel.y);
    if (speed > 8) {
      const heading = (Math.atan2(vel.y, vel.x) * 180) / Math.PI;
      let delta = heading - angle;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      angle += delta * Math.min(1, 10 * dt);
    }

    boat.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${angle}deg)`;
  };

  const step = (t) => {
    try {
      tick(t);
    } catch (err) {
      /* keep following the cursor even if the land mask fails */
    }
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function previewInset() {
  let inset = 0;
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("#scene, #loader, #boat")) continue;
    const r = el.getBoundingClientRect();
    if (r.top > 2 || r.height < 16 || r.height > 140) continue;
    if (r.width < window.innerWidth * 0.5) continue;
    const pos = getComputedStyle(el).position;
    if (pos !== "fixed" && pos !== "sticky") continue;
    inset = Math.max(inset, Math.round(r.bottom));
  }
  return inset;
}

function pinScene(scene) {
  scene.style.setProperty("--moro-top", previewInset() + "px");
  if (scene.parentElement !== document.body) document.body.appendChild(scene);

  const stage = scene.querySelector(".map-stage");
  const fit = () => {
    if (!stage) return;
    const rect = scene.getBoundingClientRect();
    const stageW = Math.max(1, Math.min(rect.width, rect.height * 1.6));
    stage.style.setProperty("--stage-w", stageW + "px");
    stage.style.setProperty("--stage-h", (stageW * 10) / 16 + "px");
  };

  fit();
  window.addEventListener("resize", fit);
}

function boot(tries = 0) {
  const scene = document.getElementById("scene");
  // Imweb may run this script before the widget HTML is in the page.
  if (!scene) {
    if (tries < 40) window.setTimeout(() => boot(tries + 1), 50);
    return;
  }
  pinScene(scene);
  initReveal();
  initMarkers();
  initClock();
  initFix();
  initBoat();
  initRoutesDrift();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
