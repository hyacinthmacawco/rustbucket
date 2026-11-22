import * as THREE from "three";
import { createTitleScreen } from "../hud/title.js";
import { createJoystick, createKeyboard } from "../hud/joystick.js";
import { createExtranet } from "../hud/extranet.js";
import { createSuitcases } from "../omniverse/suitcases.js";
import { createSolarSystem } from "../omniverse/solar-system.js";
import { createEarthInterior } from "../omniverse/earth.js";
import { createMoonInterior } from "../omniverse/moon-interior.js";
import { createPlanetInterior, PLANET_WORLDS } from "../omniverse/planet-interior.js";
import { createKevinStorageUnit } from "../omniverse/kevin-storage-unit.js";
import { createRustbucket } from "../omniverse/rustbucket.js";
import { createHumanRig } from "../omniverse/human-rig.js";
import { createBen } from "../omniverse/ben.js";
import { createGwen } from "../omniverse/gwen.js";
import { createKevin } from "../omniverse/kevin.js";
import { createRook } from "../omniverse/rook.js";
import { createPhysics } from "../physics/engine.js";
import { createPhaseTwo, createChromastone } from "../omniverse/phase2.js";
import { createPhaseTwoCloud } from "../hud/phase2-cloud.js";

export const dimensions = {
  ben: { position: [-3, -0.5, 5], scale: [0.5, 0.5, 0.5] },
  gwen: { position: [-7, -0.5, -7], scale: [0.5, 0.5, 0.5] },
  kevin: { position: [0, -0.5, -9], scale: [0.52, 0.52, 0.52] },
  rook: { position: [7, -0.5, -7], scale: [0.52, 0.52, 0.52] },
  rustbucket: { position: [0, 2, 0], scale: [2, 2, 2] },
  kevinStorageUnit: { position: [0, -0.5, 0], scale: [1.5, 1.5, 1.5] },
  earthInterior: { position: [0, 0, 0], scale: [1, 1, 1] },
  bellwood: { scale: [1, 1, 1] },
  earth: { position: [4.5, 0, 0], radius: 2.05 },
  moon: { position: [6.8, 0.2, -1.5], radius: 0.35 },
  sun: { position: [-50, 0, 0], radius: 30 },
  camera: {
    title: { position: [-22.75, 6, 90], target: [-22.75, 0, 0], fov: 55, near: 0.1, far: 1000, distance: 90, minDistance: 45, maxDistance: 140, yaw: 0, pitch: 0.13 },
    gameplay: { position: [0, 5.3, 18.5], target: [0, 1.8, 0], fov: 43, near: 0.1, far: 250, distance: 18.5, minDistance: 8, maxDistance: 45, yaw: 0, pitch: 0.18 },
    dragSensitivity: 0.006, pitchSensitivity: 0.004, minPitch: -0.15, maxPitch: 1.0
  }
};
export const state = { stage: "title", currentScene: "space", arrivingInShip: false };


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
          const anchor = ship.worldToLocal(selectedEntity.position.clone());
          anchor.x = THREE.MathUtils.clamp(anchor.x,-0.15,0.15);
          anchor.y += 1.05;
          const orbitDistance = THREE.MathUtils.clamp(cameraDistance * 0.055,0.55,1.15);
          const horizontal = Math.cos(cameraPitch) * orbitDistance;
          const offset = new THREE.Vector3(
            Math.sin(cameraYaw) * horizontal,
            Math.sin(cameraPitch) * orbitDistance,
            Math.cos(cameraYaw) * horizontal
          );
          camera.position.copy(ship.localToWorld(anchor.clone().add(offset)));
          camera.lookAt(ship.localToWorld(anchor));
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
    let dialogueSfx = null;
    function startGameplay() {
      if (state.stage !== "prelude") return;
      startRequested = true;
      if (dialogueSfx) { stopSfx(dialogueSfx); dialogueSfx = null; }
      stopMusic();
      if (loadedRegion === "earth") state.stage = "gameplay";
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
    pauseOverlay.innerHTML = '<div id="pause-panel"><div id="pause-title">PAUSED</div><nav id="pause-tabs"><button data-pause-tab="settings" class="active">SETTINGS</button><button data-pause-tab="help">HELP</button><button data-pause-tab="credits">CREDITS</button></nav><div id="pause-content"></div><button id="resume-button" type="button">RESUME</button></div>';
    document.body.append(pauseButton, pauseOverlay);
    function setPaused(value) {
      state.paused = Boolean(value);
      pauseOverlay.style.display = state.paused ? "flex" : "none";
      pauseButton.textContent = state.paused ? "▶" : "Ⅱ";
      pauseButton.setAttribute("aria-label", state.paused ? "Resume game" : "Pause game");
      if (musicTrack) {
        if (state.paused) musicTrack.pause();
        else if (audioUnlocked) musicTrack.play().catch(() => {});
      }
    }
    pauseButton.addEventListener("click", () => setPaused(!state.paused));
    const pauseContent=pauseOverlay.querySelector("#pause-content");
    const pauseViews={
      settings:'<h3>SETTINGS</h3><label>CAMERA SENSITIVITY <input type="range" min="1" max="15" value="6"></label><label>MASTER VOLUME <input type="range" min="0" max="100" value="70"></label>',
      help:'<h3>CONTROLS</h3><p>WASD / joystick: move. Drag: camera. Pinch / wheel: zoom. F / double-tap joystick: switch team member. Space / jump: system map when Rustbucket is selected. E / pick: interact. Q / attack: use weapon. R: open or close Rustbucket ramp.</p>',
      credits:'<h3>CREDITS</h3><p>Developed by Hyacinth Macaw.</p><p>Soundtrack artists: see soundtrack credits.</p><p>Ben 10 created by Man of Action.</p>'
    };
    pauseContent.innerHTML=pauseViews.settings;
    pauseOverlay.querySelectorAll("[data-pause-tab]").forEach(button=>button.addEventListener("click",()=>{
      pauseOverlay.querySelectorAll("[data-pause-tab]").forEach(b=>b.classList.toggle("active",b===button));
      pauseContent.innerHTML=pauseViews[button.dataset.pauseTab];
    }));
    pauseOverlay.querySelector("#resume-button").addEventListener("click", () => setPaused(false));
    function pauseKey(event) { if (event.key === "Escape" && state.stage === "gameplay") setPaused(!state.paused); }
    document.addEventListener("keydown", pauseKey);
    const phaseTwo = createPhaseTwo();
    const eventNotice=document.createElement("div");eventNotice.id="phase2-event-notice";document.body.appendChild(eventNotice);
    let eventNoticeTimer=0;
    phaseTwo.onEvent=event=>{
      eventNotice.textContent=event.description;
      eventNotice.style.display="block";
      eventNotice.classList.toggle("hostile",event.type==="attack"||event.type==="war");
      window.clearTimeout(eventNoticeTimer);
      eventNoticeTimer=window.setTimeout(()=>{eventNotice.style.display="none";},4800);
    };
    function configureShip(ship){
      ship.userData.onFuelUse=amount=>phaseTwo.consumeFuel(amount*0.45);
      const fire=ship.userData.performAttack;
      ship.userData.performAttack=()=>{if(phaseTwo.consumeFuel(1))fire?.();};
      return ship;
    }
    const extranet = createExtranet({
      onContinue: () => extranet.close(),
      onComplete: () => playSfx("./hud/ov-end-credits.mp3"),
      phaseTwo,
      onData: () => phaseTwoCloud.open()
    });
    const phaseTwoCloud=createPhaseTwoCloud(phaseTwo);
    const phaseTwoButton=document.createElement("button");
    phaseTwoButton.id="phase2-cloud-button";phaseTwoButton.type="button";phaseTwoButton.textContent="DATA";
    phaseTwoButton.setAttribute("aria-label","Open Private Cloud data hub");
    phaseTwoButton.addEventListener("click",()=>phaseTwoCloud.open());
    const hep=document.createElement("button");hep.id="hep-control";hep.type="button";hep.setAttribute("aria-label","Health and energy; click to pause");
    hep.innerHTML='<span class="hep-meter"><i id="hep-health-fill"></i><b>H</b></span><span class="hep-meter"><i id="hep-energy-fill"></i><b>E</b></span>';
    hep.addEventListener("click",()=>setPaused(!state.paused));
    document.body.append(phaseTwoButton,hep);
    const hepHealth=hep.querySelector("#hep-health-fill"),hepEnergy=hep.querySelector("#hep-energy-fill");
    const carriedHud=document.createElement("div");carriedHud.id="carried-items-hud";
    carriedHud.innerHTML='<span>IN HAND</span><select id="carried-item-select"><option value="">NO ITEMS</option></select><button id="use-carried-item">USE</button>';
    document.body.appendChild(carriedHud);
    const carriedSelect=carriedHud.querySelector("select");
    carriedHud.querySelector("button").addEventListener("click",()=>{
      const selected=keyboardController?.selected||"ben";
      if(carriedSelect.value==="")return;
      const result=phaseTwo.useCarriedItem(selected[0].toUpperCase()+selected.slice(1),Number(carriedSelect.value));
      if(!result.ok)carriedHud.title=result.reason;
      refreshCarriedHud();
    });
    function refreshCarriedHud(){
      const selected=keyboardController?.selected||"ben";
      const who=selected[0].toUpperCase()+selected.slice(1);
      const list=phaseTwo.data.team.carried[who]||[];
      const previous=carriedSelect.value;
      carriedSelect.innerHTML=list.map((name,i)=>'<option value="'+i+'">'+name+'</option>').join("")||'<option value="">NO ITEMS</option>';
      if(previous!==""&&list[Number(previous)])carriedSelect.value=previous;
      carriedHud.style.display=state.stage==="gameplay"&&selected!=="rustbucket"?"flex":"none";
    }
    const omnitrixControl=document.createElement("label");omnitrixControl.id="omnitrix-control";
    omnitrixControl.innerHTML='<span>OMNITRIX</span><input id="omnitrix-slider" type="range" min="0" max="1" step="1" value="0"><b id="omnitrix-alien-label">BEN</b>';
    document.body.appendChild(omnitrixControl);
    const omnitrixSlider=omnitrixControl.querySelector("input");
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
    const rampButton = document.createElement("button");
    rampButton.id = "ramp-toggle-button";
    rampButton.type = "button";
    rampButton.textContent = "OPEN RAMP";
    document.body.appendChild(rampButton);
    rampButton.addEventListener("click", () => { const ship = entities?.rustbucket; ship?.userData.toggleRamp?.(); rampButton.textContent = ship?.userData.getRampOpen?.() ? "CLOSE RAMP" : "OPEN RAMP"; });
    const mapOverlay = document.createElement("div");
    mapOverlay.id = "system-map-overlay";
    mapOverlay.innerHTML = '<div id="system-map-panel"><div id="system-map-title">PLANETARY NAVIGATION</div><div id="system-map-graphic"><button class="system-map-node sun-node" disabled>SUN</button><button class="system-map-node earth-node" data-destination="earth">EARTH<br><small>BELLWOOD</small></button><button class="system-map-node moon-node" data-destination="moon">MOON</button><button class="system-map-node" style="left:8%;top:8%" data-destination="augstaka">AUGSTAKA</button><button class="system-map-node" style="left:70%;top:8%" data-destination="anodyne">ANODYNE</button><button class="system-map-node" style="left:12%;top:68%" data-destination="galvan">GALVAN PRIME</button><button class="system-map-node" style="right:8%;top:68%" data-destination="incursia">INCURSIA</button></div><div id="system-map-actions"><button data-destination="space">TAKE OFF / RETURN TO ORBIT</button><button id="system-map-close">CLOSE</button></div></div>';
    document.body.appendChild(mapOverlay);

    const marketPanel=document.createElement("div");
    marketPanel.id="planet-market";
    marketPanel.innerHTML='<div class="planet-market-card"><button id="planet-market-close" aria-label="Close marketplace">×</button><p class="planet-market-kicker">LOCAL TRADE EXCHANGE</p><h2 id="planet-market-title">MARKETPLACE</h2><p id="planet-market-cash"></p><div id="planet-market-stock"></div><p id="planet-market-message"></p></div>';
    document.body.appendChild(marketPanel);
    marketPanel.querySelector("#planet-market-close").addEventListener("click",()=>marketPanel.style.display="none");
    function openPlanetMarket(){
      const key=state.currentScene;
      const world=PLANET_WORLDS[key];if(!world)return;
      const stock=phaseTwo.data.resources[world.species]||[];
      marketPanel.querySelector("#planet-market-title").textContent=world.name+" MARKET";
      marketPanel.querySelector("#planet-market-cash").textContent="TEAM FUNDS: "+phaseTwo.data.team.cash.toLocaleString()+" TAYDENITE";
      const list=marketPanel.querySelector("#planet-market-stock");list.replaceChildren();
      for(const item of stock){
        const row=document.createElement("div");row.className="planet-market-item";
        const info=document.createElement("div");const name=document.createElement("b");name.textContent=item.name;
        const detail=document.createElement("small");detail.textContent=item.quantity+" AVAILABLE • "+item.price+" T EACH";
        info.append(name,detail);
        const buy=document.createElement("button");buy.textContent="BUY 1";
        buy.disabled=item.quantity<=0;
        buy.addEventListener("click",()=>{
          const selected=keyboardController?.selected||"ben";
          const buyer=selected==="ben"?"Ben":selected==="gwen"?"Gwen":selected==="kevin"?"Kevin":"Rook";
          const result=phaseTwo.tradeWithSpecies(buyer,world.species,item.id,1);
          const message=marketPanel.querySelector("#planet-market-message");
          message.textContent=result.ok?"PURCHASE COMPLETE • "+result.cost+" TAYDENITE":result.reason;
          marketPanel.querySelector("#planet-market-cash").textContent="TEAM FUNDS: "+phaseTwo.data.team.cash.toLocaleString()+" TAYDENITE";
          detail.textContent=item.quantity+" AVAILABLE • "+item.price+" T EACH";
          buy.disabled=item.quantity<=0;
        });
        row.append(info,buy);list.append(row);
      }
      marketPanel.querySelector("#planet-market-message").textContent="Select a resource to purchase. Trade access depends on crew relationships.";
      marketPanel.style.display="flex";
    }
    const warpOverlay = document.createElement("div");
    warpOverlay.id = "warp-overlay";
    warpOverlay.innerHTML = '<div id="warp-flash"></div><div id="warp-caption">SPACE WARP</div>';
    document.body.appendChild(warpOverlay);
    function openSystemMap() {
      if (state.stage === "gameplay" && keyboardController?.selected === "rustbucket") mapOverlay.style.display = "flex";
    }
    async function warpTo(destination) {
      mapOverlay.style.display = "none";
      if (!["earth","moon","space","augstaka","anodyne","galvan","incursia"].includes(destination)) return;
      const atmosphericTransition=Boolean(PLANET_WORLDS[destination]||PLANET_WORLDS[state.currentScene]);
      warpOverlay.querySelector("#warp-caption").textContent=PLANET_WORLDS[destination]?"ATMOSPHERIC ENTRY":atmosphericTransition?"CLEARING ATMOSPHERE":"SPACE WARP";
      warpOverlay.classList.toggle("atmospheric",atmosphericTransition);
      warpOverlay.style.display = "flex";
      warpOverlay.classList.remove("warp-active"); void warpOverlay.offsetWidth; warpOverlay.classList.add("warp-active");
      await new Promise(resolve => window.setTimeout(resolve, 1250));
      state.currentScene = destination;
      if(PLANET_ORBITS[destination])state.spaceReturnPosition=PLANET_ORBITS[destination].clone().add(new THREE.Vector3(0,15,0));
      state.arrivingInShip = true;
      if(destination==="space"&&state.spaceReturnPosition){
        await loadRegion("space");
        if(entities?.rustbucket)entities.rustbucket.position.copy(state.spaceReturnPosition);
      } else await loadRegion(destination);
      setCameraPreset(dimensions.camera.gameplay);
      warpOverlay.classList.remove("warp-active","atmospheric"); warpOverlay.style.display = "none";
      extranet.setLocation(destination);
      marketPanel.style.display="none";
    }
    mapOverlay.querySelectorAll("[data-destination]").forEach(button => button.addEventListener("click", () => warpTo(button.dataset.destination)));
    mapOverlay.querySelector("#system-map-close").addEventListener("click", () => { mapOverlay.style.display = "none"; });
    const isMobile = (window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 900px)").matches) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    
    

    // Music loops independently; SFX are one-shot and never replace music.
    let musicTrack = null;
    const sfxTracks = new Set();
    let audioUnlocked = false;

    function stopMusic() {
      if (!musicTrack) return;
      musicTrack.pause();
      musicTrack.currentTime = 0;
      musicTrack.src = "";
      musicTrack = null;
    }

    function playMusic(src) {
      stopMusic();
      const track = new Audio(new URL(src, document.baseURI).href);
      track.loop = true;
      track.volume = 0.55;
      track.preload = "auto";
      track.addEventListener("error", () => console.error("Could not load music:", track.src), { once: true });
      musicTrack = track;
      if (audioUnlocked) track.play().catch(error => console.warn("Music playback is waiting for interaction:", error));
    }

    function playSfx(src, onEnded = null) {
      const track = new Audio(new URL(src, document.baseURI).href);
      track.loop = false;
      track.volume = 0.7;
      track.preload = "auto";
      sfxTracks.add(track);
      const cleanup = () => {
        sfxTracks.delete(track);
        if (onEnded) onEnded();
      };
      track.addEventListener("ended", cleanup, { once: true });
      track.addEventListener("error", () => {
        sfxTracks.delete(track);
        console.error("Could not load SFX:", track.src);
      }, { once: true });
      if (audioUnlocked) track.play().catch(error => console.warn("SFX playback is waiting for interaction:", error));
      return track;
    }

    function stopSfx(track = null) {
      const tracks = track ? [track] : [...sfxTracks];
      for (const item of tracks) {
        item.pause();
        item.currentTime = 0;
        item.src = "";
        sfxTracks.delete(item);
      }
    }

    function unlockAudio() {
      if (!audioUnlocked) audioUnlocked = true;
      if (state.stage === "title" && !musicTrack) playMusic("./hud/senji-v2-ov.mp3");
      else if (musicTrack?.paused) musicTrack.play().catch(error => console.warn("Music playback is waiting for interaction:", error));
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


    function disposeRegion() {
      if (keyboardController) {
        keyboardController.destroy();
        keyboardController = null;
      }
      ben = null;
      if (physics) { physics.dispose(); physics = null; }
      entities = null;
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
      loadingRegion = name; disposeRegion();
      if (!name) { loadedRegion = null; loadingRegion = null; return; }
      const group = new THREE.Group();
      group.name = name === "space" ? "SolarSystemScene" : name === "moon" ? "MoonScene" : "EarthScene";
      try {
        if (name === "space") {
          scene.background = new THREE.Color(0x02040a); scene.fog = null;
          titleObjects = createSolarSystem(group);
          if (state.stage === "gameplay") {
            const { ship } = createRustbucket(group); configureShip(ship);
            if(state.spaceReturnPosition)ship.position.copy(state.spaceReturnPosition);
            physics = await createPhysics(); physics.setEnvironment("space"); physics.addVehicle(ship);
            entities = { rustbucket: ship }; regionGroup = group; scene.add(regionGroup);
            keyboardController = createKeyboard({
              entities,camera,joystick,updateCamera,isMobile,initialSelected:"rustbucket",onJump:openSystemMap,getLift:()=>Number(liftInput.value),
              onToggleRamp:()=>{ship.userData.toggleRamp?.();rampButton.textContent=ship.userData.getRampOpen?.()?"CLOSE RAMP":"OPEN RAMP";},
              onSelect:selected=>{liftControl.style.display=selected==="rustbucket"?"flex":"none";rampButton.style.display=selected==="rustbucket"?"block":"none";}
            });
          } else { regionGroup=group; scene.add(regionGroup); }
          loadedRegion=name; loadingRegion=null; return;
        } else if (name === "moon") {
          scene.background=new THREE.Color(0x080b14);scene.fog=new THREE.Fog(0x080b14,90,360);
          createMoonInterior(group);
          const {ship}=createRustbucket(group);configureShip(ship);
          physics=await createPhysics();physics.setEnvironment("planet");physics.addStaticScene(group);physics.addVehicle(ship);
          entities={rustbucket:ship};regionGroup=group;scene.add(regionGroup);
          keyboardController=createKeyboard({
            entities,camera,joystick,updateCamera,isMobile,initialSelected:"rustbucket",onJump:openSystemMap,getLift:()=>Number(liftInput.value),
            onToggleRamp:()=>{ship.userData.toggleRamp?.();rampButton.textContent=ship.userData.getRampOpen?.()?"CLOSE RAMP":"OPEN RAMP";},
            onSelect:selected=>{liftControl.style.display=selected==="rustbucket"?"flex":"none";rampButton.style.display=selected==="rustbucket"?"block":"none";}
          });
          loadedRegion=name;loadingRegion=null;return;

        } else if (PLANET_WORLDS[name]) {
          const world=PLANET_WORLDS[name];
          scene.background=new THREE.Color(world.sky);
          scene.fog=new THREE.Fog(world.sky,38,190);
          const {marketPosition}=createPlanetInterior(group,name);
          const {ship}=createRustbucket(group);configureShip(ship);ship.position.set(0,2,13);
          physics=await createPhysics();physics.setEnvironment("planet");physics.addStaticScene(group);physics.addVehicle(ship);
          entities={rustbucket:ship};regionGroup=group;scene.add(regionGroup);
          keyboardController=createKeyboard({
            entities,camera,joystick,updateCamera,isMobile,initialSelected:"rustbucket",onJump:openSystemMap,getLift:()=>Number(liftInput.value),
            onToggleRamp:()=>{ship.userData.toggleRamp?.();rampButton.textContent=ship.userData.getRampOpen?.()?"CLOSE RAMP":"OPEN RAMP";},
            onSelect:selected=>{liftControl.style.display=selected==="rustbucket"?"flex":"none";rampButton.style.display=selected==="rustbucket"?"block":"none";}
          });
          regionGroup.userData.marketPosition=marketPosition;
          loadedRegion=name;loadingRegion=null;return;
        } else if (name === "earth") {
          // Earth interior: Bellwood, the storage unit, the crew, and the Rustbucket.

          createEarthInterior(scene, group);
          const { unit } = createKevinStorageUnit(group);
          const { ship } = createRustbucket(group);

          physics = await createPhysics();
          physics.setEnvironment("planet");
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
              carried.scale.set(0.5,0.5,0.5);
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
          
          const benCharacter = createBen({ createHumanRig });
          const chromastoneVisual=createChromastone();
          benCharacter.group.add(chromastoneVisual);
          chromastoneVisual.visible=phaseTwo.getChromastoneActive();
          omnitrixSlider.value=phaseTwo.getChromastoneActive()?"1":"0";
          if(phaseTwo.getChromastoneActive())benCharacter.group.children.forEach(child=>{if(child!==chromastoneVisual)child.visible=false;});
          joystick.buttons.querySelector("#pick-button").textContent=phaseTwo.getChromastoneActive()?"↯":"✋";
          omnitrixControl.querySelector("b").textContent=phaseTwo.getChromastoneActive()?"CHROMASTONE":"BEN";
          omnitrixSlider.oninput=()=>{
            const active=Number(omnitrixSlider.value)===1;
            phaseTwo.setChromastoneActive(active);
            chromastoneVisual.visible=active;
            benCharacter.group.children.forEach(child=>{if(child!==chromastoneVisual)child.visible=!active;});
            joystick.buttons.querySelector("#pick-button").textContent=active?"↯":"✋";
            omnitrixControl.querySelector("b").textContent=active?"CHROMASTONE":"BEN";
          };
          benCharacter.group.userData.performChromastoneAttack=()=>{
            if(!phaseTwo.spendEnergy("Chromastone",8))return;
            const beam=new THREE.Mesh(new THREE.CylinderGeometry(.055,.12,7,8),new THREE.MeshBasicMaterial({color:0x8b63ff,transparent:true,opacity:.9}));
            beam.rotation.x=Math.PI/2;beam.position.set(0,1.65,-3.8);chromastoneVisual.add(beam);
            window.setTimeout(()=>{chromastoneVisual.remove(beam);beam.geometry.dispose();beam.material.dispose();},180);
          };
          const gwenCharacter = createGwen({ createHumanRig });
          const kevinCharacter = createKevin({ createHumanRig });
          const rookCharacter = createRook({ createHumanRig });
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
              if(name==="ben"&&phaseTwo.getChromastoneActive()){character.group.userData.performChromastoneAttack?.();return;}
              character.group.userData.actionActive = true;
              character.group.userData.actionRemaining = 0.78;
              character.rig.playAnimation("punch");
            };
            character.group.userData.performPickup = () => {
              if(name==="ben"&&phaseTwo.getChromastoneActive()){phaseTwo.recharge("Chromastone",12);return;}
              tryPickup(name, character.group, character.rig);
            };
            characterEntities[name] = character.group;
            group.add(character.group);
            physics.addCharacter(character.group);
          }
          ben = benCharacter.group;
          entities = { ...characterEntities, rustbucket: ship };
          regionGroup = group;
          scene.add(regionGroup);
          keyboardController = createKeyboard({
            entities, camera, joystick, updateCamera, isMobile, initialSelected: state.arrivingInShip ? "rustbucket" : "ben",
            onJump: openSystemMap,
            onToggleRamp: () => { ship.userData.toggleRamp?.(); rampButton.textContent = ship.userData.getRampOpen?.() ? "CLOSE RAMP" : "OPEN RAMP"; },
            getLift: () => Number(liftInput.value),
            onSelect: selected => {
              liftControl.style.display = selected === "rustbucket" ? "flex" : "none";
              rampButton.style.display = selected === "rustbucket" ? "block" : "none";
              if (selected !== "rustbucket") liftInput.value = "0";
            }
          });
          loadedRegion = name;
          loadingRegion = null;
          if (name === "earth" && startRequested && state.stage === "prelude") state.stage = "gameplay";
          return;
        }
        regionGroup=group;scene.add(regionGroup);loadedRegion=name;
      } catch(error) {
        console.error("Could not load scene:",name,error);loadedRegion=null;
      } finally { loadingRegion=null; }
    }
    loadRegion("space");

    function updateStage() {
      if (activeStage === state.stage) return;
      activeStage = state.stage;

      if (activeStage === "title") {
        state.currentScene = "space";
        if (loadedRegion !== "space" && !loadingRegion) loadRegion("space");
        preludeScreen.style.display = "none";
        titleScreen.setVisible(true);
        joystick.setVisible(false);
        
        setCameraPreset(dimensions.camera.title);
        playMusic("./hud/senji-v2-ov.mp3");
      } else if (activeStage === "prelude") {
        state.currentScene = "earth";
        titleScreen.setVisible(false);
        joystick.setVisible(false);
        setCameraPreset(dimensions.camera.gameplay);
        if (loadedRegion !== "earth" && loadingRegion !== "earth") loadRegion("earth");
        
        preludeScreen.style.display = "flex";
        stopMusic();
        dialogueSfx = playSfx("./hud/ov-final-dialogues.mp3", startGameplay);
      } else if (activeStage === "gameplay") {
        if (loadedRegion !== state.currentScene && !loadingRegion) loadRegion(state.currentScene);
        titleScreen.setVisible(false);
        preludeScreen.style.display = "none";
        joystick.setVisible(isMobile);
        
        
        setCameraPreset(dimensions.camera.gameplay);
        playMusic("./hud/neodevol-ov.mp3");
      } else {
        titleScreen.setVisible(false);
        preludeScreen.style.display = "none";
        joystick.setVisible(isMobile && activeStage === "gameplay");
        
        stopMusic();
      }
    }

    const marketButton=document.createElement("button");marketButton.id="planet-market-button";marketButton.textContent="OPEN MARKETPLACE";marketButton.addEventListener("click",openPlanetMarket);document.body.appendChild(marketButton);
    const PLANET_ORBITS={augstaka:new THREE.Vector3(174,12,-115),anodyne:new THREE.Vector3(-148,18,-125),galvan:new THREE.Vector3(191,8,145),incursia:new THREE.Vector3(-168,-8,150)};
    let planetEntryCooldown=0;
    async function enterNearbyPlanet(){
      if(state.currentScene!=="space"||loadedRegion!=="space"||!entities?.rustbucket||planetEntryCooldown>0)return;
      const ship=entities.rustbucket;
      for(const [key,center] of Object.entries(PLANET_ORBITS)){
        if(ship.position.distanceTo(center)<13){
          state.spaceReturnPosition=center.clone().add(new THREE.Vector3(0,15,0));
          planetEntryCooldown=3;warpOverlay.querySelector("#warp-caption").textContent="ATMOSPHERIC ENTRY";
          warpOverlay.classList.add("atmospheric");warpOverlay.style.display="flex";warpOverlay.classList.remove("warp-active");void warpOverlay.offsetWidth;warpOverlay.classList.add("warp-active");
          await new Promise(resolve=>window.setTimeout(resolve,1250));
          state.currentScene=key;await loadRegion(key);setCameraPreset(dimensions.camera.gameplay);
          extranet.setLocation(key);warpOverlay.classList.remove("warp-active","atmospheric");warpOverlay.style.display="none";
          return;
        }
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
      phaseTwoButton.style.display=state.stage==="gameplay"?"grid":"none";
      hep.style.display=state.stage==="gameplay"?"flex":"none";
      carriedHud.style.display=state.stage==="gameplay"?"flex":"none";
      omnitrixControl.style.display=state.stage==="gameplay"&&keyboardController?.selected==="ben"?"flex":"none";
      if (state.stage !== "gameplay") { liftControl.style.display = "none"; rampButton.style.display = "none"; }
      if (state.stage !== "gameplay" && state.paused) setPaused(false);

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      planetEntryCooldown=Math.max(0,planetEntryCooldown-delta);

      if (!state.paused && state.stage === "gameplay" && keyboardController && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex") {
        keyboardController.update(delta);
      }
      if (!state.paused && state.stage==="gameplay"&&state.currentScene==="space") enterNearbyPlanet();
      if (!state.paused && physics && state.stage === "gameplay" && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex") physics.step(delta);
      if (!state.paused && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex" && entities?.rustbucket?.userData.updateVehicle) entities.rustbucket.userData.updateVehicle(delta);

      if (state.stage === "gameplay") {
        extranet.setLocation(state.currentScene);
        if(PLANET_WORLDS[state.currentScene]&&entities?.rustbucket&&regionGroup?.userData.marketPosition){
          const near=entities.rustbucket.position.distanceTo(regionGroup.userData.marketPosition)<15;
          const marketButtonVisible=near&&marketPanel.style.display!=="flex";
          marketButton.style.display=marketButtonVisible?"block":"none";
        } else marketButton.style.display="none";
        if(!state.paused)phaseTwo.update(delta,(keyboardController?.selected||"ben").replace(/^./,c=>c.toUpperCase()),PLANET_WORLDS[state.currentScene]?.species||state.currentScene,state.currentScene!=="space");
        const selectedName=keyboardController?.selected||"ben";
        const status=phaseTwo.getStatus(selectedName==="rustbucket"?"Rustbucket":selectedName==="ben"&&phaseTwo.getChromastoneActive()?"Chromastone":selectedName[0].toUpperCase()+selectedName.slice(1));
        hepHealth.style.height=status.health+"%";hepEnergy.style.height=status.energy+"%";
        hep.title="HEALTH "+Math.round(status.health)+"% / "+status.energyLabel+" "+Math.round(status.energy)+"%";
        omnitrixControl.style.display=selectedName==="ben"?"flex":"none";
        refreshCarriedHud();
      }

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
      liftControl.remove(); rampButton.remove(); mapOverlay.remove(); warpOverlay.remove(); marketPanel.remove(); marketButton.remove();
      extranet.close();
      disposeRegion();
      titleScreen.destroy();
      preludeScreen.remove();
      joystick.destroy();
      
      
      stopMusic();
      renderer.dispose();
    }, { once: true });