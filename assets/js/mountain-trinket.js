import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const container = document.getElementById("home-mountain-trinket");

if (container) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.82);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(-30, 45, 30);
  scene.add(sun);

  const cursorLight = new THREE.PointLight(0x7dd3fc, 2.25, 95, 1.8);
  cursorLight.position.set(0, 20, 20);
  scene.add(cursorLight);

  const width = 170;
  const depth = 105;
  const columns = 46;
  const rows = 28;
  const vertices = [];
  const indices = [];
  const baseHeights = [];
  const peaks = Array.from({ length: 20 }, () => ({
    x: (Math.random() - 0.5) * width,
    z: (Math.random() - 0.5) * depth,
    radius: 9 + Math.random() * 18,
    height: 5 + Math.random() * 15,
  }));

  function terrainHeight(x, z) {
    let height = 0;

    for (const peak of peaks) {
      const dx = x - peak.x;
      const dz = z - peak.z;
      height += peak.height * Math.exp(-(dx * dx + dz * dz) / (peak.radius * peak.radius));
    }

    height += Math.sin(x * 0.13) * 1.4 + Math.cos(z * 0.16) * 1.8;
    height += Math.sin((x + z) * 0.075) * 1.1;

    const horizonBoost = THREE.MathUtils.smoothstep(-z, -depth * 0.45, depth * 0.5) * 5;
    const edgeFalloff = THREE.MathUtils.smoothstep(width * 0.5, width * 0.28, Math.abs(x));

    return Math.max(0, height + horizonBoost) * (0.55 + edgeFalloff * 0.45);
  }

  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= columns; col += 1) {
      const x = (col / columns - 0.5) * width;
      const z = (row / rows - 0.5) * depth;
      const y = terrainHeight(x, z);
      vertices.push(x, y, z);
      baseHeights.push(y);
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const a = row * (columns + 1) + col;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;

      if ((row + col) % 2 === 0) {
        indices.push(a, c, d, a, d, b);
      } else {
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const terrainGeometry = new THREE.BufferGeometry();
  terrainGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  terrainGeometry.setIndex(indices);
  terrainGeometry.computeVertexNormals();

  const fillMaterial = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x082f49,
    emissiveIntensity: 0.08,
    flatShading: true,
    metalness: 0.06,
    roughness: 0.78,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
  });

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x0f766e,
    transparent: true,
    opacity: 0.22,
    wireframe: true,
  });

  const terrain = new THREE.Mesh(terrainGeometry, fillMaterial);
  const wireframe = new THREE.Mesh(terrainGeometry, wireMaterial);
  scene.add(terrain, wireframe);

  const mouse = new THREE.Vector2(0, 0);
  const targetMouse = new THREE.Vector2(0, 0);
  const lookTarget = new THREE.Vector3(0, 4, -5);
  const cameraTarget = new THREE.Vector3();

  function isDarkTheme() {
    return document.body.classList.contains("dark");
  }

  function applyThemeColors() {
    if (isDarkTheme()) {
      fillMaterial.color.set(0x38bdf8);
      fillMaterial.emissive.set(0x0f172a);
      fillMaterial.opacity = 0.36;
      wireMaterial.color.set(0xa78bfa);
      wireMaterial.opacity = 0.28;
      cursorLight.color.set(0xc084fc);
      ambient.intensity = 0.66;
      sun.intensity = 1.45;
    } else {
      fillMaterial.color.set(0x14b8a6);
      fillMaterial.emissive.set(0xecfeff);
      fillMaterial.opacity = 0.34;
      wireMaterial.color.set(0x0284c7);
      wireMaterial.opacity = 0.2;
      cursorLight.color.set(0x22d3ee);
      ambient.intensity = 0.95;
      sun.intensity = 1.05;
    }
  }

  function handlePointerMove(event) {
    const xPercent = (event.clientX / window.innerWidth) * 100;
    const yPercent = (event.clientY / window.innerHeight) * 100;

    targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    container.style.setProperty("--mountain-glow-x", `${xPercent}%`);
    container.style.setProperty("--mountain-glow-y", `${yPercent}%`);
  }

  function handlePointerLeave() {
    targetMouse.set(0, 0);
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const nextWidth = Math.max(1, rect.width || window.innerWidth);
    const nextHeight = Math.max(1, rect.height || window.innerHeight);

    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(nextWidth, nextHeight, false);
  }

  const themeObserver = new MutationObserver(applyThemeColors);
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  window.addEventListener("resize", resize);

  let animationId;
  let lastGeometryUpdate = 0;
  const positions = terrainGeometry.attributes.position;

  function animate(time = 0) {
    mouse.lerp(targetMouse, 0.055);

    const livelyMotion = !prefersReducedMotion.matches;
    const waveTime = livelyMotion ? time * 0.001 : 0;
    const cursorX = mouse.x * width * 0.33;
    const cursorZ = -mouse.y * depth * 0.22;

    if (time - lastGeometryUpdate > 33 || !livelyMotion) {
      for (let index = 0; index < baseHeights.length; index += 1) {
        const x = positions.getX(index);
        const z = positions.getZ(index);
        const dx = x - cursorX;
        const dz = z - cursorZ;
        const cursorBump = Math.exp(-(dx * dx + dz * dz) / 620) * 3.3;
        const shimmer = livelyMotion ? Math.sin(waveTime * 0.9 + x * 0.09 + z * 0.12) * 0.34 : 0;
        positions.setY(index, baseHeights[index] + cursorBump + shimmer);
      }

      positions.needsUpdate = true;
      terrainGeometry.computeVertexNormals();
      lastGeometryUpdate = time;
    }

    terrain.rotation.y = mouse.x * 0.07;
    wireframe.rotation.copy(terrain.rotation);

    cameraTarget.set(mouse.x * 11, 31 + mouse.y * 5, 78 - Math.abs(mouse.x) * 4);
    camera.position.lerp(cameraTarget, 0.05);
    lookTarget.set(mouse.x * 8, 5 + mouse.y * 3, -8);
    camera.lookAt(lookTarget);

    cursorLight.position.set(cursorX, 23 + mouse.y * 7, cursorZ + 12);
    renderer.render(scene, camera);

    if (livelyMotion) {
      animationId = window.requestAnimationFrame(animate);
    }
  }

  function start() {
    resize();
    applyThemeColors();
    camera.position.set(0, 31, 78);
    animate();
  }

  start();

  prefersReducedMotion.addEventListener?.("change", () => {
    window.cancelAnimationFrame(animationId);
    animationId = window.requestAnimationFrame(animate);
  });
}
