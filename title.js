
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function initTitleScreen(root = document) {
  const screen = root.querySelector("#title-screen");
  const background = root.querySelector("#space-background");
  const title = root.querySelector("#game-title");
  const buttonRow = root.querySelector("#title-buttons");
  const newGameButton = root.querySelector("#new-game-button");
  const loadGameButton = root.querySelector("#load-game-button");
  const loadGamePanel = root.querySelector("#load-game-panel");

  if (!screen || !background || !title || !buttonRow) {
    throw new Error("Title screen elements are missing.");
  }

  // --------------------------------------------------
  // Renderer
  // --------------------------------------------------

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040a);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 1.75)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  background.appendChild(renderer.domElement);

  // --------------------------------------------------
  // Lighting
  // --------------------------------------------------

  const ambientLight = new THREE.AmbientLight(
    0x52617f,
    1.1
  );

  scene.add(ambientLight);

  const sunLight = new THREE.PointLight(
    0xffb65c,
    180,
    100,
    1.5
  );

  sunLight.position.set(-6, 0, 1);
  scene.add(sunLight);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const textureLoader = new THREE.TextureLoader();

  function loadTexture(url, onLoad) {
    textureLoader.load(
      url,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        onLoad(texture);
      },
      undefined,
      error => {
        console.warn("Texture could not be loaded:", url, error);
      }
    );
  }

  function makeSphere(radius, material, position) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 48),
      material
    );

    mesh.position.set(...position);
    scene.add(mesh);

    return mesh;
  }

  // --------------------------------------------------
  // Starfield
  // --------------------------------------------------

  const starCount = 6500;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    // Distribute stars throughout a large spherical volume.
    const radius = 45 + Math.random() * 110;
    const theta = Math.random() * Math.PI * 2;
    const z = Math.random() * 2 - 1;
    const planar = Math.sqrt(1 - z * z);

    starPositions[i * 3] =
      radius * planar * Math.cos(theta);

    starPositions[i * 3 + 1] =
      radius * z;

    starPositions[i * 3 + 2] =
      radius * planar * Math.sin(theta);

    const brightness = 0.55 + Math.random() * 0.45;

    // Mostly white, with occasional cool blue stars.
    const blueStar = Math.random() > 0.84;

    starColors[i * 3] =
      brightness * (blueStar ? 0.65 : 1);

    starColors[i * 3 + 1] =
      brightness * (blueStar ? 0.82 : 1);

    starColors[i * 3 + 2] = brightness;
  }

  const starGeometry = new THREE.BufferGeometry();

  starGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(starPositions, 3)
  );

  starGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(starColors, 3)
  );

  const starMaterial = new THREE.PointsMaterial({
    size: 0.12,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });

  const stars = new THREE.Points(
    starGeometry,
    starMaterial
  );

  scene.add(stars);

  // --------------------------------------------------
  // Sun
  // --------------------------------------------------

  const sunPosition = [-6, 0, 0];

  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffbd55
  });

  const sun = makeSphere(
    3.0,
    sunMaterial,
    sunPosition
  );

  // Animated surface detail using a second transparent sphere.
  const sunAura = makeSphere(
    3.18,
    new THREE.MeshBasicMaterial({
      color: 0xff8a2a,
      transparent: true,
      opacity: 0.13,
      side: THREE.BackSide,
      depthWrite: false
    }),
    sunPosition
  );

  const sunOuterGlow = makeSphere(
    3.65,
    new THREE.MeshBasicMaterial({
      color: 0xff671f,
      transparent: true,
      opacity: 0.055,
      side: THREE.BackSide,
      depthWrite: false
    }),
    sunPosition
  );

  // --------------------------------------------------
  // Earth
  // --------------------------------------------------

  const earthPosition = [4.5, 0, 0];
  const earthRadius = 2.05;

  const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0
  });

  const earth = makeSphere(
    earthRadius,
    earthMaterial,
    earthPosition
  );

  const earthGroup = new THREE.Group();
  earthGroup.position.set(...earthPosition);
  scene.add(earthGroup);

  // Atmospheric halo.
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      earthRadius * 1.045,
      64,
      48
    ),
    new THREE.MeshBasicMaterial({
      color: 0x4b9fff,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      depthWrite: false
    })
  );

  earthGroup.add(atmosphere);

  // A slightly larger, subtle outer atmospheric glow.
  const outerAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      earthRadius * 1.12,
      64,
      48
    ),
    new THREE.MeshBasicMaterial({
      color: 0x216eff,
      transparent: true,
      opacity: 0.045,
      side: THREE.BackSide,
      depthWrite: false
    })
  );

  earthGroup.add(outerAtmosphere);

  // Public planet textures from the Three.js examples repository.
  const textureBase =
    "https://threejs.org/examples/textures/planets/";

  loadTexture(
    textureBase + "earth_atmos_2048.jpg",
    texture => {
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
    }
  );

  // --------------------------------------------------
  // Additional planets
  // --------------------------------------------------

  const mars = makeSphere(
    0.46,
    new THREE.MeshStandardMaterial({
      color: 0xb65c38,
      roughness: 1
    }),
    [-1.5, 1.7, -2.2]
  );

  const jupiter = makeSphere(
    0.85,
    new THREE.MeshStandardMaterial({
      color: 0xc6a77b,
      roughness: 1
    }),
    [0.4, 3.5, -5]
  );

  const moon = makeSphere(
    0.35,
    new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 1
    }),
    [6.8, 0.2, -1.5]
  );

  // --------------------------------------------------
  // Orbital paths
  // --------------------------------------------------

  function createOrbit(radius, color, opacity) {
    const points = [];
    const segments = 180;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        )
      );
    }

    const geometry = new THREE.BufferGeometry()
      .setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity
    });

    const orbit = new THREE.LineLoop(
      geometry,
      material
    );

    orbit.rotation.x = Math.PI / 2.3;
    orbit.position.set(0, -0.2, -3);
    scene.add(orbit);

    return orbit;
  }

  const orbit1 = createOrbit(5.1, 0x91a8cc, 0.16);
  const orbit2 = createOrbit(8.5, 0x91a8cc, 0.10);
  const orbit3 = createOrbit(12.0, 0x91a8cc, 0.07);

  // --------------------------------------------------
  // Camera framing
  // --------------------------------------------------

  const lookTarget = new THREE.Vector3(0, 0, 0);
  let cameraAngle = 0;

  function updateCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    // Pull back on narrow screens to keep the Sun and Earth visible.
    const distance =
      aspect < 0.8 ? 28 :
      aspect < 1.15 ? 23 :
      19;

    camera.position.set(
      Math.sin(cameraAngle) * 1.15,
      Math.sin(cameraAngle * 0.65) * 0.45,
      distance
    );

    camera.lookAt(lookTarget);
    camera.fov = aspect < 0.8 ? 55 : 45;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }

  updateCamera();

  // --------------------------------------------------
  // Match button row to title width
  // --------------------------------------------------

  function updateMenuWidth() {
    // Measure after fonts and layout have settled.
    const titleWidth = title.getBoundingClientRect().width;
    const availableWidth = window.innerWidth - 28;

    const width = Math.min(titleWidth, availableWidth);

    buttonRow.style.width = `${width}px`;
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(updateMenuWidth);
  }

  updateMenuWidth();

  // --------------------------------------------------
  // Menu interactions
  // --------------------------------------------------

  function onNewGame() {
    // The actual game-start flow will be implemented later.
    screen.dispatchEvent(
      new CustomEvent("rustbucket:newgame", {
        bubbles: true
      })
    );

    console.info("Rustbucket: New Game selected.");
  }

  function onLoadGame() {
    const isExpanded =
      loadGameButton.getAttribute("aria-expanded") === "true";

    loadGameButton.setAttribute(
      "aria-expanded",
      String(!isExpanded)
    );

    loadGamePanel.hidden = isExpanded;
  }

  newGameButton.addEventListener("click", onNewGame);
  loadGameButton.addEventListener("click", onLoadGame);

  // --------------------------------------------------
  // Resize
  // --------------------------------------------------

  function onResize() {
    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.75)
    );

    updateCamera();
    updateMenuWidth();
  }

  window.addEventListener("resize", onResize);

  // --------------------------------------------------
  // Animation loop
  // --------------------------------------------------

  const clock = new THREE.Clock();
  let animationFrame = 0;
  let disposed = false;

  function animate() {
    if (disposed) return;

    animationFrame = requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    // Slow, continuous camera orbit.
    cameraAngle += delta * 0.012;
    updateCamera();

    // Gentle planetary rotation.
    earth.rotation.y += delta * 0.035;
    mars.rotation.y += delta * 0.02;
    jupiter.rotation.y += delta * 0.012;

    // Subtle glow variation.
    sunAura.material.opacity =
      0.11 + Math.sin(elapsed * 0.7) * 0.025;

    sunOuterGlow.material.opacity =
      0.05 + Math.sin(elapsed * 0.45) * 0.012;

    stars.rotation.y += delta * 0.0008;

    renderer.render(scene, camera);
  }

  animate();

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------

  function destroy() {
    if (disposed) return;
    disposed = true;

    cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", onResize);

    newGameButton.removeEventListener("click", onNewGame);
    loadGameButton.removeEventListener("click", onLoadGame);

    scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();

      if (object.material) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value?.isTexture) value.dispose();
          }

          material.dispose();
        }
      }
    });

    renderer.dispose();
    renderer.domElement.remove();
  }

  return { scene, camera, renderer, destroy };
}
