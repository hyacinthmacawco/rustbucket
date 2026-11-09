import * as THREE from "three";
export const dimensions = {
  ben: { position: [-3, 0, 5], scale: [0.5, 0.5, 0.5] },
  gwen: { position: [-7, 0, -7], scale: [0.5, 0.5, 0.5] },
  kevin: { position: [0, 0, -9], scale: [0.52, 0.52, 0.52] },
  rook: { position: [7, 0, -7], scale: [0.52, 0.52, 0.52] },
  rustbucket: { position: [0, 2, 0], scale: [1, 1, 1] },
  kevinStorageUnit: { position: [0, 0, 0], scale: [1, 1, 1] },
  bellwood: { position: [0, 0, 0], scale: [1, 1, 1] },
  earth: { position: [4.5, 0, 0], radius: 2.05 },
  moon: { position: [6.8, 0.2, -1.5], radius: 0.35 },
  sun: { position: [-50, 0, 0], radius: 30 },

  camera: {
    title: {
      position: [-22.75, 6, 90],
      target: [-22.75, 0, 0],
      fov: 55,
      near: 0.1,
      far: 1000,
      distance: 90,
      minDistance: 45,
      maxDistance: 140,
      yaw: 0,
      pitch: 0.13
    },
    gameplay: {
      position: [0, 5.3, 18.5],
      target: [0, 1.8, 0],
      fov: 43,
      near: 0.1,
      far: 250,
      distance: 18.5,
      minDistance: 8,
      maxDistance: 45,
      yaw: 0,
      pitch: 0.18
    },
    dragSensitivity: 0.006,
    pitchSensitivity: 0.004,
    minPitch: -0.15,
    maxPitch: 1.0
  }
};


export const state = {
  stage: "title"
};

import { createTitleScreen } from "../hud/title.js";
import { createJoystick } from "../hud/joystick.js";
import { createExtranet } from "../hud/extranet.js";
import { createSuitcases } from "../omniverse/suitcases.js";


    const canvas = document.getElementById("omniverse");
    const scene = new THREE.Scene();
    scene.name = "omniverse";
    scene.background = new THREE.Color(0x02040a);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)),
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const camera = new THREE.PerspectiveCamera(
      dimensions.camera.title.fov,
      window.innerWidth / window.innerHeight,
      dimensions.camera.title.near,
      dimensions.camera.title.far
    );
    scene.add(camera);

    let activeStage = null;
    let cameraTarget = new THREE.Vector3();
    let cameraYaw = 0;
    let cameraPitch = 0;
    let cameraDistance = 1;
    let cameraPreset = dimensions.camera.title;
    let ben = null;
    let keyboardController = null;
    let physics = null;
    let entities = null;

    function updateCamera() {
      const selectedName = keyboardController?.selected || "ben";
      const selectedEntity = activeStage === "gameplay" && entities ? entities[selectedName] : null;
      const ship = activeStage === "gameplay" ? entities?.rustbucket : null;
      if (ship && selectedEntity && selectedName !== "rustbucket") {
        ship.updateMatrixWorld(true);
        const local = ship.worldToLocal(selectedEntity.position.clone());
        const insideCabin = local.x > -1.18 && local.x < 1.18 && local.z > 1.65 && local.z < 4.65 && local.y > -2.9 && local.y < 0.8;
        if (insideCabin) {
          const cameraPoint = ship.localToWorld(new THREE.Vector3(0,0.25,0.2));
          const targetPoint = ship.localToWorld(new THREE.Vector3(0,0.35,3.1));
          camera.position.copy(cameraPoint);
          camera.lookAt(targetPoint);
          return;
        }
      }
      const followedEntity = selectedEntity || ben;
      const target = activeStage === "gameplay" && followedEntity
        ? new THREE.Vector3(followedEntity.position.x, followedEntity.position.y + 1.8, followedEntity.position.z)
        : cameraTarget;
      const horizontal = Math.cos(cameraPitch) * cameraDistance;
      camera.position.set(
        target.x + Math.sin(cameraYaw) * horizontal,
        target.y + Math.sin(cameraPitch) * cameraDistance,
        target.z + Math.cos(cameraYaw) * horizontal
      );
      camera.lookAt(target);
    }

    function setCameraPreset(preset) {
      cameraPreset = preset;
      camera.fov = window.innerWidth / window.innerHeight < 0.8
        ? Math.max(preset.fov, 65)
        : preset.fov;
      camera.near = preset.near;
      camera.far = preset.far;
      camera.updateProjectionMatrix();

      cameraTarget.set(...preset.target);
      const position = new THREE.Vector3(...preset.position);
      const offset = position.sub(cameraTarget);
      cameraDistance = offset.length();
      cameraYaw = Math.atan2(offset.x, offset.z);
      cameraPitch = Math.atan2(offset.y, Math.hypot(offset.x, offset.z));
      updateCamera();
    }

    setCameraPreset(dimensions.camera.title);

    // UI overlays are created once; the animation loop controls visibility.
    const titleScreen = createTitleScreen({
      onNewGame() {
        state.stage = "prelude";
      }
    });

    const preludeScreen = document.createElement("div");
    preludeScreen.id = "prelude-screen";
    preludeScreen.innerHTML = '<div id="prelude-title">A NEW DAWN</div><button id="skip-dialogue" type="button">SKIP</button>';
    document.body.appendChild(preludeScreen);
    const preludeTitle = preludeScreen.querySelector("#prelude-title");
    let startRequested = false;
    function startGameplay() {
      if (state.stage !== "prelude") return;
      startRequested = true;
      stopMusic();
      if (loadedRegion === "bellwood") state.stage = "gameplay";
      else preludeTitle.textContent = "LOADING";
    }
    preludeScreen.querySelector("#skip-dialogue").addEventListener("click", startGameplay);

    const joystick = createJoystick();
    joystick.setVisible(false);
    const pauseButton = document.createElement("button");
    pauseButton.id = "pause-button";
    pauseButton.type = "button";
    pauseButton.setAttribute("aria-label", "Pause game");
    pauseButton.textContent = "Ⅱ";
    const pauseOverlay = document.createElement("div");
    pauseOverlay.id = "pause-overlay";
    pauseOverlay.innerHTML = '<div id="pause-panel"><div id="pause-title">PAUSED</div><button id="resume-button" type="button">RESUME</button></div>';
    document.body.append(pauseButton, pauseOverlay);
    function setPaused(value) {
      state.paused = Boolean(value);
      pauseOverlay.style.display = state.paused ? "flex" : "none";
      pauseButton.textContent = state.paused ? "▶" : "Ⅱ";
      pauseButton.setAttribute("aria-label", state.paused ? "Resume game" : "Pause game");
      if (music) {
        if (state.paused) music.pause();
        else if (audioUnlocked) music.play().catch(() => {});
      }
    }
    pauseButton.addEventListener("click", () => setPaused(!state.paused));
    pauseOverlay.querySelector("#resume-button").addEventListener("click", () => setPaused(false));
    function pauseKey(event) { if (event.key === "Escape" && state.stage === "gameplay") setPaused(!state.paused); }
    document.addEventListener("keydown", pauseKey);
    const extranet = createExtranet({ onContinue: () => extranet.close() });
    const extranetButton = document.createElement("button");
    extranetButton.id = "extranet-button";
    extranetButton.type = "button";
    extranetButton.setAttribute("aria-label", "Open Extranet");
    extranetButton.textContent = "🌐";
    extranetButton.addEventListener("click", () => extranet.open());
    const liftControl = document.createElement("label");
    liftControl.id = "vehicle-lift-control";
    liftControl.innerHTML = '<span>LIFT</span><input id="vehicle-lift-slider" type="range" min="-1" max="1" step="0.02" value="0" orient="vertical"><span>HOVER</span>';
    document.body.append(extranetButton, liftControl);
    const liftInput = liftControl.querySelector("#vehicle-lift-slider");
    const isMobile = (window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 900px)").matches) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    
    

    // One audio handle is reused for the active stage's soundtrack/dialogue.
    let music = null;
    let audioUnlocked = false;
    let preludeEndedHandler = null;

    function stopMusic() {
      if (!music) return;
      if (preludeEndedHandler) {
        music.removeEventListener("ended", preludeEndedHandler);
        preludeEndedHandler = null;
      }
      music.pause();
      music.currentTime = 0;
      music.src = "";
      music = null;
    }

    function playStageMusic(src, loop = false, onEnded = null) {
      stopMusic();
      music = new Audio(new URL(src, document.baseURI).href);
      music.loop = loop;
      music.volume = 0.55;
      music.preload = "auto";
      music.load();
      music.addEventListener("error", () => {
        console.error("Could not load soundtrack:", music?.src);
      }, { once: true });
      if (onEnded) {
        preludeEndedHandler = onEnded;
        music.addEventListener("ended", onEnded, { once: true });
      }
      if (audioUnlocked) {
        music.play().catch(error => console.warn("Audio playback is waiting for interaction:", error));
      }
    }

    function unlockAudio() {
      if (!audioUnlocked) audioUnlocked = true;
      if (state.stage === "title") {
        if (!music) playStageMusic("./hud/senji-v2-ov.mp3", true);
        else if (music.paused) music.play().catch(error => console.warn("Audio playback is waiting for interaction:", error));
      } else if (music?.paused) {
        music.play().catch(error => console.warn("Audio playback is waiting for interaction:", error));
      }
    }
    function requestFullscreenOnGesture() {
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      const target = document.documentElement;
      const request = target.requestFullscreen || target.webkitRequestFullscreen;
      if (!request) return;
      try {
        const result = request.call(target);
        result?.catch?.(() => {});
      } catch (error) {
        console.warn("Fullscreen request was rejected by the browser:", error);
      }
    }
    // Fullscreen is restricted by browsers to a user gesture; retry until accepted.
    document.addEventListener("pointerdown", requestFullscreenOnGesture);
    document.addEventListener("touchend", requestFullscreenOnGesture, { passive: true });
    document.addEventListener("keydown", requestFullscreenOnGesture);
    document.addEventListener("pointerdown", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    // Pointer-based camera controls: one pointer rotates, two touch pointers
    // exclusively pinch-zoom. A pinch can never leak into the rotate handler.
    const cameraPointers = new Map();
    let draggingCamera = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let pinchDistance = 0;

    function onPointerDown(event) {
      if (event.pointerType === "touch") {
        cameraPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (cameraPointers.size >= 2) {
          draggingCamera = false;
          const points = [...cameraPointers.values()];
          pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        } else {
          lastPointerX = event.clientX;
          lastPointerY = event.clientY;
          draggingCamera = true;
        }
      } else {
        draggingCamera = true;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
      }
      if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    }
    function onPointerMove(event) {
      if (event.pointerType === "touch") {
        if (!cameraPointers.has(event.pointerId)) return;
        cameraPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (cameraPointers.size >= 2) {
          const points = [...cameraPointers.values()];
          const next = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
          if (pinchDistance > 0) {
            cameraDistance = THREE.MathUtils.clamp(
              cameraDistance - (next - pinchDistance) * 0.035,
              cameraPreset.minDistance,
              cameraPreset.maxDistance
            );
            updateCamera();
          }
          pinchDistance = next;
          event.preventDefault();
          return;
        }
      }
      if (!draggingCamera) return;
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      cameraYaw -= dx * dimensions.camera.dragSensitivity;
      cameraPitch = THREE.MathUtils.clamp(
        cameraPitch + dy * dimensions.camera.pitchSensitivity,
        dimensions.camera.minPitch,
        dimensions.camera.maxPitch
      );
      updateCamera();
    }
    function onPointerUp(event) {
      cameraPointers.delete(event.pointerId);
      if (event.pointerType === "touch") {
        draggingCamera = false;
        pinchDistance = 0;
        if (cameraPointers.size === 1) {
          const remaining = [...cameraPointers.values()][0];
          lastPointerX = remaining.x;
          lastPointerY = remaining.y;
        }
      } else {
        draggingCamera = false;
      }
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", e => {
      e.preventDefault();
      cameraDistance = THREE.MathUtils.clamp(
        cameraDistance + e.deltaY * 0.025,
        cameraPreset.minDistance,
        cameraPreset.maxDistance
      );
      updateCamera();
    }, { passive: false });

    // Region objects are imported and instantiated only after the camera is
    // found to be near that region. Each region is held in one removable group.
    let loadedRegion = null;
    let loadingRegion = null;
    let regionGroup = null;
    let titleObjects = null;

    function regionNearCamera() {
      const cameraPosition = camera.position;
      if (state.stage === "title") {
        const earth = new THREE.Vector3(...dimensions.earth.position);
        const sun = new THREE.Vector3(...dimensions.sun.position);
        const nearEarth = cameraPosition.distanceTo(earth) < 180;
        const nearSun = cameraPosition.distanceTo(sun) < 180;
        return nearEarth || nearSun ? "space" : null;
      }
      if (state.stage === "gameplay" || state.stage === "prelude") {
        const bellwood = new THREE.Vector3(...dimensions.bellwood.position);
        return cameraPosition.distanceTo(bellwood) < 350 ? "bellwood" : null;
      }
      return null;
    }

    function disposeRegion() {
      if (keyboardController) {
        keyboardController.destroy();
        keyboardController = null;
      }
      ben = null;
      if (!regionGroup) return;
      scene.remove(regionGroup);
      regionGroup.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            for (const value of Object.values(material)) {
              if (value?.isTexture) value.dispose();
            }
            material.dispose();
          }
        }
      });
      regionGroup = null;
      titleObjects = null;
    }

    async function loadRegion(name) {
      if (loadingRegion === name || loadedRegion === name) return;
      loadingRegion = name;
      disposeRegion();

      if (!name) {
        loadedRegion = null;
        loadingRegion = null;
        return;
      }

      const group = new THREE.Group();
      group.name = name === "space" ? "SpaceRegion" : "BellwoodRegion";

      try {
        if (name === "space") {
          // Lazy imports: celestial models are not loaded on the initial module pass.
          const [sunModule, earthModule, moonModule, starModule] = await Promise.all([
            import("../omniverse/sun.js"),
            import("../omniverse/earth.js"),
            import("../omniverse/moon.js"),
            import("../omniverse/starfield.js")
          ]);
          scene.background = new THREE.Color(0x02040a);
          scene.fog = null;
          group.add(new THREE.AmbientLight(0x52617f, 0.45));
          const sun = sunModule.createSun(group);
          const earth = earthModule.createEarth(group);
          const moon = moonModule.createMoon(group);
          const starfield = starModule.createStarfield(group);
          titleObjects = { ...sun, ...earth, ...moon, ...starfield };
        } else if (name === "bellwood") {
          // Only Bellwood's nearby environment and gameplay models are loaded.
          const [bellwoodModule, unitModule, shipModule, rigModule, benModule, gwenModule, kevinModule, rookModule, controllerModule, physicsModule] = await Promise.all([
            import("../omniverse/bellwood.js"),
            import("../omniverse/kevin-storage-unit.js"),
            import("../omniverse/rustbucket.js"),
            import("../omniverse/human-rig.js"),
            import("../omniverse/ben.js"),
            import("../omniverse/gwen.js"),
            import("../omniverse/kevin.js"),
            import("../omniverse/rook.js"),
            import("../hud/joystick.js"),
            import("../physics/engine.js")
          ]);
          bellwoodModule.createBellwood(scene, group);
          const { unit } = unitModule.createKevinStorageUnit(group);
          const { ship } = shipModule.createRustbucket(group);
          physics = await physicsModule.createPhysics();
          physics.addStaticScene(group);
          const { suitcases } = createSuitcases(group);
          physics.addVehicle(ship);
          const carriedSuitcases = new Map();
          let storedSuitcaseCount = 0;
          function tryPickup(characterName, characterGroup, rig) {
            const carried = carriedSuitcases.get(characterName);
            if (carried) {
              if (characterGroup.position.distanceTo(ship.position) > 9) return;
              ship.attach(carried);
              carried.position.set(0,-0.18,-1.65 + storedSuitcaseCount * 0.82);
              carried.scale.set(1,1,1);
              carried.rotation.set(0,0,0);
              carried.userData.carriedBy = null;
              carried.userData.stored = true;
              carriedSuitcases.delete(characterName);
              storedSuitcaseCount += 1;
              extranet.updateTask(storedSuitcaseCount);
              return;
            }
            let nearest = null;
            let nearestDistance = 2.35;
            for (const suitcase of suitcases) {
              if (!suitcase.userData.pickable || suitcase.userData.stored || suitcase.userData.carriedBy) continue;
              const distance = characterGroup.position.distanceTo(suitcase.position);
              if (distance < nearestDistance) { nearest = suitcase; nearestDistance = distance; }
            }
            if (!nearest) return;
            nearest.userData.carriedBy = characterName;
            characterGroup.attach(nearest);
            nearest.position.set(0,0.18,0.68);
            carriedSuitcases.set(characterName,nearest);
            extranet.addRelationship(characterName,nearest.userData.owner.toLowerCase());
            characterGroup.userData.actionActive = true;
            characterGroup.userData.actionRemaining = 0.95;
            rig.playAnimation("pickup");
          }
          const { createHumanRig } = rigModule;
          const benCharacter = benModule.createBen({ createHumanRig });
          const gwenCharacter = gwenModule.createGwen({ createHumanRig });
          const kevinCharacter = kevinModule.createKevin({ createHumanRig });
          const rookCharacter = rookModule.createRook({ createHumanRig });
          const characterEntries = [
            ["ben", benCharacter],
            ["gwen", gwenCharacter],
            ["kevin", kevinCharacter],
            ["rook", rookCharacter]
          ];
          const characterEntities = {};
          for (const [name, character] of characterEntries) {
            const config = dimensions[name];
            character.group.position.set(...config.position);
            character.group.scale.set(...config.scale);
            character.group.userData.actionActive = false;
            character.group.userData.actionRemaining = 0;
            character.group.userData.moving = false;
            character.group.setAnimation = animation => {
              character.group.userData.moving = animation === "walk";
              if (!character.group.userData.actionActive) {
                character.rig.setWalking(character.group.userData.moving);
              }
            };
            character.group.update = delta => {
              character.animationTime = (character.animationTime || 0) + delta;
              if (character.group.userData.actionActive) {
                character.group.userData.actionRemaining -= delta;
                if (character.group.userData.actionRemaining <= 0) {
                  character.group.userData.actionActive = false;
                  character.rig.setWalking(character.group.userData.moving);
                }
              }
              character.rig.updateWalk(character.animationTime);
            };
            character.group.setAnimation("idle");
            character.group.userData.performPickup = () => tryPickup(name, character.group, character.rig);
            character.group.userData.performAttack = () => {
              character.group.userData.actionActive = true;
              character.group.userData.actionRemaining = 0.78;
              character.rig.playAnimation("punch");
            };
            characterEntities[name] = character.group;
            group.add(character.group);
            physics.addCharacter(character.group);
          }
          ben = benCharacter.group;
          entities = { ...characterEntities, rustbucket: ship };
          regionGroup = group;
          scene.add(regionGroup);
          keyboardController = controllerModule.createKeyboard({
            entities, camera, joystick, updateCamera, isMobile,
            getLift: () => Number(liftInput.value),
            onSelect: selected => {
              liftControl.style.display = selected === "rustbucket" ? "flex" : "none";
              if (selected !== "rustbucket") liftInput.value = "0";
            }
          });
          loadedRegion = name;
          loadingRegion = null;
          if (name === "bellwood" && startRequested && state.stage === "prelude") state.stage = "gameplay";
          return;
        }

        regionGroup = group;
        scene.add(regionGroup);
        loadedRegion = name;
        if (name === "bellwood" && startRequested && state.stage === "prelude") state.stage = "gameplay";
      } catch (error) {
        console.error("Could not load nearby region:", name, error);
        loadedRegion = null;
      } finally {
        loadingRegion = null;
      }
    }

    function updateStage() {
      if (activeStage === state.stage) return;
      activeStage = state.stage;

      if (activeStage === "title") {
        preludeScreen.style.display = "none";
        titleScreen.setVisible(true);
        joystick.setVisible(false);
        
        setCameraPreset(dimensions.camera.title);
        playStageMusic("./hud/senji-v2-ov.mp3", true);
      } else if (activeStage === "prelude") {
        titleScreen.setVisible(false);
        joystick.setVisible(false);
        setCameraPreset(dimensions.camera.gameplay);
        if (!loadedRegion && !loadingRegion) loadRegion("bellwood");
        
        preludeScreen.style.display = "flex";
        stopMusic();
        playStageMusic("./hud/ov-final-dialogues.mp3", false, startGameplay);
      } else if (activeStage === "gameplay") {
        titleScreen.setVisible(false);
        preludeScreen.style.display = "none";
        joystick.setVisible(isMobile);
        
        
        setCameraPreset(dimensions.camera.gameplay);
        playStageMusic("./hud/neodevol-ov.mp3", true);
      } else {
        titleScreen.setVisible(false);
        preludeScreen.style.display = "none";
        joystick.setVisible(isMobile && activeStage === "gameplay");
        
        stopMusic();
      }
    }

    const clock = new THREE.Clock();
    let animationFrame = 0;

    function animate() {
      animationFrame = requestAnimationFrame(animate);

      updateStage();
      titleScreen.setVisible(state.stage === "title");
      preludeScreen.style.display = state.stage === "prelude" ? "flex" : "none";
      joystick.setVisible(isMobile && state.stage === "gameplay");
      pauseButton.style.display = state.stage === "gameplay" ? "grid" : "none";
      extranetButton.style.display = state.stage === "gameplay" ? "grid" : "none";
      if (state.stage !== "gameplay") liftControl.style.display = "none";
      if (state.stage !== "gameplay" && state.paused) setPaused(false);

      // Decide what to instantiate from the camera's current world position.
      const wantedRegion = regionNearCamera();
      if (!loadingRegion && wantedRegion !== loadedRegion) {
        loadRegion(wantedRegion);
      }

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      if (!state.paused && state.stage === "gameplay" && keyboardController) {
        keyboardController.update(delta);
      }
      if (!state.paused && physics && state.stage === "gameplay") physics.step(delta);
      if (!state.paused && entities?.rustbucket?.userData.updateVehicle) entities.rustbucket.userData.updateVehicle(delta);

      if (state.stage === "title" && titleObjects) {
        titleObjects.earth.rotation.y += delta * 0.07;
        titleObjects.moon.rotation.y += delta * 0.04;
        titleObjects.sunAura.material.opacity = 0.11 + Math.sin(elapsed * 0.7) * 0.025;
        titleObjects.sunOuterGlow.material.opacity = 0.05 + Math.sin(elapsed * 0.45) * 0.012;
        titleObjects.stars.rotation.y += delta * 0.0008;
      }

      renderer.render(scene, camera);
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.fov = window.innerWidth / window.innerHeight < 0.8
        ? Math.max(cameraPreset.fov, 65)
        : cameraPreset.fov;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    }
    window.addEventListener("resize", onResize);

    animate();

    window.addEventListener("beforeunload", () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("pointerdown", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
      document.removeEventListener("pointerdown", requestFullscreenOnGesture);
      document.removeEventListener("touchend", requestFullscreenOnGesture);
      document.removeEventListener("keydown", requestFullscreenOnGesture);
      document.removeEventListener("keydown", pauseKey);
      pauseButton.remove();
      pauseOverlay.remove();
      extranetButton.remove();
      liftControl.remove();
      extranet.close();
      disposeRegion();
      titleScreen.destroy();
      preludeScreen.remove();
      joystick.destroy();
      
      
      stopMusic();
      renderer.dispose();
    }, { once: true });