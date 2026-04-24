import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js";

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const mountainPalettes = {
  light: {
    terrain: 0x9bd7f0,
    terrainOpacity: 0.74,
    wire: 0x38bdf8,
    wireOpacity: 0.32,
    fog: 0xe0f7ff,
    ambient: 0xffffff,
    ambientIntensity: 0.62,
    key: 0xdff6ff,
    keyIntensity: 1.45,
    fill: 0x60a5fa,
    fillIntensity: 0.5,
  },
  dark: {
    terrain: 0x355f8a,
    terrainOpacity: 0.85,
    wire: 0x7dd3fc,
    wireOpacity: 0.25,
    fog: 0x0f172a,
    ambient: 0xffffff,
    ambientIntensity: 0.45,
    key: 0xcce7ff,
    keyIntensity: 1.2,
    fill: 0x7dd3fc,
    fillIntensity: 0.55,
  },
};
let cleanup = null;

function getMountainPalette() {
  return document.body.classList.contains("dark") ? mountainPalettes.dark : mountainPalettes.light;
}

function applyMountainPalette({ scene, terrainMaterial, wireMaterial, ambient, keyLight, fillLight }) {
  const palette = getMountainPalette();

  scene.fog.color.setHex(palette.fog);
  terrainMaterial.color.setHex(palette.terrain);
  terrainMaterial.opacity = palette.terrainOpacity;
  wireMaterial.color.setHex(palette.wire);
  wireMaterial.opacity = palette.wireOpacity;
  ambient.color.setHex(palette.ambient);
  ambient.intensity = palette.ambientIntensity;
  keyLight.color.setHex(palette.key);
  keyLight.intensity = palette.keyIntensity;
  fillLight.color.setHex(palette.fill);
  fillLight.intensity = palette.fillIntensity;
}

function createMountains(palette) {
  const terrainGeometry = new THREE.PlaneGeometry(280, 180, 44, 26);
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
    color: palette.terrain,
    flatShading: true,
    roughness: 0.92,
    metalness: 0.05,
    transparent: true,
    opacity: palette.terrainOpacity,
  });

  const wireGeometry = terrainGeometry.clone();
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: palette.wire,
    wireframe: true,
    transparent: true,
    opacity: palette.wireOpacity,
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

  const palette = getMountainPalette();
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(palette.fog, 16, 78);

  const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 19, 25);
  camera.lookAt(0, -1, -10);

  const ambient = new THREE.AmbientLight(palette.ambient, palette.ambientIntensity);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(palette.key, palette.keyIntensity);
  keyLight.position.set(25, 24, 15);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(palette.fill, palette.fillIntensity);
  fillLight.position.set(-30, 10, -18);
  scene.add(fillLight);

  const mountainGroup = new THREE.Group();
  const { terrain, wire, terrainGeometry, wireGeometry, terrainMaterial, wireMaterial } = createMountains(palette);
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

  const themeObserver = new MutationObserver(() => {
    applyMountainPalette({ scene, terrainMaterial, wireMaterial, ambient, keyLight, fillLight });
  });

  themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

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
    themeObserver.disconnect();

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
