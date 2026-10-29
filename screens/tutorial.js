
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import { createRustbucket } from "../models/rustbucket.js";
import { createKevinStorageUnit } from "../models/kevin-storage-unit.js";

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
  // Lighting
  // --------------------------------------------------

  scene.add(
    new THREE.HemisphereLight(
      0xb8dcff,
      0x5a5040,
      2.0
    )
  );

  const sunlight = new THREE.DirectionalLight(
    0xffd39a,
    3.0
  );

  sunlight.position.set(-12, 14, 12);
  scene.add(sunlight);

  const ceilingLight = new THREE.PointLight(
    0xffe5c2,
    65,
    38,
    1.5
  );

  ceilingLight.position.set(0, 10, -3);
  scene.add(ceilingLight);

  const frontFill = new THREE.DirectionalLight(
    0x9bcfff,
    2.0
  );

  frontFill.position.set(0, 8, 18);
  scene.add(frontFill);

  const sideLight = new THREE.PointLight(
    0xffc681,
    30,
    24,
    2
  );

  sideLight.position.set(8, 5, 2);
  scene.add(sideLight);

  // --------------------------------------------------
  // Models
  // --------------------------------------------------

  const { unit } = createKevinStorageUnit(scene);
  const { ship } = createRustbucket(scene);

  // --------------------------------------------------
  // Dialogue audio and reveal
  // --------------------------------------------------

  const dialogue = new Audio("./sounds/final-dialogue.mp3");

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

    dialogue.play().catch(error => {
      console.warn(
        "Dialogue playback failed. Waiting for user interaction:",
        error
      );

      beginFadeIn();
    });
  }

  dialogue.addEventListener("ended", beginFadeIn);

  // Begin dialogue when entering the tutorial screen.
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

    const aspect = window.innerWidth / window.innerHeight;

    camera.aspect = aspect;
    camera.fov = aspect < 0.8 ? 53 : 43;

    camera.position.set(
      0,
      aspect < 0.8 ? 6.8 : 5.3,
      aspect < 0.8 ? 23.5 : 18.5
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

  // Start with a black screen while the dialogue plays.
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
            if (value?.isTexture) {
              value.dispose();
            }
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
    unit,
    destroy
  };
}
