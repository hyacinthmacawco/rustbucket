import * as THREE from "three";
import { Title } from "../io/Title.js";
import { Camera } from "../team/Camera.js";
import { SolarSystem } from "./SolarSystem.js";
import { Moon } from "./Moon.js";
import { Augstaka } from "./Augstaka.js";
import { Anodyne } from "./Anodyne.js";
import { GalvanPrime } from "./GalvanPrime.js";
import { Incursia } from "./Incursia.js";
import { Earth } from "./Earth.js";
import { Extranet } from "../extranet/Extranet.js";

export class Omniverse {
  static state = { stage: "title", currentScene: "space" };

  constructor() {
    this.state = Omniverse.state;
    this.canvas = document.createElement("canvas");
    this.canvas.id = "omniverse";
    this.canvas.setAttribute("aria-label", "Rustbucket 3D game");
    Object.assign(this.canvas.style, {
      position: "fixed",
      inset: "0",
      display: "block",
      width: "100%",
      height: "100%",
      touchAction: "none"
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
      background: "#02040a"
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
      { fov: 55, near: 0.1, far: 2000000 },
      window.innerWidth / window.innerHeight
    );
    this.camera = this.cameraController.camera;
    this.camera.position.set(0, 0, 600000);
    this.camera.lookAt(-137150, 0, 0);
    this.scene.add(this.camera);
    this.cameraController.attach(this.canvas, {
      getStage: () => this.state.stage,
      getTarget: () => this.cameraTarget || new THREE.Vector3()
    });

    this.planetClasses = {
      earth: Earth,
      moon: Moon,
      augstaka: Augstaka,
      anodyne: Anodyne,
      galvan: GalvanPrime,
      incursia: Incursia
    };

    this.titleScreen = new Title({
      onNewGame: () => this.setStage("prelude"),
      onSkipPrelude: () => this.setStage("gameplay")
    });
    this.extranet = new Extranet();
    this.extranetButton = this.extranet.createButton();
    this.extranetButton.style.display = "none";

    this.onResize = () => {
      this.cameraController.resize(window.innerWidth / window.innerHeight);
      this.resize();
    };
    window.addEventListener("resize", this.onResize);
    this.clock = new THREE.Clock();
    this.animationFrame = null;
    this.animate = this.animate.bind(this);
    window.addEventListener("beforeunload", () => this.destroy(), { once: true });

    this.loadTitleWorld();
    this.start();
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

  animate() {
    this.animationFrame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    this.celestial.animate?.(delta, elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  setStage(stage) {
    this.state.stage = stage;
    this.titleScreen.setVisible(stage === "title");
    this.titleScreen.newGame.setPreludeVisible(stage === "prelude");
    this.extranetButton.style.display = stage === "gameplay" ? "block" : "none";

    if (stage === "gameplay") {
      this.titleScreen.newGame.initialize(this);
    } else if (stage === "title") {
      this.loadTitleWorld();
    }
  }

  loadTitleWorld() {
    this.clearWorld();
    const system = new THREE.Group();
    this.titleWorld = new SolarSystem(system);
    this.celestial = system;
    this.celestial.animate = this.titleWorld.animate.bind(this.titleWorld);
    this.addSystemPlanets("solar");
    this.camera.position.set(0, 0, 600000);
    this.camera.lookAt(-137150, 0, 0);
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
      const exterior = planet.exterior();
      exterior.position.set(...placement.position);
      this.celestial.add(exterior);
      this.systemPlanets.push({ planet, exterior });
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
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    this.cameraController.destroy();
    this.extranet.destroy();
    this.titleScreen.destroy();
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.renderer.dispose();
    this.canvas.remove();
  }
}

new Omniverse();
