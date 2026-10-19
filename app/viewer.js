// 3D の表示。橋・試験車・機器・同時打撃の板の場面を1つの canvas で切り替える。
// 座標：設置表と同じ「橋の座標」（x＝入口の支承から出口へ、y＝中心線から G4 の側へ、z＝上フランジの上面から上、単位 m）で書き、
// three.js の座標（Y が上）へは B() で直す。試験車は「車の座標」（x＝前車軸から前へ、y＝左へ、z＝地面から上）で V() を使う。
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GEN } from './generated.js';

const DRACO_PATH = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/';
const BR = GEN.bridge;
const X0 = BR.x0;
const DECK_TOP = 0.012;
const COLORS = {
  imu: 0x0059ff, ono: 0x02b07a, mosaic: 0xf5ab00, press: 0x26262e, temp: 0xcc1a4d, shaker: 0x7833b3,
  shaker_force: 0x7833b3, hammer: 0x26262e, vehicle: 0x0059ff, cam: 0xd6249f, hi: 0xffc400, tape: 0xffcc00,
};
export const KIND_NAMES = {
  imu: '加速度計（IMU）', ono: '小野橋梁センサ', mosaic: 'MOSAIC', press: '感圧センサ', temp: '温度センサ',
  shaker: '加振器', hammer: '打撃の点', vehicle: '車両の加速度計',
};

export const B = (x, y, z) => new THREE.Vector3(X0 + x, z, -y);
export const V = (x, y, z) => new THREE.Vector3(x, z, -y);
const dirB = (d) => new THREE.Vector3(d[0], d[2], -d[1]);

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...opts });
}

function label(text, cls = '') {
  // 外の div は CSS2DRenderer が位置を決める。中の span で札をずらす（カメラの札は上、撮る物の札は下）
  const div = document.createElement('div');
  const span = document.createElement('span');
  span.className = 'lab ' + cls;
  span.textContent = text;
  div.appendChild(span);
  const o = new CSS2DObject(div);
  o.userData.isLabel = true;
  o.userData.span = span;
  return o;
}
const setLabelClass = (o, cls) => { o.userData.span.className = 'lab ' + cls; };

function cylinderBetween(p0, p1, radius, material) {
  const len = p0.distanceTo(p1);
  const g = new THREE.CylinderGeometry(radius, radius, len, 8, 1);
  const m = new THREE.Mesh(g, material);
  m.position.copy(p0).add(p1).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize());
  return m;
}

function dashed(p0, p1, color, dash = 0.06) {
  const g = new THREE.BufferGeometry().setFromPoints([p0, p1]);
  const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: dash * 0.7 }));
  l.computeLineDistances();
  return l;
}

function disposeGroup(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material && !o.userData.sharedMat) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    if (o.userData.isLabel && o.element && o.element.parentNode) o.element.parentNode.removeChild(o.element);
  });
  g.clear();
}

export class Viewer {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'viewer';
    this.ok = true;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (e) {
      this.ok = false;
      this.el.innerHTML = '<p class="viewer-msg">この端末では 3D を表示できません。下の文の指示で撮ってください。</p>';
      return;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.el.appendChild(this.renderer.domElement);
    this.labels = new CSS2DRenderer();
    this.labels.domElement.className = 'labels';
    this.el.appendChild(this.labels.domElement);

    this.tools = document.createElement('div');
    this.tools.className = 'viewer-tools';
    this.btnOver = this._button('全体', () => this.setMode('over'));
    this.btnCam = this._button('撮る位置から', () => this.setMode('cam'));
    this.btnCam.classList.add('cam');
    this.tools.append(this.btnOver, this.btnCam);
    this.el.appendChild(this.tools);
    this.legend = document.createElement('div');
    this.legend.className = 'viewer-legend';
    this.el.appendChild(this.legend);
    this.msg = document.createElement('div');
    this.msg.className = 'viewer-msg';
    this.msg.hidden = true;
    this.el.appendChild(this.msg);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 300);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.addEventListener('change', () => this.render());

    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_PATH);
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(draco);

    this.scenes = {};
    this.current = null;
    this.mode = 'over';
    this.pose = null;
    this.pulse = null;
    this.cache = {};
    new ResizeObserver(() => this.resize()).observe(this.el);
  }

  _button(text, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.addEventListener('click', fn);
    return b;
  }

  attach(parent) {
    if (this.el.parentNode !== parent) parent.appendChild(this.el);
    this.resize();
  }

  resize() {
    if (!this.ok) return;
    const w = this.el.clientWidth || 1;
    const h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.labels.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  render() {
    if (!this.ok || !this.current) return;
    this.renderer.render(this.current.scene, this.camera);
    this.labels.render(this.current.scene, this.camera);
    // r160 の CSS2DRenderer は、カメラの後ろの札を反転して出すことがあるので消す
    const v = new THREE.Vector3();
    this.current.scene.traverse((o) => {
      if (!o.userData.isLabel || o.element.style.display === 'none') return;
      v.setFromMatrixPosition(o.matrixWorld).applyMatrix4(this.camera.matrixWorldInverse);
      if (v.z > -this.camera.near) o.element.style.display = 'none';
    });
  }

  async gltf(url) {
    if (!this.cache[url]) {
      this.cache[url] = new Promise((res, rej) => this.loader.load(url, (g) => res(g), undefined, rej));
    }
    return this.cache[url];
  }

  _baseScene(bg = 0xdfe6ec) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x7d848c, 1.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.7);
    sun.position.set(6, 12, 8);
    scene.add(sun);
    const extra = new THREE.Group();
    scene.add(extra);
    return { scene, extra, labelsAll: [] };
  }

  _useScene(s) {
    if (this.current && this.current !== s) {
      this.current.scene.traverse((o) => { if (o.userData.isLabel) o.element.style.display = 'none'; });
    }
    this.current = s;
  }

  // ---------- 橋 ----------
  async bridgeScene() {
    if (this.scenes.bridge) return this.scenes.bridge;
    const s = this._baseScene();
    const g = await this.gltf('models/bridge_retest.glb');
    const root = g.scene;
    s.scene.add(root);
    // GLTFLoader は名前の '.' などを消す（PropertyBinding.sanitizeNodeName）。元の名前でも引けるようにする
    s.nodes = {};
    root.traverse((o) => { if (o.name) s.nodes[o.name] = o; });
    s.node = (name) => s.nodes[name] || s.nodes[THREE.PropertyBinding.sanitizeNodeName(name)];
    s.deck = [];
    root.traverse((o) => {
      if (o.isMesh && /^SB/.test(o.name)) { o.material = o.material.clone(); s.deck.push(o); }
    });
    s.damage = s.node('CG_x4.550_G3G4');
    if (!s.damage) console.warn('損傷させる横桁の node が見つからない');
    [s.damage, ...Object.values(s.nodes).filter((o) => o.name.startsWith('bolt_end'))].forEach((n) => n && n.traverse((o) => { if (o.isMesh) o.material = o.material.clone(); }));
    s.bolts = Object.keys(s.nodes).filter((n) => n.startsWith('bolt_end')).sort().map((n) => s.nodes[n]);
    s.boltColor = s.bolts.length ? s.bolts[0].material.color.clone() : null;

    // 地面（模型の表示用の高さ）と、入口・出口・進む向き
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), mat(0xcfd6cd, { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(X0 + BR.span / 2, BR.groundZ - 0.002, 0);
    s.scene.add(ground);
    // 取り付けの路面（実物の形は分からないので、床版の高さの平らな板で示す）
    const padMat = mat(0xb9c0c7, { roughness: 1, transparent: true, opacity: 0.85 });
    [[-6.39, -0.39], [BR.deckX[1], BR.deckX[1] + 6]].forEach(([a, b]) => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(b - a, 0.02, BR.deckY[1] - BR.deckY[0]), padMat);
      pad.position.copy(B((a + b) / 2, (BR.deckY[0] + BR.deckY[1]) / 2, DECK_TOP - 0.01));
      s.scene.add(pad);
    });
    const padNote = label('路面（表示用。実物の形とは違う）', 'dim');
    padNote.position.copy(B(-4.2, BR.deckY[1] + 0.1, 0.05));
    s.scene.add(padNote);
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), B(-1.6, BR.pathY, DECK_TOP + 0.02), 1.2, 0x1d3557, 0.25, 0.14);
    s.scene.add(arrow);
    const lin = label('入口（車はここから入る）', 'dim');
    lin.position.copy(B(-1.2, BR.pathY, 0.25));
    s.scene.add(lin);
    const lout = label('出口', 'dim');
    lout.position.copy(B(BR.span + 0.9, BR.pathY, 0.25));
    s.scene.add(lout);
    BR.girderY.forEach((y, i) => {
      const l = label(`G${i + 1}`, 'dim');
      l.position.copy(B(-0.55, y, 0.05));
      s.scene.add(l);
    });

    // 点の印（設置表から）
    s.markers = {};
    for (const p of GEN.points) {
      if (p.side !== 'BRIDGE' || p.notDone) continue;
      const m = this._marker(p);
      if (!m) continue;
      s.scene.add(m);
      s.markers[p.id] = m;
    }
    // 継ぎ目・横桁の位置（表示用の模型の値）
    s.joints = new THREE.Group();
    BR.jointX.forEach((x, i) => {
      const line = cylinderBetween(B(x, BR.deckY[0], DECK_TOP + 0.004), B(x, BR.deckY[1], DECK_TOP + 0.004), 0.006, mat(0x5a6470));
      s.joints.add(line);
      const l = label(`J${i + 1}`, 'dim');
      l.position.copy(B(x, BR.deckY[1] + 0.12, DECK_TOP));
      s.joints.add(l);
    });
    s.joints.visible = false;
    s.scene.add(s.joints);

    // 加振器（Antigravity の GLB を元のスレッドが確かめたら models/shaker_on_G1.glb に写す。無いうちは目安の箱）
    s.shaker = new THREE.Group();
    const S1 = GEN.points.find((p) => p.id === 'S1');
    s.shaker.position.copy(B(S1.x, S1.y, 0));
    s.scene.add(s.shaker);
    if (GEN.models && GEN.models.shaker) {
      try {
        const sg = await this.gltf(GEN.models.shaker);
        sg.scene.scale.setScalar(0.001);
        s.shaker.add(sg.scene);
        s.shakerReal = true;
      } catch (e) { s.shakerReal = false; }
    }
    if (!s.shakerReal) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.116, 0.116, 0.116), mat(COLORS.shaker, { transparent: true, opacity: 0.35 }));
      box.position.y = 0.058;
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: COLORS.shaker }));
      edges.position.copy(box.position);
      s.shaker.add(box, edges);
    }
    this.scenes.bridge = s;
    return s;
  }

  _marker(p) {
    const color = COLORS[p.kind] ?? 0x666666;
    const solid = p.decided;
    const grp = new THREE.Group();
    grp.userData.point = p;
    let top = 0.1;
    if (p.kind === 'imu' || p.kind === 'ono') {
      const z = p.girder === 'G1' ? 0 : DECK_TOP;
      const xs = p.id.startsWith('E') ? (p.x < 1 ? p.x + 0.16 : p.x - 0.16) : p.x;   // 支承の点は支間側の縁のすぐ内側（目安）
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), mat(color, solid ? {} : { transparent: true, opacity: 0.45 }));
      box.position.copy(B(xs, p.y, z + 0.03));
      grp.add(box);
      grp.userData.anchor = B(xs, p.y, z + 0.06);
      top = z + 0.06;
    } else if (p.kind === 'mosaic') {
      const pole = cylinderBetween(B(p.x, p.y, 0), B(p.x, p.y, 0.25), 0.008, mat(0x555555));
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20), mat(color));
      disc.position.copy(B(p.x, p.y, 0.26));
      grp.add(pole, disc);
      grp.userData.anchor = B(p.x, p.y, 0.27);
    } else if (p.kind === 'press') {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 0.622), mat(color));
      strip.position.copy(B(p.x, p.y, DECK_TOP + 0.002));
      grp.add(strip);
      grp.userData.anchor = B(p.x, p.y, DECK_TOP + 0.01);
    } else if (p.kind === 'temp') {
      // 主桁が未定なので、支間中央を横切る帯で示す
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 3.9), mat(color, { transparent: true, opacity: 0.35 }));
      band.position.copy(B(p.x, 0, -0.1 + (p.id === 'T2' ? -0.03 : 0)));
      grp.add(band);
      grp.userData.anchor = B(p.x, p.id === 'T1' ? -1.95 : 1.95, -0.1);
    } else if (p.kind === 'hammer') {
      const lateral = p.device.includes('水平');
      const at = B(p.x, p.y, lateral ? -0.1 : (p.girder === 'G1' ? 0 : DECK_TOP));
      const out = p.y < 0 ? -1 : 1;
      const from = lateral ? B(p.x, p.y + out * 0.45, -0.1) : at.clone().add(new THREE.Vector3(0, 0.4, 0));
      const dir = at.clone().sub(from).normalize();
      grp.add(new THREE.ArrowHelper(dir, from, at.distanceTo(from), color, 0.08, 0.05));
      grp.userData.anchor = lateral ? from : from;
    } else if (p.kind === 'shaker' || p.kind === 'shaker_force') {
      grp.userData.anchor = B(p.x ?? 1.67, p.y ?? -1.8, 0.14);
      if (p.kind === 'shaker_force') return null;
    } else {
      return null;
    }
    const l = label(p.id, solid ? '' : 'tbd');
    l.position.copy(grp.userData.anchor);
    l.visible = false;
    grp.add(l);
    grp.userData.label = l;
    return grp;
  }

  // ---------- 試験車 ----------
  async truckScene() {
    if (this.scenes.truck) return this.scenes.truck;
    const s = this._baseScene();
    const g = await this.gltf('models/truck_real.glb');
    s.scene.add(g.scene);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), mat(0xcfd6cd, { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(-1, -0.001, 0);
    s.scene.add(ground);
    s.markers = {};
    for (const vp of GEN.vehiclePoints || []) {
      const grp = new THREE.Group();
      const solid = vp.decided;
      const c = vp.kind === 'mosaic' ? COLORS.mosaic : COLORS.vehicle;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.07), mat(c, solid ? {} : { transparent: true, opacity: 0.45 }));
      box.position.copy(V(...vp.at));
      grp.add(box);
      if (!solid) {
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: c }));
        e.position.copy(box.position);
        grp.add(e);
      }
      grp.userData.anchor = V(vp.at[0], vp.at[1], vp.at[2] + 0.04);
      const l = label(vp.id, solid ? '' : 'tbd');
      l.position.copy(grp.userData.anchor);
      l.visible = false;
      grp.add(l);
      grp.userData.label = l;
      s.scene.add(grp);
      s.markers[vp.id] = grp;
    }
    this.scenes.truck = s;
    return s;
  }

  // ---------- 同時打撃の板（模式） ----------
  syncScene() {
    if (this.scenes.sync) return this.scenes.sync;
    const s = this._baseScene();
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.03, 0.5), mat(0xb08d5b));
    board.position.set(0, 0.015, 0);
    s.scene.add(board);
    const n = 12;
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < n; i++) {
        const c = row === 0 ? COLORS.imu : COLORS.ono;
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.09), mat(c));
        b.position.set(-1.1 + i * 0.2, 0.06, row === 0 ? -0.12 : 0.12);
        s.scene.add(b);
        const arr = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), b.position.clone().add(new THREE.Vector3(-0.04, 0.035, 0)), 0.08, 0xffffff, 0.03, 0.02);
        s.scene.add(arr);
      }
    }
    const l1 = label('橋の SPRESENSE（BRI）', 'dim'); l1.position.set(-1.25, 0.12, -0.3); s.scene.add(l1);
    const l2 = label('小野橋梁センサ（ONO）', 'dim'); l2.position.set(-1.25, 0.12, 0.32); s.scene.add(l2);
    const l3 = label('並べ方の模式（実物の形ではない）', 'dim'); l3.position.set(0.6, 0.3, -0.35); s.scene.add(l3);
    s.markers = {};
    s.anchor = new THREE.Vector3(0, 0.06, 0);
    this.scenes.sync = s;
    return s;
  }

  // ---------- 機器 ----------
  async deviceScene(url) {
    const key = 'dev:' + url;
    if (this.scenes[key]) return this.scenes[key];
    const s = this._baseScene(0xe9edf1);
    const g = await this.gltf(url);
    const obj = g.scene.clone(true);
    const box = new THREE.Box3().setFromObject(obj);
    const c = box.getCenter(new THREE.Vector3());
    obj.position.sub(c);
    s.scene.add(obj);
    s.size = box.getSize(new THREE.Vector3()).length();
    s.markers = {};
    this.scenes[key] = s;
    return s;
  }

  async showDevice(url, note) {
    if (!this.ok) return;
    this._clearExtra();
    this.msg.hidden = true;
    this.legend.textContent = note || '';
    this.legend.hidden = !note;
    this.tools.hidden = true;
    this.pose = null;
    let s;
    try { s = await this.deviceScene(url); } catch (e) { this._fail(e); return; }
    this._useScene(s);
    const d = s.size * 1.25;
    this.camera.fov = 40;
    this.camera.near = d / 200; this.camera.far = d * 20;
    this.camera.position.set(d * 0.7, d * 0.55, d * 0.8);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.camera.updateProjectionMatrix();
    this.render();
  }

  _fail(e) {
    console.error(e);
    this.msg.hidden = false;
    this.msg.textContent = '3D を読み込めませんでした（電波の弱い所では、使い方の「3D を全部読み込む」を先に）。下の文の指示で撮ってください。';
  }

  _clearExtra() {
    for (const s of Object.values(this.scenes)) {
      disposeGroup(s.extra);
      if (s.markers) {
        for (const m of Object.values(s.markers)) {
          if (m.userData.label) { m.userData.label.visible = false; setLabelClass(m.userData.label, ''); }
          m.traverse((o) => { if (o.isMesh && o.userData.hiMat) { o.material = o.userData.baseMat; delete o.userData.hiMat; } });
        }
      }
    }
    if (this.pulse) { cancelAnimationFrame(this.pulse); this.pulse = null; }
  }

  _point(s, ref) {
    if (Array.isArray(ref)) return s === this.scenes.truck ? V(...ref) : B(...ref);
    if (typeof ref === 'string') {
      if (ref.startsWith('node:')) {
        const n = s.node && s.node(ref.slice(5));
        if (n) return new THREE.Box3().setFromObject(n).getCenter(new THREE.Vector3());
      }
      if (ref === 'S1shaker') return B(1.67, -1.8, 0.12);
      if (ref === 'bolts:G4' || ref === 'bolts:G3') {
        const list = s.bolts.filter((b) => (ref.endsWith('G4') ? b.name.startsWith('bolt_end2') : b.name.startsWith('bolt_end1')));
        const box = new THREE.Box3();
        list.forEach((b) => box.expandByObject(b));
        return box.getCenter(new THREE.Vector3());
      }
      const m = s.markers && s.markers[ref];
      if (m) return m.userData.anchor.clone();
      if (s.anchor) return s.anchor.clone();
    }
    return new THREE.Vector3();
  }

  // 1枚の写真の場面を出す
  async show(view) {
    if (!this.ok) return;
    this._clearExtra();
    this.msg.hidden = true;
    this.tools.hidden = false;
    let s;
    try {
      if (view.scene === 'truck') s = await this.truckScene();
      else if (view.scene === 'sync') s = this.syncScene();
      else s = await this.bridgeScene();
    } catch (e) { this._fail(e); return; }
    this._useScene(s);
    const isBridge = s === this.scenes.bridge;

    if (isBridge) {
      const st = view.state || 'intact';
      if (s.damage) s.damage.visible = st !== 'heavy';
      s.bolts.forEach((b) => {
        b.visible = st !== 'heavy';
        b.material.color.copy(st === 'light' ? new THREE.Color(0xff7a00) : s.boltColor);
      });
      s.deck.forEach((d) => { d.material.transparent = view.deck != null; d.material.opacity = view.deck ?? 1; d.material.depthWrite = view.deck == null; });
      s.joints.visible = !!view.joints;
      s.joints.traverse((o) => { if (o.userData.isLabel) o.visible = !!view.joints; });   // r160 の CSS2D は親の表示を見ないので、札も切り替える
      s.shaker.visible = view.shaker !== false && (view.shaker === true || !!view.shakerOn);
      if (view.state === 'heavy' && s.damage) {
        const box = new THREE.Box3().setFromObject(s.damage);
        const helper = new THREE.Box3Helper(box, COLORS.hi);
        s.extra.add(helper);
      }
      if (s.damage) {
        const glow = view.highlightDamage && view.state !== 'heavy' ? 0x553300 : 0x000000;
        s.damage.traverse((o) => { if (o.isMesh) o.material.emissive = new THREE.Color(glow); });
      }
    }

    if (isBridge) {
      if (view.truckAt != null) {
        if (!s.truck) {
          try {
            const tg = await this.gltf(GEN.models.truck);
            s.truck = tg.scene.clone(true);
            s.scene.add(s.truck);
          } catch (e) { s.truck = null; }
        }
        if (s.truck) { s.truck.visible = true; s.truck.position.copy(B(view.truckAt, BR.pathY, DECK_TOP)); }
      } else if (s.truck) {
        s.truck.visible = false;
      }
    }

    // 座標 [x, y, z] は1つの点。[].concat で平らにすると数の並びになってしまうので分けて扱う
    const targets = view.target == null ? [] : Array.isArray(view.target) && typeof view.target[0] === 'number' ? [view.target] : [].concat(view.target);
    const T = targets.length ? this._point(s, targets[0]) : new THREE.Vector3();
    // 目印の札と強調
    const shown = new Set([...(view.labels || []), ...targets.filter((t) => typeof t === 'string')]);
    for (const [id, m] of Object.entries(s.markers || {})) {
      if (m.userData.label) {
        m.userData.label.visible = shown.has(id);
        setLabelClass(m.userData.label, (targets.includes(id) ? 'hi' : '') + (m.userData.point && !m.userData.point.decided ? ' tbd' : ''));
      }
      if (targets.includes(id)) {
        m.traverse((o) => {
          if (o.isMesh) { o.userData.baseMat = o.material; o.userData.hiMat = true; o.material = mat(COLORS.hi, { emissive: 0x664400 }); }
        });
      }
    }
    this.rings = [];
    for (const t of targets) {
      const p = this._point(s, t);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(view.ring ?? 0.13, 0.014, 8, 36), new THREE.MeshBasicMaterial({ color: COLORS.hi, depthTest: false }));
      ring.renderOrder = 5;
      ring.position.copy(p);
      ring.rotation.x = Math.PI / 2;
      s.extra.add(ring);
      this.rings.push(ring);
    }
    if (view.targetLabel) {
      const l = label(view.targetLabel, 'hi');
      l.position.copy(T);
      s.extra.add(l);
    }
    if (isBridge && (view.bolts === 'G4' || view.bolts === 'G3' || view.bolts === 'both')) {
      const want = view.bolts;
      s.bolts.forEach((b) => {
        const isG4 = b.name.startsWith('bolt_end2');
        if (want === 'both' || (want === 'G4') === isG4) {
          b.material.color.set(COLORS.hi);
        }
      });
    }

    // 巻尺・補助の線
    for (const t of view.tapes || []) {
      const p0 = this._point(s, t.from);
      const p1 = this._point(s, t.to);
      s.extra.add(cylinderBetween(p0, p1, 0.007, new THREE.MeshBasicMaterial({ color: t.color ?? COLORS.tape })));
      if (t.label0 !== '') { const l0 = label(t.label0 ?? '0', 'dim'); l0.position.copy(p0); s.extra.add(l0); }
      if (t.label1) { const l1 = label(t.label1, 'hi'); l1.position.copy(p1); s.extra.add(l1); }
    }
    for (const n of view.notes3d || []) {
      const l = label(n.text, n.cls || 'dim');
      l.position.copy(this._point(s, n.at));
      s.extra.add(l);
    }
    if (view.axes) {
      const o = this._point(s, view.axes);
      const mk = (d, c, t) => {
        const a = new THREE.ArrowHelper(d, o, 0.26, c, 0.07, 0.045);
        s.extra.add(a);
        const l = label(t, 'dim');
        l.position.copy(o.clone().add(d.clone().multiplyScalar(0.36)).add(new THREE.Vector3(0, t.startsWith('y') ? -0.05 : 0, 0)));
        s.extra.add(l);
      };
      if (s === this.scenes.truck) {
        mk(dirB([1, 0, 0]), 0xe03131, '前');
      } else {
        mk(dirB([1, 0, 0]), 0xe03131, 'x 出口へ');
        mk(dirB([0, 1, 0]), 0x2f9e44, 'y G4 へ');
        mk(dirB([0, 0, 1]), 0x1c7ed6, 'z 上');
      }
    }

    // 撮る位置とカメラの向き
    let C = null;
    if (view.cam) {
      if (view.cam.at) C = this._point(s, view.cam.at);
      else C = T.clone().add(dirB(view.cam.dir).normalize().multiplyScalar(view.cam.dist ?? 1));
      this._cameraGlyph(s, C, T, view);
    }
    const same = this.pose && this.pose.view === view;
    this.pose = { T, C, view, scene: s };
    this.legend.textContent = view.legend || '';
    this.legend.hidden = !view.legend;
    if (view.msg) { this.msg.hidden = false; this.msg.textContent = view.msg; }
    this.setMode(same && this.mode === 'cam' && C ? 'cam' : 'over', true);
    this._startPulse();
  }

  _cameraGlyph(s, C, T, view) {
    const g = new THREE.Group();
    const look = T.clone().sub(C).normalize();
    const tate = view.orient !== 'yoko';
    const body = new THREE.Mesh(new THREE.BoxGeometry(tate ? 0.09 : 0.17, tate ? 0.17 : 0.09, 0.02), mat(COLORS.cam));
    body.position.copy(C);
    body.lookAt(T);
    g.add(body);
    // 写る範囲（4:3）
    const d = Math.min(C.distanceTo(T) * 0.9, 1.6);
    const up = Math.abs(look.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(look, up).normalize();
    const up2 = new THREE.Vector3().crossVectors(right, look).normalize();
    const half = Math.tan(THREE.MathUtils.degToRad(27)) * d;
    const hw = tate ? half * 0.75 : half;
    const hh = tate ? half : half * 0.75;
    const ctr = C.clone().add(look.clone().multiplyScalar(d));
    const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => ctr.clone().add(right.clone().multiplyScalar(a * hw)).add(up2.clone().multiplyScalar(b * hh)));
    const lm = new THREE.LineBasicMaterial({ color: COLORS.cam });
    const pts = [];
    corners.forEach((c) => { pts.push(C, c); });
    for (let i = 0; i < 4; i++) pts.push(corners[i], corners[(i + 1) % 4]);
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lm));
    const face = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([corners[0], corners[1], corners[2], corners[0], corners[2], corners[3]]),
      new THREE.MeshBasicMaterial({ color: COLORS.cam, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    g.add(face);
    g.add(dashed(C, T, COLORS.cam, 0.05));
    // 立つ所
    let floor = s === this.scenes.bridge ? BR.groundZ : 0;
    if (s === this.scenes.bridge) {
      const xb = C.x - X0;
      const yb = -C.z;
      if (xb > BR.deckX[0] && xb < BR.deckX[1] && yb > BR.deckY[0] && yb < BR.deckY[1] && C.y > DECK_TOP) floor = DECK_TOP;
    }
    if (view.floor != null) floor = view.floor;
    if (C.y - floor > 0.15 && s !== this.scenes.sync) {
      const foot = new THREE.Vector3(C.x, floor + 0.003, C.z);
      g.add(dashed(C, foot, COLORS.cam, 0.04));
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.16, 32), new THREE.MeshBasicMaterial({ color: COLORS.cam, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(foot);
      g.add(ring);
    }
    const l = label(view.camLabel || 'ここから撮る', 'cam');
    l.position.copy(C);
    g.add(l);
    g.userData.glyph = true;
    s.extra.add(g);
    this.glyph = g;
  }

  setMode(mode, keep) {
    if (!this.ok || !this.pose) return;
    const { T, C, view } = this.pose;
    if (mode === 'cam' && !C) mode = 'over';
    this.mode = mode;
    this.btnCam.classList.toggle('on', mode === 'cam');
    this.btnOver.classList.toggle('on', mode === 'over');
    this.btnCam.disabled = !C;
    if (this.glyph) this.glyph.visible = mode !== 'cam';
    this.ringBase = mode === 'cam' ? 1 : 1.8;   // 全体の図では輪を大きくして見つけやすくする
    (this.rings || []).forEach((r) => r.scale.setScalar(this.ringBase));
    if (mode === 'cam') {
      // スマートフォンの広角のカメラ（横 69°・縦 54°、4:3）に近い写り方にする。縦長の指示なら縦と横を入れ替える
      const t = (deg) => Math.tan(THREE.MathUtils.degToRad(deg / 2));
      const a = this.camera.aspect;
      const [h, v] = view.orient === 'tate' ? [54, 69] : [69, 54];
      this.camera.fov = Math.max(THREE.MathUtils.radToDeg(2 * Math.atan(t(h) / a)), v);
      this.camera.near = 0.01; this.camera.far = 200;
      this.camera.position.copy(C);
      this.controls.target.copy(T);
    } else {
      this.camera.fov = 45;
      this.camera.near = 0.02; this.camera.far = 300;
      const ov = view.over;
      if (ov && ov.at) {
        this.camera.position.copy(this._point(this.pose.scene, ov.at));
        this.controls.target.copy(ov.look ? this._point(this.pose.scene, ov.look) : T);
      } else {
        const mid = C ? T.clone().multiplyScalar(0.62).add(C.clone().multiplyScalar(0.38)) : T.clone();
        let side = C ? C.clone().sub(T) : dirB([-0.5, -1, 0.8]);
        side.y = 0;
        if (side.lengthSq() < 1e-6) side.set(-0.5, 0, 1);
        side.normalize();
        const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(ov?.turn ?? 72));
        side.applyQuaternion(rot);
        const span = C ? Math.max(C.distanceTo(T), 0.6) : 1;
        const narrow = Math.max(1, 1.1 / Math.max(this.camera.aspect, 0.4));
        const dist = (ov?.dist ?? Math.max(2.6, span * 3.4)) * narrow;
        const elev = THREE.MathUtils.degToRad(ov?.elev ?? 35);
        this.camera.position.copy(mid).add(side.multiplyScalar(dist * Math.cos(elev))).add(new THREE.Vector3(0, dist * Math.sin(elev), 0));
        this.controls.target.copy(mid);
      }
    }
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.render();
  }

  _startPulse() {
    const t0 = performance.now();
    const rings = [];
    this.current.extra.traverse((o) => { if (o.geometry && o.geometry.type === 'TorusGeometry') rings.push(o); });
    const step = (t) => {
      const k = (t - t0) / 1000;
      const sc = (this.ringBase || 1) * (1 + 0.25 * Math.sin(k * 6));
      rings.forEach((r) => r.scale.setScalar(sc));
      this.render();
      if (k < 2.4) this.pulse = requestAnimationFrame(step);
      else { rings.forEach((r) => r.scale.setScalar(this.ringBase || 1)); this.render(); this.pulse = null; }
    };
    this.pulse = requestAnimationFrame(step);
  }
}
