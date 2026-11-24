import * as THREE from "three";
import { Title } from "../io/Title.js";
import { Camera } from "../team/Camera.js";
import { SolarSystem } from "./SolarSystem.js";
import { AugstakaSystem } from "./AugstakaSystem.js";
import { AnodyneSystem } from "./AnodyneSystem.js";
import { GalvanSystem } from "./GalvanSystem.js";
import { IncursiaSystem } from "./IncursiaSystem.js";
import { Moon } from "./Moon.js";
import { Augstaka } from "./Augstaka.js";
import { Anodyne } from "./Anodyne.js";
import { GalvanPrime } from "./GalvanPrime.js";
import { Incursia } from "./Incursia.js";
import { Earth } from "./Earth.js";
import { Extranet } from "../extranet/Extranet.js";
import { Pause } from "../io/Pause.js";
import { PlanetaryResident } from "../species/PlanetaryResident.js";

export class Omniverse {
  static state = { stage: "title", currentScene: "space" };

  constructor() {
    this.state = Omniverse.state;
    this.installStyles();

    this.canvas = document.createElement("canvas");
    this.canvas.id = "omniverse";
    this.canvas.setAttribute("aria-label", "Rustbucket 3D game");
    Object.assign(this.canvas.style, {
      position: "fixed",
      inset: "0",
      display: "block",
      width: "100%",
      height: "100%",
      touchAction: "none",
      zIndex: "0",
      pointerEvents: "auto"
    });

    Object.assign(document.documentElement.style, {
      width: "100%",
      height: "100%",
      margin: "0",
      overflow: "hidden"
    });
    Object.assign(document.body.style, {
      width: "100%",
      height: "100%",
      margin: "0",
      overflow: "hidden",
      background: "#02040a",
      fontFamily: "Industry, sans-serif"
    });

    document.body.appendChild(this.canvas);
    this.scene = new THREE.Scene();
    this.scene.name = "Rustbucket";
    this.scene.background = new THREE.Color(0x02040a);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)),
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this._celestial = new THREE.Group();
    this._celestial.name = "ActiveCelestial";
    this.scene.add(this._celestial);

    this.cameraController = new Camera(
      THREE,
      { fov: 55, near: 0.1, far: 5000000 },
      window.innerWidth / window.innerHeight
    );
    this.camera = this.cameraController.camera;
    this.camera.position.set(0, 0, 600000);
    this.camera.lookAt(-137150, 0, 0);
    this.scene.add(this.camera);
    this.cameraTarget = new THREE.Vector3();
    this.cameraController.attach(this.canvas, {
      getStage: () => this.state.stage,
      getTarget: () => this.cameraTarget
    });

    this.systemClasses = {
      solar: SolarSystem,
      augstaka: AugstakaSystem,
      anodyne: AnodyneSystem,
      galvan: GalvanSystem,
      incursia: IncursiaSystem
    };

    this.planetClasses = {
      earth: Earth,
      moon: Moon,
      augstaka: Augstaka,
      anodyne: Anodyne,
      galvan: GalvanPrime,
      incursia: Incursia
    };

    this.titleScreen = new Title({
      onNewGame: () => {
        this.requestFullscreen();
        this.setStage("prelude");
      },
      onSkipPrelude: () => {
        this.requestFullscreen();
        this.setStage("gameplay");
      }
    });
    this.titleScreen.setVisible(true);

    this.extranet = new Extranet({ onJumpSystem: key => this.jumpToSystem(key) });
    this.extranetButton = this.extranet.createButton();
    this.extranetButton.style.display = "none";

    this.pause = new Pause({
      onResume: () => this.pause.setVisible(false),
      onCameraSensitivity: value => this.cameraController.setSensitivity?.(value)
    });
    this.pause.create();
    this.pauseButton = document.createElement("button");
    this.pauseButton.type = "button";
    this.pauseButton.textContent = "PAUSE";
    this.pauseButton.setAttribute("aria-label", "Pause game");
    Object.assign(this.pauseButton.style, {
      position: "fixed",
      top: "max(14px, env(safe-area-inset-top))",
      right: "max(14px, env(safe-area-inset-right))",
      zIndex: "30",
      padding: "10px 14px",
      border: "1px solid rgba(126,255,168,.5)",
      borderRadius: "20px",
      background: "rgba(5,30,18,.84)",
      color: "#eaffef",
      font: "inherit",
      letterSpacing: ".08em",
      display: "none"
    });
    this.pauseButton.addEventListener("click", () => this.pause.setVisible(true));
    document.body.append(this.pauseButton);

    this.onResize = () => {
      this.cameraController.resize(window.innerWidth / window.innerHeight);
      this.resize();
    };
    window.addEventListener("resize", this.onResize);
    this.onFirstInteraction = () => this.requestFullscreen();
    document.addEventListener("pointerdown", this.onFirstInteraction, { once: true });
    this.clock = new THREE.Clock();
    this.animationFrame = null;
    this.animate = this.animate.bind(this);
    window.addEventListener("beforeunload", () => this.destroy(), { once: true });

    this.loadTitleWorld();
    this.start();
  }

  installStyles() {
    this.fontStyle = document.createElement("style");
    this.fontStyle.id = "rustbucket-fonts";
    this.fontStyle.textContent = `
      @font-face {
        font-family: "Industry";
        src: url("./files/fonts/Industry-Light.woff") format("woff");
        font-weight: 300;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: "Industry";
        src: url("./files/fonts/Industry-Medium.woff") format("woff");
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: "Industry";
        src: url("./files/fonts/Industry-Bold.woff") format("woff");
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }
      html, body, button, input {
        font-family: "Industry", sans-serif;
      }
      h1, h2, h3, .rb-title, .rb-heading {
        font-family: "Industry", sans-serif !important;
        font-weight: 700 !important;
      }
      #title-screen, #prelude-screen, #pause-overlay, #extranet-overlay {
        box-sizing: border-box;
      }
      #title-screen * { box-sizing: border-box; }
    `;
    document.head.append(this.fontStyle);
  }

  async requestFullscreen() {
    const root = document.documentElement;
    if (document.fullscreenElement || !root.requestFullscreen) return;
    try {
      await root.requestFullscreen({ navigationUI: "hide" });
    } catch (error) {
      // Browsers can reject fullscreen when permission or user-gesture rules
      // are not satisfied. The game remains playable in the available viewport.
    }
  }

  get celestial() {
    return this._celestial;
  }

  set celestial(celestial) {
    if (!celestial || celestial === this._celestial) return;
    this.scene.remove(this._celestial);
    this._celestial = celestial;
    this.scene.add(this._celestial);
  }

  get activeWorld() {
    return this.celestial;
  }

  resize() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    if (this.animationFrame !== null) return;
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  selectTeamMember(selected) {
    if (selected === "rustbucket") {
      const ship = this.vehicle?.ship;
      if (!ship) return;
      if (!ship.parent) {
        this.loadSystemScene(this.vehicleSystem || "solar", ship, []);
      }
      this.updateCamera();
      return;
    }

    const index = ["ben", "gwen", "kevin", "rook"].indexOf(selected);
    const member = this.crew?.[index];
    if (!member) return;
    const home = this.crewHomePlanet || this.earth || new Earth();
    if (this.state.currentScene !== home.world.key || member.group.parent !== this.celestial) {
      this.enterPlanetScene(home, null, [...(this.crew || [])]);
    }
    this.updateCamera();
  }

  updateCamera() {
    const selected = this.joystick?.currentSelection;
    const entity = selected === "rustbucket"
      ? this.vehicle?.ship
      : this.crew?.[["ben", "gwen", "kevin", "rook"].indexOf(selected)]?.group;
    if (!entity) return;

    const target = entity.getWorldPosition(new THREE.Vector3());
    target.y += selected === "rustbucket" ? 1.5 : 1.15;
    if (!this.cameraTarget) this.cameraTarget = target.clone();
    const shift = target.clone().sub(this.cameraTarget);
    this.camera.position.add(shift);
    this.cameraTarget.copy(target);
    this.camera.lookAt(this.cameraTarget);
  }

  checkAtmosphereTransition() {
    const ship = this.vehicle?.ship;
    if (!ship || this.joystick?.currentSelection !== "rustbucket") return;

    if (this.currentPlanet && this.state.currentScene === this.currentPlanet.world.key) {
      const groundHeight = -0.6;
      const altitude = ship.position.y - groundHeight;
      if (altitude <= this.currentPlanet.atmosphereHeight) return;

      const planet = this.currentPlanet;
      const vehicle = this.vehicle;
      const crew = [...(this.crew || [])];
      this.loadSystemScene(planet.system, ship, crew, planet.world.key);
      this.joystick?.setVehicleMode(true);
      return;
    }

    if (this.state.currentScene !== "space" && !this.state.currentScene.startsWith("system-")) return;
    ship.updateWorldMatrix(true, false);
    const shipPosition = ship.getWorldPosition(new THREE.Vector3());
    let nearest = null;
    let nearestDistance = Infinity;
    for (const entry of this.systemPlanets || []) {
      const center = entry.exterior.getWorldPosition(new THREE.Vector3());
      const distance = shipPosition.distanceTo(center);
      if (distance < nearestDistance) {
        nearest = entry;
        nearestDistance = distance;
      }
    }
    if (!nearest) return;

    const globe = nearest.exterior.children.find(child => child.isMesh);
    const planetRadius = globe?.geometry?.parameters?.radius || 1300;
    if (nearestDistance >= planetRadius + nearest.planet.atmosphereHeight) return;

    const vehicle = this.vehicle;
    const crew = [...(this.crew || [])];
    this.enterPlanetScene(nearest.planet, ship, crew);
    this.joystick?.setVehicleMode(true);
  }

  resetCameraToShip(ship) {
    const position = ship.getWorldPosition(new THREE.Vector3());
    this.camera.position.set(position.x, position.y + 4, position.z + 42);
    this.cameraTarget.copy(position);
    this.camera.lookAt(this.cameraTarget);
    this.camera.updateProjectionMatrix();
  }

  loadSystemScene(systemKey, ship = this.vehicle?.ship, crew = this.crew || [], destinationKey = null) {
    const vehicle = this.vehicle;
    ship?.removeFromParent();
    crew.forEach(member => member.group?.removeFromParent());

    this.clearWorld();

    const SystemClass = this.systemClasses[systemKey] || SolarSystem;
    this.systemWorld = new SystemClass();
    this.celestial.add(this.systemWorld.model());

    this.addSystemPlanets(systemKey);
    this.celestial.updateMatrixWorld(true);

    const destination = this.systemPlanets.find(entry => entry.planet.world.key === destinationKey)
      || this.systemPlanets[0];
    const center = destination?.model.position || new THREE.Vector3();

    if (ship) {
      ship.position.set(center.x, center.y + 1500, center.z);
      ship.rotation.set(0, 0, 0);
      this.celestial.add(ship);
      this.vehicle = vehicle || { ship };
      this.vehicle.ship = ship;
      this.crew = crew;
      crew.forEach((member, index) => {
        member.group.position.set((index - 1.5) * 0.4, -1.18, 0.15);
        ship.add(member.group);
      });
    }

    this.scene.background = new THREE.Color(0x02040a);
    this.scene.fog = null;
    this.state.stage = "gameplay";
    this.state.currentScene = systemKey === "solar" ? "space" : "system-" + systemKey;
    this.vehicleSystem = systemKey;
    this.extranet?.setLocation(systemKey === "solar" ? "space" : systemKey);
    if (ship) this.resetCameraToShip(ship);
    else {
      this.camera.position.set(0, 0, 600000);
      this.camera.lookAt(0, 0, 0);
      this.cameraTarget.set(0, 0, 0);
    }
    return this.systemWorld;
  }

  enterPlanetScene(planet, ship, crew) {
    const vehicle = this.vehicle;
    ship?.removeFromParent();
    crew.forEach(member => member.group?.removeFromParent());

    this.clearWorld();
    this.celestial.add(planet.model("interior"));
    this.currentPlanet = planet;
    this.earth = planet.world.key === "earth" ? planet : null;
    this.scene.background = new THREE.Color(planet.world.sky);
    this.scene.fog = new THREE.Fog(planet.world.sky, 180, 700);

    this.vehicle = vehicle || (ship ? { ship } : null);
    this.crew = crew || [];
    if (ship) {
      this.vehicle.ship = ship;
      ship.position.set(0, 2, 34);
      ship.rotation.set(0, 0, 0);
      this.celestial.add(ship);
      this.resetCameraToShip(ship);
    } else {
      this.camera.position.set(0, 8, 23);
      this.camera.lookAt(0, 1.5, 0);
      this.cameraTarget.set(0, 1.5, 0);
    }

    this.state.stage = "gameplay";
    this.state.currentScene = planet.world.key;
    this.titleScreen.setVisible(false);
    this.titleScreen.newGame.setPreludeVisible(false);
    this.extranetButton.style.display = "block";
    this.extranet?.setLocation(planet.world.key);
    this.populatePlanet(planet);
    return this.celestial;
  }

  populatePlanet(planet) {
    this.residents = [];
    for (let index = 0; index < 5; index++) {
      const resident = new PlanetaryResident(planet.world.species, index);
      const angle = index * Math.PI * 2 / 5;
      const radius = 24 + (index % 2) * 12;
      resident.group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius - 18);
      resident.group.rotation.y = angle + Math.PI;
      this.celestial.add(resident.group);
      this.residents.push(resident);
    }
  }

  updateResidents(delta, elapsed) {
    for (const resident of this.residents || []) {
      resident.update(delta, elapsed);
    }
  }

  jumpToSystem(systemKey) {
    const aliases = {
      highbreed: "augstaka",
      incursean: "incursia",
      anodite: "anodyne"
    };
    const destination = aliases[systemKey] || systemKey;
    if (!this.planetClasses[destination] && destination !== "solar") return;
    const ship = this.vehicle?.ship;
    const crew = [...(this.crew || [])];
    this.loadSystemScene(destination, ship, crew);
    this.extranet?.close();
    this.joystick?.setVehicleMode(true);
  }

  animate() {
    this.animationFrame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    if (this.state.stage === "gameplay") {
      this.joystick?.update(delta);
      this.updateCamera();
      this.updateResidents(delta, elapsed);
    }
    this.systemWorld?.animate?.(delta, elapsed);
    this.vehicle?.update?.(delta);
    if (this.state.stage !== "paused") this.renderer.render(this.scene, this.camera);
  }

  setStage(stage) {
    this.state.stage = stage;
    this.titleScreen.setVisible(stage === "title");
    this.titleScreen.newGame.setPreludeVisible(stage === "prelude");
    this.extranetButton.style.display = stage === "gameplay" ? "block" : "none";
    this.pauseButton.style.display = stage === "gameplay" ? "block" : "none";

    this.titleScreen.newGame.setControlsVisible(stage === "gameplay");
    if (stage === "gameplay") {
      this.titleScreen.newGame.initialize(this);
    } else if (stage === "title") {
      this.joystick?.setVisible(false);
      this.pause.setVisible(false);
      this.loadTitleWorld();
    }
  }

  loadTitleWorld() {
    this.joystick?.destroy();
    this.joystick = null;
    this.pause?.setVisible(false);
    this.clearWorld();

    this.systemWorld = new SolarSystem();
    this.celestial.add(this.systemWorld.model());
    this.addSystemPlanets("solar");
    this.celestial.updateMatrixWorld(true);

    this.camera.position.set(0, 0, 600000);
    this.camera.lookAt(-137150, 0, 0);
    this.camera.updateProjectionMatrix();
    this.cameraTarget.set(-137150, 0, 0);
    this.scene.background = new THREE.Color(0x02040a);
    this.scene.fog = null;
    this.state.stage = "title";
    this.state.currentScene = "space";
  }

  addSystemPlanets(systemKey) {
    const placements = {
      solar: [
        { key: "earth", position: [0, 0, 0] },
        { key: "moon", position: [1547, 0, 0] }
      ],
      augstaka: [{ key: "augstaka", position: [274300, 0, 0] }],
      anodyne: [{ key: "anodyne", position: [274300, 0, 0] }],
      galvan: [{ key: "galvan", position: [274300, 0, 0] }],
      incursia: [{ key: "incursia", position: [274300, 0, 0] }]
    };

    this.systemPlanets = [];
    for (const placement of placements[systemKey] || []) {
      const PlanetClass = this.planetClasses[placement.key];
      if (!PlanetClass) continue;
      const planet = new PlanetClass();
      const model = planet.model("exterior");
      model.position.set(...placement.position);
      this.celestial.add(model);
      this.systemPlanets.push({ planet, model, exterior: model });
    }
  }

  clearWorld() {
    this.celestial.traverse(object => {
      if (!object.isMesh) return;
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach(material => material.dispose());
    });
    this.celestial.clear();
    this.celestial = new THREE.Group();
    this.scene.fog = null;
    this.earth = null;
    this.currentPlanet = null;
    this.systemPlanets = [];
    this.systemWorld = null;
    this.vehicle = null;
    this.crew = [];
    this.bags = [];
    this.residents = [];
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("pointerdown", this.onFirstInteraction);
    this.cameraController.destroy();
    this.extranet.destroy();
    this.titleScreen.destroy();
    this.pause.destroy();
    this.pauseButton.remove();
    this.fontStyle.remove();
    if (this.joystick) this.joystick.destroy();
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.renderer.dispose();
    this.canvas.remove();
  }
}

new Omniverse();
