import * as THREE from 'three';

const activeTrinkets = new WeakMap();

function makeCircleTexture(color = '#ffffff') {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.32, color);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function makeWordTexture(word, darkMode) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 42;
    ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
    const textWidth = Math.ceil(ctx.measureText(word).width);
    canvas.width = Math.max(160, textWidth + 54);
    canvas.height = 82;

    ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = darkMode ? 'rgba(15, 23, 42, 0.62)' : 'rgba(255, 255, 255, 0.70)';
    roundRect(ctx, 3, 8, canvas.width - 6, canvas.height - 16, 30);
    ctx.fill();
    ctx.strokeStyle = darkMode ? 'rgba(147, 197, 253, 0.48)' : 'rgba(37, 99, 235, 0.28)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = darkMode ? 'rgba(226, 232, 240, 0.94)' : 'rgba(30, 41, 59, 0.92)';
    ctx.fillText(word, canvas.width / 2, canvas.height / 2 + 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return { texture, ratio: canvas.width / canvas.height };
}

function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
}

function pickHomeWords(panel) {
    const text = (panel?.innerText || '').replace(/https?:\/\/\S+/g, ' ');
    const stopWords = new Set([
        'hello', 'name', 'high', 'school', 'doing', 'free', 'time', 'links', 'github',
        'linkedin', 'google', 'scholar', 'junior', 'enjoy', 'play', 'doing', 'with'
    ]);
    const seen = new Set();
    const words = [];

    (text.match(/[A-Za-z][A-Za-z'-]{3,}/g) || []).forEach(raw => {
        const normalized = raw.toLowerCase().replace(/'s$/, '');
        if (stopWords.has(normalized) || seen.has(normalized)) return;
        seen.add(normalized);
        words.push(raw.replace(/[^A-Za-z'-]/g, ''));
    });

    return words.slice(0, 9);
}

function initHomeTrinket() {
    const host = document.querySelector('[data-three-home-trinket]');
    if (!host || activeTrinkets.has(host)) return;

    const canvas = host.querySelector('[data-home-trinket-canvas]');
    const panel = host.querySelector('[data-home-copy]');
    if (!canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const darkMode = document.body.classList.contains('dark');
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    camera.position.set(0, 0, 8.4);

    const palette = darkMode
        ? { cyan: '#7dd3fc', blue: '#60a5fa', violet: '#c084fc', amber: '#fbbf24', line: 0x7dd3fc, prism: 0x93c5fd }
        : { cyan: '#0284c7', blue: '#2563eb', violet: '#9333ea', amber: '#f59e0b', line: 0x2563eb, prism: 0x1d4ed8 };

    const shimmerTexture = makeCircleTexture(darkMode ? 'rgba(186, 230, 253, 1)' : 'rgba(37, 99, 235, 1)');

    const particleCount = reducedMotion ? 150 : 340;
    const base = new Float32Array(particleCount * 3);
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const colorChoices = [
        new THREE.Color(palette.cyan),
        new THREE.Color(palette.blue),
        new THREE.Color(palette.violet),
        new THREE.Color(palette.amber)
    ];

    for (let i = 0; i < particleCount; i++) {
        const t = (i / particleCount) * Math.PI * 2 * 5.5;
        const petal = Math.sin(t * 2.0) * 0.35 + Math.cos(t * 0.72) * 0.22;
        const radius = 1.55 + petal + (Math.random() - 0.5) * 0.55;
        const x = Math.cos(t) * radius + Math.sin(t * 0.31) * 0.65;
        const y = Math.sin(t * 0.73) * 1.35 + Math.cos(t * 1.7) * 0.28;
        const z = Math.sin(t * 1.13) * 1.15 + (Math.random() - 0.5) * 0.55;
        base[i * 3] = positions[i * 3] = x;
        base[i * 3 + 1] = positions[i * 3 + 1] = y;
        base[i * 3 + 2] = positions[i * 3 + 2] = z;
        phases[i] = Math.random() * Math.PI * 2;
        speeds[i] = 0.45 + Math.random() * 0.75;
        const color = colorChoices[i % colorChoices.length];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
        size: reducedMotion ? 0.055 : 0.045,
        map: shimmerTexture,
        transparent: true,
        opacity: darkMode ? 0.82 : 0.72,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    }));
    particles.position.x = -1.1;
    scene.add(particles);

    const prism = new THREE.Group();
    const prismGeometry = new THREE.IcosahedronGeometry(1.02, 1);
    const prismMesh = new THREE.Mesh(prismGeometry, new THREE.MeshBasicMaterial({
        color: palette.prism,
        transparent: true,
        opacity: darkMode ? 0.085 : 0.065,
        wireframe: true
    }));
    const knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.78, 0.012, 150, 8, 2, 5),
        new THREE.MeshBasicMaterial({ color: palette.line, transparent: true, opacity: darkMode ? 0.40 : 0.28 })
    );
    prism.add(prismMesh, knot);
    prism.position.set(-1.05, 0.1, 0);
    scene.add(prism);

    const netNodes = 72;
    const linePositions = new Float32Array(netNodes * 2 * 3);
    const netGeometry = new THREE.BufferGeometry();
    netGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const net = new THREE.LineSegments(netGeometry, new THREE.LineBasicMaterial({
        color: palette.line,
        transparent: true,
        opacity: darkMode ? 0.23 : 0.16
    }));
    net.position.x = -1.1;
    scene.add(net);

    const lens = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.012, 10, 80),
        new THREE.MeshBasicMaterial({ color: palette.amber, transparent: true, opacity: 0 })
    );
    scene.add(lens);

    const wordGroup = new THREE.Group();
    const words = pickHomeWords(panel);
    words.forEach((word, index) => {
        const { texture, ratio } = makeWordTexture(word, darkMode);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: darkMode ? 0.80 : 0.76,
            depthWrite: false
        }));
        sprite.scale.set(0.42 * ratio, 0.42, 1);
        sprite.userData = { index };
        wordGroup.add(sprite);
    });
    wordGroup.position.x = 0.15;
    scene.add(wordGroup);

    const pointer = {
        active: false,
        x: 0,
        y: 0,
        world: new THREE.Vector3(1.8, 0.8, 0)
    };
    const ripples = [];
    const clock = new THREE.Clock();
    let frameId = null;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
    }

    function setPointer(event) {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        pointer.world.set(pointer.x * camera.aspect * 4.3, pointer.y * 4.3, 0);
        pointer.active = true;
    }

    function addRipple(origin) {
        ripples.push({ origin: origin.clone(), born: clock.elapsedTime });
        if (ripples.length > 7) ripples.shift();

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.12, 0.008, 8, 70),
            new THREE.MeshBasicMaterial({ color: palette.amber, transparent: true, opacity: 0.62 })
        );
        ring.position.copy(origin);
        ring.userData = { born: clock.elapsedTime, rippleRing: true };
        scene.add(ring);
    }

    function updateNet(time) {
        for (let i = 0; i < netNodes; i++) {
            const a = (i / netNodes) * Math.PI * 2;
            const b = ((i + 9) / netNodes) * Math.PI * 2;
            const ax = Math.cos(a * 2 + time * 0.13) * (1.7 + Math.sin(a * 5) * 0.12);
            const ay = Math.sin(a * 3 - time * 0.09) * 1.25;
            const az = Math.sin(a * 4 + time * 0.1) * 0.9;
            const bx = Math.cos(b * 2 + time * 0.13) * (1.7 + Math.sin(b * 5) * 0.12);
            const by = Math.sin(b * 3 - time * 0.09) * 1.25;
            const bz = Math.sin(b * 4 + time * 0.1) * 0.9;
            const offset = i * 6;
            linePositions[offset] = ax;
            linePositions[offset + 1] = ay;
            linePositions[offset + 2] = az;
            linePositions[offset + 3] = bx;
            linePositions[offset + 4] = by;
            linePositions[offset + 5] = bz;
        }
        netGeometry.attributes.position.needsUpdate = true;
    }

    function animate() {
        const time = clock.getElapsedTime();
        const motion = reducedMotion ? 0.08 : 1;

        for (let i = 0; i < particleCount; i++) {
            const ix = i * 3;
            let x = base[ix] + Math.sin(time * speeds[i] * motion + phases[i]) * 0.08;
            let y = base[ix + 1] + Math.cos(time * (speeds[i] + 0.2) * motion + phases[i]) * 0.08;
            let z = base[ix + 2] + Math.sin(time * 0.5 * motion + phases[i] * 1.7) * 0.06;

            if (pointer.active && !reducedMotion) {
                const dx = x + particles.position.x - pointer.world.x;
                const dy = y - pointer.world.y;
                const distSq = dx * dx + dy * dy + 0.08;
                const influence = Math.min(0.9, 1.0 / distSq) * 0.09;
                x += -dy * influence;
                y += dx * influence;
                z += Math.sin(time * 4 + phases[i]) * influence * 1.3;
            }

            ripples.forEach(ripple => {
                const age = time - ripple.born;
                if (age > 2.4) return;
                const dx = x + particles.position.x - ripple.origin.x;
                const dy = y - ripple.origin.y;
                const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
                const wave = Math.sin(dist * 5.2 - age * 7.6) * Math.exp(-age * 1.55) * Math.exp(-dist * 0.28);
                x += (dx / dist) * wave * 0.12;
                y += (dy / dist) * wave * 0.12;
                z += wave * 0.44;
            });

            positions[ix] = x;
            positions[ix + 1] = y;
            positions[ix + 2] = z;
        }
        particleGeometry.attributes.position.needsUpdate = true;

        prism.rotation.x = time * 0.12 * motion;
        prism.rotation.y = time * 0.18 * motion;
        knot.rotation.z = -time * 0.22 * motion;
        updateNet(time * motion);

        lens.material.opacity += ((pointer.active && !reducedMotion) ? 0.46 : 0) - lens.material.opacity;
        lens.position.lerp(pointer.world, 0.12);
        lens.rotation.z = time * 0.9;
        lens.scale.setScalar(1 + Math.sin(time * 3) * 0.06);

        wordGroup.children.forEach(sprite => {
            const i = sprite.userData.index;
            const angle = time * 0.12 * motion + (i / Math.max(1, wordGroup.children.length)) * Math.PI * 2;
            sprite.position.set(Math.cos(angle) * 3.2, Math.sin(angle * 1.55) * 1.55, Math.sin(angle) * 1.1);
            sprite.material.opacity = (darkMode ? 0.76 : 0.70) + Math.sin(angle + time) * 0.08;
        });

        scene.children.filter(child => child.userData.rippleRing).forEach(ring => {
            const age = time - ring.userData.born;
            ring.scale.setScalar(1 + age * 5.4);
            ring.material.opacity = Math.max(0, 0.56 * (1 - age / 1.2));
            if (age > 1.25) {
                ring.geometry.dispose();
                ring.material.dispose();
                scene.remove(ring);
            }
        });

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('pointermove', setPointer, { passive: true });
    canvas.addEventListener('pointerenter', setPointer, { passive: true });
    canvas.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
    canvas.addEventListener('pointerdown', event => {
        setPointer(event);
        addRipple(pointer.world);
    }, { passive: true });

    resize();
    animate();

    const cleanup = () => {
        if (frameId) cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        window.removeEventListener('resize', resize);
        renderer.dispose();
        shimmerTexture.dispose();
        particleGeometry.dispose();
        prismGeometry.dispose();
        scene.traverse(object => {
            if (object.material) {
                if (object.material.map) object.material.map.dispose();
                object.material.dispose();
            }
            if (object.geometry) object.geometry.dispose();
        });
        activeTrinkets.delete(host);
    };

    activeTrinkets.set(host, cleanup);
}

function cleanupHomeTrinkets() {
    document.querySelectorAll('[data-three-home-trinket]').forEach(host => {
        const cleanup = activeTrinkets.get(host);
        if (cleanup) cleanup();
    });
}

function init() {
    initHomeTrinket();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

document.addEventListener('turbo:load', init);
document.addEventListener('turbo:before-cache', cleanupHomeTrinkets);
