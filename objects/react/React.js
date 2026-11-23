import * as THREE from "three";
import { UIStyles } from "../ui/UIStyles.js";
import { AudioPlayer } from "../ui/AudioPlayer.js";
import { Camera } from "./Camera.js";
import { PhysicsEngine } from "./PhysicsEngine.js";
import { SimulationSystem } from "./SimulationSystem.js";
new UIStyles();
import { createTitleScreen } from "../title/Title.js";
import { createJoystick, createKeyboard } from "../ui/Joystick.js";
import { createExtranet } from "../extranet/Extranet.js";
import { SolarSystem } from "../world/systems/solar-system.js";
import { AugstakaSystem } from "../world/systems/augstaka.js";
import { AnodyneSystem } from "../world/systems/anodyne.js";
import { GalvanSystem } from "../world/systems/galvan.js";
import { IncursiaSystem } from "../world/systems/incursia.js";
import { EarthInterior } from "../world/interiors/EarthInterior.js";
import { KevinStorageUnit } from "../world/interiors/KevinStorageUnit.js";
import { Suitcases } from "../world/interiors/Suitcases.js";
import { MoonInterior } from "../world/interiors/moon-interior.js";
import { PLANET_WORLDS } from "../world/interiors/planet-interior.js";
import { AugstakaInterior } from "../world/interiors/augstaka-interior.js";
import { AnodyneInterior } from "../world/interiors/anodyne-interior.js";
import { GalvanPrimeInterior } from "../world/interiors/galvan-interior.js";
import { IncursiaInterior } from "../world/interiors/incursia-interior.js";
import { Rustbucket } from "../world/rustbucket.js";
import { AlienShip } from "../world/alien-ship.js";
import { PlanetPopulation } from "../world/interiors/planet-population.js";
import { PassengerTransport } from "../world/passenger-transport.js";
import { HumanRig } from "../world/human-rig.js";
import { Ben } from "../world/ben.js";
import { Gwen } from "../world/gwen.js";
import { Kevin } from "../world/kevin.js";
import { Rook } from "../world/rook.js";
import { createSimulationCloud } from "../extranet/ExtranetBrowser.js";
import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/+esm";
import { Chromastone } from "../world/omnitrix/Chromastone.js";


export const state = { stage: "title", currentScene: "space", arrivingInShip: false, spaceReturnPosition: new THREE.Vector3(0, 2080, 0) };

export class React {
  constructor() {
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
      cameraController.setPreset(preset, window.innerWidth / window.innerHeight);

      cameraTarget.set(...preset.target);
      const position = new THREE.Vector3(...preset.position);
      const offset = position.sub(cameraTarget);
      cameraDistance = offset.length();
      cameraYaw = Math.atan2(offset.x, offset.z);
      cameraPitch = Math.atan2(offset.y, Math.hypot(offset.x, offset.z));
      updateCamera();
    }

    setCameraPreset(this.cameraConfig.title);

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
    const pauseOverlay = document.createElement("div");
    pauseOverlay.id = "pause-overlay";
    pauseOverlay.innerHTML = '<div id="pause-panel"><div id="pause-title">PAUSED</div><nav id="pause-tabs"><button data-pause-tab="settings" class="active">SETTINGS</button><button data-pause-tab="help">HELP</button><button data-pause-tab="credits">CREDITS</button></nav><div id="pause-content"></div><button id="resume-button" type="button">RESUME</button></div>';
    document.body.append(pauseOverlay);
    function setPaused(value) {
      state.paused = Boolean(value);
      pauseOverlay.style.display = state.paused ? "flex" : "none";
      if (audioPlayer.musicTrack) {
        if (state.paused) audioPlayer.musicTrack.pause();
        else if (audioPlayer.unlocked) audioPlayer.musicTrack.play().catch(() => {});
      }
    }

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
    const simulation = new SimulationSystem();
    const passengerTransport = new PassengerTransport(simulation);
    const eventNotice=document.createElement("div");eventNotice.id="simulation-event-notice";document.body.appendChild(eventNotice);
    let eventNoticeTimer=0;
    simulation.onEvent=event=>{
      eventNotice.textContent=event.description;
      eventNotice.style.display="block";
      eventNotice.classList.toggle("hostile",event.type==="attack"||event.type==="war");
      window.clearTimeout(eventNoticeTimer);
      eventNoticeTimer=window.setTimeout(()=>{eventNotice.style.display="none";},4800);
    };
    function configureShip(ship){
      passengerTransport.attachShip(ship);
      ship.userData.maxHealth = 100;
      ship.userData.health = simulation.getStatus('Rustbucket').health;
      ship.userData.takeDamage = amount => {
        simulation.damage('Rustbucket',amount);
        ship.userData.health = simulation.getStatus('Rustbucket').health;
        return ship.userData.health;
      };
      ship.userData.onFuelUse=amount=>simulation.consumeFuel(amount*0.45);
      const fire=ship.userData.performAttack;
      ship.userData.performAttack=()=>{if(simulation.consumeFuel(1))fire?.();};
      return ship;
    }
    function spawnPatrols(parent, systemKey) {
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
    function updatePatrolCombat(delta) {
      const ship = entities?.rustbucket;
      if (!ship || !alienPatrols.length || state.currentScene !== 'space') return;
      ship.updateMatrixWorld(true);
      for (const patrol of [...alienPatrols]) {
        const hostile = simulation.crew.some(member => simulation.isHostile(patrol.species,member));
        patrol.update(delta,ship,hostile,() => {
          ship.userData.takeDamage?.(5);
          simulation.recordEvent('attack',patrol.species + ' patrol fired on Rustbucket.',{attacker:patrol.species,target:'Rustbucket',damage:5});
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
              if (patrol.destroyed) simulation.recordEvent('combat',patrol.species + ' patrol fighter was destroyed.',{species:patrol.species});
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

    const extranet = createExtranet({
      onContinue: () => extranet.close(),
      onComplete: () => playSfx("./files/songs/ov-end-credits.mp3"),
      simulation,
      onData: (host, view) => simulationCloud.render(view, host),
      onJumpSystem: key => warpToSystem(key)
    });
    const simulationCloud=createSimulationCloud(simulation);
    const hep=document.createElement("button");hep.id="hep-control";hep.type="button";hep.setAttribute("aria-label","Health and energy; click to pause");
    hep.innerHTML='<span class="hep-meter"><i id="hep-health-fill"></i><b>H</b></span><span class="hep-meter"><i id="hep-energy-fill"></i><b>E</b></span>';
    hep.addEventListener("click",()=>setPaused(!state.paused));
    document.body.append(hep);
    const hepHealth=hep.querySelector("#hep-health-fill"),hepEnergy=hep.querySelector("#hep-energy-fill");
    const carriedHud=document.createElement("div");carriedHud.id="carried-items-hud";
    carriedHud.innerHTML='<span>IN HAND</span><select id="carried-item-select"><option value="">NO ITEMS</option></select><button id="use-carried-item">USE</button>';
    document.body.appendChild(carriedHud);
    const carriedSelect=carriedHud.querySelector("select");
    carriedHud.querySelector("button").addEventListener("click",()=>{
      const selected=keyboardController?.selected||"ben";
      if(carriedSelect.value==="")return;
      const result=simulation.useCarriedItem(selected[0].toUpperCase()+selected.slice(1),Number(carriedSelect.value));
      if(!result.ok)carriedHud.title=result.reason;
      refreshCarriedHud();
    });
    function refreshCarriedHud(){
      const selected=keyboardController?.selected||"ben";
      const who=selected[0].toUpperCase()+selected.slice(1);
      const list=simulation.data.team.carried[who]||[];
      const previous=carriedSelect.value;
      carriedSelect.innerHTML=list.map((name,i)=>'<option value="'+i+'">'+name+'</option>').join("")||'<option value="">NO ITEMS</option>';
      if(previous!==""&&list[Number(previous)])carriedSelect.value=previous;
      carriedHud.style.display=state.stage==="gameplay"&&selected!=="rustbucket"?"flex":"none";
    }
    const abilityDial=document.createElement("div");
    abilityDial.id="ability-dial";
    abilityDial.innerHTML='<div id="ability-dial-title">OMNITRIX</div><div id="ability-dial-ring"><div id="ability-dial-indicator"></div><div id="ability-dial-center">BEN</div></div><div id="ability-dial-mode">HUMAN</div>';
    document.body.appendChild(abilityDial);
    const abilityDialRing=abilityDial.querySelector("#ability-dial-ring");
    const abilityDialIndicator=abilityDial.querySelector("#ability-dial-indicator");
    const abilityDialCenter=abilityDial.querySelector("#ability-dial-center");
    const abilityDialMode=abilityDial.querySelector("#ability-dial-mode");
    const abilityModes={ben:["HUMAN","CHROMASTONE"],kevin:["METAL","STONE","CRYSTAL","RUBBER"],gwen:["SHIELD","BOLT","HEAL","BIND"],rook:["GUN","SWORD"]};
    const abilityState={ben:simulation.getChromastoneActive()?1:0,kevin:0,gwen:0,rook:0};
    let abilityPointer=null;
    function setAbilityMode(character,index){
      const modes=abilityModes[character]||[];if(!modes.length)return;
      const next=(index+modes.length)%modes.length;abilityState[character]=next;
      const mode=modes[next];
      abilityDial.querySelector("#ability-dial-title").textContent=({ben:"OMNITRIX",kevin:"MATERIAL",gwen:"SPELLBOOK",rook:"PROTO-TOOL"})[character];
      abilityDialCenter.textContent=character==="ben"?(next?"CH":"B"):character[0].toUpperCase();
      abilityDialMode.textContent=mode;
      abilityDialIndicator.style.transform="rotate("+(next/modes.length*360)+"deg) translateY(-34px)";
      if(character==="ben"){
        simulation.setChromastoneActive(next===1);
        const visual=entities?.ben?.userData.chromastoneVisual;
        if(visual)visual.visible=next===1;
        entities?.ben?.children?.forEach(child=>{if(child!==visual)child.visible=next===0;});
        const pickButton=joystick.buttons.querySelector("#pick-button");if(pickButton)pickButton.textContent="PICK";
      }
      if(entities?.[character])entities[character].userData.toolMode=mode;
    }
    function updateAbilityDial(character){
      const modes=abilityModes[character];
      abilityDial.style.display=state.stage==="gameplay"&&Boolean(modes)?"flex":"none";
      if(!modes)return;
      const index=abilityState[character]||0;
      abilityDial.querySelector("#ability-dial-title").textContent=({ben:"OMNITRIX",kevin:"MATERIAL",gwen:"SPELLBOOK",rook:"PROTO-TOOL"})[character];
      abilityDialCenter.textContent=character==="ben"?(index?"CH":"B"):character[0].toUpperCase();
      abilityDialMode.textContent=modes[index];
      abilityDialIndicator.style.transform="rotate("+(index/modes.length*360)+"deg) translateY(-34px)";
    }
    function chooseAbilityFromPointer(event){
      const rect=abilityDialRing.getBoundingClientRect();
      const angle=(Math.atan2(event.clientX-(rect.left+rect.width/2),-(event.clientY-(rect.top+rect.height/2)))+Math.PI*2)%(Math.PI*2);
      const character=keyboardController?.selected||"ben",modes=abilityModes[character]||[];
      setAbilityMode(character,Math.round(angle/(Math.PI*2)*modes.length)%modes.length);
    }
    abilityDialRing.addEventListener("pointerdown",event=>{event.preventDefault();abilityPointer=event.pointerId;abilityDialRing.setPointerCapture(event.pointerId);chooseAbilityFromPointer(event);});
    abilityDialRing.addEventListener("pointermove",event=>{if(event.pointerId===abilityPointer&&event.buttons)chooseAbilityFromPointer(event);});
    abilityDialRing.addEventListener("pointerup",event=>{if(event.pointerId===abilityPointer)abilityPointer=null;});
    abilityDialRing.addEventListener("pointercancel",()=>{abilityPointer=null;});
    const extranetButton = document.createElement("button");
    extranetButton.id = "extranet-button";
    extranetButton.type = "button";
    extranetButton.setAttribute("aria-label", "Open Extranet");
    extranetButton.textContent = "EXTRANET";
    extranetButton.addEventListener("click", () => extranet.open());
    document.body.appendChild(extranetButton);
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

    const marketPanel=document.createElement("div");
    marketPanel.id="planet-market";
    marketPanel.innerHTML='<div class="planet-market-card"><button id="planet-market-close" aria-label="Close marketplace">CLOSE</button><p class="planet-market-kicker">LOCAL TRADE EXCHANGE</p><h2 id="planet-market-title">MARKETPLACE</h2><p id="planet-market-cash"></p><div id="planet-market-stock"></div><p id="planet-market-message"></p></div>';
    document.body.appendChild(marketPanel);
    marketPanel.querySelector("#planet-market-close").addEventListener("click",()=>marketPanel.style.display="none");
    function openPlanetMarket(){
      const key=state.currentScene;
      const world=PLANET_WORLDS[key];if(!world)return;
      const stock=simulation.data.resources[world.species]||[];
      marketPanel.querySelector("#planet-market-title").textContent=world.name+" MARKET";
      marketPanel.querySelector("#planet-market-cash").textContent="TEAM FUNDS: "+simulation.data.team.cash.toLocaleString()+" TAYDENITE";
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
          const result=simulation.tradeWithSpecies(buyer,world.species,item.id,1);
          const message=marketPanel.querySelector("#planet-market-message");
          message.textContent=result.ok?"PURCHASE COMPLETE • "+result.cost+" TAYDENITE":result.reason;
          marketPanel.querySelector("#planet-market-cash").textContent="TEAM FUNDS: "+simulation.data.team.cash.toLocaleString()+" TAYDENITE";
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
      if (state.stage === "gameplay" && keyboardController?.selected === "rustbucket") extranet.openOmnidata();
    }
    async function warpToSystem(requestedKey) {
      const systemKey = ({solar:"solar",highbreed:"augstaka",incursean:"incursia",anodite:"anodyne",galvan:"galvan"})[requestedKey];
      if (!systemKey) return;
      extranet.close();
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
      await loadRegion(systemKey === "solar" ? "space" : "system-" + systemKey);
      if (entities?.rustbucket) {
        entities.rustbucket.position.copy(state.spaceReturnPosition);
        entities.rustbucket.userData.vehicleBody?.setTranslation({x:state.spaceReturnPosition.x,y:state.spaceReturnPosition.y,z:state.spaceReturnPosition.z},true);
        entities.rustbucket.userData.vehicleBody?.setLinvel({x:0,y:0,z:0},true);
      }
      setCameraPreset(cameraConfig.gameplay);
      extranet.setLocation(systemKey === "solar" ? "space" : systemKey);
      warpOverlay.classList.remove("warp-active"); warpOverlay.style.display = "none";
    }
    async function warpTo(destination) {
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
        await loadRegion(returnRegion);
        if(entities?.rustbucket){
          entities.rustbucket.position.copy(state.spaceReturnPosition);
          entities.rustbucket.userData.vehicleBody?.setTranslation({x:state.spaceReturnPosition.x,y:state.spaceReturnPosition.y,z:state.spaceReturnPosition.z},true);
          entities.rustbucket.userData.vehicleBody?.setLinvel({x:0,y:0,z:0},true);
        }
      } else await loadRegion(destination);
      if (destination !== "space" && loadedRegion === destination) passengerTransport.complete(destination,entities?.rustbucket);
      setCameraPreset(cameraConfig.gameplay);
      warpOverlay.classList.remove("warp-active","atmospheric"); warpOverlay.style.display = "none";
      extranet.setLocation(destination === "space" ? (activeSystem === "solar" ? "space" : activeSystem) : destination);
      marketPanel.style.display="none";
    }
    mapOverlay.querySelectorAll("[data-destination]").forEach(button => button.addEventListener("click", () => warpTo(button.dataset.destination)));
    mapOverlay.querySelector("#system-map-close").addEventListener("click", () => { mapOverlay.style.display = "none"; });
    const isMobile = (window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 900px)").matches) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    
    

    const audioPlayer = new AudioPlayer();
    const playMusic = src => audioPlayer.playMusic(src);
    const stopMusic = () => audioPlayer.stopMusic();
    const playSfx = (src, onEnded = null) => audioPlayer.playSfx(src, onEnded);
    const stopSfx = track => audioPlayer.stopSfx(track);
    function unlockAudio() { audioPlayer.unlock(state.stage); }
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
      cameraYaw -= dx * cameraConfig.dragSensitivity;
      cameraPitch = THREE.MathUtils.clamp(
        cameraPitch + dy * cameraConfig.pitchSensitivity,
        cameraConfig.minPitch,
        cameraConfig.maxPitch
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
    let regionLoadId = 0;
    let regionGroup = null;
    let titleObjects = null;


    function disposeObjectTree(root) {
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

    function disposeRegion() {
      keyboardController?.destroy();
      keyboardController = null;
      ben = null;
      physics?.dispose();
      physics = null;
      entities = null;
      if (regionGroup) {
        scene.remove(regionGroup);
        disposeObjectTree(regionGroup);
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
      if (failedRegion) loadRegion(failedRegion);
    });

    let activeSystem = "solar";
    async function loadRegion(name) {
      if (loadingRegion === name || loadedRegion === name) return;
      const requestId = ++regionLoadId;
      loadingRegion = name;
      sceneLoadError.style.display = "none";
      failedRegion = null;
      disposeRegion();
      if (!name) { loadedRegion = null; loadingRegion = null; return; }
      const group = new THREE.Group();
      group.name = name === "space" ? "SolarSystemScene" : name === "moon" ? "MoonScene" : "EarthScene";
      try {
        if (name === "space") {
          scene.background = new THREE.Color(0x02040a); scene.fog = null;
          titleObjects = new SolarSystem(group);
          if (state.stage === "gameplay") {
            spawnPatrols(group,"solar");
            const rustbucket = new Rustbucket(group); const ship = rustbucket.ship; configureShip(ship);
            if(state.spaceReturnPosition)ship.position.copy(state.spaceReturnPosition);
            const nextPhysics = await PhysicsEngine.create();
          if (requestId !== regionLoadId) {
            nextPhysics.dispose();
            disposeObjectTree(group);
            return;
          }
          physics = nextPhysics; physics.setEnvironment("space"); physics.addVehicle(ship);
            entities = { rustbucket: ship }; regionGroup = group; scene.add(regionGroup);
            keyboardController = createKeyboard({
              entities,camera,joystick,updateCamera,isMobile,initialSelected:"rustbucket",onJump:openSystemMap,
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
            spawnPatrols(group,systemKey);
            const rustbucket = new Rustbucket(group); const ship = rustbucket.ship; configureShip(ship);
            ship.position.set(15000,12,0);
            const nextPhysics = await PhysicsEngine.create();
            if (requestId !== regionLoadId) { nextPhysics.dispose(); disposeObjectTree(group); return; }
            physics = nextPhysics; physics.setEnvironment("space"); physics.addVehicle(ship);
            entities = {rustbucket:ship}; regionGroup = group; scene.add(regionGroup);
            keyboardController = createKeyboard({
              entities,camera,joystick,updateCamera,isMobile,initialSelected:"rustbucket",onJump:openSystemMap,
              onToggleRamp:()=>{ship.userData.toggleRamp?.();rampButton.textContent=ship.userData.getRampOpen?.()?"CLOSE RAMP":"OPEN RAMP";},
              onSelect:selected=>{rampButton.style.display=selected==="rustbucket"?"block":"none";}
            });
          } else { regionGroup=group; scene.add(regionGroup); }
          loadedRegion=name; loadingRegion=null; return;
        } else if (name === "moon") {
          scene.background=new THREE.Color(0x080b14);scene.fog=new THREE.Fog(0x080b14,90,360);
          new MoonInterior(group);
          const rustbucket = new Rustbucket(group); const ship = rustbucket.ship;configureShip(ship);
          physics=await PhysicsEngine.create();physics.setEnvironment("planet");physics.addStaticScene(group);physics.addVehicle(ship);
          entities={rustbucket:ship};regionGroup=group;scene.add(regionGroup);
          keyboardController=createKeyboard({
            entities,camera,joystick,updateCamera,isMobile,initialSelected:"rustbucket",onJump:openSystemMap,
            onToggleRamp:()=>{ship.userData.toggleRamp?.();rampButton.textContent=ship.userData.getRampOpen?.()?"CLOSE RAMP":"OPEN RAMP";},
            onSelect:selected=>{rampButton.style.display=selected==="rustbucket"?"block":"none";}
          });
          loadedRegion=name;loadingRegion=null;return;

        } else if (PLANET_WORLDS[name]) {
          const world=PLANET_WORLDS[name];
          scene.background=new THREE.Color(world.sky);
          scene.fog=new THREE.Fog(world.sky,38,190);
          const InteriorClass = { augstaka: AugstakaInterior, anodyne: AnodyneInterior, galvan: GalvanPrimeInterior, incursia: IncursiaInterior }[name];
          const interior = new InteriorClass(group);
          group.userData.population = interior.environment.population;
          const { marketPosition } = interior.environment;
          const rustbucket = new Rustbucket(group); const ship = rustbucket.ship; configureShip(ship); ship.position.set(0,2,13);
          passengerTransport.bindShip(ship,interior.environment.inhabitants);
          physics=await PhysicsEngine.create();physics.setEnvironment("planet");physics.addStaticScene(group);physics.addVehicle(ship);
          entities={rustbucket:ship};regionGroup=group;scene.add(regionGroup);
          keyboardController=createKeyboard({
            entities,camera,joystick,updateCamera,isMobile,initialSelected:"rustbucket",onJump:openSystemMap,
            onToggleRamp:()=>{ship.userData.toggleRamp?.();rampButton.textContent=ship.userData.getRampOpen?.()?"CLOSE RAMP":"OPEN RAMP";},
            onSelect:selected=>{rampButton.style.display=selected==="rustbucket"?"block":"none";}
          });
          regionGroup.userData.marketPosition=marketPosition;
          loadedRegion=name;loadingRegion=null;return;
        } else if (name === "earth") {
          // Earth interior: Bellwood, the storage unit, the crew, and the Rustbucket.

          const earthEnvironment = new EarthInterior(scene, group);
          const population = new PlanetPopulation(earthEnvironment.bellwood,"earth");
          group.userData.population = population;
          const storageUnit = new KevinStorageUnit(group); const unit = storageUnit.unit;
          const rustbucket = new Rustbucket(group); const ship = rustbucket.ship; configureShip(ship);
          passengerTransport.bindShip(ship,population.inhabitants);

          const nextPhysics = await PhysicsEngine.create();
          if (requestId !== regionLoadId) {
            nextPhysics.dispose();
            disposeObjectTree(group);
            return;
          }
          physics = nextPhysics;
          physics.setEnvironment("planet");
          physics.addStaticScene(group);
          const suitcaseCollection = new Suitcases(group); const suitcases = suitcaseCollection.suitcases;
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
          
          const benCharacter = new Ben({ HumanRig });
          const chromastoneVisual=new Chromastone().model;
          benCharacter.group.add(chromastoneVisual);
          chromastoneVisual.visible=simulation.getChromastoneActive();
          benCharacter.group.userData.chromastoneVisual=chromastoneVisual;
          if(simulation.getChromastoneActive())benCharacter.group.children.forEach(child=>{if(child!==chromastoneVisual)child.visible=false;});
          joystick.buttons.querySelector("#pick-button").textContent="PICK";
          benCharacter.group.userData.chromastoneVisual=chromastoneVisual;
          setAbilityMode("ben",simulation.getChromastoneActive()?1:0);
          benCharacter.group.userData.performChromastoneAttack=()=>{
            if(!simulation.spendEnergy("Chromastone",8))return;
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
            character.group.userData.performPickup = () => tryPickup(name, character.group, character.rig);
            character.group.userData.performAttack = () => {
              if(name==="ben"&&simulation.getChromastoneActive()){character.group.userData.performChromastoneAttack?.();return;}
              character.group.userData.actionActive = true;
              character.group.userData.actionRemaining = 0.78;
              character.rig.playAnimation("punch");
            };
            character.group.userData.performPickup = () => {
              if(name==="ben"&&simulation.getChromastoneActive()){simulation.recharge("Chromastone",12);return;}
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
          disposeObjectTree(group);
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
        disposeObjectTree(group);
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
    loadRegion("space");

    const updateStage = () => {
      if (activeStage === state.stage) return;
      activeStage = state.stage;

      if (activeStage === "title") {
        activeSystem = "solar";
        state.currentScene = "space";
        if (loadedRegion !== "space" && !loadingRegion) loadRegion("space");
        preludeScreen.style.display = "none";
        titleScreen.setVisible(true);
        joystick.setVisible(false);
        
        setCameraPreset(this.cameraConfig.title);
        playMusic("./files/songs/senji-v2-ov.mp3");
      } else if (activeStage === "prelude") {
        state.currentScene = "earth";
        titleScreen.setVisible(false);
        joystick.setVisible(false);
        setCameraPreset(cameraConfig.gameplay);
        if (loadedRegion !== "earth" && loadingRegion !== "earth") loadRegion("earth");
        
        preludeScreen.style.display = "flex";
        stopMusic();
        dialogueSfx = playSfx("./files/songs/ov-final-dialogues.mp3", startGameplay);
      } else if (activeStage === "gameplay") {
        if (loadedRegion !== state.currentScene && !loadingRegion) loadRegion(state.currentScene);
        titleScreen.setVisible(false);
        preludeScreen.style.display = "none";
        joystick.setVisible(true);
        
        
        setCameraPreset(cameraConfig.gameplay);
        playMusic("./files/songs/neodevol-ov.mp3");
      } else {
        titleScreen.setVisible(false);
        preludeScreen.style.display = "none";
        joystick.setVisible(activeStage === "gameplay");
        
        stopMusic();
      }
    };

    const marketButton=document.createElement("button");marketButton.id="planet-market-button";marketButton.textContent="OPEN MARKETPLACE";marketButton.addEventListener("click",openPlanetMarket);document.body.appendChild(marketButton);
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
        state.currentScene=nearestPlanet.key;await loadRegion(nearestPlanet.key);setCameraPreset(cameraConfig.gameplay);
        if (loadedRegion === nearestPlanet.key) passengerTransport.complete(nearestPlanet.key,entities?.rustbucket);
        extranet.setLocation(nearestPlanet.key);warpOverlay.classList.remove("warp-active","atmospheric");warpOverlay.style.display="none";
        planetTransitionBusy=false;
      }
    };
    async function leavePlanetInterior(){
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
      await loadRegion(returnRegion);
      if(entities?.rustbucket){
        entities.rustbucket.position.copy(state.spaceReturnPosition);
        entities.rustbucket.userData.vehicleBody?.setTranslation({x:state.spaceReturnPosition.x,y:state.spaceReturnPosition.y,z:state.spaceReturnPosition.z},true);
        entities.rustbucket.userData.vehicleBody?.setLinvel({x:0,y:0,z:0},true);
      }
      setCameraPreset(cameraConfig.gameplay);extranet.setLocation(activeSystem === "solar" ? "space" : activeSystem);
      warpOverlay.classList.remove("warp-active","atmospheric");warpOverlay.style.display="none";
      planetTransitionBusy=false;planetEntryCooldown=2;
    }
    const clock = new THREE.Clock();
    let animationFrame = 0;

    function animate() {
      animationFrame = requestAnimationFrame(animate);

      updateStage();
      titleScreen.setVisible(state.stage === "title");
      preludeScreen.style.display = state.stage === "prelude" ? "flex" : "none";
      joystick.setVisible(state.stage === "gameplay");
      extranetButton.style.display = state.stage === "gameplay" ? "grid" : "none";
      hep.style.display=state.stage==="gameplay"?"flex":"none";
      carriedHud.style.display=state.stage==="gameplay"?"flex":"none";
      updateAbilityDial(keyboardController?.selected||"ben");
      if (state.stage !== "gameplay") { rampButton.style.display = "none"; }
      if (state.stage !== "gameplay" && state.paused) setPaused(false);

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      planetEntryCooldown=Math.max(0,planetEntryCooldown-delta);

      if (!state.paused && state.stage === "gameplay" && keyboardController && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex") {
        keyboardController.update(delta);
      }
      if (!state.paused && state.stage==="gameplay"&&state.currentScene==="space") enterNearbyPlanet();
      if (!state.paused && state.stage==="gameplay" && (state.currentScene==="earth"||state.currentScene==="moon"||PLANET_WORLDS[state.currentScene]) && entities?.rustbucket && !planetTransitionBusy) {
        const shipHeight = entities.rustbucket.userData.vehicleBody?.translation().y ?? entities.rustbucket.position.y;
        if (shipHeight > 12) leavePlanetInterior();
      }
      if (!state.paused && physics && state.stage === "gameplay" && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex") physics.step(delta);
      if (!state.paused && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex" && entities?.rustbucket?.userData.updateVehicle) entities.rustbucket.userData.updateVehicle(delta);
      if (!state.paused && state.stage === "gameplay" && mapOverlay.style.display !== "flex" && warpOverlay.style.display !== "flex") {
        updatePatrolCombat(delta);
        regionGroup?.userData.population?.update(delta);
      }

      if (state.stage === "gameplay") {
        extranet.setLocation(state.currentScene === "space" ? (activeSystem === "solar" ? "space" : activeSystem) : state.currentScene);
        if(PLANET_WORLDS[state.currentScene]&&entities?.rustbucket&&regionGroup?.userData.marketPosition){
          const near=entities.rustbucket.position.distanceTo(regionGroup.userData.marketPosition)<15;
          const marketButtonVisible=near&&marketPanel.style.display!=="flex";
          marketButton.style.display=marketButtonVisible?"block":"none";
        } else marketButton.style.display="none";
        if(!state.paused)simulation.update(delta,(keyboardController?.selected||"ben").replace(/^./,c=>c.toUpperCase()),PLANET_WORLDS[state.currentScene]?.species||state.currentScene,state.currentScene!=="space");
        const selectedName=keyboardController?.selected||"ben";
        const status=simulation.getStatus(selectedName==="rustbucket"?"Rustbucket":selectedName==="ben"&&simulation.getChromastoneActive()?"Chromastone":selectedName[0].toUpperCase()+selectedName.slice(1));
        hepHealth.style.height=status.health+"%";hepEnergy.style.height=status.energy+"%";
        hep.title="HEALTH "+Math.round(status.health)+"% / "+status.energyLabel+" "+Math.round(status.energy)+"%";
        updateAbilityDial(selectedName);
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
      cameraController.resize(window.innerWidth / window.innerHeight);
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
      sceneLoadError.remove();
      pauseOverlay.remove();
      extranetButton.remove();
      rampButton.remove(); mapOverlay.remove(); warpOverlay.remove(); marketPanel.remove(); marketButton.remove();
      extranet.close();
      passengerTransport.destroy();
      disposeRegion();
      titleScreen.destroy();
      preludeScreen.remove();
      joystick.destroy();
      
      
      stopMusic();
      renderer.dispose();
    }, { once: true });
  }
}

new React();