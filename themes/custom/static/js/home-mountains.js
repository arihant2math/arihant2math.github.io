import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js";

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let cleanup = null;

function createMountains() {
  const terrainGeometry = new THREE.PlaneGeometry(140, 90, 44, 26);
  const vertices = terrainGeometry.attributes.position;

  for (let i = 0; i < vertices.count; i += 1) {
    const x = vertices.getX(i);
    const y = vertices.getY(i);
    const distanceFade = (y + 45) / 90;
    const ridge = Math.sin(x * 0.14) * 1.9 + Math.cos((x + y) * 0.08) * 1.2;
    const randomLift = (Math.random() - 0.5) * (2.5 + (1 - distanceFade) * 5.5);
    const elevation = ridge + randomLift - distanceFade * 7;
    vertices.setZ(i, elevation);
  }

  terrainGeometry.computeVertexNormals();
  terrainGeometry.rotateX(-Math.PI * 0.42);
  terrainGeometry.translate(0, -7, -12);

  const terrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x355f8a,
    flatShading: true,
    roughness: 0.92,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });

  const wireGeometry = terrainGeometry.clone();
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });

  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  const wire = new THREE.Mesh(wireGeometry, wireMaterial);
  wire.position.y += 0.03;

  return { terrain, wire, terrainGeometry, wireGeometry, terrainMaterial, wireMaterial };
}

function initMountains() {
  const canvas = document.getElementById("home-mountains-canvas");
  if (!canvas || canvas.dataset.initialized === "true" || reducedMotionQuery.matches) {
    return;
  }

  canvas.dataset.initialized = "true";

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    canvas.dataset.initialized = "false";
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0f172a, 16, 78);

  const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 14, 34);
  camera.lookAt(0, -1, -10);

  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xcce7ff, 1.2);
  keyLight.position.set(25, 24, 15);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.55);
  fillLight.position.set(-30, 10, -18);
  scene.add(fillLight);

  const mountainGroup = new THREE.Group();
  const { terrain, wire, terrainGeometry, wireGeometry, terrainMaterial, wireMaterial } = createMountains();
  mountainGroup.add(terrain);
  mountainGroup.add(wire);
  scene.add(mountainGroup);

  const pointerTarget = new THREE.Vector2(0, 0);
  const pointerSmooth = new THREE.Vector2(0, 0);

  const onPointerMove = (event) => {
    pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
  };

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", onResize);

  let frame = 0;
  const clock = new THREE.Clock();

  const animate = () => {
    const elapsed = clock.getElapsedTime();
    pointerSmooth.lerp(pointerTarget, 0.05);

    camera.position.x = pointerSmooth.x * 3.4;
    camera.position.y = 14 + pointerSmooth.y * 2.1;
    camera.lookAt(pointerSmooth.x * 2.5, -1 + pointerSmooth.y * 0.8, -10);

    mountainGroup.rotation.y = pointerSmooth.x * 0.12;
    mountainGroup.position.z = Math.sin(elapsed * 0.28) * 0.6;

    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };

  animate();

  cleanup = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("resize", onResize);

    terrainGeometry.dispose();
    wireGeometry.dispose();
    terrainMaterial.dispose();
    wireMaterial.dispose();
    renderer.dispose();

    canvas.dataset.initialized = "false";
  };
}

function teardownMountains() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}

if (typeof reducedMotionQuery.addEventListener === "function") {
  reducedMotionQuery.addEventListener("change", (event) => {
    if (event.matches) {
      teardownMountains();
    } else {
      initMountains();
    }
  });
}

document.addEventListener("DOMContentLoaded", initMountains);
document.addEventListener("turbo:load", initMountains);
document.addEventListener("turbo:before-cache", teardownMountains);
window.addEventListener("pagehide", teardownMountains);

initMountains();
