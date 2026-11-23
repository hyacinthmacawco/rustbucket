import * as THREE from "three";
import { AudioPlayer } from "../ui/AudioPlayer.js";
import { Camera } from "./Camera.js";
import { PhysicsEngine } from "./PhysicsEngine.js";
import { Title } from "../title/Title.js";
import { Joystick } from "../ui/Joystick.js";
import { Pause } from "../ui/Pause.js";
import { Extranet } from "../extranet/Extranet.js";
import { SolarSystem } from "../systems/SolarSystem.js";
import { AugstakaSystem } from "../systems/AugstakaSystem.js";
import { AnodyneSystem } from "../systems/AnodyneSystem.js";
import { GalvanSystem } from "../systems/GalvanSystem.js";
import { IncursiaSystem } from "../systems/IncursiaSystem.js";
import { EarthInterior } from "../interiors/EarthInterior.js";
import { KevinStorageUnit } from "../interiors/KevinStorageUnit.js";
import { Suitcases } from "../interiors/Suitcases.js";
import { AugstakaInterior } from "../interiors/AugstakaInterior.js";
import { AnodyneInterior } from "../interiors/AnodyneInterior.js";
import { GalvanPrimeInterior } from "../interiors/GalvanPrimeInterior.js";
import { IncursiaInterior } from "../interiors/IncursiaInterior.js";
import { Rustbucket } from "../team/Rustbucket.js";
import { AlienShip } from "../technology/ships/AlienShip.js";
import { Human as HumanRig } from "../species/Human.js";
import { Highbreed } from "../species/Highbreed.js";
import { Incursean } from "../species/Incursean.js";
import { Anodite } from "../species/Anodite.js";
import { Galvan } from "../species/Galvan.js";
import { LunarSurface } from "../interiors/LunarSurface.js";
import { Ben } from "../team/Ben.js";
import { Gwen } from "../team/Gwen.js";
import { Kevin } from "../team/Kevin.js";
import { Rook } from "../team/Rook.js";
import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/+esm";
import { Chromastone } from "../omnitrix/Chromastone.js";

const PLANET_INTERIOR_CLASSES = {
  augstaka: AugstakaInterior,
  anodyne: AnodyneInterior,
  galvan: GalvanPrimeInterior,
  incursia: IncursiaInterior
};
const PLANET_WORLDS = Object.fromEntries(
  Object.entries(PLANET_INTERIOR_CLASSES).map(([key, Interior]) => [key, Interior.WORLD])
);
const SPECIES_RELATIONSHIPS = {
  Highbreed: Highbreed.relationships,
  Incursean: Incursean.relationships,
  Anodite: Anodite.relationships,
  Galvan: Galvan.relationships,
  Human: HumanRig.relationships
};




export class React {
  static state = { stage: "title", currentScene: "space", arrivingInShip: false, spaceReturnPosition: new THREE.Vector3(0, 2080, 0) };

  constructor() {
    const state = React.state;
    this.cameraConfig = {
      title: { position: [0, 0, 600000], target: [-137150, 0, 0], fov: 55, near: 0.1, far: 2000000, distance: 615500, minDistance: 10000, maxDistance: 1000000, yaw: 0, pitch: 0 },
      gameplay: { position: [0, 5.3, 18.5], target: [0, 1.8, 0], fov: 43, near: 0.1, far: 2000000, distance: 18.5, minDistance: 8, maxDistance: 30000, yaw: 0, pitch: 0.18 },
      dragSensitivity: 0.006, pitchSensitivity: 0.004, minPitch: -0.15, maxPitch: 1.0
    };
    

    const cameraConfig = this.cameraConfig;
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

    const cameraController = new Camera(THREE, this.cameraConfig.title, window.innerWidth / window.innerHeight);
    const camera = cameraController.camera;
    scene.add(camera);

    let activeStage = null;
    let cameraTarget = new THREE.Vector3();
    let cameraYaw = 0;
    let cameraPitch = 0;
    let cameraDistance = 1;
    let cameraPreset = this.cameraConfig.title;
    let ben = null;
    let keyboardController = null;
    let physics = null;
    let entities = null;
    let alienPatrols = [];
    const passengers = [];
    let chromastoneActive = false;

    this.updateCamera = () => {
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

    this.setCameraPreset = (preset) => {
      cameraPreset = preset;
      cameraController.setPreset(preset, window.innerWidth / window.innerHeight);

      cameraTarget.set(...preset.target);
      const position = new THREE.Vector3(...preset.position);
      const offset = position.sub(cameraTarget);
      cameraDistance = offset.length();
      cameraYaw = Math.atan2(offset.x, offset.z);
      cameraPitch = Math.atan2(offset.y, Math.hypot(offset.x, offset.z));
      this.updateCamera();
    }

    this.setCameraPreset(this.cameraConfig.title);

    // UI overlays are created once; the animation loop controls visibility.
    const titleScreen = new Title({ onNewGame: () => { state.stage = "prelude"; } });

    const preludeScreen = document.createElement("div");
    preludeScreen.id = "prelude-screen";
    preludeScreen.innerHTML = '<div id="prelude-title">A NEW DAWN</div><button id="skip-dialogue" type="button">SKIP</button>';
    document.body.appendChild(preludeScreen);
    const preludeTitle = preludeScreen.querySelector("#prelude-title");
    let startRequested = false;
    let dialogueSfx = null;
    this.startGameplay = () => {
      if (state.stage !== "prelude") return;
      startRequested = true;
      if (dialogueSfx) { stopSfx(dialogueSfx); dialogueSfx = null; }
      stopMusic();
      if (loadedRegion === "earth") state.stage = "gameplay";
      else preludeTitle.textContent = "LOADING";
    }
    preludeScreen.querySelector("#skip-dialogue").addEventListener("click", this.startGameplay);

    const joystick = new Joystick();
    joystick.setVisible(false);
    const pause = new Pause({
      onResume: () => this.setPaused(false)
    });
    const pauseOverlay = pause.create();

    this.setPaused = value => {
      state.paused = Boolean(value);
      pause.setVisible(state.paused);

      if (audioPlayer.musicTrack) {
        if (state.paused) {
          audioPlayer.musicTrack.pause();
        } else if (audioPlayer.unlocked) {
          audioPlayer.musicTrack.play().catch(() => {});
        }
      }
    };

    this.pauseKey = event => {
      if (event.key === "Escape" && state.stage === "gameplay") {
        this.setPaused(!state.paused);
      }
    };
    document.addEventListener("keydown", this.pauseKey);

    this.attachPassengers = ship => {
      passengers.forEach((passenger, index) => passenger.attachToRustbucket(ship, index));
    };
    this.deliverPassengers = (worldKey, interior, ship) => {
      for (let index = passengers.length - 1; index >= 0; index--) {
        const passenger = passengers[index];
        const payment = passenger.deliverAtHomeworld(worldKey, interior.root, ship);
        if (payment) {
          interior.populationManager.inhabitants.push(passenger.group);
          passengers.splice(index, 1);
        } else {
          passenger.attachToRustbucket(ship, index);
        }
      }
    };
    this.configureShip = ship => {
      const owner = ship.userData.statusOwner;
      ship.userData.maxHealth = 100;
      ship.userData.health = owner.health;
      ship.userData.energy = owner.energy;
      ship.userData.takeDamage = amount => {
        owner.takeDamage(amount);
        ship.userData.health = owner.health;
        return owner.health;
      };
      ship.userData.onFuelUse = amount => owner.useEnergy(amount * 0.45);
      const fire = ship.userData.performAttack;
      ship.userData.performAttack = () => {
        if (owner.useEnergy(1)) fire?.();
      };
      return ship;
    };
    this.spawnPatrols = (parent, systemKey) => {
      const systems = {
        solar: {species:'Human',planet:'earth',center:new THREE.Vector3(0,0,0)},
        augstaka: {species:'Highbreed',planet:'augstaka',center:new THREE.Vector3(274300,0,0)},
        anodyne: {species:'Anodite',planet:'anodyne',center:new THREE.Vector3(274300,0,0)},
        galvan: {species:'Galvan',planet:'galvan',center:new THREE.Vector3(274300,0,0)},
        incursia: {species:'Incursean',planet:'incursia',center:new THREE.Vector3(274300,0,0)}
      };
      const config = systems[systemKey];
      if (!config) return;
      alienPatrols = [];
      for (let index=0; index<3; index++) alienPatrols.push(new AlienShip(parent,config.species,config.planet,config.center,index));
    }

    const combatWorldPosition = new THREE.Vector3();
    const combatSegment = new THREE.Vector3();
    const combatClosest = new THREE.Vector3();
    this.updatePatrolCombat = (delta) => {
      const ship = entities?.rustbucket;
      if (!ship || !alienPatrols.length || state.currentScene !== 'space') return;
      ship.updateMatrixWorld(true);
      for (const patrol of [...alienPatrols]) {
        const hostile = ["Ben", "Gwen", "Kevin", "Rook"].some(member => Number(SPECIES_RELATIONSHIPS[patrol.species]?.[member] ?? 0) < -30);
        patrol.update(delta,ship,hostile,() => {
          ship.userData.takeDamage?.(5);

        });
        if (!patrol.destroyed) {
          for (const laser of [...(ship.userData.getLasers?.() || [])]) {
            laser.mesh.getWorldPosition(combatWorldPosition);
            const start = laser.previousWorldPosition || combatWorldPosition;
            combatSegment.subVectors(combatWorldPosition,start);
            const segmentLengthSq = combatSegment.lengthSq();
            const segmentT = segmentLengthSq ? THREE.MathUtils.clamp(new THREE.Vector3().subVectors(patrol.group.position,start).dot(combatSegment)/segmentLengthSq,0,1) : 0;
            combatClosest.copy(start).addScaledVector(combatSegment,segmentT);
            if (patrol.group.position.distanceTo(combatClosest) < 55) {
              patrol.takeDamage(laser.damage || 5);
              ship.userData.removeLaser?.(laser);

              break;
            }
          }
        }
      }
      alienPatrols = alienPatrols.filter(patrol => {
        if (!patrol.destroyed) return true;
        patrol.dispose();
        return false;
      });
    }

    const extranet = new Extranet({
      onContinue: () => extranet.close(),
      onComplete: () => playSfx("./files/songs/ov-end-credits.mp3"),
      onJumpSystem: key => this.warpToSystem(key)
    });
    const hep=document.createElement("button");hep.id="hep-control";hep.type="button";hep.setAttribute("aria-label","Health and energy; click to pause");
    hep.innerHTML='<span class="hep-meter"><i id="hep-health-fill"></i><b>H</b></span><span class="hep-meter"><i id="hep-energy-fill"></i><b>E</b></span>';
    hep.addEventListener("click",()=>this.setPaused(!state.paused));
    document.body.append(hep);
    const hepHealth=hep.querySelector("#hep-health-fill"),hepEnergy=hep.querySelector("#hep-energy-fill");
    const abilityDial=document.createElement("div");
    abilityDial.id="ability-dial";
    abilityDial.innerHTML='<div id="ability-dial-title">OMNITRIX</div><div id="ability-dial-ring"><div id="ability-dial-indicator"></div><div id="ability-dial-center">BEN</div></div><div id="ability-dial-mode">HUMAN</div>';
    document.body.appendChild(abilityDial);
    const abilityDialRing=abilityDial.querySelector("#ability-dial-ring");
    const abilityDialIndicator=abilityDial.querySelector("#ability-dial-indicator");
    const abilityDialCenter=abilityDial.querySelector("#ability-dial-center");
    const abilityDialMode=abilityDial.querySelector("#ability-dial-mode");
    const abilityModes={ben:["HUMAN","CHROMASTONE"],kevin:["METAL","STONE","CRYSTAL","RUBBER"],gwen:["SHIELD","BOLT","HEAL","BIND"],rook:["GUN","SWORD"]};
    const abilityState={ben:chromastoneActive?1:0,kevin:0,gwen:0,rook:0};
    let abilityPointer=null;
    this.setAbilityMode = (character,index) => {
      const modes=abilityModes[character]||[];if(!modes.length)return;
      const next=(index+modes.length)%modes.length;abilityState[character]=next;
      const mode=modes[next];
      abilityDial.querySelector("#ability-dial-title").textContent=({ben:"OMNITRIX",kevin:"MATERIAL",gwen:"SPELLBOOK",rook:"PROTO-TOOL"})[character];
      abilityDialCenter.textContent=character==="ben"?(next?"CH":"B"):character[0].toUpperCase();
      abilityDialMode.textContent=mode;
      abilityDialIndicator.style.transform="rotate("+(next/modes.length*360)+"deg) translateY(-34px)";
      if(character==="ben"){
        chromastoneActive = next === 1;
        const visual=entities?.ben?.userData.chromastoneVisual;
        if(visual)visual.visible=next===1;
        entities?.ben?.children?.forEach(child=>{if(child!==visual)child.visible=next===0;});
        const pickButton=joystick.buttons.querySelector("#pick-button");if(pickButton)pickButton.textContent="PICK";
      }
      if(entities?.[character])entities[character].userData.toolMode=mode;
    }
    this.updateAbilityDial = (character) => {
      const modes=abilityModes[character];
      abilityDial.style.display=state.stage==="gameplay"&&Boolean(modes)?"flex":"none";
      if(!modes)return;
      const index=abilityState[character]||0;
      abilityDial.querySelector("#ability-dial-title").textContent=({ben:"OMNITRIX",kevin:"MATERIAL",gwen:"SPELLBOOK",rook:"PROTO-TOOL"})[character];
      abilityDialCenter.textContent=character==="ben"?(index?"CH":"B"):character[0].toUpperCase();
      abilityDialMode.textContent=modes[index];
      abilityDialIndicator.style.transform="rotate("+(index/modes.length*360)+"deg) translateY(-34px)";
    }
    this.chooseAbilityFromPointer = (event) => {
      const rect=abilityDialRing.getBoundingClientRect();
      const angle=(Math.atan2(event.clientX-(rect.left+rect.width/2),-(event.clientY-(rect.top+rect.height/2)))+Math.PI*2)%(Math.PI*2);
      const character=keyboardController?.selected||"ben",modes=abilityModes[character]||[];
      this.setAbilityMode(character,Math.round(angle/(Math.PI*2)*modes.length)%modes.length);
    }
    abilityDialRing.addEventListener("pointerdown",event=>{event.preventDefault();abilityPointer=event.pointerId;abilityDialRing.setPointerCapture(event.pointerId);this.chooseAbilityFromPointer(event);});
    abilityDialRing.addEventListener("pointermove",event=>{if(event.pointerId===abilityPointer&&event.buttons)this.chooseAbilityFromPointer(event);});
    abilityDialRing.addEventListener("pointerup",event=>{if(event.pointerId===abilityPointer)abilityPointer=null;});
    abilityDialRing.addEventListener("pointercancel",()=>{abilityPointer=null;});
    const extranetButton = extranet.createButton();
    const rampButton = document.createElement("button");
    rampButton.id = "ramp-toggle-button";
    rampButton.type = "button";
    rampButton.textContent = "OPEN RAMP";
    document.body.appendChild(rampButton);
    rampButton.addEventListener("click", () => { const ship = entities?.rustbucket; ship?.userData.toggleRamp?.(); rampButton.textContent = ship?.userData.getRampOpen?.() ? "CLOSE RAMP" : "OPEN RAMP"; });
    joystick.buttons.appendChild(rampButton);
    const mapOverlay = document.createElement("div");
    mapOverlay.id = "system-map-overlay";
    mapOverlay.innerHTML = '<div id="system-map-panel"><div id="system-map-title">PLANETARY NAVIGATION</div><div id="system-map-graphic"><button class="system-map-node sun-node" disabled>SUN</button><button class="system-map-node earth-node" data-destination="earth">EARTH<br><small>BELLWOOD</small></button><button class="system-map-node moon-node" data-destination="moon">MOON</button><button class="system-map-node" style="left:8%;top:8%" data-destination="augstaka">AUGSTAKA</button><button class="system-map-node" style="left:70%;top:8%" data-destination="anodyne">ANODYNE</button><button class="system-map-node" style="left:12%;top:68%" data-destination="galvan">GALVAN PRIME</button><button class="system-map-node" style="right:8%;top:68%" data-destination="incursia">INCURSIA</button></div><div id="system-map-actions"><button data-destination="space">TAKE OFF / RETURN TO ORBIT</button><button id="system-map-close">CLOSE</button></div></div>';
    document.body.appendChild(mapOverlay);

    const warpOverlay = document.createElement("div");
    warpOverlay.id = "warp-overlay";
    warpOverlay.innerHTML = '<div id="warp-flash"></div><div id="warp-caption">SPACE WARP</div>';
    document.body.appendChild(warpOverlay);
    this.openSystemMap = () => {
      if (state.stage === "gameplay" && keyboardController?.selected === "rustbucket") extranet.openOmnidata();
    }
    this.warpToSystem = async (requestedKey) => {
      const systemKey = ({solar:"solar",highbreed:"augstaka",incursean:"incursia",anodite:"anodyne",galvan:"galvan"})[requestedKey];
      if (!systemKey) return;
      extranet.destroy();
      mapOverlay.style.display = "none";
      warpOverlay.querySelector("#warp-caption").textContent = "INTERSTELLAR JUMP";
      warpOverlay.classList.remove("atmospheric");
      warpOverlay.style.display = "flex";
      warpOverlay.classList.remove("warp-active"); void warpOverlay.offsetWidth; warpOverlay.classList.add("warp-active");
      await new Promise(resolve => window.setTimeout(resolve, 1250));
      activeSystem = systemKey;
      state.currentScene = "space";
      const homePlanet = ({ solar: "earth", augstaka: "augstaka", anodyne: "anodyne", galvan: "galvan", incursia: "incursia" })[systemKey];
      const homeOrbit = SYSTEM_PLANET_ORBITS[systemKey]?.[homePlanet] || new THREE.Vector3();
      state.spaceReturnPosition = homeOrbit.clone().add(new THREE.Vector3(0, getPlanetClearance(homePlanet), 0));
      await this.loadRegion(systemKey === "solar" ? "space" : "system-" + systemKey);
      if (entities?.rustbucket) {
        entities.rustbucket.position.copy(state.spaceReturnPosition);
        entities.rustbucket.userData.vehicleBody?.setTranslation({x:state.spaceReturnPosition.x,y:state.spaceReturnPosition.y,z:state.spaceReturnPosition.z},true);
        entities.rustbucket.userData.vehicleBody?.setLinvel({x:0,y:0,z:0},true);
      }
      this.setCameraPreset(cameraConfig.gameplay);
      extranet.setLocation(systemKey === "solar" ? "space" : systemKey);
      warpOverlay.classList.remove("warp-active"); warpOverlay.style.display = "none";
    }
    this.warpTo = async (destination) => {
      mapOverlay.style.display = "none";
      if (!["earth","moon","space","augstaka","anodyne","galvan","incursia"].includes(destination)) return;
      const atmosphericTransition=Boolean(destination==="earth"||destination==="moon"||PLANET_WORLDS[destination]||PLANET_WORLDS[state.currentScene]);
      warpOverlay.querySelector("#warp-caption").textContent=atmosphericTransition?"":"SPACE WARP";
      warpOverlay.classList.toggle("atmospheric",atmosphericTransition);
      warpOverlay.style.display = "flex";
      warpOverlay.classList.remove("warp-active"); void warpOverlay.offsetWidth; warpOverlay.classList.add("warp-active");
      await new Promise(resolve => window.setTimeout(resolve, 1250));
      state.currentScene = destination;
      const destinationOrbit = SYSTEM_PLANET_ORBITS[activeSystem]?.[destination];
      if(destinationOrbit)state.spaceReturnPosition=destinationOrbit.clone().add(new THREE.Vector3(0,getPlanetClearance(destination),0));
      state.arrivingInShip = true;
      if(destination==="space"&&state.spaceReturnPosition){
        const returnRegion = activeSystem === "solar" ? "space" : "system-" + activeSystem;
        await this.loadRegion(returnRegion);
        if(entities?.rustbucket){
          entities.rustbucket.position.copy(state.spaceReturnPosition);
          entities.rustbucket.userData.vehicleBody?.setTranslation({x:state.spaceReturnPosition.x,y:state.spaceReturnPosition.y,z:state.spaceReturnPosition.z},true);
          entities.rustbucket.userData.vehicleBody?.setLinvel({x:0,y:0,z:0},true);
        }
      } else await this.loadRegion(destination);
      this.setCameraPreset(cameraConfig.gameplay);
      warpOverlay.classList.remove("warp-active","atmospheric"); warpOverlay.style.display = "none";
      extranet.setLocation(destination === "space" ? (activeSystem === "solar" ? "space" : activeSystem) : destination);
    }
    mapOverlay.querySelectorAll("[data-destination]").forEach(button => button.addEventListener("click", () => this.warpTo(button.dataset.destination)));
    mapOverlay.querySelector("#system-map-close").addEventListener("click", () => { mapOverlay.style.display = "none"; });
    const isMobile = (window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 900px)").matches) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    
    

    const audioPlayer = new AudioPlayer();
    const playMusic = src => audioPlayer.playMusic(src);
    const stopMusic = () => audioPlayer.stopMusic();
    const playSfx = (src, onEnded = null) => audioPlayer.playSfx(src, onEnded);
    const stopSfx = track => audioPlayer.stopSfx(track);
    this.unlockAudio = () => { audioPlayer.unlock(state.stage); }
    this.requestFullscreenOnGesture = () => {
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
    document.addEventListener("pointerdown", this.requestFullscreenOnGesture);
    document.addEventListener("touchend", this.requestFullscreenOnGesture, { passive: true });
    document.addEventListener("keydown", this.requestFullscreenOnGesture);
    document.addEventListener("pointerdown", this.unlockAudio);
    document.addEventListener("keydown", this.unlockAudio);

    // Pointer-based camera controls: one pointer rotates, two touch pointers
    // exclusively pinch-zoom. A pinch can never leak into the rotate handler.
    const cameraPointers = new Map();
    let draggingCamera = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let pinchDistance = 0;

    this.onPointerDown = (event) => {
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
    this.onPointerMove = (event) => {
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
            this.updateCamera();
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
      cameraYaw -= dx * cameraConfig.dragSensitivity;
      cameraPitch = THREE.MathUtils.clamp(
        cameraPitch + dy * cameraConfig.pitchSensitivity,
        cameraConfig.minPitch,
        cameraConfig.maxPitch
      );
      this.updateCamera();
    }
    this.onPointerUp = (event) => {
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

    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("wheel", e => {
      e.preventDefault();
      cameraDistance = THREE.MathUtils.clamp(
        cameraDistance + e.deltaY * 0.025,
        cameraPreset.minDistance,
        cameraPreset.maxDistance
      );
      this.updateCamera();
    }, { passive: false });

    // Region objects are imported and instantiated only after the camera is
    // found to be near that region. Each region is held in one removable group.
    let loadedRegion = null;
    let loadingRegion = null;
    let regionLoadId = 0;
    let regionGroup = null;
    let titleObjects = null;


    this.disposeObjectTree = (root) => {
      if (!root) return;
      root.traverse(object => {
        object.geometry?.dispose();
        if (!object.material) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value?.isTexture) value.dispose();
          }
          material.dispose();
        }
      });
    }

    this.disposeRegion = () => {
      keyboardController?.destroy();
      keyboardController = null;
      ben = null;
      physics?.dispose();
      physics = null;
      entities = null;
      for (const passenger of passengers) passenger.group.removeFromParent();
      if (regionGroup) {
        scene.remove(regionGroup);
        this.disposeObjectTree(regionGroup);
      }
      regionGroup = null;
      titleObjects = null;
      alienPatrols = [];
    }

    const sceneLoadError = document.createElement("section");
    sceneLoadError.id = "scene-load-error";
    sceneLoadError.setAttribute("role", "alert");
    sceneLoadError.style.cssText = "display:none;position:fixed;z-index:10000;inset:0;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.88);color:#eaffef;font:14px/1.5 monospace;text-align:center";
    const sceneLoadErrorCard = document.createElement("div");
    sceneLoadErrorCard.style.cssText = "max-width:420px;padding:24px;border:1px solid #65d889;background:#07150d";
    const sceneLoadErrorTitle = document.createElement("h2");
    sceneLoadErrorTitle.textContent = "SCENE COULD NOT LOAD";
    const sceneLoadErrorMessage = document.createElement("p");
    const sceneLoadRetry = document.createElement("button");
    sceneLoadRetry.type = "button";
    sceneLoadRetry.textContent = "RETRY";
    sceneLoadRetry.style.cssText = "margin-top:12px;padding:10px 24px;border:1px solid #65d889;background:#102b1b;color:#eaffef;font:inherit";
    sceneLoadErrorCard.append(sceneLoadErrorTitle, sceneLoadErrorMessage, sceneLoadRetry);
    sceneLoadError.appendChild(sceneLoadErrorCard);
    document.body.appendChild(sceneLoadError);
    let failedRegion = null;
    sceneLoadRetry.addEventListener("click", () => {
      if (failedRegion) this.loadRegion(failedRegion);
    });

    let activeSystem = "solar";
    this.loadRegion = async (name) => {
      if (loadingRegion === name || loadedRegion === name) return;
      const requestId = ++regionLoadId;
      loadingRegion = name;
      sceneLoadError.style.display = "none";
      failedRegion = null;
      this.disposeRegion();
      if (!name) { loadedRegion = null; loadingRegion = null; return; }
      const group = new THREE.Group();
      group.name = name === "space" ? "SolarSystemScene" : name === "moon" ? "MoonScene" : "EarthScene";
      try {
        if (name === "space") {
          scene.background = new THREE.Color(0x02040a); scene.fog = null;
          titleObjects = new SolarSystem(group);
          if (state.stage === "gameplay") {
            this.spawnPatrols(group,"solar");
            const rustbucket = new Rustbucket(group); const ship = rustbucket.ship; this.configureShip(ship);
            this.attachPassengers(ship);
            if(state.spaceReturnPosition)ship.position.copy(state.spaceReturnPosition);
            const nextPhysics = await PhysicsEngine.create();
          if (requestId !== regionLoadId) {
            nextPhysics.dispose();
            this.disposeObjectTree(group);
            return;
          }
          physics = nextPhysics; physics.setEnvironment("space"); physics.addVehicle(ship);
            entities = { rustbucket: ship }; regionGroup = group; scene.add(regionGroup);
            keyboardController = joystick.createKeyboard({
              entities,camera,joystick,this.updateCamera,isMobile,initialSelected:"rustbucket",onJump:this.openSystemMap,
              onToggleRamp:()=>{ship.userData.toggleRamp?.();rampButton.textContent=ship.userData.getRampOpen?.()?"CLOSE RAMP":"OPEN RAMP";},
              onSelect:selected=>{rampButton.style.display=selected==="rustbucket"?"block":"none";}
            });
          } else { regionGroup=group; scene.add(regionGroup); }
          loadedRegion=name; loadingRegion=null; return;
        } else if (name.startsWith("system-")) {
          const systemKey = name.slice("system-".length);
          const SystemClass = {augstaka:AugstakaSystem,anodyne:AnodyneSystem,galvan:GalvanSystem,incursia:IncursiaSystem}[systemKey];
          if (!SystemClass) throw new Error("Unknown star system: " + systemKey);
          scene.background = new THREE.Color(0x02040a); scene.fog = null;
          titleObjects = new SystemClass(group);
          if (state.stage === "gameplay") {
            this.spawnPatrols(group,systemKey);
            const rustbucket = new Rustbucket(group); const ship = rustbucket.ship; this.configureShip(ship);
            this.attachPassengers(ship);
            ship.position.set(15000,12,0);
            const nextPhysics = await PhysicsEngine.create();
            if (requestId !== regionLoadId) { nextPhysics.dispose(); this.disposeObjectTree(group); return; }
            physics = nextPhysics; physics.setEnvironment("space"); physics.addVehicle(ship);
            entities = {rustbucket:ship}; regionGroup = group; scene.add(regionGroup);
            keyboardController = joystick.createKeyboard({
              entities,camera,joystick,this.updateCamera,isMobile,initialSelected:"rustbucket",onJump:this.openSystemMap,
              onToggleRamp:()=>{ship.userData.toggleRamp?.();rampButton.textContent=ship.userData.getRampOpen?.()?"CLOSE RAMP":"OPEN RAMP";},
              onSelect:selected=>{rampButton.style.display=selected==="rustbucket"?"block":"none";}
            });
          } else { regionGroup=group; scene.add(regionGroup); }
          loadedRegion=name; loadingRegion=null; return;
        } else if (name === "moon") {
          scene.background=new THREE.Color(0x080b14);scene.fog=new THREE.Fog(0x080b14,90,360);
          new LunarSurface(group);
          const rustbucket = new Rustbucket(group); const ship = rustbucket.ship;this.configureShip(ship);
          this.attachPassengers(ship);
          physics=await PhysicsEngine.create();physics.setEnvironment("planet");physics.addStaticScene(group);physics.addVehicle(ship);
          entities={rustbucket:ship};regionGroup=group;scene.add(regionGroup);
          keyboardController=joystick.createKeyboard({
            entities,camera,joystick,this.updateCamera,isMobile,initialSelected:"rustbucket",onJump:this.openSystemMap,
            onToggleRamp:()=>{ship.userData.toggleRamp?.();rampButton.textContent=ship.userData.getRampOpen?.()?"CLOSE RAMP":"OPEN RAMP";},
            onSelect:selected=>{rampButton.style.display=selected==="rustbucket"?"block":"none";}
          });
          loadedRegion=name;loadingRegion=null;return;

        } else if (PLANET_WORLDS[name]) {
          const world = PLANET_WORLDS[name];
          scene.background = new THREE.Color(world.sky);
          scene.fog = new THREE.Fog(world.sky, 38, 190);
          const InteriorClass = PLANET_INTERIOR_CLASSES[name];
          const interior = new InteriorClass(group);
          group.userData.population = interior.populationManager;
          group.userData.interior = interior;

          const rustbucket = new Rustbucket(group);
          const ship = rustbucket.ship;
          this.configureShip(ship);
          ship.position.set(0, 2, 13);
          this.deliverPassengers(name, interior, ship);

          ship.userData.performPickup = () => {
            if (passengers.length >= 4) return;
            let nearest = null;
            let nearestDistance = 12;
            for (const person of interior.populationManager.inhabitants) {
              const passenger = person.userData.speciesInstance;
              if (!passenger || passenger.homeworld === name || passenger.boardedShip) continue;
              const distance = ship.position.distanceTo(person.position);
              if (distance < nearestDistance) {
                nearest = passenger;
                nearestDistance = distance;
              }
            }
            if (nearest && nearest.boardRustbucket(ship, passengers.length)) passengers.push(nearest);
          };

          const nextPhysics = await PhysicsEngine.create();
          if (requestId !== regionLoadId) {
            nextPhysics.dispose();
            this.disposeObjectTree(group);
            return;
          }
          physics = nextPhysics;
          physics.setEnvironment("planet");
          physics.addStaticScene(group);
          physics.addVehicle(ship);
          entities = { rustbucket: ship };
          regionGroup = group;
          scene.add(regionGroup);
          keyboardController = joystick.createKeyboard({
            entities, camera, joystick, this.updateCamera, isMobile, initialSelected: "rustbucket", onJump: this.openSystemMap,
            onToggleRamp: () => { ship.userData.toggleRamp?.(); rampButton.textContent = ship.userData.getRampOpen?.() ? "CLOSE RAMP" : "OPEN RAMP"; },
            onSelect: selected => { rampButton.style.display = selected === "rustbucket" ? "block" : "none"; }
          });
          loadedRegion = name;
          loadingRegion = null;
          return;
        } else if (name === "earth") {
          // Earth interior: Bellwood, the storage unit, the crew, and the Rustbucket.

          const earthEnvironment = new EarthInterior(scene, group);
          const population = earthEnvironment.populationManager;
          group.userData.population = population;
          group.userData.interior = earthEnvironment;
          earthEnvironment.populationManager = population;
          earthEnvironment.inhabitants = population.inhabitants;
          const storageUnit = new KevinStorageUnit(group); const unit = storageUnit.unit;
          const rustbucket = new Rustbucket(group); const ship = rustbucket.ship; this.configureShip(ship);
          this.attachPassengers(ship);

          const nextPhysics = await PhysicsEngine.create();
          if (requestId !== regionLoadId) {
            nextPhysics.dispose();
            this.disposeObjectTree(group);
            return;
          }
          physics = nextPhysics;
          physics.setEnvironment("planet");
          physics.addStaticScene(group);
          const suitcaseCollection = new Suitcases(group); const suitcases = suitcaseCollection.suitcases;
          physics.addVehicle(ship);
          const carriedSuitcases = new Map();
          let storedSuitcaseCount = 0;
          this.tryPickup = (characterName, characterGroup, rig) => {
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
          
          const benCharacter = new Ben({ HumanRig });
          const chromastoneVisual=new Chromastone().model;
          benCharacter.group.add(chromastoneVisual);
          chromastoneVisual.visible=chromastoneActive;
          benCharacter.group.userData.chromastoneVisual=chromastoneVisual;
          if(chromastoneActive)benCharacter.group.children.forEach(child=>{if(child!==chromastoneVisual)child.visible=false;});
          joystick.buttons.querySelector("#pick-button").textContent="PICK";
          benCharacter.group.userData.chromastoneVisual=chromastoneVisual;
          this.setAbilityMode("ben",chromastoneActive?1:0);
          benCharacter.group.userData.performChromastoneAttack=()=>{
            if(!benCharacter.useEnergy(8))return;
            const beam=new THREE.Mesh(new THREE.CylinderGeometry(.055,.12,7,8),new THREE.MeshBasicMaterial({color:0x8b63ff,transparent:true,opacity:.9}));
            beam.rotation.x=Math.PI/2;beam.position.set(0,1.65,-3.8);chromastoneVisual.add(beam);
            window.setTimeout(()=>{chromastoneVisual.remove(beam);beam.geometry.dispose();beam.material.dispose();},180);
          };
          const gwenCharacter = new Gwen({ HumanRig });
          const kevinCharacter = new Kevin({ HumanRig });
          const rookCharacter = new Rook({ HumanRig });
          const characterEntries = [
            ["ben", benCharacter],
            ["gwen", gwenCharacter],
            ["kevin", kevinCharacter],
            ["rook", rookCharacter]
          ];
          const characterEntities = {};
          for (const [name, character] of characterEntries) {
            character.group.position.set(...character.startPosition);
            character.group.scale.set(...character.startScale);
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
            character.group.userData.performPickup = () => this.tryPickup(name, character.group, character.rig);
            character.group.userData.performAttack = () => {
              if(name==="ben"&&chromastoneActive){character.group.userData.performChromastoneAttack?.();return;}
              character.group.userData.actionActive = true;
              character.group.userData.actionRemaining = 0.78;
              character.rig.playAnimation("punch");
            };
            character.group.userData.performPickup = () => {
              if(name==="ben"&&chromastoneActive){benCharacter.restoreEnergy(12);return;}
              this.tryPickup(name, character.group, character.rig);
            };
            characterEntities[name] = character.group;
            group.add(character.group);
            physics.addCharacter(character.group);
          }
          ben = benCharacter.group;
          entities = { ...characterEntities, rustbucket: ship };
          regionGroup = group;
          scene.add(regionGroup);
          keyboardController = joystick.createKeyboard({
            entities, camera, joystick, this.updateCamera, isMobile, initialSelected: state.arrivingInShip ? "rustbucket" : "ben",
            onJump: this.openSystemMap,
            onToggleRamp: () => { ship.userData.toggleRamp?.(); rampButton.textContent = ship.userData.getRampOpen?.() ? "CLOSE RAMP" : "OPEN RAMP"; },
            
            onSelect: selected => {
              rampButton.style.display = selected === "rustbucket" ? "block" : "none";
            }
          });
          loadedRegion = name;
          loadingRegion = null;
          if (name === "earth" && startRequested && state.stage === "prelude") state.stage = "gameplay";
          return;
        }
        regionGroup=group;scene.add(regionGroup);loadedRegion=name;
      } catch (error) {
        if (requestId !== regionLoadId) {
          this.disposeObjectTree(group);
          return;
        }
        console.error("Could not load scene:", name, error);
        loadedRegion = null;
        keyboardController?.destroy();
        keyboardController = null;
        physics?.dispose();
        physics = null;
        entities = null;
        ben = null;
        scene.remove(group);
        this.disposeObjectTree(group);
        if (regionGroup === group) regionGroup = null;
        titleObjects = null;
        failedRegion = name;
        sceneLoadErrorMessage.textContent = error?.message
          ? "The " + name + " scene failed: " + error.message
          : "The " + name + " scene failed to initialize. Check the browser console for details.";
        sceneLoadError.style.display = "flex";
      } finally {
        if (requestId === regionLoadId) loadingRegion = null;
      }
    }
    this.loadRegion("space");

    const updateStage = () => {
      if (activeStage === state.stage) return;
      activeStage = state.stage;

      if (activeStage === "title") {
        activeSystem = "solar";
        state.currentScene = "space";
        if (loadedRegion !== "space" && !loadingRegion) this.loadRegion("space");
        preludeScreen.style.display = "none";
        titleScreen.setVisible(true);
        joystick.setVisible(false);
        
        this.setCameraPreset(this.cameraConfig.title);
        playMusic("./files/songs/senji-v2-ov.mp3");
      } else if (activeStage === "prelude") {
        state.currentScene = "earth";
        titleScreen.setVisible(false);
        joystick.setVisible(false);
        this.setCameraPreset(cameraConfig.gameplay);
        if (loadedRegion !== "earth" && loadingRegion !== "earth") this.loadRegion("earth");
        
        preludeScreen.style.display = "flex";
        stopMusic();
        dialogueSfx = playSfx("./files/songs/ov-final-dialogues.mp3", this.startGameplay);
      } else if (activeStage === "gameplay") {
        if (loadedRegion !== state.currentScene && !loadingRegion) this.loadRegion(state.currentScene);
        titleScreen.setVisible(false);
        preludeScreen.style.display = "none";
        joystick.setVisible(true);
        
        
        this.setCameraPreset(cameraConfig.gameplay);
        playMusic("./files/songs/neodevol-ov.mp3");
      } else {
        titleScreen.setVisible(false);
        preludeScreen.style.display = "none";
        joystick.setVisible(activeStage === "gameplay");
        
        stopMusic();
      }
    };

    const SYSTEM_PLANET_ORBITS = {
      solar: {earth:new THREE.Vector3(0,0,0),moon:new THREE.Vector3(1547,0,0)},
      augstaka: {augstaka:new THREE.Vector3(274300,0,0)},
      anodyne: {anodyne:new THREE.Vector3(274300,0,0)},
      galvan: {galvan:new THREE.Vector3(274300,0,0)},
      incursia: {incursia:new THREE.Vector3(274300,0,0)}
    };
    const SYSTEM_PLANET_RADII = { earth:1300, moon:217, augstaka:1300, anodyne:1300, galvan:1300, incursia:1066 };
    const getPlanetClearance = key => (SYSTEM_PLANET_RADII[key] || 1050) * 1.6;
    let planetEntryCooldown=0;
    let planetTransitionBusy=false;
    const enterNearbyPlanet = async () => {
      const expectedRegion = activeSystem === "solar" ? "space" : "system-" + activeSystem;
      if(planetTransitionBusy||state.currentScene!=="space"||loadedRegion!==expectedRegion||!entities?.rustbucket||planetEntryCooldown>0)return;
      const ship=entities.rustbucket;
      let nearestPlanet=null, nearestDistance=Infinity;
      for(const [key,center] of Object.entries(SYSTEM_PLANET_ORBITS[activeSystem]||{})){
        const horizontalDistance=Math.hypot(ship.position.x-center.x,ship.position.z-center.z);
        const entryRange=(SYSTEM_PLANET_RADII[key] || 1050)*1.5;
        if(horizontalDistance<entryRange && ship.position.y<center.y+2 && horizontalDistance<nearestDistance){
          nearestPlanet={key,center};nearestDistance=horizontalDistance;
        }
      }
      if(nearestPlanet){
        planetTransitionBusy=true;
        state.spaceReturnPosition=nearestPlanet.center.clone().add(new THREE.Vector3(0,getPlanetClearance(nearestPlanet.key),0));
        planetEntryCooldown=3;warpOverlay.querySelector("#warp-caption").textContent="";
        warpOverlay.classList.add("atmospheric");warpOverlay.style.display="flex";warpOverlay.classList.remove("warp-active");void warpOverlay.offsetWidth;warpOverlay.classList.add("warp-active");
        await new Promise(resolve=>window.setTimeout(resolve,1250));
        state.currentScene=nearestPlanet.key;await this.loadRegion(nearestPlanet.key);this.setCameraPreset(cameraConfig.gameplay);
        extranet.setLocation(nearestPlanet.key);warpOverlay.classList.remove("warp-active","atmospheric");warpOverlay.style.display="none";
        planetTransitionBusy=false;
      }
    };
    this.leavePlanetInterior = async () => {
      if(planetTransitionBusy||(state.currentScene!=="earth"&&state.currentScene!=="moon"&&!PLANET_WORLDS[state.currentScene])||!entities?.rustbucket)return;
      const planet=state.currentScene,orbit=SYSTEM_PLANET_ORBITS[activeSystem]?.[planet];if(!orbit)return;
      planetTransitionBusy=true;
      warpOverlay.querySelector("#warp-caption").textContent="";
      warpOverlay.classList.add("atmospheric");warpOverlay.style.display="flex";
      warpOverlay.classList.remove("warp-active");void warpOverlay.offsetWidth;warpOverlay.classList.add("warp-active");
      await new Promise(resolve=>window.setTimeout(resolve,1250));
      state.spaceReturnPosition=orbit.clone().add(new THREE.Vector3(0,getPlanetClearance(planet),0));
      state.currentScene="space";
      const returnRegion = activeSystem === "solar" ? "space" : "system-" + activeSystem;
      await this.loadRegion(returnRegion);
      if(entities?.rustbucket){
        entities.rustbucket.position.copy(state.spaceReturnPosition);
        entities.rustbucket.userData.vehicleBody?.setTranslation({x:state.spaceReturnPosition.x,y:state.spaceReturnPosition.y,z:state.spaceReturnPosition.z},true);
        entities.rustbucket.userData.vehicleBody?.setLinvel({x:0,y:0,z:0},true);
      }
      this.setCameraPreset(cameraConfig.gameplay);extranet.setLocation(activeSystem === "solar" ? "space" : activeSystem);
      warpOverlay.classList.remove("warp-active","atmospheric");warpOverlay.style.display="none";
      planetTransitionBusy=false;planetEntryCooldown=2;
    }
    const clock = new THREE.Clock();
    let animationFrame = 0;

    this.animate = () => {
      animationFrame = requestAnimationFrame(this.animate);

      updateStage();
      titleScreen.setVisible(state.stage === "title");
      preludeScreen.style.display = state.stage === "prelude" ? "flex" : "none";
      joystick.setVisible(state.stage === "gameplay");
      extranetButton.style.display = state.stage === "gameplay" ? "grid" : "none";
      hep.style.display=state.stage==="gameplay"?"flex":"none";
      this.updateAbilityDial(keyboardController?.selected||"ben");
      if (state.stage !== "gameplay") { rampButton.style.display = "none"; }
      if (state.stage !== "gameplay" && state.paused) this.setPaused(false);

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      planetEntryCooldown=Math.max(0,planetEntryCooldown-delta);

      if (!state.paused && state.stage === "gameplay" && keyboardController && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex") {
        keyboardController.update(delta);
      }
      if (!state.paused && state.stage==="gameplay"&&state.currentScene==="space") enterNearbyPlanet();
      if (!state.paused && state.stage==="gameplay" && (state.currentScene==="earth"||state.currentScene==="moon"||PLANET_WORLDS[state.currentScene]) && entities?.rustbucket && !planetTransitionBusy) {
        const shipHeight = entities.rustbucket.userData.vehicleBody?.translation().y ?? entities.rustbucket.position.y;
        if (shipHeight > 12) this.leavePlanetInterior();
      }
      if (!state.paused && physics && state.stage === "gameplay" && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex") physics.step(delta);
      if (!state.paused && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex" && entities?.rustbucket?.userData.updateVehicle) entities.rustbucket.userData.updateVehicle(delta);
      if (!state.paused && state.stage === "gameplay" && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex") {
        this.updatePatrolCombat(delta);
        regionGroup?.userData.population?.update(delta);
      }

      if (state.stage === "gameplay") {
        extranet.setLocation(state.currentScene === "space" ? (activeSystem === "solar" ? "space" : activeSystem) : state.currentScene);
        if (!state.paused) {
          for (const entity of Object.values(entities || {})) {
            entity.userData.statusOwner?.updateStatus(delta);
          }
          regionGroup?.userData.interior?.update(delta);
        }
        const selectedName = keyboardController?.selected || "ben";
        const selectedEntity = entities?.[selectedName];
        const status = selectedEntity?.userData.statusOwner;
        if (status) {
          hepHealth.style.height = status.health + "%";
          hepEnergy.style.height = status.energy + "%";
          hep.title = "HEALTH " + Math.round(status.health) + "% / " + status.energyLabel + " " + Math.round(status.energy) + "%";
        }
        this.updateAbilityDial(selectedName);
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

    this.onResize = () => {
      cameraController.resize(window.innerWidth / window.innerHeight);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    }
    window.addEventListener("resize", this.onResize);

    this.animate();

    window.addEventListener("beforeunload", () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", this.onResize);
      canvas.removeEventListener("pointerdown", this.onPointerDown);
      canvas.removeEventListener("pointermove", this.onPointerMove);
      canvas.removeEventListener("pointerup", this.onPointerUp);
      canvas.removeEventListener("pointercancel", this.onPointerUp);
      document.removeEventListener("pointerdown", this.unlockAudio);
      document.removeEventListener("keydown", this.unlockAudio);
      document.removeEventListener("pointerdown", this.requestFullscreenOnGesture);
      document.removeEventListener("touchend", this.requestFullscreenOnGesture);
      document.removeEventListener("keydown", this.requestFullscreenOnGesture);
      document.removeEventListener("keydown", this.pauseKey);
      sceneLoadError.remove();
      pause.destroy();
      extranetButton.remove();
      rampButton.remove(); mapOverlay.remove(); warpOverlay.remove();
      extranet.destroy();
      this.disposeRegion();
      titleScreen.destroy();
      preludeScreen.remove();
      joystick.destroy();
      
      
      stopMusic();
      renderer.dispose();
    }, { once: true });
  }
}

new React();