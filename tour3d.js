/* Elite Drako Gym — 3D.
   1) Tour: a câmera atravessa os hexágonos de neon do teto da academia; entre eles, as fotos de cada lugar.
   2) Anilha: uma anilha de borracha em 3D que gira com o dedo ou o mouse.
   Sem WebGL ou com "reduzir movimento", a página mostra as mesmas cenas como fotos com legenda. */
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

/* ============================================================ TOUR */
function initTour() {
  const section = document.getElementById("tour");
  const canvas = document.querySelector("[data-tour-canvas]");
  if (!section || !canvas) return;
  const cenas = Array.from(section.querySelectorAll("[data-cena]"));
  if (reduce || !webglOK()) { section.classList.add("tour--static"); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) { section.classList.add("tour--static"); return; }
  section.classList.add("tour--3d");
  section.style.setProperty("--n", cenas.length);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x050505, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050505, 6, 26);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);

  const SPACING = 7;
  const N = cenas.length;

  /* rings: alternate white and red, like the ceiling */
  const WHITE = new THREE.Color(0xffffff);
  for (let i = 0; i <= N + 1; i++) {
    const red = i % 2 === 1;
    const ring = hexTube(10, 5.4, 1.4, 0.03, red ? RED : WHITE, red ? 2.6 : 1.15);
    ring.position.set(0, 0.2, -i * SPACING);
    scene.add(ring);
    // a smaller inner ring, offset, as on the real ceiling
    const inner = hexTube(6, 3.2, 0.9, 0.022, red ? WHITE : RED, red ? 1.2 : 2.6);
    inner.position.set(0, 1.9, -i * SPACING - 0.6);
    inner.rotation.x = Math.PI / 2.2;
    scene.add(inner);
  }

  /* floor: dark rubber with a faint red sheen under each ring */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, (N + 3) * SPACING),
    new THREE.MeshBasicMaterial({ color: 0x0d0d0d })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.6, -(N + 1) * SPACING / 2);
  scene.add(floor);
  for (let i = 0; i <= N + 1; i++) {
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 1.2),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x2a0405 : 0x141414, transparent: true, opacity: 0.8 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, -2.59, -i * SPACING);
    scene.add(glow);
  }

  /* photos: one per place, alternating sides, turned toward the aisle */
  const loader = new THREE.TextureLoader();
  const photos = [];
  cenas.forEach((li, i) => {
    const img = li.querySelector("img");
    const w = Number(img.getAttribute("width")) || 4, h = Number(img.getAttribute("height")) || 3;
    const aspect = w / h;
    const height = aspect > 1 ? 2.6 : 3.4;
    const geo = new THREE.PlaneGeometry(height * aspect, height);
    const mat = new THREE.MeshBasicMaterial({ color: 0xd8d8d8, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    const side = i % 2 === 0 ? -1 : 1;
    mesh.userData = { side, baseX: side * 2.5, z: -i * SPACING - SPACING * 0.55 };
    mesh.position.set(mesh.userData.baseX, 0.15, mesh.userData.z);
    mesh.rotation.y = side * -0.38;
    scene.add(mesh);
    photos.push(mesh);
    loader.load(img.currentSrc || img.src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      mat.map = tex; mat.needsUpdate = true;
    });
    // red frame behind each photo
    // a red border only (a rectangle with the photo cut out), so it never tints the picture
    const fw = height * aspect / 2, fh = height / 2, b = 0.06;
    const border = new THREE.Shape();
    border.moveTo(-fw - b, -fh - b); border.lineTo(fw + b, -fh - b); border.lineTo(fw + b, fh + b); border.lineTo(-fw - b, fh + b); border.lineTo(-fw - b, -fh - b);
    const cut = new THREE.Path();
    cut.moveTo(-fw, -fh); cut.lineTo(-fw, fh); cut.lineTo(fw, fh); cut.lineTo(fw, -fh); cut.lineTo(-fw, -fh);
    border.holes.push(cut);
    const frame = new THREE.Mesh(
      new THREE.ShapeGeometry(border),
      new THREE.MeshBasicMaterial({ color: RED.clone().multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0 })
    );
    frame.position.z = -0.02;
    mesh.add(frame);
    mesh.userData.frame = frame;
  });

  /* dust in the light */
  const DUST = 700;
  const dustGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
    pos[i * 3 + 2] = 4 - Math.random() * (N + 2) * SPACING;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.45 }));
  scene.add(dust);

  /* bloom: the neon glows like it does in the room */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.4, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* captions */
  const capEl = section.querySelector("[data-tour-caption]");
  const bar = section.querySelector("[data-tour-bar]");
  const hint = section.querySelector("[data-tour-hint]");
  let shown = -1;
  function caption(i) {
    if (i === shown) return;
    shown = i;
    const txt = cenas[i] && cenas[i].querySelector(".cena__txt");
    capEl.classList.remove("is-in");
    void capEl.offsetWidth;
    capEl.innerHTML = txt ? '<p class="tour__count">Cena ' + (i + 1) + " de " + N + "</p>" + txt.innerHTML : "";
    capEl.classList.add("is-in");
  }

  /* size */
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w, h);
    camera.aspect = w / h;
    // narrow screens: bring photos toward the middle so they stay in frame
    const narrow = camera.aspect < 0.9;
    camera.fov = narrow ? 68 : 55;
    camera.updateProjectionMatrix();
    photos.forEach((m) => {
      m.position.x = m.userData.side * (narrow ? 0.55 : 2.5);
      m.rotation.y = m.userData.side * (narrow ? -0.1 : -0.38);
      m.scale.setScalar(narrow ? 0.9 : 1);
    });
  }
  resize();
  window.addEventListener("resize", resize);

  /* scroll → camera */
  let target = 0, current = 0, mx = 0, my = 0;
  function progress() {
    const r = section.getBoundingClientRect();
    const head = section.querySelector(".tour__head");
    const start = head ? head.offsetHeight : 0; // sticky elements report a moving offsetTop, so measure the heading instead
    const total = section.offsetHeight - start - window.innerHeight;
    return Math.min(1, Math.max(0, (-r.top - start) / Math.max(1, total)));
  }
  window.addEventListener("scroll", () => { target = progress(); }, { passive: true });
  window.addEventListener("pointermove", (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  target = current = progress();

  let visible = false, raf = 0, t0 = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    current += (target - current) * 0.08;
    const z = 6 - current * (N * SPACING + 1);
    camera.position.set(mx * 0.35, 0.1 - my * 0.2 + Math.sin(t * 0.6) * 0.04, z);
    camera.lookAt(mx * 0.6, 0.05, z - 8);

    const idx = Math.min(N - 1, Math.max(0, Math.round(current * N - 0.35)));
    caption(idx);
    bar.style.transform = "scaleX(" + current.toFixed(4) + ")";
    if (hint) hint.style.opacity = current > 0.02 ? "0" : "1";

    photos.forEach((m, i) => {
      const d = Math.abs(m.userData.z - (z - 5));
      const ahead = z - m.userData.z; // how far in front of the camera the photo is
      const o = Math.max(0, Math.min(1, 1.6 - d / 5)) * Math.max(0, Math.min(1, (ahead - 1.2) / 2));
      m.material.opacity = o;
      m.userData.frame.material.opacity = i === idx ? o : o * 0.25;
    });
    const p = dust.geometry.attributes.position;
    for (let i = 0; i < DUST; i += 3) p.array[i * 3 + 1] += Math.sin(t + i) * 0.0008;
    p.needsUpdate = true;

    composer.render();
  }
  new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && !visible) { visible = true; t0 = performance.now(); raf = requestAnimationFrame(frame); }
      else if (!en.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf); }
    });
  }, { threshold: 0 }).observe(section);
  caption(0);
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
