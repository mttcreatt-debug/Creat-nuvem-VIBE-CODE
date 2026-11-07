/* Elite Drako Gym — 3D.
   1) Tour "Caminhe pela Drako": caminhada em primeira pessoa pelo túnel de neon, com o vídeo de cada lugar.
   2) Anilha: uma anilha de borracha em 3D que gira com o dedo ou o mouse.
   Sem WebGL ou com "reduzir movimento", o tour vira uma faixa de cartões com pôster e vídeo. */
import * as THREE from "three";
import { EffectComposer } from "./assets/vendor/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "./assets/vendor/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./assets/vendor/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "./assets/vendor/addons/postprocessing/OutputPass.js";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const RED = new THREE.Color(0xb3181b);

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}

/* elongated hexagon, same proportions as the ceiling neon */
function hexPoints(w, h, cut) {
  const x = w / 2, y = h / 2;
  return [
    new THREE.Vector3(-x + cut, y, 0), new THREE.Vector3(x - cut, y, 0), new THREE.Vector3(x, 0, 0),
    new THREE.Vector3(x - cut, -y, 0), new THREE.Vector3(-x + cut, -y, 0), new THREE.Vector3(-x, 0, 0)
  ];
}
function hexTube(w, h, cut, radius, color, intensity) {
  const pts = hexPoints(w, h, cut);
  const path = new THREE.CurvePath();
  for (let i = 0; i < pts.length; i++) path.add(new THREE.LineCurve3(pts[i], pts[(i + 1) % pts.length]));
  const geo = new THREE.TubeGeometry(path, 240, radius, 8, true);
  const mat = new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(intensity), toneMapped: false });
  return new THREE.Mesh(geo, mat);
}

/* ============================================================ TOUR: "Caminhe pela Drako"
   A câmera anda, em primeira pessoa, por um túnel de hexágonos de neon (o teto da academia).
   Em cada parada, um vídeo do lugar, gravado à altura do olhar. Ao seguir, o vídeo se abre
   para o lado como uma porta e a câmera passa. Só o vídeo da parada atual toca. */
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/* flat stretched hexagon with 0..1 UVs, so a video fills it */
function hexPlane(w, h, cut) {
  const pts = hexPoints(w, h, cut);
  const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, p.y)));
  const geo = new THREE.ShapeGeometry(shape);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  return geo;
}

function makeVideo(src) {
  const v = document.createElement("video");
  v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
  v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("preload", "none");
  v.crossOrigin = "anonymous";
  v.dataset.src = src;
  return v;
}
function attach(v) { if (!v.getAttribute("src")) { v.preload = "auto"; v.src = v.dataset.src; } }
function detach(v) { if (v.getAttribute("src")) { v.pause(); v.removeAttribute("src"); v.load(); } }
function play(v) { if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } }

function initTour() {
  const section = document.getElementById("tour");
  if (!section || !section.classList.contains("walk")) return;
  const cards = Array.from(section.querySelectorAll("[data-walk-cena]"));
  const N = cards.length;
  if (!N) return;
  const rail = section.querySelector("[data-walk-rail]");
  const railList = rail.querySelector("ol");
  const strip = section.querySelector("[data-walk-strip]");
  const data = cards.map((li) => ({
    id: li.id,
    title: li.querySelector("h3").textContent,
    text: li.querySelector(".walk__txt p:last-child").textContent,
    short: li.dataset.curto || li.querySelector("h3").textContent,
    video: li.dataset.video, poster: li.dataset.poster
  }));

  /* rail buttons, one per stop */
  const stops = data.map((d, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button"; b.className = "walk__stop"; b.textContent = d.short;
    b.setAttribute("aria-label", d.short + ", parada " + (i + 1) + " de " + N);
    li.appendChild(b); railList.appendChild(li);
    return b;
  });
  function markStop(i) {
    stops.forEach((b, k) => {
      if (k === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.classList.toggle("is-past", k < i);
    });
    const b = stops[i];
    if (!b) return;
    // keep the active stop visible inside the rail, without moving the page
    const l = b.parentElement.offsetLeft, r = l + b.parentElement.offsetWidth;
    if (l < railList.scrollLeft + 8 || r > railList.scrollLeft + railList.clientWidth - 8) {
      railList.scrollTo({ left: Math.max(0, l - railList.clientWidth / 2 + b.offsetWidth / 2), behavior: reduce ? "auto" : "smooth" });
    }
  }

  const film = initWalkFilm(section);
  const use3d = !reduce && webglOK();
  if (!use3d) { initWalkStrip(section, strip, cards, data, stops, markStop, film); return; }

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: section.querySelector("[data-walk-canvas]"), antialias: true, powerPreference: "high-performance" }); }
  catch (e) { initWalkStrip(section, strip, cards, data, stops, markStop, film); return; }

  section.classList.add("walk--3d");
  section.style.setProperty("--n", N);
  const track = section.querySelector("[data-walk-track]");
  const stage = section.querySelector("[data-walk-stage]");
  const canvas = renderer.domElement;
  stage.appendChild(rail);
  const capEl = section.querySelector("[data-walk-cap]");
  const bar = section.querySelector("[data-walk-bar]");
  const hint = section.querySelector("[data-walk-hint]");

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x050505, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050505, 7, 30);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 90);

  const S = 9;                // distance between stops
  const PW = 4, PH = 2.25;    // 16:9 video plane
  const WHITE = new THREE.Color(0xffffff);

  /* tunnel: a hex ring every half stop, red and white like the ceiling; a lower long strip on the floor */
  const RINGS = N * 2 + 6;
  for (let i = -3; i < RINGS; i++) {
    const red = i % 2 !== 0;
    const ring = hexTube(10.5, 5.6, 1.5, 0.028, red ? RED : WHITE, red ? 2.6 : 1.1);
    ring.position.set(0, 0.25, -i * S / 2 + S / 4);
    scene.add(ring);
    if (i % 2 === 0) {
      const inner = hexTube(5.6, 3, 0.85, 0.02, red ? WHITE : RED, red ? 1.1 : 2.4);
      inner.position.set(0, 2.85, -i * S / 2 + S / 4 - 1.2);
      inner.rotation.x = Math.PI / 2;
      scene.add(inner);
    }
  }
  const len = (N + 4) * S;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, len), new THREE.MeshBasicMaterial({ color: 0x0c0c0c }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -2.55, -len / 2 + 2 * S);
  scene.add(floor);
  // the walking line on the floor, like a runway
  [-1.15, 1.15].forEach((x) => {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.035, len), new THREE.MeshBasicMaterial({ color: RED.clone().multiplyScalar(1.4), toneMapped: false }));
    l.rotation.x = -Math.PI / 2; l.position.set(x, -2.54, -len / 2 + 2 * S);
    scene.add(l);
  });

  /* stops: hex screen + neon frame + a pool of light on the floor */
  const loader = new THREE.TextureLoader();
  const vbin = document.createElement("div");
  vbin.className = "walk__vbin";
  stage.appendChild(vbin);
  const planeGeo = hexPlane(PW, PH, 0.32);
  const stopsGL = data.map((d, i) => {
    const g = new THREE.Group();
    g.position.set(0, 0, -i * S);
    scene.add(g);
    const pivot = new THREE.Group();     // hinge on one side, so the screen swings open like a door
    const side = i % 2 === 0 ? -1 : 1;
    pivot.position.x = side * PW / 2 * 1.06;
    g.add(pivot);
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide, fog: false });
    const screen = new THREE.Mesh(planeGeo, mat);
    screen.position.x = -side * PW / 2 * 1.06;
    pivot.add(screen);
    const frame = hexTube(PW * 1.06, PH * 1.1, 0.36, 0.02, RED, 2.4);
    frame.material.transparent = true;
    frame.position.copy(screen.position); frame.position.z = -0.01;
    pivot.add(frame);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.3, 1.6), new THREE.MeshBasicMaterial({ color: 0x2a0506, transparent: true, opacity: 0 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, -2.53, 0.6);
    g.add(pool);
    const st = { g, pivot, side, screen, mat, frame, pool, video: null, vtex: null, ptex: null, live: false, wantPoster: false };
    return st;
  });
  function loadPoster(i) {
    const st = stopsGL[i];
    if (!st || st.wantPoster) return;
    st.wantPoster = true;
    loader.load(data[i].poster, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      st.ptex = tex;
      if (!st.live) { st.mat.map = tex; st.mat.color.set(0xffffff); st.mat.needsUpdate = true; }
    });
  }
  function videoFor(i) {
    const st = stopsGL[i];
    if (st.video) return st.video;
    const v = makeVideo(data[i].video);
    v.setAttribute("aria-hidden", "true"); v.tabIndex = -1;
    vbin.appendChild(v);
    v.addEventListener("playing", () => {
      if (!st.vtex) { st.vtex = new THREE.VideoTexture(v); st.vtex.colorSpace = THREE.SRGBColorSpace; }
      st.live = true; st.mat.map = st.vtex; st.mat.color.set(0xffffff); st.mat.needsUpdate = true;
    });
    st.video = v;
    return v;
  }

  /* dust in the light */
  const DUST = 600;
  const dpos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dpos[i * 3] = (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random() * 4.4); // never right in front of the lens
    dpos[i * 3 + 1] = (Math.random() - 0.5) * 6;
    dpos[i * 3 + 2] = 8 - Math.random() * (N + 2) * S;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.022, transparent: true, opacity: 0.4 })));

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.35, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* layout: how far from the screen the camera stops so the video fits */
  let D = 5, narrow = false, W = 1, H = 1;
  const header = document.getElementById("topo");
  function resize() {
    if (header) section.style.setProperty("--bar", Math.round(header.getBoundingClientRect().height) + "px");
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    composer.setPixelRatio(dpr);
    composer.setSize(W, H);
    // wide: screen to the right, caption in the left column. Otherwise: screen on top, caption under it.
    const wide = W >= 1100 && W / H > 1.2;
    narrow = W / H < 0.9;
    camera.aspect = W / H;
    camera.fov = narrow ? 64 : 50;
    const t2 = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const fitW = wide ? 0.52 : 0.9, fitH = wide ? 0.6 : 0.44;
    D = Math.max(PW * 1.06 / (fitW * t2 * camera.aspect), PH * 1.1 / (fitH * t2));
    // where the screen centre sits, as a share of the stage size
    const xc = wide ? 0.62 : 0.5, yc = wide ? 0.44 : (narrow ? 0.29 : 0.3);
    camera.setViewOffset(W, H, (0.5 - xc) * W, (0.5 - yc) * H, W, H);
    stage.classList.toggle("is-wide", wide);
    camera.updateProjectionMatrix();
    // tell the caption where the screen ends (mobile puts the caption under it)
    const planePx = (PH * 1.1 / (t2 * D)) * H;
    stage.style.setProperty("--plane-bottom", ((yc * H + planePx / 2) / H * 100).toFixed(2) + "%");
  }
  resize();
  window.addEventListener("resize", resize);

  /* scroll → position along the route (with a dwell at each stop) */
  function geom() {
    const r = track.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(stage).top) || 0;
    const total = Math.max(1, track.offsetHeight - stage.offsetHeight);
    return { r, top, total };
  }
  function scrollProgress() {
    const { r, top, total } = geom();
    return clamp01((top - r.top) / total);
  }
  function routeAt(p) {
    const raw = p * (N - 1);
    const k = Math.min(N - 2, Math.floor(raw));
    if (k < 0) return 0;
    const f = raw - k;
    return k + smooth(clamp01((f - 0.2) / 0.6));
  }
  function jump(i) {
    const { r, top, total } = geom();
    const y = window.scrollY + r.top - top + (i / (N - 1)) * total + 2;
    window.scrollTo({ top: Math.round(y), behavior: reduce ? "auto" : "smooth" });
  }
  stops.forEach((b, i) => b.addEventListener("click", () => jump(i)));

  let target = routeAt(scrollProgress()), cur = target, prog = scrollProgress();
  window.addEventListener("scroll", () => { prog = scrollProgress(); target = routeAt(prog); }, { passive: true });
  let mx = 0, my = 0;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* caption */
  let shown = -1;
  function caption(i) {
    if (i === shown) return;
    shown = i;
    const d = data[i];
    capEl.classList.remove("is-in");
    void capEl.offsetWidth;
    capEl.innerHTML = '<p class="walk__count">Parada ' + (i + 1) + " de " + N + "</p><h3></h3><p></p>";
    capEl.querySelector("h3").textContent = d.title;
    capEl.querySelector("p:last-child").textContent = d.text;
    capEl.classList.add("is-in");
    markStop(i);
  }

  /* videos: only the nearest one plays; neighbours get their src just in time; far ones are released */
  let visible = false, paused = false;
  function manageVideos(s) {
    const near = Math.round(s);
    stopsGL.forEach((st, i) => {
      const d = Math.abs(s - i);
      if (d < 2.2) loadPoster(i);
      if (d <= 1.25) attach(videoFor(i));
      else if (st.video && d > 2.6) { detach(st.video); st.live = false; if (st.ptex) { st.mat.map = st.ptex; st.mat.needsUpdate = true; } }
      if (st.video) {
        if (visible && !paused && i === near && d < 0.6) play(st.video); else if (!st.video.paused) st.video.pause();
      }
    });
  }
  function pauseAll() { stopsGL.forEach((st) => st.video && st.video.pause()); }
  film.onOpen = () => { paused = true; pauseAll(); };
  film.onClose = () => { paused = false; };
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseAll(); });

  let raf = 0, last = performance.now(), t = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    const prev = cur;
    cur += (target - cur) * (1 - Math.exp(-dt * 5.5));
    if (Math.abs(target - cur) < 1e-4) cur = target;
    const speed = Math.min(1, Math.abs(cur - prev) / Math.max(dt, 1e-3) * 0.9);

    // first person: walk forward, a soft step bob while moving, a breath while still
    const k = Math.floor(cur), f = cur - k;
    const z = -cur * S + D;
    const bob = Math.sin(z * 2.1) * 0.05 * speed + Math.sin(t * 0.9) * 0.02;
    const sway = Math.sin(z * 1.05) * 0.06 * speed;
    camera.position.set(mx * 0.25 + sway, 0.1 + bob - my * 0.12, z);
    camera.lookAt(mx * 0.45 + sway * 0.5, 0.1 - my * 0.1, z - 10);

    stopsGL.forEach((st, i) => {
      const rel = cur - i; // <0: still ahead, 0: here, >0: passing
      let open = 0, o;
      if (rel <= 0) o = clamp01(1.25 + rel * 0.9);         // fades in from the fog as you approach
      else { open = smooth(clamp01(rel * 1.7)); o = 1 - smooth(clamp01((rel - 0.25) * 2.2)); }
      st.pivot.rotation.y = -st.side * open * 1.45;
      st.mat.opacity = o;
      st.frame.material.opacity = o;
      st.frame.visible = st.g.visible = o > 0.003;
      st.pool.material.opacity = 0.9 * o * (1 - open);
    });

    const idx = Math.max(0, Math.min(N - 1, Math.round(cur)));
    caption(idx);
    manageVideos(cur);
    bar.style.transform = "scaleX(" + prog.toFixed(4) + ")";
    if (hint) hint.style.opacity = prog > 0.015 ? "0" : "1";

    composer.render();
  }
  new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && !visible) { visible = true; last = performance.now(); resize(); raf = requestAnimationFrame(frame); }
      else if (!en.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf); pauseAll(); }
    });
  }, { rootMargin: "200px 0px" }).observe(track);
  loadPoster(0); loadPoster(1);
  caption(0);
}

/* fallback: horizontal strip of cards that swipe; each card plays its clip when it is in view */
function initWalkStrip(section, strip, cards, data, stops, markStop, film) {
  section.classList.add("walk--static");
  const vids = cards.map((li, i) => {
    const v = makeVideo(data[i].video);
    v.poster = data[i].poster;
    v.setAttribute("aria-label", "Vídeo: " + data[i].title);
    if (reduce) { v.controls = true; v.classList.add("is-on"); }
    v.addEventListener("playing", () => v.classList.add("is-on"));
    li.querySelector(".walk__media").appendChild(v);
    return v;
  });
  let paused = false;
  film.onOpen = () => { paused = true; vids.forEach((v) => v.pause()); };
  film.onClose = () => { paused = false; };
  const ratio = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const i = cards.indexOf(en.target);
      ratio.set(i, en.intersectionRatio);
      if (en.isIntersecting) attach(vids[i]);
      if (!reduce) { if (en.intersectionRatio > 0.6 && !paused) play(vids[i]); else vids[i].pause(); }
    });
  }, { threshold: [0, 0.6, 1], rootMargin: "0px 40% 0px 40%" });
  cards.forEach((c) => io.observe(c));

  function nearest() {
    const pad = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
    const left = strip.getBoundingClientRect().left + pad;
    let best = 0, bd = Infinity;
    cards.forEach((c, i) => { const d = Math.abs(c.getBoundingClientRect().left - left); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  let ticking = false;
  strip.addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; markStop(nearest()); });
  }, { passive: true });
  stops.forEach((b, i) => b.addEventListener("click", () => {
    const pad = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
    const dx = cards[i].getBoundingClientRect().left - strip.getBoundingClientRect().left - pad;
    strip.scrollTo({ left: strip.scrollLeft + dx, behavior: reduce ? "auto" : "smooth" });
    markStop(i);
  }));
  markStop(0);
}

/* the continuous walk film, in a modal dialog (Esc, close button or a click outside closes it) */
function initWalkFilm(section) {
  const api = { onOpen: null, onClose: null };
  const dlg = section.querySelector("[data-walk-dialog]");
  const btn = section.querySelector("[data-walk-film]");
  if (!dlg || !btn) return api;
  const video = dlg.querySelector("[data-walk-film-video]");
  const close = () => { if (dlg.open) dlg.close(); };
  let opener = null;
  btn.addEventListener("click", () => {
    opener = document.activeElement;
    if (!video.getAttribute("src")) video.src = video.dataset.src;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    document.documentElement.classList.add("walk-lock");
    if (api.onOpen) api.onOpen();
    dlg.querySelector("[data-walk-close]").focus();
    if (!reduce) play(video);
  });
  dlg.querySelector("[data-walk-close]").addEventListener("click", () => { if (dlg.open && typeof dlg.close === "function") dlg.close(); else { dlg.removeAttribute("open"); onClosed(); } });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  function onClosed() {
    video.pause();
    document.documentElement.classList.remove("walk-lock");
    if (api.onClose) api.onClose();
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  dlg.addEventListener("close", onClosed);
  return api;
}


/* ============================================================ SALÃO 360 */
function initGiro() {
  const stage = document.querySelector("[data-giro]");
  if (!stage) return;
  const canvas = stage.querySelector("[data-giro-canvas]");
  const fallback = stage.querySelector(".giro__fallback");
  if (!webglOK()) { stage.classList.add("giro--static"); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
  catch (e) { stage.classList.add("giro--static"); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 100);

  // the stitched photo covers about 190° of the room; wrap it on the inside of a cylinder
  const ARC = THREE.MathUtils.degToRad(190);
  const R = 10, aspect = 6000 / 2207;
  const H = (R * ARC) / aspect;
  const geo = new THREE.CylinderGeometry(R, R, H, 160, 1, true, Math.PI - ARC / 2, ARC);
  geo.scale(-1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  new THREE.TextureLoader().load(fallback.currentSrc || fallback.src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    mat.map = tex; mat.needsUpdate = true;
    stage.classList.add("giro--3d");
  });

  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = r.width / Math.max(1, r.height);
    // keep the photo's top and bottom edges out of view
    const vfov = 2 * Math.atan((H * 0.46) / R);
    camera.fov = THREE.MathUtils.radToDeg(Math.min(vfov, THREE.MathUtils.degToRad(70)));
    camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener("resize", resize);

  const hfov = () => 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
  const limit = () => Math.max(0, ARC / 2 - hfov() / 2);
  let yaw = 0, vel = reduce ? 0 : 0.0016, drag = false, lx = 0, idle = 0, auto = !reduce;
  canvas.addEventListener("pointerdown", (e) => { drag = true; auto = false; lx = e.clientX; canvas.setPointerCapture(e.pointerId); stage.classList.add("is-grab"); });
  canvas.addEventListener("pointermove", (e) => { if (!drag) return; vel = -(e.clientX - lx) * 0.0028; lx = e.clientX; idle = 0; });
  const end = () => { drag = false; stage.classList.remove("is-grab"); };
  canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  stage.querySelectorAll("[data-giro-dir]").forEach((b) => b.addEventListener("click", () => { auto = false; vel = Number(b.dataset.giroDir) * 0.05; idle = 0; }));
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { auto = false; vel = -0.05; }
    if (e.key === "ArrowRight") { auto = false; vel = 0.05; }
  });

  let raf = 0, on = false, dir = 1;
  function frame() {
    raf = requestAnimationFrame(frame);
    idle++;
    if (!drag) {
      if (auto) vel = 0.0016 * dir; else vel *= 0.93;
      if (!auto && idle > 360 && !reduce) auto = true;
    }
    yaw += vel;
    const lim = limit();
    if (yaw > lim) { yaw = lim; dir = -1; vel = 0; }
    if (yaw < -lim) { yaw = -lim; dir = 1; vel = 0; }
    camera.rotation.set(0, -yaw, 0);
    renderer.render(scene, camera);
  }
  new IntersectionObserver((en) => {
    en.forEach((x) => {
      if (x.isIntersecting && !on) { on = true; raf = requestAnimationFrame(frame); }
      else if (!x.isIntersecting && on) { on = false; cancelAnimationFrame(raf); }
    });
  }).observe(stage);
}


/* ============================================================ COMO CHEGAR: mapa 3D de Valente */
function initMapa() {
  const stage = document.querySelector("[data-mapa]");
  if (!stage) return;
  const canvas = stage.querySelector("canvas");
  const labelsEl = stage.querySelector("[data-mapa-labels]");
  if (!webglOK()) { stage.classList.add("mapa--static"); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { stage.classList.add("mapa--static"); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x070707, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070707, 900, 2600);
  const camera = new THREE.PerspectiveCamera(42, 1, 1, 6000);

  fetch(stage.dataset.mapa).then((r) => r.json()).then((d) => {
    stage.classList.add("mapa--3d");
    const S = 1; // metres → units
    const col = { primary: 0x9a9a9a, secondary: 0x8a8a8a, tertiary: 0x7a7a7a, residential: 0x5c5c5c, unclassified: 0x4a4a4a };
    const groups = {};
    d.roads.forEach((r) => {
      const c = col[r.k] || 0x353535;
      const arr = groups[c] || (groups[c] = []);
      for (let i = 0; i < r.p.length - 1; i++) arr.push(r.p[i][0] * S, 0, r.p[i][1] * S, r.p[i + 1][0] * S, 0, r.p[i + 1][1] * S);
    });
    Object.keys(groups).forEach((c) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(groups[c], 3));
      scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: Number(c) })));
    });
    // ground grid feel
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshBasicMaterial({ color: 0x0b0b0b }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -1; scene.add(ground);

    // route as a glowing tube that draws itself
    const rp = d.rotas[0].r.p.map((p) => new THREE.Vector3(p[0] * S, 2, p[1] * S));
    const path = new THREE.CurvePath();
    for (let i = 0; i < rp.length - 1; i++) path.add(new THREE.LineCurve3(rp[i], rp[i + 1]));
    const tube = new THREE.TubeGeometry(path, Math.max(64, rp.length * 6), 3.2, 6, false);
    const routeMat = new THREE.MeshBasicMaterial({ color: RED.clone().multiplyScalar(2.2), toneMapped: false });
    const route = new THREE.Mesh(tube, routeMat);
    scene.add(route);
    const totalIdx = tube.index.count;
    tube.setDrawRange(0, 0);

    // target: the gym street, with a hex beacon at its centre
    const [tx, tz] = d.alvo.c;
    const beacon = new THREE.Group(); beacon.position.set(tx, 0, tz); scene.add(beacon);
    const hex = hexTube(70, 40, 12, 2.2, RED, 2.6); hex.rotation.x = -Math.PI / 2; hex.position.y = 3; beacon.add(hex);
    const hex2 = hexTube(110, 62, 18, 1.4, new THREE.Color(0xffffff), 1.2); hex2.rotation.x = -Math.PI / 2; hex2.position.y = 3; beacon.add(hex2);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 180, 12, 1, true), new THREE.MeshBasicMaterial({ color: RED.clone().multiplyScalar(2), transparent: true, opacity: 0.55, toneMapped: false }));
    beam.position.y = 90; beacon.add(beam);

    // the whole gym street, in white
    (d.alvo.rua || []).forEach((seg) => {
      const pts = seg.map((p) => new THREE.Vector3(p[0] * S, 2.5, p[1] * S));
      const cp = new THREE.CurvePath();
      for (let i = 0; i < pts.length - 1; i++) cp.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(cp, pts.length * 4, 4.2, 6, false), new THREE.MeshBasicMaterial({ color: 0xffffff })));
    });

    // labels for landmarks and the start/end
    const marks = d.pois.map((p, i) => ({ n: i === 0 ? "Partida · " + p.n : p.n, v: new THREE.Vector3(p.p[0] * S, 6, p.p[1] * S), cls: i === 0 ? "is-inicio" : "" }));
    marks.push({ n: "Elite Drako Gym · Rua Eraldo Lopes", v: new THREE.Vector3(tx, 120, tz), cls: "is-alvo" });
    labelsEl.innerHTML = marks.map((m) => '<span class="mapa__lbl ' + m.cls + '">' + m.n + "</span>").join("");
    const lblEls = Array.from(labelsEl.children);

    const centre = new THREE.Vector3(tx / 2, 0, tz / 2);
    function resize() {
      const r = canvas.getBoundingClientRect();
      renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
      camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix();
    }
    resize(); window.addEventListener("resize", resize);

    let ang = -0.6, drag = false, lx = 0, vel = 0, t0 = 0, started = false;
    canvas.addEventListener("pointerdown", (e) => { drag = true; lx = e.clientX; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => { if (drag) { vel = (e.clientX - lx) * 0.004; lx = e.clientX; } });
    const end = () => { drag = false; };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    stage.querySelector("[data-mapa-replay]").addEventListener("click", () => { t0 = performance.now(); });

    let raf = 0, on = false;
    const v = new THREE.Vector3();
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!t0) t0 = now;
      const k = reduce ? 1 : Math.min(1, (now - t0) / 4200);
      tube.setDrawRange(0, Math.floor(totalIdx * k / 3) * 3);
      if (!drag) { vel *= 0.94; if (!reduce) ang += 0.0007; }
      ang += vel;
      const narrow = camera.aspect < 0.9;
      const R = narrow ? 1150 : 1050, H = narrow ? 980 : 760;
      camera.position.set(centre.x + Math.cos(ang) * R, H, centre.z + Math.sin(ang) * R);
      camera.lookAt(centre);
      const pulse = 1 + Math.sin(now / 380) * 0.08;
      hex.scale.setScalar(pulse); hex2.scale.setScalar(2 - pulse);
      renderer.render(scene, camera);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const pos = marks.map((m, i) => {
        v.copy(m.v).project(camera);
        return { i, hide: v.z > 1, x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
      });
      // keep labels from piling on each other: push the later one down
      const vis = pos.filter((p) => !p.hide).sort((a, b) => a.y - b.y);
      for (let a = 0; a < vis.length; a++) for (let b = 0; b < a; b++) {
        const A = vis[a], B = vis[b], wa = lblEls[A.i].offsetWidth, wb = lblEls[B.i].offsetWidth;
        if (Math.abs(A.x - B.x) < (wa + wb) / 2 && Math.abs(A.y - B.y) < 26) A.y = B.y + 26;
      }
      pos.forEach((p) => {
        const el = lblEls[p.i];
        if (p.hide) { el.style.opacity = 0; return; }
        el.style.opacity = 1;
        const hw = el.offsetWidth / 2 + 6;
        p.x = Math.min(w - hw, Math.max(hw, p.x));
        el.style.transform = "translate(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px) translate(-50%,-120%)";
      });
    }
    new IntersectionObserver((en) => {
      en.forEach((x) => {
        if (x.isIntersecting && !on) { on = true; if (!started) { started = true; t0 = 0; } raf = requestAnimationFrame(frame); }
        else if (!x.isIntersecting && on) { on = false; cancelAnimationFrame(raf); }
      });
    }, { threshold: 0.25 }).observe(stage);
  }).catch(() => stage.classList.add("mapa--static"));
}

/* ============================================================ ANILHA */
function initAnilha() {
  const canvas = document.querySelector("[data-anilha-canvas]");
  if (!canvas) return;
  const stage = canvas.parentElement;
  if (!webglOK()) { stage.classList.add("peso--static"); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { stage.classList.add("peso--static"); return; }
  stage.classList.add("peso--3d");
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 6.2);

  const plate = new THREE.Group();
  scene.add(plate);

  /* red body with the three grip openings and the centre hole */
  const body = new THREE.Shape();
  body.absarc(0, 0, 0.86, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.2, 0, Math.PI * 2, true); body.holes.push(hole);
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 2 + k * (Math.PI * 2 / 3);
    const g = new THREE.Path();
    g.absellipse(Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0.2, 0.085, 0, Math.PI * 2, true, a + Math.PI / 2);
    body.holes.push(g);
  }
  const bodyGeo = new THREE.ExtrudeGeometry(body, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 4, curveSegments: 72 });
  bodyGeo.center();
  const rubberRed = new THREE.MeshStandardMaterial({ color: 0xb3181b, roughness: 0.62, metalness: 0.0 });
  plate.add(new THREE.Mesh(bodyGeo, rubberRed));

  /* black outer rim, a little thicker */
  const rim = new THREE.Shape(); rim.absarc(0, 0, 1, 0, Math.PI * 2, false);
  const rimHole = new THREE.Path(); rimHole.absarc(0, 0, 0.85, 0, Math.PI * 2, true); rim.holes.push(rimHole);
  const rimGeo = new THREE.ExtrudeGeometry(rim, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 5, curveSegments: 96 });
  rimGeo.center();
  const rubberBlack = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.7 });
  plate.add(new THREE.Mesh(rimGeo, rubberBlack));

  /* steel hub */
  const hubPts = [];
  [[0.13, -0.24], [0.2, -0.24], [0.22, -0.2], [0.22, 0.2], [0.2, 0.24], [0.13, 0.24]].forEach((p) => hubPts.push(new THREE.Vector2(p[0], p[1])));
  const hub = new THREE.Mesh(new THREE.LatheGeometry(hubPts, 64), new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.22, metalness: 1 }));
  hub.rotation.x = Math.PI / 2;
  plate.add(hub);

  /* "20 KG" painted on the rim, both faces */
  function label(text) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#e9e9e9"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "700 92px Saira, sans-serif";
    g.fillText(text, 256, 68);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  }
  function addLabels() {
    const mat = label("20 KG");
    [[0, 0.925, 0], [0, -0.925, Math.PI]].forEach(([x, y, rot]) => {
      [1, -1].forEach((face) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.11), mat);
        m.position.set(x, y, face * 0.191);
        m.rotation.z = rot;
        if (face < 0) m.rotation.y = Math.PI;
        plate.add(m);
      });
    });
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(addLabels);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x220000, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 4, 5); scene.add(key);
  const rimLight = new THREE.PointLight(0xff2a2a, 30, 12); rimLight.position.set(-3, -1, -2.5); scene.add(rimLight);
  const fill = new THREE.PointLight(0xffffff, 8, 10); fill.position.set(-3, 2, 3); scene.add(fill);

  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener("resize", resize);

  /* drag to turn, with inertia; idles into a slow spin */
  let rx = -0.25, ry = 0.5, vx = 0, vy = reduce ? 0 : 0.006, dragging = false, lx = 0, ly = 0, idle = 0;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); stage.classList.add("is-grab"); });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    vy = (e.clientX - lx) * 0.006; vx = (e.clientY - ly) * 0.004;
    lx = e.clientX; ly = e.clientY; idle = 0;
  });
  const end = () => { dragging = false; stage.classList.remove("is-grab"); };
  canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { vy = -0.08; idle = 0; }
    if (e.key === "ArrowRight") { vy = 0.08; idle = 0; }
    if (e.key === "ArrowUp") { vx = -0.06; idle = 0; }
    if (e.key === "ArrowDown") { vx = 0.06; idle = 0; }
  });

  let visible = false, raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    idle++;
    if (!dragging) {
      vx *= 0.94; vy *= 0.96;
      if (!reduce && idle > 90) vy += (0.006 - vy) * 0.02;
      rx += (-0.25 - rx) * 0.01;
    }
    rx = Math.max(-1.2, Math.min(1.2, rx + vx));
    ry += vy;
    plate.rotation.set(rx, ry, 0);
    renderer.render(scene, camera);
  }
  new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && !visible) { visible = true; raf = requestAnimationFrame(frame); }
      else if (!en.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf); }
    });
  }).observe(canvas);
}

initTour();
initAnilha();
initGiro();
initMapa();
