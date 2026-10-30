import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import { createRustbucket } from "../models/rustbucket.js";
import { createKevinStorageUnit } from "../models/kevin-storage-unit.js";
import createBen from '../models/ben.js';

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

  const ben = createBen(THREE);
  ben.position.set(-3, 0, 5);
  ben.scale.setScalar(0.5);
  scene.add(ben);

  // --------------------------------------------------
  // Camera orbit and player controls
  // --------------------------------------------------
  
  const cameraTarget = new THREE.Vector3();
  const cameraOffset = new THREE.Vector3();
  
  let cameraYaw = 0;
  let cameraPitch = 0.18;
  let cameraDistance = 18.5;
  
  const keys = new Set();
  
  const joystick = {
    active: false,
    pointerId: null,
    x: 0,
    y: 0
  };
  
  const joystickElement = root.querySelector("#movement-joystick");
  const joystickKnob = root.querySelector("#joystick-knob");
  
  function updateCamera() {
    cameraTarget.set(
      ben.position.x,
      ben.position.y + 1.8,
      ben.position.z
    );
  
    cameraOffset.set(
      Math.sin(cameraYaw) * Math.cos(cameraPitch),
      Math.sin(cameraPitch),
      Math.cos(cameraYaw) * Math.cos(cameraPitch)
    ).multiplyScalar(cameraDistance);
  
    camera.position.copy(cameraTarget).add(cameraOffset);
    camera.lookAt(cameraTarget);
  }
  
  updateCamera();
  
  // Mouse and touch camera orbit.
  let draggingCamera = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  
  const canvas = renderer.domElement;
  
  canvas.style.touchAction = "none";
  
  function onPointerDown(event) {
    draggingCamera = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  
    canvas.setPointerCapture(event.pointerId);
  }
  
  function onPointerMove(event) {
    if (!draggingCamera) return;
  
    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;
  
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  
    cameraYaw -= dx * 0.006;
    cameraPitch = THREE.MathUtils.clamp(
      cameraPitch + dy * 0.004,
      -0.15,
      1.0
    );
  
    updateCamera();
  }
  
  function onPointerUp() {
    draggingCamera = false;
  }
  
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  
  // Keyboard movement.
  function onKeyDown(event) {
    const key = event.key.toLowerCase();
  
    if ([
      "w", "a", "s", "d",
      "arrowup", "arrowdown",
      "arrowleft", "arrowright"
    ].includes(key)) {
      event.preventDefault();
      keys.add(key);
    }
  }
  
  function onKeyUp(event) {
    keys.delete(event.key.toLowerCase());
  }
  
  function onBlur() {
    keys.clear();
  }
  
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  
  // Mobile joystick.
  function updateJoystick(event) {
    const rect = joystickElement.getBoundingClientRect();
  
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
  
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
  
    const maxRadius = rect.width * 0.32;
    const distance = Math.hypot(dx, dy);
    const scale = distance > maxRadius
      ? maxRadius / distance
      : 1;
  
    const knobX = dx * scale;
    const knobY = dy * scale;
  
    joystick.x = knobX / maxRadius;
    joystick.y = -knobY / maxRadius;
  
    joystickKnob.style.transform =
      `translate(${knobX}px, ${knobY}px)`;
  }
  
  function onJoystickDown(event) {
    event.preventDefault();
  
    joystick.active = true;
    joystick.pointerId = event.pointerId;
  
    joystickElement.setPointerCapture(event.pointerId);
    updateJoystick(event);
  }
  
  function onJoystickMove(event) {
    if (
      !joystick.active ||
      event.pointerId !== joystick.pointerId
    ) return;
  
    event.preventDefault();
    updateJoystick(event);
  }
  
  function onJoystickUp(event) {
    if (event.pointerId !== joystick.pointerId) return;
  
    joystick.active = false;
    joystick.pointerId = null;
    joystick.x = 0;
    joystick.y = 0;
  
    joystickKnob.style.transform = "translate(0px, 0px)";
  }
  
  joystickElement.addEventListener("pointerdown", onJoystickDown);
  joystickElement.addEventListener("pointermove", onJoystickMove);
  joystickElement.addEventListener("pointerup", onJoystickUp);
  joystickElement.addEventListener("pointercancel", onJoystickUp);

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

    camera.updateProjectionMatrix();
    updateCamera();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    );
  }

  window.addEventListener("resize", onResize);

  function updatePlayer(deltaTime) {
    const forwardInput =
      (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
  
    const rightInput =
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
  
    let forward = forwardInput + joystick.y;
    let right = rightInput + joystick.x;
  
    const magnitude = Math.hypot(forward, right);
  
    if (magnitude > 1) {
      forward /= magnitude;
      right /= magnitude;
    }
  
    const moving = magnitude > 0.08;
  
    if (moving) {
      // Move relative to the camera's actual horizontal orientation.
      camera.getWorldDirection(cameraTarget);

      const forwardX = cameraTarget.x;
      const forwardZ = cameraTarget.z;

      const forwardLength = Math.hypot(forwardX, forwardZ) || 1;

      const normalizedForwardX = forwardX / forwardLength;
      const normalizedForwardZ = forwardZ / forwardLength;

      // Camera-relative right direction.
      const rightX = -normalizedForwardZ;
      const rightZ = normalizedForwardX;
  
      const speed = 3.5;
  
      ben.position.x += (normalizedForwardX * forward + rightX * right) * speed * deltaTime;
      ben.position.z += (normalizedForwardZ * forward + rightZ * right) * speed * deltaTime;

      // Face the direction of movement.
      const moveX = normalizedForwardX * forward + rightX * right;
      const moveZ = normalizedForwardZ * forward + rightZ * right;
  
      ben.rotation.y = Math.atan2(moveX, moveZ);
  
      ben.setAnimation("walk");
    } else {
      ben.setAnimation("idle");
    }
  
    ben.update(deltaTime);
    updateCamera();
  }
  
  // --------------------------------------------------
  // Render loop
  // --------------------------------------------------

  const clock = new THREE.Clock();

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

    updatePlayer(Math.min(clock.getDelta(), 0.05));
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
