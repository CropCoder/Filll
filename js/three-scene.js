/* ============================================
   filll.cn — Three.js 粒子背景场景
   表现"相分离"凝聚滴落意象
   优化版：减少粒子数、提升性能、适配学术风格
   Author: Jiwen Zhao (https://github.com/CropCoder)
   ============================================ */

import * as THREE from 'three';

// 检查是否为低性能设备
const isLowPerf = window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Canvas ---
const canvas = document.createElement('canvas');
canvas.id = 'three-canvas';
document.body.prepend(canvas);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isLowPerf });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowPerf ? 1 : 1.5));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 14;
camera.lookAt(0, 0, 0);

let viewW = window.innerWidth;
let viewH = window.innerHeight;

function resize() {
  viewW = window.innerWidth;
  viewH = window.innerHeight;
  renderer.setSize(viewW, viewH);
  camera.aspect = viewW / Math.max(viewH, 1);
  camera.updateProjectionMatrix();
}

// --- Glow texture (共享) ---
function makeGlowTex(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.6)');
  g.addColorStop(0.6, 'rgba(13,110,158,0.2)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const glowTex = makeGlowTex(32);

// --- 配色 (学术风, 柔和) ---
const palette = [
  new THREE.Color('#0d6e9e'),
  new THREE.Color('#5a8fbb'),
  new THREE.Color('#2d7d46'),
  new THREE.Color('#c96a2b'),
  new THREE.Color('#6b6e88'),
];

// --- 粒子系统 ---
const count = isLowPerf ? 60 : 120;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const basePos = new Float32Array(count * 3);
const speeds = new Float32Array(count);
const phases = new Float32Array(count);
const amps = new Float32Array(count);

for (let i = 0; i < count; i++) {
  const x = (Math.random() - 0.5) * 20;
  const y = (Math.random() - 0.5) * 16;
  const z = (Math.random() - 0.5) * 8;
  positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
  basePos[i*3] = x; basePos[i*3+1] = y; basePos[i*3+2] = z;
  speeds[i] = 0.3 + Math.random() * 0.8;
  phases[i] = Math.random() * Math.PI * 2;
  amps[i] = 0.1 + Math.random() * 0.4;
  const col = palette[Math.floor(Math.random() * palette.length)];
  colors[i*3] = col.r * (0.5 + Math.random() * 0.5);
  colors[i*3+1] = col.g * (0.5 + Math.random() * 0.5);
  colors[i*3+2] = col.b * (0.5 + Math.random() * 0.5);
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const mat = new THREE.PointsMaterial({
  size: isLowPerf ? 0.06 : 0.08,
  map: glowTex,
  vertexColors: true,
  transparent: true,
  opacity: 0.4,
  blending: THREE.NormalBlending,
  depthWrite: false,
});
const points = new THREE.Points(geo, mat);
scene.add(points);

// --- 液滴凝聚组 (相分离意象) ---
const DROPLETS = isLowPerf ? 2 : 5;
const dropletDefs = [
  { pos: [-6, 3, -3], radius: 2.2, pCount: 300 },
  { pos: [5, -2, -2], radius: 1.8, pCount: 240 },
  { pos: [-4, -5, -3], radius: 1.5, pCount: 200 },
  { pos: [7, 5, -4], radius: 2.0, pCount: 260 },
  { pos: [0, -7, -4], radius: 1.6, pCount: 220 },
];

const dropletGroups = [];
const dSelect = dropletDefs.slice(0, DROPLETS);

dSelect.forEach((def) => {
  const group = new THREE.Group();
  group.position.set(...def.pos);

  const gCount = def.pCount;
  const dPos = new Float32Array(gCount * 3);
  const dBase = new Float32Array(gCount * 3);
  const dCol = new Float32Array(gCount * 3);
  const baseColor = palette[Math.floor(Math.random() * palette.length)];

  for (let i = 0; i < gCount; i++) {
    const u = Math.random();
    const r = def.radius * (0.15 + 0.85 * Math.cbrt(u));
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const lx = r * Math.sin(phi) * Math.cos(theta);
    const ly = r * Math.sin(phi) * Math.sin(theta);
    const lz = r * Math.cos(phi);
    dPos[i*3] = lx; dPos[i*3+1] = ly; dPos[i*3+2] = lz;
    dBase[i*3] = lx; dBase[i*3+1] = ly; dBase[i*3+2] = lz;
    dCol[i*3] = Math.min(1, baseColor.r * (0.6 + Math.random() * 0.5));
    dCol[i*3+1] = Math.min(1, baseColor.g * (0.6 + Math.random() * 0.5));
    dCol[i*3+2] = Math.min(1, baseColor.b * (0.6 + Math.random() * 0.5));
  }

  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));

  const dMat = new THREE.PointsMaterial({
    size: 0.05, map: glowTex, vertexColors: true,
    transparent: true, opacity: 0.35, depthWrite: false,
  });
  group.add(new THREE.Points(dGeo, dMat));

  // wireframe sphere
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(def.radius, 16, 12),
    new THREE.MeshBasicMaterial({
      color: baseColor, wireframe: true,
      transparent: true, opacity: 0.03, depthWrite: false,
    })
  );
  group.add(wire);

  scene.add(group);
  dropletGroups.push({
    group, geo: dGeo, posArr: dPos, baseArr: dBase,
    basePos: [...def.pos], count: gCount,
    speed: 0.1 + Math.random() * 0.3,
    phase: Math.random() * Math.PI * 2,
    floatAmp: 0.1 + Math.random() * 0.3,
  });
});

// --- 鼠标交互 (柔和跟随) ---
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
document.addEventListener('mousemove', (e) => {
  mouse.targetX = (e.clientX / viewW) * 2 - 1;
  mouse.targetY = -(e.clientY / viewH) * 2 + 1;
});
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    mouse.targetX = (e.touches[0].clientX / viewW) * 2 - 1;
    mouse.targetY = -(e.touches[0].clientY / viewH) * 2 + 1;
  }
}, { passive: true });

// --- 动画循环 ---
const clock = new THREE.Clock();

function animate(time) {
  requestAnimationFrame(animate);
  const t = time * 0.001;
  const dt = Math.min(clock.getDelta(), 0.1);

  // Smooth mouse
  mouse.x += (mouse.targetX - mouse.x) * 0.05;
  mouse.y += (mouse.targetY - mouse.y) * 0.05;

  // Camera gentle follow
  camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.02;
  camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.02;
  camera.lookAt(0, 0, 0);

  // Animate free particles
  const fp = geo.attributes.position.array;
  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    const phase = phases[i];
    const spd = speeds[i];
    fp[ix] = basePos[ix] + Math.sin(t * spd * 0.3 + phase) * amps[i] * 0.8;
    fp[ix + 1] = basePos[ix + 1] + Math.cos(t * spd * 0.25 + phase * 1.2) * amps[i];
    fp[ix + 2] = basePos[ix + 2] + Math.sin(t * spd * 0.2 + phase * 0.7) * amps[i] * 0.5;
  }
  geo.attributes.position.needsUpdate = true;

  // Animate droplets
  dropletGroups.forEach((d) => {
    const fx = Math.sin(t * d.speed + d.phase) * d.floatAmp;
    const fy = Math.cos(t * d.speed * 1.2 + d.phase) * d.floatAmp * 1.1;
    const fz = Math.cos(t * d.speed * 0.6 + d.phase + 1) * d.floatAmp * 0.7;
    d.group.position.x = d.basePos[0] + fx;
    d.group.position.y = d.basePos[1] + fy;
    d.group.position.z = d.basePos[2] + fz;
    d.group.rotation.y += dt * 0.03;
    d.group.rotation.x += dt * 0.01;
  });

  renderer.render(scene, camera);
}

// --- Init ---
resize();
window.addEventListener('resize', resize);
requestAnimationFrame(animate);
