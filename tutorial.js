import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function initTutorialScreen(root = document) {
  const screen = root.querySelector("#tutorial-screen");
  const background = root.querySelector("#tutorial-scene");
  const blackout = root.querySelector("#tutorial-blackout");
  const loading = root.querySelector("#tutorial-loading");

  if (!screen || !background || !blackout) {
    throw new Error("Tutorial screen elements are missing.");
  }

  // --------------------------------------------------
  // State
  // --------------------------------------------------

  let disposed = false;
  let animationFrame = 0;
  let fadingIn = false;
  let fadeStart = 0;
  const fadeDuration = 5.5;

  // --------------------------------------------------
  // Scene and renderer
  // --------------------------------------------------

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x78b9f5);
  scene.fog = new THREE.Fog(0xa6cbed, 35, 85);

  const camera = new THREE.PerspectiveCamera(
    43,
    window.innerWidth / window.innerHeight,
    0.1,
    150
  );

  // Exterior-facing view into the storage unit.
  camera.position.set(0, 5.3, 18.5);
  camera.lookAt(0, 3.3, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 1.5)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  background.appendChild(renderer.domElement);

  // --------------------------------------------------
  // Materials
  // --------------------------------------------------

  function standardMaterial(color, roughness = 0.9, extra = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.05,
      ...extra
    });
  }

  const concrete = standardMaterial(0x51545a);
  const wallMaterial = standardMaterial(0x464b46);
  const darkWallMaterial = standardMaterial(0x202731);
  const roofMaterial = standardMaterial(0x151923);
  const metalMaterial = standardMaterial(0x323b46, 0.65);
  const trimMaterial = standardMaterial(0x171b21, 0.65);
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x7c9a99,
    emissive: 0x233e42,
    emissiveIntensity: 0.3,
    roughness: 0.45,
    metalness: 0.1
  });

  // --------------------------------------------------
  // Geometry helpers
  // --------------------------------------------------

  function addBox(
    width,
    height,
    depth,
    material,
    x,
    y,
    z,
    parent = scene
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);

    return mesh;
  }

  function addBeam(
    start,
    end,
    thickness,
    material,
    parent = scene
  ) {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(b, a);

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        thickness,
        direction.length(),
        thickness
      ),
      material
    );

    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);

    return mesh;
  }

  function addCylinderBetween(
    start,
    end,
    radius,
    material,
    parent
  ) {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(b, a);

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius,
        radius,
        direction.length(),
        8
      ),
      material
    );

    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);

    return mesh;
  }

  // --------------------------------------------------
  // Lighting
  // --------------------------------------------------

  // Bright blue sky and warm reflected light.
  scene.add(
    new THREE.HemisphereLight(
      0xb8dcff,
      0x5a5040,
      2.0
    )
  );

  // Warm afternoon sunlight entering the garage.
  const sunlight = new THREE.DirectionalLight(
    0xffd39a,
    3.0
  );

  sunlight.position.set(-12, 14, 12);
  scene.add(sunlight);

  // Soft fill light inside the storage unit.
  const ceilingLight = new THREE.PointLight(
    0xffe5c2,
    65,
    38,
    1.5
  );

  ceilingLight.position.set(0, 10, -3);
  scene.add(ceilingLight);

  // Cool daylight entering from the entrance.
  const frontFill = new THREE.DirectionalLight(
    0x9bcfff,
    2.0
  );

  frontFill.position.set(0, 8, 18);
  scene.add(frontFill);

  // Warm bounce light on the right wall.
  const sideLight = new THREE.PointLight(
    0xffc681,
    30,
    24,
    2
  );

  sideLight.position.set(8, 5, 2);
  scene.add(sideLight);

  // --------------------------------------------------
  // Storage unit architecture
  // --------------------------------------------------

  // Floor.
  addBox(
    34, 0.35, 32,
    concrete,
    0, -0.2, -1
  );

  // Darker concrete surface layer.
  addBox(
    33.8, 0.04, 31.8,
    standardMaterial(0x5c5f64),
    0, -0.015, -1
  );

  // Back wall.
  addBox(
    34, 12, 0.6,
    wallMaterial,
    0, 5.8, -16
  );

  // Side walls.
  addBox(
    0.6, 12, 31,
    darkWallMaterial,
    -17, 5.8, -0.5
  );

  addBox(
    0.6, 12, 31,
    darkWallMaterial,
    17, 5.8, -0.5
  );

  // Roof and ceiling beams.
  addBox(
    34, 0.45, 32,
    roofMaterial,
    0, 11.9, -1
  );

  for (let z = -14; z <= 10; z += 6) {
    addBeam(
      [-16.5, 11.3, z],
      [16.5, 11.3, z],
      0.22,
      metalMaterial
    );
  }

  // Front structural pillars.
  addBox(
    0.65, 11.5, 0.75,
    trimMaterial,
    -16.3, 5.65, 14.2
  );

  addBox(
    0.65, 11.5, 0.75,
    trimMaterial,
    16.3, 5.65, 14.2
  );

  // Upper wall above the large entrance.
  addBox(
    25.5, 3.1, 0.55,
    darkWallMaterial,
    0, 10.05, 14.2
  );

  // Side portions of the front facade.
  addBox(
    4.2, 7.8, 0.55,
    wallMaterial,
    -14.2, 4.1, 14.2
  );

  addBox(
    4.2, 7.8, 0.55,
    wallMaterial,
    14.2, 4.1, 14.2
  );

  // High windows on the back wall.
  for (let x = -12; x <= 12; x += 6) {
    addBox(
      3.4, 1.55, 0.08,
      windowMaterial,
      x, 8.9, -15.65
    );

    for (let dx = -1; dx <= 1; dx++) {
      addBox(
        0.055, 1.65, 0.1,
        trimMaterial,
        x + dx * 1.05, 8.9, -15.55
      );
    }

    addBox(
      3.5, 0.06, 0.1,
      trimMaterial,
      x, 8.9, -15.55
    );
  }

  // Long side-wall windows.
  for (let z = -10; z <= 8; z += 4) {
    addBox(
      0.08, 1.5, 3.2,
      windowMaterial,
      -16.65, 8.6, z
    );
  }

  // Industrial wall supports.
  for (let z = -14; z <= 10; z += 4) {
    addBox(
      0.18, 10.8, 0.2,
      trimMaterial,
      -16.6, 5.5, z
    );

    addBox(
      0.18, 10.8, 0.2,
      trimMaterial,
      16.6, 5.5, z
    );
  }

  // Floor seams.
  const floorLineMaterial = standardMaterial(
    0x292e35,
    1
  );

  for (let z = -13; z <= 13; z += 4) {
    addBox(
      33, 0.012, 0.025,
      floorLineMaterial,
      0, 0.012, z
    );
  }

  for (let x = -14; x <= 14; x += 5) {
    addBox(
      0.025, 0.012, 29,
      floorLineMaterial,
      x, 0.013, -1
    );
  }

  // --------------------------------------------------
  // Rustbucket spacecraft
  // --------------------------------------------------

  const ship = new THREE.Group();
  scene.add(ship);

  // Overall proportions:
  // Long central fuselage, broad swept wings, raised tail.
  // The spacecraft is assembled from meshes rather than
  // using a 2D image or an external model.

  const cream = standardMaterial(0xd5cda7, 0.68);
  const paleCream = standardMaterial(0xe2dbb9, 0.72);
  const orange = standardMaterial(0xc76b36, 0.7);
  const orangeDark = standardMaterial(0x713d2d, 0.7);
  const stripeMaterial = standardMaterial(0xb85c37, 0.7);
  const blueGray = standardMaterial(0x657789, 0.55);
  const glass = new THREE.MeshStandardMaterial({
    color: 0x46616c,
    roughness: 0.25,
    metalness: 0.3
  });

  // The ship's long axis follows the Z axis.
  // Nose points toward the front of the garage (+Z).
  ship.position.set(0, 2.0, 0);
  ship.rotation.y = 0;

  // Main fuselage.
  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(
      1.15, 0.75, 10.5, 10, 1, false
    ),
    cream
  );

  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.set(0, 0, 0);
  fuselage.scale.set(1, 1, 1);
  fuselage.castShadow = true;
  fuselage.receiveShadow = true;
  ship.add(fuselage);

  // Nose cone.
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(1.12, 2.6, 10),
    paleCream
  );

  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0, 6.0);
  nose.scale.set(1, 1, 1);
  nose.castShadow = true;
  ship.add(nose);

  // Nose band.
  const noseBand = new THREE.Mesh(
    new THREE.CylinderGeometry(
      1.08, 1.05, 0.32, 10
    ),
    orange
  );

  noseBand.rotation.x = Math.PI / 2;
  noseBand.position.set(0, 0, 5.0);
  ship.add(noseBand);

  // Rear fuselage collar.
  const rearBand = new THREE.Mesh(
    new THREE.CylinderGeometry(
      1.17, 1.05, 1.15, 10
    ),
    blueGray
  );

  rearBand.rotation.x = Math.PI / 2;
  rearBand.position.set(0, 0, -3.5);
  ship.add(rearBand);

  // Engine housing.
  const engineHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(
      1.15, 1.4, 2.0, 10
    ),
    blueGray
  );

  engineHousing.rotation.x = Math.PI / 2;
  engineHousing.position.set(0, -0.15, -4.5);
  ship.add(engineHousing);

  // Engine exhausts.
  for (const x of [-0.72, 0.72]) {
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.4, 0.48, 0.65, 10
      ),
      orangeDark
    );

    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(x, -0.22, -5.45);
    ship.add(exhaust);

    const exhaustInterior = new THREE.Mesh(
      new THREE.CircleGeometry(0.29, 12),
      trimMaterial
    );

    exhaustInterior.position.set(x, -0.22, -5.79);
    ship.add(exhaustInterior);
  }

  // Cockpit windows, arranged along the upper forward
  // fuselage to suggest the reference aircraft glazing.
  for (let i = 0; i < 5; i++) {
    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.57, 0.075),
      glass
    );

    pane.position.set(
      -0.77 + i * 0.38,
      0.68,
      3.15 - i * 0.33
    );

    pane.rotation.x = -0.12;
    ship.add(pane);
  }

  // Cockpit front glazing.
  const frontGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.55, 0.12),
    glass
  );

  frontGlass.position.set(0, 0.77, 4.35);
  frontGlass.rotation.x = -0.2;
  ship.add(frontGlass);

  // Broad swept wings, built from tapered extruded shapes.
  function addWing(side) {
    const shape = new THREE.Shape();

    shape.moveTo(0.7, 2.7);
    shape.lineTo(5.9, 4.6);
    shape.lineTo(8.4, 2.0);
    shape.lineTo(3.1, -2.0);
    shape.lineTo(0.8, -3.2);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08
    });

    const wing = new THREE.Mesh(
      geometry,
      cream
    );

    wing.rotation.x = -Math.PI / 2;
    wing.scale.x = side;
    wing.position.set(0, -0.25, -0.05);
    wing.castShadow = true;
    wing.receiveShadow = true;
    ship.add(wing);

    // Orange tips.
    const tip = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.27, 1.9),
      orange
    );

    tip.position.set(side * 7.2, -0.27, 2.5);
    tip.rotation.y = side * -0.28;
    ship.add(tip);

    // Orange stripe on each wing.
    const stripeShape = new THREE.Shape();

    stripeShape.moveTo(1.25, 2.7);
    stripeShape.lineTo(5.9, 4.35);
    stripeShape.lineTo(6.45, 3.8);
    stripeShape.lineTo(2.0, 2.0);
    stripeShape.closePath();

    const stripeGeometry = new THREE.ExtrudeGeometry(
      stripeShape,
      {
        depth: 0.025,
        bevelEnabled: false
      }
    );

    const stripe = new THREE.Mesh(
      stripeGeometry,
      stripeMaterial
    );

    stripe.rotation.x = -Math.PI / 2;
    stripe.scale.x = side;
    stripe.position.set(0, -0.105, 0);
    ship.add(stripe);
  }

  addWing(1);
  addWing(-1);

  // Tail fins.
  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 1.45, 2.5),
      paleCream
    );

    fin.position.set(side * 1.0, 0.9, -4.1);
    fin.rotation.z = side * -0.38;
    fin.rotation.y = side * 0.12;
    fin.castShadow = true;
    ship.add(fin);

    const finStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.12, 2.25),
      orange
    );

    finStripe.position.set(
      side * 1.04, 1.15, -4.1
    );

    finStripe.rotation.z = side * -0.38;
    ship.add(finStripe);
  }

  // Small dorsal fin.
  const dorsalFin = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.85, 2.0),
    cream
  );

  dorsalFin.position.set(0, 0.92, -4.05);
  ship.add(dorsalFin);

  // Orange fuselage stripe.
  const topStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.035, 7.2),
    stripeMaterial
  );

  topStripe.position.set(0, 1.0, -0.1);
  ship.add(topStripe);

  // Side panels on the fuselage.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.52, 0.95),
        blueGray
      );

      panel.position.set(
        side * 1.04,
        -0.02,
        0.7 - i * 1.05
      );

      ship.add(panel);
    }
  }

  // Wing-mounted engine pods.
  for (const side of [-1, 1]) {
    const pod = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.43, 0.55, 2.5, 10
      ),
      blueGray
    );

    pod.rotation.x = Math.PI / 2;
    pod.position.set(side * 3.0, -0.48, -0.25);
    pod.castShadow = true;
    ship.add(pod);

    const podIntake = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.32, 0.32, 0.12, 10
      ),
      orange
    );

    podIntake.rotation.x = Math.PI / 2;
    podIntake.position.set(side * 3.0, -0.48, 1.02);
    ship.add(podIntake);
  }

  // Landing gear: supports the spacecraft above the floor.
  for (const side of [-1, 1]) {
    addCylinderBetween(
      [side * 0.75, -0.65, 1.0],
      [side * 0.95, -1.75, 1.3],
      0.11,
      metalMaterial,
      ship
    );

    addCylinderBetween(
      [side * 0.75, -0.65, -2.3],
      [side * 0.95, -1.75, -2.5],
      0.11,
      metalMaterial,
      ship
    );
  }

  // --------------------------------------------------
  // Grounding shadow
  // --------------------------------------------------

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(7.8, 48),
    new THREE.MeshBasicMaterial({
      color: 0x080a0e,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    })
  );

  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.025, 0);
  shadow.scale.set(1.35, 0.68, 1);
  scene.add(shadow);

  // --------------------------------------------------
  // Dialogue audio and reveal
  // --------------------------------------------------

  const dialogue = new Audio("./soundtrack/final-dialogue.mp3");

  dialogue.preload = "auto";
  dialogue.loop = false;
  dialogue.volume = 1;

  let audioStarted = false;

  function beginFadeIn() {
    if (disposed || fadingIn) return;

    fadingIn = true;
    fadeStart = performance.now();

    if (loading) {
      loading.classList.add("loading-hidden");
    }

    blackout.classList.add("fade-in");
  }

  function startDialogue() {
    if (audioStarted || disposed) return;

    audioStarted = true;

    dialogue.play().then(() => {
      // Keep the screen black for the full dialogue.
    }).catch(error => {
      console.warn(
        "Dialogue playback failed. Waiting for user interaction:",
        error
      );

      // Do not leave the player on a permanent black screen
      // if the audio file is missing or playback is blocked.
      beginFadeIn();
    });
  }

  dialogue.addEventListener("ended", beginFadeIn);

  // The New Game button click normally grants audio permission.
  // If playback is still blocked, wait for a further user gesture.
  startDialogue();

  function retryAudio() {
    if (!audioStarted || disposed) return;

    if (dialogue.paused && !fadingIn) {
      dialogue.play().catch(() => {});
    }

    document.removeEventListener("pointerdown", retryAudio);
    document.removeEventListener("keydown", retryAudio);
  }

  document.addEventListener("pointerdown", retryAudio);
  document.addEventListener("keydown", retryAudio);

  // --------------------------------------------------
  // Responsive layout
  // --------------------------------------------------

  function onResize() {
    if (disposed) return;

    camera.aspect = window.innerWidth / window.innerHeight;

    // Keep the craft and wings visible on portrait screens.
    camera.fov = camera.aspect < 0.8 ? 53 : 43;

    camera.position.set(
      0,
      camera.aspect < 0.8 ? 6.8 : 5.3,
      camera.aspect < 0.8 ? 23.5 : 18.5
    );

    camera.lookAt(0, 3.3, 0);
    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    );
  }

  window.addEventListener("resize", onResize);

  // --------------------------------------------------
  // Render loop
  // --------------------------------------------------

  function animate(now) {
    if (disposed) return;

    animationFrame = requestAnimationFrame(animate);

    if (fadingIn) {
      const progress = Math.min(
        (now - fadeStart) / (fadeDuration * 1000),
        1
      );

      blackout.style.opacity = String(1 - progress);

      if (progress >= 1) {
        blackout.style.display = "none";
      }
    }

    renderer.render(scene, camera);
  }

  // Start with a fully black scene.
  blackout.style.opacity = "1";
  blackout.style.display = "block";

  animate(performance.now());

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------

  function destroy() {
    if (disposed) return;

    disposed = true;

    cancelAnimationFrame(animationFrame);

    window.removeEventListener("resize", onResize);
    document.removeEventListener("pointerdown", retryAudio);
    document.removeEventListener("keydown", retryAudio);

    dialogue.removeEventListener("ended", beginFadeIn);
    dialogue.pause();
    dialogue.currentTime = 0;
    dialogue.src = "";

    scene.traverse(object => {
      if (object.geometry) {
        object.geometry.dispose();
      }

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

  return {
    scene,
    camera,
    renderer,
    ship,
    destroy
  };
}
