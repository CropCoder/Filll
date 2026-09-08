/* ============================================================================
   explore-three.js — 首页 01 / Explore 四大模块 Three.js 动画
   ----------------------------------------------------------------------------
   功能：为四个探索方向（AI / Bioscience / Algorithms / Software）分别生成
         主题化 3D 动画，包含发光节点、连线、流动光晕等特效。
   实现：零依赖（仅通过 importmap 引入 three），共享一张径向渐变光晕纹理，
         采用 AdditiveBlending 叠加发光；使用 IntersectionObserver 在不可见时
         暂停渲染以节省性能；尊重 prefers-reduced-motion 偏好。
   作者：Jiwen Zhao (https://github.com/CropCoder)
   ============================================================================ */

import * as THREE from 'three';

/* ============================ 配置 ============================ */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 品牌亮色（在深色视觉窗口上更鲜艳）
const LIME   = '#C8F06A';
const GREEN  = '#4ADE80';
const PURPLE = '#9B8BFF';
const CYAN   = '#5FD6E8';

/* ============================ 共享光晕纹理 ============================ */
function makeGlowTexture(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const GLOW = makeGlowTexture();

/* ============================ 通用构造 ============================ */
function rgb(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

// 发光点云
function addPoints(posArray, colArray, size, opacity) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArray), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colArray), 3));
  const mat = new THREE.PointsMaterial({
    size, map: GLOW, vertexColors: true, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

// 发光连线（segArray 为扁平坐标 [x1,y1,z1, x2,y2,z2, ...]）
function addLines(segArray, color, opacity) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segArray), 3));
  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color(color), transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  return new THREE.LineSegments(geo, mat);
}

// 流动光晕粒子（沿折线路径移动）
function makeFlow(path, color, size, speed, offset) {
  const mat = new THREE.SpriteMaterial({
    map: GLOW, color: new THREE.Color(color),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.95,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(size, size, 1);
  return { sprite, path, speed, offset };
}

function posOnPath(path, t) {
  if (path.length === 1) return path[0];
  const seg = t * (path.length - 1);
  const i = Math.min(Math.floor(seg), path.length - 2);
  const f = seg - i;
  return path[i].clone().lerp(path[i + 1], f);
}

/* ============================ 各类型构建器 ============================ */

// AI —— 神经网络节点 / embedding 空间（点云 + 近邻连线 + 流动光点）
function buildAI(group) {
  const n = 130;
  const pos = [], cols = [], vecs = [];
  const palette = [LIME, PURPLE, CYAN];
  for (let i = 0; i < n; i++) {
    const r = 2.2 + Math.random() * 3.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.72;
    const z = r * Math.cos(phi);
    pos.push(x, y, z);
    vecs.push(new THREE.Vector3(x, y, z));
    cols.push(...rgb(palette[(Math.random() * palette.length) | 0]));
  }
  group.add(addPoints(pos, cols, 0.36, 0.92));

  const TH = 2.6, seg = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (vecs[i].distanceTo(vecs[j]) < TH) {
        seg.push(vecs[i].x, vecs[i].y, vecs[i].z, vecs[j].x, vecs[j].y, vecs[j].z);
      }
    }
  }
  group.add(addLines(seg, PURPLE, 0.22));

  const flows = [];
  for (let k = 0; k < 5; k++) {
    const i = (Math.random() * n) | 0;
    let j = -1;
    for (let m = 0; m < n; m++) {
      if (m !== i && vecs[i].distanceTo(vecs[m]) < TH) { j = m; break; }
    }
    if (j < 0) continue;
    const f = makeFlow([vecs[i], vecs[j]], LIME, 0.6, 0.5 + Math.random() * 0.5, Math.random());
    flows.push(f);
    group.add(f.sprite);
  }
  return { rotate: 0.22, flows };
}

// Bioscience —— DNA 双螺旋（两条点链 + 横档 + 链上流动光点）
function buildBioscience(group) {
  const n = 30, radius = 2.3, height = 11, turns = 3.2;
  const s1 = [], s2 = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const y = -height / 2 + t * height;
    const a = t * Math.PI * 2 * turns;
    s1.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
    s2.push(new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius));
  }
  const p1 = [], c1 = [], p2 = [], c2 = [];
  s1.forEach(v => { p1.push(v.x, v.y, v.z); c1.push(...rgb(CYAN)); });
  s2.forEach(v => { p2.push(v.x, v.y, v.z); c2.push(...rgb(GREEN)); });
  group.add(addPoints(p1, c1, 0.52, 0.95));
  group.add(addPoints(p2, c2, 0.52, 0.95));

  const seg = [];
  for (let i = 0; i < n; i++) {
    seg.push(s1[i].x, s1[i].y, s1[i].z, s2[i].x, s2[i].y, s2[i].z);
  }
  group.add(addLines(seg, LIME, 0.5));

  const flows = [
    makeFlow(s1, LIME, 0.6, 0.4, 0),
    makeFlow(s2.slice().reverse(), CYAN, 0.6, 0.45, 0.5),
  ];
  flows.forEach(f => group.add(f.sprite));
  return { rotate: 0.4, flows };
}

// Algorithms —— 球面图网络（Fibonacci 球面节点 + 近邻边 + 贪心遍历光点）
function buildAlgorithms(group) {
  const n = 56;
  const vecs = [], pos = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const v = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(4.2);
    vecs.push(v);
    pos.push(v.x, v.y, v.z);
  }
  const cols = [];
  vecs.forEach((v, i) => {
    cols.push(...rgb(i % 3 === 0 ? LIME : (i % 3 === 1 ? CYAN : GREEN)));
  });
  group.add(addPoints(pos, cols, 0.4, 0.95));

  const TH = 2.6, seg = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (vecs[i].distanceTo(vecs[j]) < TH) {
        seg.push(vecs[i].x, vecs[i].y, vecs[i].z, vecs[j].x, vecs[j].y, vecs[j].z);
      }
    }
  }
  group.add(addLines(seg, CYAN, 0.2));

  // 贪心最近邻遍历路径
  const path = [vecs[0]];
  const visited = new Set([0]);
  let cur = 0;
  for (let k = 0; k < 14; k++) {
    let best = -1, bd = Infinity;
    for (let j = 0; j < n; j++) {
      if (visited.has(j)) continue;
      const d = vecs[cur].distanceTo(vecs[j]);
      if (d < bd) { bd = d; best = j; }
    }
    if (best < 0) break;
    visited.add(best); cur = best; path.push(vecs[best]);
  }
  const flows = [makeFlow(path, LIME, 0.7, 0.5, 0)];
  flows.forEach(f => group.add(f.sprite));
  return { rotate: 0.25, flows };
}

// Software —— 旋转线框多面体 + 轨道流动光点
function buildSoftware(group) {
  const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(4.2, 0),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(CYAN), wireframe: true, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  group.add(ico);
  const ico2 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.6, 1),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(PURPLE), wireframe: true, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  group.add(ico2);

  const orbit = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    orbit.push(new THREE.Vector3(Math.cos(a) * 4.9, Math.sin(a) * 0.7, Math.sin(a) * 4.9));
  }
  const flows = [makeFlow(orbit, LIME, 0.7, 0.32, 0)];
  flows.forEach(f => group.add(f.sprite));
  return { rotate: 0.3, flows, spin: { ico, ico2 } };
}

/* ============================ 构建器注册 ============================ */
const BUILDERS = {
  ai: buildAI,
  bioscience: buildBioscience,
  algorithms: buildAlgorithms,
  software: buildSoftware,
};

/* ============================ 挂载与生命周期 ============================ */
function mount(container, type) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: document.createElement('canvas'),
      alpha: true,
      antialias: true,
    });
  } catch (e) {
    return; // 不支持 WebGL 时静默降级
  }
  container.appendChild(renderer.domElement);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 12;

  const group = new THREE.Group();
  scene.add(group);
  const data = BUILDERS[type](group);

  function resize() {
    const w = container.clientWidth || 300;
    const h = container.clientHeight || 260;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(container);

  const t0 = performance.now();
  function update(t) {
    group.rotation.y = t * data.rotate;
    group.rotation.x = Math.sin(t * 0.3) * 0.16;
    data.flows.forEach(f => {
      f.sprite.position.copy(posOnPath(f.path, (t * f.speed + f.offset) % 1));
    });
    if (data.spin) {
      data.spin.ico.rotation.y = t * 0.5;
      data.spin.ico2.rotation.y = -t * 0.7;
      data.spin.ico2.rotation.x = t * 0.4;
    }
  }
  function render() {
    renderer.render(scene, camera);
  }

  if (REDUCED) {
    update(1.5);
    render();
    return;
  }

  // 可见时才渲染，节省性能
  let visible = false, raf = null;
  function start() { if (raf === null) raf = requestAnimationFrame(loop); }
  function stop() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }
  function loop() {
    raf = null;
    const t = (performance.now() - t0) / 1000;
    update(t);
    render();
    if (visible) start();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => { visible = e.isIntersecting; });
      visible ? start() : stop();
    }, { threshold: 0.05 }).observe(container);
  } else {
    visible = true;
    start();
  }
}

/* ============================ 初始化 ============================ */
document.querySelectorAll('.explore-visual').forEach((el) => {
  const type = el.getAttribute('data-anim');
  if (type && BUILDERS[type]) mount(el, type);
});
