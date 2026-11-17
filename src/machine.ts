// @ts-nocheck
import * as THREE from './vendor/three.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const F = 0.425; // front face z
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  return t;
}
function rr(w, h, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function holeRect(x0, y0, x1, y1) {
  const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0); return p;
}
function roundRectPath(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

const DESIGNS = [
  { n: 'Yogabar', s: 'PROTEIN BAR', a: '#e8541e', b: '#b93a10', t: '#fff', k: '#F8D800', kind: 'bar' },
  { n: 'Too Yumm!', s: 'MULTIGRAIN', a: '#F8D800', b: '#e0b800', t: '#b3261e', k: '#b3261e', kind: 'pouch' },
  { n: 'Slurrp Farm', s: 'MILLET BITES', a: '#2aa198', b: '#17776f', t: '#fff', k: '#ffd54a', kind: 'pouch' },
  { n: 'Paper Boat', s: 'AAM PANNA', a: '#2a6ad1', b: '#17408f', t: '#fff', k: '#ffe08a', kind: 'carton' },
  { n: 'Raw Pressery', s: 'COLD PRESSED', a: '#f08a1c', b: '#c96a08', t: '#fff', k: '#fff', kind: 'bottle' },
  { n: 'Roasted Nuts', s: 'HEALTHY MIX', a: '#8a5a2b', b: '#5e3a17', t: '#fff', k: '#F8D800', kind: 'pouch' },
  { n: 'Peanut Crunch', s: 'SALTED', a: '#c0392b', b: '#8e2318', t: '#fff', k: '#ffd54a', kind: 'pouch' },
  { n: 'Date Bites', s: 'NO ADDED SUGAR', a: '#6d4c41', b: '#4a3028', t: '#fff', k: '#ffcc80', kind: 'bar' },
  { n: 'Cocoa Oat', s: 'ENERGY BAR', a: '#3e2723', b: '#241512', t: '#ffe082', k: '#ffe082', kind: 'bar' },
  { n: 'Lime Fizz', s: 'SPARKLING', a: '#7cb342', b: '#4e7a22', t: '#fff', k: '#fff59d', kind: 'can' },
  { n: 'Cold Brew', s: 'COFFEE', a: '#4e342e', b: '#2b1c18', t: '#ffe0b2', k: '#ffe0b2', kind: 'can' },
  { n: 'Greek Yogurt', s: 'HIGH PROTEIN', a: '#f4f7ff', b: '#3f7ed8', t: '#1f3a0d', k: '#3f7ed8', kind: 'cup' },
  { n: 'Berry Fruit', s: 'FRUIT CUP', a: '#e91e63', b: '#ad1457', t: '#fff', k: '#fff', kind: 'cup' },
  { n: 'Coconut Water', s: 'TENDER', a: '#26a69a', b: '#00796b', t: '#fff', k: '#e0f2f1', kind: 'carton' },
  { n: 'Apple Juice', s: '100% JUICE', a: '#d4e157', b: '#9e9d24', t: '#33691e', k: '#33691e', kind: 'bottle' },
  { n: 'Trail Mix', s: 'FRUIT & NUT', a: '#ff8f00', b: '#c56000', t: '#fff', k: '#fff', kind: 'pouch' },
];
const texCache = {}, matCache = {}, geoCache = {};
const G = (k, f) => geoCache[k] || (geoCache[k] = f());
const wrapKind = d => d.kind === 'can' || d.kind === 'cup' || d.kind === 'bottle';
function packTex(d) {
  if (texCache[d.n]) return texCache[d.n];
  const wrap = wrapKind(d), W = wrap ? 512 : 256, H = 384;
  const q = matchMedia('(max-width: 900px)').matches ? 1 : 2; // 2x artwork on desktop
  const t = canvasTex(W * q, H * q, (x, w2, h2) => {
    x.scale(q, q); const w = w2 / q, h = h2 / q, cx = w / 2, g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, d.a); g.addColorStop(1, d.b); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.13)'; x.beginPath(); x.moveTo(0, h * .62); x.bezierCurveTo(w * .3, h * .5, w * .6, h * .78, w, h * .6); x.lineTo(w, h); x.lineTo(0, h); x.fill();
    const bw = wrap ? 78 : 104;
    x.fillStyle = '#fff8df'; x.beginPath(); x.ellipse(cx, h * .27, bw, 52, -.1, 0, 7); x.fill();
    x.fillStyle = d.b; x.textAlign = 'center'; x.font = 'bold 36px Arial'; x.fillText(d.n, cx, h * .29, bw * 2 - 20);
    x.fillStyle = d.t; x.font = 'bold 19px Arial'; x.fillText(d.s, cx, h * .44, bw * 2);
    for (let i = 0; i < 7; i++) {
      const px = cx - 54 + (i % 4) * 36 + Math.floor(i / 4) * 18, py = h * .6 + Math.floor(i / 4) * 40 + (i % 2) * 6, r = 20 + (i % 3) * 4;
      const gr = x.createRadialGradient(px - 6, py - 6, 2, px, py, r); gr.addColorStop(0, '#ffe9a8'); gr.addColorStop(1, i % 2 ? '#c9822a' : '#e8b45a');
      x.fillStyle = gr; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    }
    x.fillStyle = d.k; x.fillRect(cx - 100, h * .86, 200, 3);
    x.fillStyle = '#fff'; x.font = 'bold 14px Arial'; x.fillText('FSSAI  •  VEG', cx, h * .92);
    if (!wrap) { x.fillStyle = d.b; x.fillRect(0, 0, w, 18); x.fillRect(0, h - 18, w, 18); x.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 0; i < w; i += 6) { x.fillRect(i, 0, 2, 18); x.fillRect(i, h - 18, 2, 18); } }
  });
  texCache[d.n] = t; return t;
}
const foil = d => matCache[d.n] || (matCache[d.n] = new THREE.MeshPhysicalMaterial({ map: packTex(d), roughness: .3, metalness: .3, clearcoat: .5, clearcoatRoughness: .3, envMapIntensity: 1.3 }));
const edge = d => matCache['e' + d.n] || (matCache['e' + d.n] = new THREE.MeshStandardMaterial({ color: d.b, roughness: .5, metalness: .2 }));
const ALU = new THREE.MeshStandardMaterial({ color: 0xd9dedc, metalness: .9, roughness: .22, envMapIntensity: 1.4 });
function pouchGeo(w, h, dp) {
  const g = new THREE.BoxGeometry(w, h, dp, 40, 18, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ay = Math.abs(y) / (h / 2);
    const belly = Math.min(1, (1 - ay) / .22), bell = Math.sqrt(Math.max(0, 1 - (x / (w / 2)) ** 2 * .75));
    p.setZ(i, z * (.12 + .88 * belly * bell) + (ay > .86 ? Math.sin(x * 700) * .0018 * (z < 0 ? -1 : 1) : 0));
    p.setX(i, x * (.86 + .14 * (1 - ay * ay)));
  }
  g.computeVertexNormals(); return g;
}
function cartonGeo(w, h, dp) {
  const g = new THREE.BoxGeometry(w, h, dp, 1, 4, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > h / 2 - 1e-6) p.setZ(i, p.getZ(i) * .3);
  g.computeVertexNormals(); return g;
}
function makePack(d) {
  const g = new THREE.Group(), k = d.kind, front = foil(d), side = edge(d);
  const add = (geo, mat, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; g.add(m); return m; };
  if (k === 'pouch' || k === 'bar') {
    const bar = k === 'bar', w = bar ? .062 : .09, h = bar ? .15 : .14, dp = bar ? .016 : .04;
    add(G('p' + k, () => pouchGeo(w, h, dp)), [side, side, side, side, front, front]); g.userData.h = h + .01;
  } else if (k === 'can') {
    const r = .0325, h = .125;
    add(G('canb', () => new THREE.CylinderGeometry(r, r, h, 32, 1, true)), front).rotation.y = Math.PI;
    add(G('cant', () => new THREE.CylinderGeometry(r * .84, r, .008, 32)), ALU, h / 2 + .004);
    add(G('canl', () => new THREE.CylinderGeometry(r * .78, r * .84, .004, 32)), ALU, h / 2 + .01);
    add(G('canu', () => new THREE.CylinderGeometry(r, r * .88, .008, 32)), ALU, -h / 2 - .004);
    add(G('cantab', () => new THREE.TorusGeometry(.008, .0018, 6, 12)), ALU, h / 2 + .013).rotation.x = Math.PI / 2;
    g.userData.h = h + .02;
  } else if (k === 'cup') {
    const h = .072;
    add(G('cup', () => new THREE.CylinderGeometry(.034, .026, h, 32, 1, true)), front).rotation.y = Math.PI;
    add(G('cupl', () => new THREE.CylinderGeometry(.0355, .0355, .004, 32)), ALU, h / 2 + .002);
    add(G('cupr', () => new THREE.TorusGeometry(.0355, .0022, 6, 32)), side, h / 2).rotation.x = Math.PI / 2;
    g.userData.h = h + .008;
  } else if (k === 'carton') {
    const w = .062, h = .1, dp = .04;
    add(G('cart', () => cartonGeo(w, h, dp)), [side, side, side, side, front, front]);
    add(G('fin', () => new THREE.BoxGeometry(w, .006, .012)), side, h / 2 + .004); g.userData.h = h + .01;
  } else {
    const liquid = new THREE.MeshPhysicalMaterial({ color: d.a, roughness: .1, clearcoat: 1, envMapIntensity: 1.6 });
    add(G('botb', () => { const pts = [[0, 0], [.026, 0], [.027, .004], [.027, .075], [.022, .094], [.0115, .108], [.0115, .122], [0, .122]].map(a => new THREE.Vector2(a[0], a[1])); const l = new THREE.LatheGeometry(pts, 32); l.translate(0, -.069, 0); return l; }), liquid);
    add(G('botl', () => new THREE.CylinderGeometry(.0278, .0278, .055, 32, 1, true)), front, -.029).rotation.y = Math.PI;
    add(G('botc', () => new THREE.CylinderGeometry(.0135, .0135, .016, 16)), side, .061); g.userData.h = .14;
  }
  return g;
}

export function createMachine(host, opts) {
  opts = opts || {};
  const logoUrl = opts.logo;
  let compact = matchMedia('(max-width: 900px)').matches;
  let raf = 0, ready = false;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
  let capBase = compact ? 1.5 : 2, prCap = capBase; // prCap drops automatically if frames get slow
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, prCap));
  renderer.shadowMap.enabled = !compact; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab';

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pm.fromScene(room, 0.04);
  scene.environment = environment.texture; room.dispose(); pm.dispose();
  const cam = new THREE.PerspectiveCamera(28, 1, .1, 50);

  // lights
  scene.add(new THREE.HemisphereLight(0xf2f6ff, 0x7d8f66, .85));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.0); key.position.set(-1.4, 5.5, 2.6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 1; key.shadow.camera.far = 12;
  key.shadow.camera.left = -1.8; key.shadow.camera.right = 1.8; key.shadow.camera.top = 1.8; key.shadow.camera.bottom = -1.8; key.shadow.bias = -0.0004; key.shadow.radius = 5; key.shadow.normalBias = .01;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfe8a8, .9); rim.position.set(-3, 2, -2); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xdce8ff, .75); fill.position.set(-3.5, 1.8, 3); scene.add(fill);
  const back = new THREE.DirectionalLight(0xfff0d8, .6); back.position.set(2.5, 2, -3); scene.add(back);

  const root = new THREE.Group(); scene.add(root);
  const mach = new THREE.Group(); root.add(mach);

  // ground shadow
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: .22 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.045; ground.receiveShadow = true; root.add(ground);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.45), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(8,18,0,.8)'); g.addColorStop(.5, 'rgba(8,18,0,.4)'); g.addColorStop(1, 'rgba(8,18,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = -1.04; root.add(blob);

  // body (rounded, with window + tray holes)
  const WIN = { x0: -.44, x1: .14, y0: -.45, y1: .88 }, TRAY = { x0: -.44, x1: .14, y0: -.93, y1: -.67 };
  const shape = rr(.96, 1.96, .05);
  shape.holes.push(holeRect(WIN.x0, WIN.y0, WIN.x1, WIN.y1), holeRect(TRAY.x0, TRAY.y0, TRAY.x1, TRAY.y1));
  const depth = .81;
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 5, curveSegments: 10 });
  bodyGeo.translate(0, 0, -depth / 2);
  const paint = new THREE.MeshPhysicalMaterial({ color: 0x1f4a1c, roughness: .5, metalness: .1, clearcoat: .35, clearcoatRoughness: .35, envMapIntensity: 1 });
  const body = new THREE.Mesh(bodyGeo, paint); body.castShadow = true; body.receiveShadow = true; mach.add(body);

  // back plate + cavity back walls
  const backPlate = new THREE.Mesh(new THREE.BoxGeometry(.98, 1.98, .02), paint); backPlate.position.z = -F + .01; mach.add(backPlate);
  const cavBackMat = new THREE.MeshStandardMaterial({ color: 0x2c312b, emissive: 0x151a14, emissiveIntensity: .35, roughness: .9 });
  const cavBack = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), cavBackMat); cavBack.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, -.05); mach.add(cavBack);
  const trayBack = new THREE.Mesh(new THREE.PlaneGeometry(TRAY.x1 - TRAY.x0, TRAY.y1 - TRAY.y0), new THREE.MeshStandardMaterial({ color: 0x151a12, roughness: .9 })); trayBack.position.set((TRAY.x0 + TRAY.x1) / 2, (TRAY.y0 + TRAY.y1) / 2, .12); mach.add(trayBack);
  // cavity liners (side walls light)
  const linerMat = new THREE.MeshStandardMaterial({ color: 0x3a403a, emissive: 0x1c211b, emissiveIntensity: .2, roughness: .9, side: THREE.DoubleSide });
  const wcx = (WIN.x0 + WIN.x1) / 2, wcy = (WIN.y0 + WIN.y1) / 2, ww = WIN.x1 - WIN.x0, wh = WIN.y1 - WIN.y0, cd = F + .05;
  [[WIN.x0 + .001, wcy, 0, 'x'], [WIN.x1 - .001, wcy, 0, 'x']].forEach(p => { const m = new THREE.Mesh(new THREE.PlaneGeometry(cd, wh), linerMat); m.rotation.y = Math.PI / 2; m.position.set(p[0], p[1], (F - .05) / 2); mach.add(m); });
  [[wcx, WIN.y1 - .001], [wcx, WIN.y0 + .001]].forEach(p => { const m = new THREE.Mesh(new THREE.PlaneGeometry(ww, cd), linerMat); m.rotation.x = Math.PI / 2; m.position.set(p[0], p[1], (F - .05) / 2); mach.add(m); });
  // tray liners
  const tcx = (TRAY.x0 + TRAY.x1) / 2, tcy = (TRAY.y0 + TRAY.y1) / 2;
  const trayFloor = new THREE.Mesh(new THREE.BoxGeometry(TRAY.x1 - TRAY.x0, .02, .32), new THREE.MeshStandardMaterial({ color: 0x2a2f25, roughness: .35, metalness: .5 })); trayFloor.position.set(tcx, TRAY.y0 + .01, F - .1); mach.add(trayFloor);
  const trayLight = new THREE.PointLight(0xfff0c0, 0, 1.2); trayLight.position.set(tcx, tcy + .05, F + .05); mach.add(trayLight);

  // shelves + products
  const shelfY = [-.40, -.20, 0, .20, .40, .60];
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0xd9dfd0, roughness: .3, metalness: .8, envMapIntensity: 1.2 });
  const layout = [[4, 13, 14, 3, 9, 10], [11, 12, 9, 10, 11, 12], [1, 2, 5, 6, 15, 0], [0, 7, 8, 2, 1, 15], [5, 6, 15, 1, 2, 7], [6, 2, 1, 5, 15, 6]];
  const slots = []; let hotSlot = null;
  shelfY.forEach((sy, r) => {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(ww - .02, .014, .36), shelfMat); sh.position.set(wcx, sy, F - .17); sh.castShadow = true; mach.add(sh);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(ww - .02, .03, .008), new THREE.MeshStandardMaterial({ color: 0xc7cfbd, roughness: .3, metalness: .7 })); lip.position.set(wcx, sy + .01, F - .0); mach.add(lip);
    // price/label strip
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(ww - .04, .02), new THREE.MeshBasicMaterial({ map: canvasTex(512, 24, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#1F3A0D'; x.font = 'bold 18px Arial'; x.textAlign = 'center'; for (let i = 0; i < 6; i++) x.fillText('ABCDEF'[r] + (i + 1), (i + .5) * w / 6, 18); }) })); lab.position.set(wcx, sy - .006, F + .002); mach.add(lab);
    for (let i = 0; i < 6; i++) {
      const d = DESIGNS[layout[r][i]]; const p = makePack(d);
      const x = wcx - ww / 2 + .06 + i * ((ww - .12) / 5);
      const h = p.userData.h; p.position.set(x, sy + .007 + h / 2, F - .13 + (d.kind === 'pouch' ? 0 : .02));
      if (d.kind === 'pouch') p.rotation.x = -.1;
      mach.add(p); slots.push({ r, i, p, d });
      if (r === 2 && i === 0) hotSlot = { p, x, y: sy + .007 + h / 2, z: p.position.z, d };
    }
  });
  // spare "drop" pack (same as hot slot design)
  const dropPack = makePack(hotSlot.d); dropPack.visible = false; mach.add(dropPack);

  // top LED strip + glow
  const led = new THREE.Mesh(new THREE.PlaneGeometry(ww - .04, .02), new THREE.MeshBasicMaterial({ color: 0xffffff })); led.position.set(wcx, WIN.y1 - .02, F - .1); led.rotation.x = Math.PI / 2; mach.add(led);
  const ledV = new THREE.Mesh(new THREE.BoxGeometry(.008, wh - .04, .006), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); ledV.position.set(WIN.x1 - .014, wcy, F - .03); mach.add(ledV);
  const inner = new THREE.PointLight(0xfff1d6, .65, 2.2); inner.position.set(wcx, .5, .1); mach.add(inner);
  const inner2 = new THREE.PointLight(0xfff1d6, .4, 2); inner2.position.set(wcx, -.2, .15); mach.add(inner2);

  // window frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xb9c2ae, roughness: .25, metalness: .85, envMapIntensity: 1.3 });
  [[wcx, WIN.y1 + .012, ww + .04, .024], [wcx, WIN.y0 - .012, ww + .04, .024]].forEach(a => { const m = new THREE.Mesh(new THREE.BoxGeometry(a[2], a[3], .03), frameMat); m.position.set(a[0], a[1], F + .008); mach.add(m); });
  [[WIN.x0 - .012], [WIN.x1 + .012]].forEach(a => { const m = new THREE.Mesh(new THREE.BoxGeometry(.024, wh + .048, .03), frameMat); m.position.set(a[0], wcy, F + .008); mach.add(m); });
  // glass
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xeaf4fb, roughness: .03, metalness: 0, transparent: true, opacity: .16, envMapIntensity: 3, clearcoat: 1, depthWrite: false });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), glassMat); glass.position.set(wcx, wcy, F + .012); glass.renderOrder = 5; mach.add(glass);
  const streak = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: .1, map: canvasTex(128, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(.33, 'rgba(255,255,255,0)'); g.addColorStop(.55, 'rgba(255,255,255,.28)'); g.addColorStop(.62, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
  streak.position.set(wcx, wcy, F + .014); streak.renderOrder = 6; mach.add(streak);

  // hot rack highlight (row C = index 2)
  const hotY = shelfY[2] + .075;
  const hotMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9, map: canvasTex(512, 96, (x, w, h) => { x.strokeStyle = '#d9ff7a'; x.lineWidth = 6; x.shadowColor = '#b6f04a'; x.shadowBlur = 16; roundRectPath(x, 10, 10, w - 20, h - 20, 14); x.stroke(); x.stroke(); }) });
  const hot = new THREE.Mesh(new THREE.PlaneGeometry(ww - .01, .2), hotMat); hot.position.set(wcx, hotY, F + .018); hot.renderOrder = 7; mach.add(hot);
  const pinTex = canvasTex(64, 64, (x, w, h) => { x.fillStyle = '#F8D800'; x.shadowColor = '#F8D800'; x.shadowBlur = 14; x.beginPath(); x.arc(32, 32, 12, 0, 7); x.fill(); x.fillStyle = '#1F3A0D'; x.font = 'bold 14px Arial'; x.textAlign = 'center'; x.shadowBlur = 0; x.fillText('+', 32, 37); });
  const pin = new THREE.Mesh(new THREE.PlaneGeometry(.07, .07), new THREE.MeshBasicMaterial({ map: pinTex, transparent: true, depthWrite: false })); pin.position.set(WIN.x1 - .06, hotY, F + .02); pin.renderOrder = 8; mach.add(pin);
  const hitMesh = new THREE.Mesh(new THREE.PlaneGeometry(ww, .24), new THREE.MeshBasicMaterial({ visible: false })); hitMesh.position.set(wcx, hotY, F + .02); mach.add(hitMesh);

  // decals: header, script text
  const decal = (w, h, x, y, tex, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); m.position.set(x, y, z || F + .004); mach.add(m); return m; };
  const logoImg = new Image(); logoImg.crossOrigin = 'anonymous';
  const stickerTex = canvasTex(512, 334, () => {}); const headerTex = canvasTex(1024, 220, (x, w, h) => { x.clearRect(0, 0, w, h); }); const sideLogoTex = canvasTex(512, 1024, () => { });
  function drawHeader() {
    const c = headerTex.image, x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height);
    const g = x.createLinearGradient(0, 0, c.width, 0); g.addColorStop(0, '#2a5a06'); g.addColorStop(1, '#4a8a10'); x.fillStyle = g; roundRectPath(x, 6, 6, c.width - 12, c.height - 12, 28); x.fill();
    x.fillStyle = '#fff'; x.font = 'bold 74px Arial'; x.textAlign = 'left'; x.fillText('snaxsmart', 330, 112);
    x.fillStyle = '#F8D800'; x.font = 'italic 36px Georgia'; x.fillText('guilt-free snacking', 332, 164);
    if (logoImg.complete && logoImg.naturalWidth) x.drawImage(logoImg, 60, 20, 240, 180);
    headerTex.needsUpdate = true;
    { const c2 = stickerTex.image, q = c2.getContext('2d'); q.clearRect(0, 0, c2.width, c2.height); if (logoImg.complete && logoImg.naturalWidth) { const r = Math.min(c2.width / logoImg.naturalWidth, c2.height / logoImg.naturalHeight); const pad = 14, rr2 = Math.min((c2.width - pad * 2) / logoImg.naturalWidth, (c2.height - pad * 2) / logoImg.naturalHeight), iw = logoImg.naturalWidth * rr2, ih = logoImg.naturalHeight * rr2; q.shadowColor = '#fff'; q.shadowBlur = 10; for (let i = 0; i < 6; i++) q.drawImage(logoImg, (c2.width - iw) / 2, (c2.height - ih) / 2, iw, ih); } stickerTex.needsUpdate = true; }
    const s = sideLogoTex.image, y = s.getContext('2d'); const sg = y.createLinearGradient(0, 0, s.width, s.height); sg.addColorStop(0, '#2b5e26'); sg.addColorStop(1, '#16351a'); y.fillStyle = sg; y.fillRect(0, 0, s.width, s.height);
    y.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 40; i++) y.fillRect(0, i * 26, s.width, 2);
    if (logoImg.complete && logoImg.naturalWidth) y.drawImage(logoImg, 90, 40, 330, 250);
    y.save(); y.translate(300, 960); y.rotate(-Math.PI / 2); y.fillStyle = '#F8D800'; y.font = 'italic 96px Georgia'; y.textAlign = 'left'; y.fillText('guilt-free snacking', 0, 0); y.restore();
    sideLogoTex.needsUpdate = true; wake();
  }
  logoImg.onload = drawHeader; if (logoUrl) logoImg.src = logoUrl; drawHeader();
  const sticker = new THREE.Mesh(new THREE.PlaneGeometry(.56, .365), new THREE.MeshBasicMaterial({ map: stickerTex, transparent: true, toneMapped: false })); sticker.position.set(-.17, 1.04, F + .006); mach.add(sticker);
  decal(.58, .12, wcx, -.545, canvasTex(512, 106, (x, w, h) => { x.fillStyle = '#F8D800'; x.font = 'italic bold 62px Georgia'; x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 6; x.fillText('guilt-free snacking', w / 2, 72); }));
  // side panels
  [[1, Math.PI / 2], [-1, -Math.PI / 2]].forEach(s => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.74, 1.7), new THREE.MeshStandardMaterial({ map: sideLogoTex, roughness: .5, metalness: .1 })); m.position.set(s[0] * .5005, 0, 0); m.rotation.y = s[1]; mach.add(m); });
  // back vents
  const backDecal = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.5), new THREE.MeshStandardMaterial({ roughness: .8, map: canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#16300a'; x.fillRect(0, 0, w, h); x.fillStyle = '#0b1a05'; for (let i = 0; i < 22; i++) x.fillRect(30, 20 + i * 22, w - 60, 8); x.fillStyle = '#F8D800'; x.font = 'bold 22px Arial'; x.textAlign = 'center'; x.fillText('+91 98807 98807', w / 2, h - 30); }) }));
  backDecal.position.z = -F - .001; backDecal.rotation.y = Math.PI; mach.add(backDecal);

  // control panel (right)
  const PX = .33;
  const panelBase = new THREE.Mesh(new THREE.BoxGeometry(.27, 1.4, .02), new THREE.MeshStandardMaterial({ color: 0x0c0f0c, roughness: .35, metalness: .6 })); panelBase.position.set(PX, .07, F + .008); mach.add(panelBase);
  const scrCanvas = document.createElement('canvas'); scrCanvas.width = 256; scrCanvas.height = 160;
  const scrTex = new THREE.CanvasTexture(scrCanvas); scrTex.colorSpace = THREE.SRGBColorSpace;
  function setScreen(l1, l2, l3, ok) {
    const x = scrCanvas.getContext('2d'); x.fillStyle = '#071403'; x.fillRect(0, 0, 256, 160);
    x.fillStyle = ok ? '#b6f04a' : '#8fd13a'; x.textAlign = 'center'; x.font = 'bold 40px Courier New'; x.fillText(l1, 128, 62, 240);
    x.font = 'bold 22px Courier New'; x.fillStyle = '#d9ff9e'; x.fillText(l2, 128, 100, 240); x.font = '18px Courier New'; x.fillStyle = '#7fb12f'; x.fillText(l3 || '', 128, 134, 240); scrTex.needsUpdate = true; wake();
  }
  setScreen('SNAX', 'Pick a snack', 'Rack A1 - D5');
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.21, .13), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false })); scr.position.set(PX, .58, F + .026); mach.add(scr);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(.23, .15, .012), new THREE.MeshStandardMaterial({ color: 0x050805, roughness: .3, metalness: .6 })); bezel.position.set(PX, .58, F + .016); mach.add(bezel);
  // keypad
  const keyMat = new THREE.MeshStandardMaterial({ color: 0xe9ede2, roughness: .35, metalness: .4 });
  const labels = '123456789*0#';
  for (let k = 0; k < 12; k++) {
    const cx = PX + (k % 3 - 1) * .062, cy = .39 - Math.floor(k / 3) * .062;
    const key = new THREE.Mesh(new THREE.CylinderGeometry(.021, .021, .012, 24), keyMat);
    key.rotation.x = Math.PI / 2; key.position.set(cx, cy, F + .02); mach.add(key);
    const kl = new THREE.Mesh(new THREE.PlaneGeometry(.036, .036), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#1F3A0D'; x.font = 'bold 40px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(labels[k], 32, k === 9 ? 40 : 34); }) }));
    kl.position.set(cx, cy, F + .0265); mach.add(kl);
  }
  // UPI QR plate
  const qrTex = canvasTex(256, 330, (x, w, h) => {
    x.fillStyle = '#fff'; roundRectPath(x, 0, 0, w, h, 18); x.fill(); x.fillStyle = '#1F3A0D'; x.font = 'bold 30px Arial'; x.textAlign = 'center'; x.fillText('Pay with UPI', w / 2, 40);
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    x.fillStyle = '#201818'; const n = 21, cs = 9, ox = (w - n * cs) / 2, oy = 56;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const inFinder = (i < 7 && j < 7) || (i > 13 && j < 7) || (i < 7 && j > 13); if (!inFinder && rnd() > .5) x.fillRect(ox + i * cs, oy + j * cs, cs, cs); }
    [[0, 0], [14, 0], [0, 14]].forEach(p => { x.fillRect(ox + p[0] * cs, oy + p[1] * cs, 7 * cs, 7 * cs); x.fillStyle = '#fff'; x.fillRect(ox + (p[0] + 1) * cs, oy + (p[1] + 1) * cs, 5 * cs, 5 * cs); x.fillStyle = '#201818'; x.fillRect(ox + (p[0] + 2) * cs, oy + (p[1] + 2) * cs, 3 * cs, 3 * cs); });
    x.fillStyle = '#407808'; x.font = 'bold 22px Arial'; x.fillText('GPay  PhonePe  Paytm', w / 2, h - 18);
  });
  const qr = new THREE.Mesh(new THREE.PlaneGeometry(.2, .258), new THREE.MeshStandardMaterial({ map: qrTex, roughness: .3, metalness: 0 })); qr.position.set(PX, -.02 - .08, F + .02); mach.add(qr);
  const payLed = new THREE.Mesh(new THREE.BoxGeometry(.2, .016, .012), new THREE.MeshBasicMaterial({ color: 0x2a4a12, toneMapped: false })); payLed.position.set(PX, -.02 - .22, F + .02); mach.add(payLed);
  // tap pay plate
  const tap = new THREE.Mesh(new THREE.PlaneGeometry(.17, .15), new THREE.MeshStandardMaterial({ roughness: .4, map: canvasTex(256, 220, (x, w, h) => { x.fillStyle = '#F8D800'; roundRectPath(x, 0, 0, w, h, 24); x.fill(); x.fillStyle = '#201818'; x.font = 'bold 38px Arial'; x.textAlign = 'center'; x.fillText('TAP', w / 2, 88); x.fillText('& PAY', w / 2, 134); x.lineWidth = 8; x.strokeStyle = '#201818'; for (let i = 1; i < 4; i++) { x.beginPath(); x.arc(w / 2, 175, i * 12, Math.PI * 1.2, Math.PI * 1.8); x.stroke(); } }) })); tap.position.set(PX, -.55, F + .02); mach.add(tap);
  // feet / plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(.94, .05, .78), new THREE.MeshStandardMaterial({ color: 0x0f1a09, roughness: .6, metalness: .4 })); plinth.position.y = -1.0; mach.add(plinth);
  mach.position.y = 0;

  // state
  const state = { spin: 0, rot: -0.55, tgt: -0.55, vel: 0, drag: false, lx: 0, moved: 0, idle: !!opts.idle, visible: true, dropT: 0, glow: true };
  // B: real-machine details (gasket, door seam, handle, card reader, feet)
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0d0f0b, roughness: .85 });
  [[wcx, WIN.y1 - .006, ww, .012], [wcx, WIN.y0 + .006, ww, .012]].forEach(a => { const m = new THREE.Mesh(new THREE.BoxGeometry(a[2], a[3], .008), rubber); m.position.set(a[0], a[1], F + .004); mach.add(m); });
  [WIN.x0 + .006, WIN.x1 - .006].forEach(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(.012, wh, .008), rubber); m.position.set(x, wcy, F + .004); mach.add(m); });
  const seam = new THREE.Mesh(new THREE.BoxGeometry(.004, 1.84, .004), new THREE.MeshStandardMaterial({ color: 0x07120a, roughness: .9 })); seam.position.set(.172, 0, F + .0015); mach.add(seam);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .5, 16), frameMat); handle.position.set(.173, .12, F + .042); mach.add(handle);
  [.3, -.06].forEach(y => { const st = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .034, 10), frameMat); st.rotation.x = Math.PI / 2; st.position.set(.173, y, F + .025); mach.add(st); });
  const reader = new THREE.Mesh(new THREE.BoxGeometry(.16, .06, .014), new THREE.MeshStandardMaterial({ color: 0x0b0f09, roughness: .35, metalness: .5 })); reader.position.set(PX, -.36, F + .022); mach.add(reader);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(.1, .007, .004), new THREE.MeshBasicMaterial({ color: 0x000000 })); slot.position.set(PX, -.372, F + .03); mach.add(slot);
  const readerLed = new THREE.Mesh(new THREE.CircleGeometry(.006, 12), new THREE.MeshBasicMaterial({ color: 0xff3b30, toneMapped: false })); readerLed.position.set(PX + .05, -.346, F + .0295); mach.add(readerLed);
  const footMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .5, metalness: .6 });
  [[-.38, -.3], [.38, -.3], [-.38, .3], [.38, .3]].forEach(p => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.028, .032, .045, 14), footMat); m.position.set(p[0], -1.0225, p[1]); mach.add(m); });

  mach.traverse(o => { if (o.isMesh) o.receiveShadow = true; }); glass.receiveShadow = streak.receiveShadow = false;
  mach.rotation.y = state.rot;
  const dom = renderer.domElement;
  dom.setAttribute('role', 'img'); dom.setAttribute('aria-label', 'SnaxSmart vending machine');
  dom.addEventListener('pointerdown', e => { if (!e.isPrimary) return; state.drag = true; wake(); state.lx = e.clientX; state.vel = 0; state.moved = 0; try { dom.setPointerCapture(e.pointerId); } catch (_) { } dom.style.cursor = 'grabbing'; });
  dom.addEventListener('pointermove', e => { if (!state.drag || !e.isPrimary) return; wake(); const d = e.clientX - state.lx; state.lx = e.clientX; state.moved += Math.abs(d); state.tgt += d * .012; state.vel = d * .012; });
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  const hitAt = e => { const r = dom.getBoundingClientRect(); v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, cam); return ray.intersectObject(hitMesh).length > 0; };
  state.hover = false;
  const setHover = v => { if (v === state.hover) return; state.hover = v; dom.style.cursor = v ? 'pointer' : 'grab'; if (opts.onHover) opts.onHover(v); };
  let hoverEv = null, hoverRaf = 0;
  dom.addEventListener('pointermove', e => {
    if (state.drag || e.pointerType === 'touch' || !opts.onHover) return;
    hoverEv = e; // coalesce: one raycast per frame, not per pointer event
    if (!hoverRaf) hoverRaf = requestAnimationFrame(() => { hoverRaf = 0; if (hoverEv && !state.drag && !state.dead) setHover(hitAt(hoverEv)); });
  });
  dom.addEventListener('pointerleave', () => { hoverEv = null; if (!state.drag) setHover(false); });
  const up = e => {
    if (!state.drag) return; state.drag = false; dom.style.cursor = state.hover ? 'pointer' : 'grab';
    if (state.moved < 5 && e.pointerType === 'touch' && opts.onHover) { setHover(hitAt(e) ? !state.hover : false); }
  };
  dom.addEventListener('pointerup', up); dom.addEventListener('pointercancel', up);

  function size() {
    compact = matchMedia('(max-width: 900px)').matches;
    if ((compact ? 1.5 : 2) !== capBase) { capBase = compact ? 1.5 : 2; prCap = capBase; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, prCap));
    renderer.shadowMap.enabled = !compact;
    const w = host.clientWidth || 400, h = host.clientHeight || 500; renderer.setSize(w, h, false); cam.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)); const dist = Math.max(1.3 / t, 1.05 / (t * cam.aspect)) * 1.04;
    baseDist = dist; updateCam(); cam.updateProjectionMatrix(); wake();
  }
  let baseDist = 4; const cv = { x: 0, y: -.02, z: 0, k: 1 }, cvT = { x: 0, y: -.02, z: 0, k: 1 }; const tmpV = new THREE.Vector3(), baseLook = new THREE.Vector3(0, -.02, 0), dirV = new THREE.Vector3(0, .18 + .02, 1).normalize();
  function updateCam() {
    mach.updateMatrixWorld(true); tmpV.set(cv.x, cv.y, cv.z); mach.localToWorld(tmpV);
    const look = tmpV.clone(); const d = baseDist / cv.k;
    cam.position.copy(look).addScaledVector(dirV, d); cam.lookAt(look);
  }
  size();
  const resizeObserver = window.ResizeObserver ? new ResizeObserver(size) : null;
  if (resizeObserver) resizeObserver.observe(host); else addEventListener('resize', size);

  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  let reduce = motion.matches; const t0 = performance.now();
  function wake() { if (ready && !state.dead && state.visible && !document.hidden && !window.__snaxPaused && !raf) raf = requestAnimationFrame(frame); }
  function visibility() { cancelAnimationFrame(raf); raf = 0; state.lastT = 0; wake(); }
  function motionChanged() { reduce = motion.matches; wake(); }
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('snaxvisibility', visibility);
  motion.addEventListener('change', motionChanged);
  const visibilityObserver = window.IntersectionObserver ? new IntersectionObserver(entries => { state.visible = entries[0].isIntersecting; visibility(); }) : null;
  visibilityObserver?.observe(host);
  const ease = x => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
  const tray = { y: TRAY.y0 + .02 + (hotSlot.p.userData.h) / 2, x: tcx + .02, z: F - .05 };
  function applyDrop() {
    const t = state.dropT;
    if (t <= 0) { hotSlot.p.visible = true; dropPack.visible = false; trayLight.intensity = 0; return; }
    hotSlot.p.visible = false; dropPack.visible = true;
    const f = ease((t - .08) / .62), y0 = hotSlot.y, y1 = tray.y;
    let y = y0 + (y1 - y0) * (f * f);
    if (t > .7) { const b = Math.max(0, Math.sin((t - .7) * 22)) * (1 - t) * .09; y = y1 + b; }
    dropPack.position.set(hotSlot.x + (tray.x - hotSlot.x) * f, y, hotSlot.z + (tray.z - hotSlot.z) * f);
    dropPack.rotation.set(-.07 * (1 - f) - f * .25, 0, (f * 6 * Math.sin(f * 5)) * .06 + f * .22);
    trayLight.intensity = t > .65 ? Math.min(1.6, (t - .65) * 12) : 0;
  }
  function frame(now) {
    raf = 0;
    if (state.dead || !state.visible || document.hidden || window.__snaxPaused) return;
    const dt = Math.min(3, (now - (state.lastT || now - 16.67)) / 16.67);
    const blend = 1 - Math.pow(.86, dt);
    if (!state.drag) {
      if (Math.abs(state.vel) > .0004) { state.tgt += state.vel * dt; state.vel *= Math.pow(.93, dt); state.spin = 0; }
      else if (opts.spin && !reduce) { state.spin += ((state.hover ? 0 : .0032) - state.spin) * (1 - Math.pow(.94, dt)); state.tgt -= state.spin * dt; }
      else if (state.idle && !reduce) state.tgt += (-0.55 + Math.sin((now - t0) / 1700) * .38 - state.tgt) * .012;
      else if (opts.rest !== undefined) state.tgt += (opts.rest - state.tgt) * (reduce ? 1 : 1 - Math.pow(.98, dt));
    }
    state.rot += (state.tgt - state.rot) * (reduce ? 1 : blend); mach.rotation.y = state.rot;
    const s = reduce ? .5 : (Math.sin((now - t0) / 420) + 1) / 2; hotMat.opacity = state.glow ? .2 + s * .3 : 0; pin.visible = state.glow; pin.scale.setScalar(1 + s * .18);
    applyDrop();
    if (Math.abs(cv.x - cvT.x) + Math.abs(cv.y - cvT.y) + Math.abs(cv.z - cvT.z) + Math.abs(cv.k - cvT.k) > .0005 || cvT.k !== 1 || state.camDirty) { const e = reduce ? 1 : 1 - Math.exp(-Math.min(.25, (now - (state.lastT || now)) / 1000) * 4.5); cv.x += (cvT.x - cv.x) * e; cv.y += (cvT.y - cv.y) * e; cv.z += (cvT.z - cv.z) * e; cv.k += (cvT.k - cv.k) * e; state.camDirty = false; }
    if (state.lastT) { const ms = now - state.lastT; if (ms < 250) { state.ema = state.ema ? state.ema * .95 + ms * .05 : ms; if (state.ema > 40 && prCap > 1 && now - (state.qT || 0) > 2500) { prCap = Math.max(1, prCap - .25); state.qT = now; state.ema = 16; size(); } } }
    state.lastT = now; updateCam(); renderer.render(scene, cam);
    const moving = state.drag || Math.abs(state.vel) > .0004 || Math.abs(state.rot - state.tgt) > .0005 || Math.abs((opts.rest ?? state.tgt) - state.tgt) > .0005;
    const cameraMoving = Math.abs(cv.x - cvT.x) + Math.abs(cv.y - cvT.y) + Math.abs(cv.z - cvT.z) + Math.abs(cv.k - cvT.k) > .0005;
    if (moving || cameraMoving || (!reduce && (state.glow || opts.spin || state.idle))) wake();
  }
  ready = true; wake();
  return {
    setDrop(t) { state.dropT = t; wake(); },
    setGlow(v) { state.glow = v; wake(); },
    setScreen,
    setPaid(v) { payLed.material.color.set(v ? 0x7dff3a : 0x2a4a12); wake(); },
    setRest(a) { opts.rest = a; wake(); },
    setView(name, rotY, amount = 1) {
      const v = { full: [0, -.02, 0, 1], products: [wcx, .12, F, 2.35], qr: [.33, -.1, F, 3.2], tray: [tcx - .05, -.78, F, 2.6] }[name] || [0, -.02, 0, 1];
      const zoom = Math.max(0, Math.min(1, amount));
      cvT.x = v[0] * zoom; cvT.y = -.02 + (v[1] + .02) * zoom; cvT.z = v[2] * zoom; cvT.k = 1 + (v[3] - 1) * zoom; state.camDirty = true; wake();
      if (rotY !== undefined) { opts.spin = false; state.idle = false; opts.rest = rotY; state.tgt = rotY; state.vel = 0; }
    },
    snapshot(w, h, rotY, drawFn) {
      const pr = renderer.getPixelRatio(); renderer.setPixelRatio(1); renderer.setSize(w, h, false); cam.aspect = w / h;
      const t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)); const dist = Math.max(1.3 / t, 1.05 / (t * cam.aspect)) * 1.0;
      baseDist = dist; cv.x=0;cv.y=-.02;cv.z=0;cv.k=1; updateCam(); cam.updateProjectionMatrix();
      state.rot = state.tgt = rotY; mach.rotation.y = rotY; if (drawFn) drawFn();
      hotMat.opacity = 0; pin.visible = false; applyDrop(); mach.updateMatrixWorld(true); cam.updateMatrixWorld(true);
      renderer.render(scene, cam); const url = dom.toDataURL('image/png');
      const P = (x, y) => { const v = new THREE.Vector3(x, y, F).applyMatrix4(mach.matrixWorld).project(cam); return [(v.x + 1) / 2, (1 - v.y) / 2]; };
      const pts = { products: P(wcx, .15), qr: P(.33, -.1), tray: P(tcx, -.78), full: [.5, .5] };
      renderer.setPixelRatio(pr); size(); return { url, pts };
    },
    destroy() {
      state.dead = true; cancelAnimationFrame(raf); cancelAnimationFrame(hoverRaf); resizeObserver?.disconnect(); visibilityObserver?.disconnect();
      removeEventListener('resize', size); document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('snaxvisibility', visibility); motion.removeEventListener('change', motionChanged); logoImg.onload = null;
      const resources = new Set();
      scene.traverse(object => {
        if (object.geometry) resources.add(object.geometry);
        for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) {
          resources.add(material);
          for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
        }
      });
      resources.forEach(resource => resource.dispose()); environment.dispose(); key.shadow.dispose();
      renderer.dispose(); renderer.forceContextLoss(); dom.remove();
    },
    el: dom,
  };
}
