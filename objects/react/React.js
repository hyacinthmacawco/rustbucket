import * as THREE from "three";
import { Omniverse } from "../omniverse/Omniverse.js";
import { Title } from "../title/Title.js";
import { SolarSystem } from "../celestials/SolarSystem.js";
import { AugstakaSystem } from "../celestials/AugstakaSystem.js";
import { AnodyneSystem } from "../celestials/AnodyneSystem.js";
import { GalvanSystem } from "../celestials/GalvanSystem.js";
import { IncursiaSystem } from "../celestials/IncursiaSystem.js";
import { Moon } from "../celestials/Moon.js";
import { Augstaka } from "../celestials/Augstaka.js";
import { Anodyne } from "../celestials/Anodyne.js";
import { GalvanPrime } from "../celestials/GalvanPrime.js";
import { Incursia } from "../celestials/Incursia.js";
import { Earth } from "../celestials/Earth.js";
import { Rustbucket } from "../team/Rustbucket.js";
import { Ben } from "../team/Ben.js";
import { Gwen } from "../team/Gwen.js";
import { Kevin } from "../team/Kevin.js";
import { Rook } from "../team/Rook.js";
import { Human } from "../species/Human.js";
import { Extranet } from "../extranet/Extranet.js";

export class React {
  static state = { stage: "title", currentScene: "space" };

  constructor() {
    this.state = React.state;
    this.omniverse = new Omniverse();
    this.canvas = this.omniverse.canvas;
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

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000000);
    this.camera.position.set(0, 0, 600000);
    this.camera.lookAt(-137150, 0, 0);
    this.scene.add(this.camera);

    this.activeWorld = new THREE.Group();
    this.activeWorld.name = "ActiveWorld";
    this.scene.add(this.activeWorld);
    this.titleWorld = new SolarSystem(this.activeWorld);
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

    this.createPrelude();
    this.titleScreen = new Title({ onNewGame: () => this.setStage("prelude") });
    this.extranet = new Extranet();
    this.extranetButton = this.extranet.createButton();
    this.extranetButton.style.display = "none";

    this.onPointerDown = event => {
      if (event.button !== 0) return;
      this.pointer = { x: event.clientX, y: event.clientY };
      this.canvas.setPointerCapture?.(event.pointerId);
    };
    this.onPointerMove = event => {
      if (!this.pointer || this.state.stage === "title") return;
      const dx = event.clientX - this.pointer.x;
      const dy = event.clientY - this.pointer.y;
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.camera.position.x -= dx * 2;
      this.camera.position.y += dy * 2;
      this.camera.lookAt(this.cameraTarget || new THREE.Vector3());
    };
    this.onPointerUp = () => { this.pointer = null; };
    this.onWheel = event => {
      if (this.state.stage === "title") return;
      const direction = this.camera.position.clone().normalize();
      this.camera.position.addScaledVector(direction, event.deltaY * 0.45);
    };

    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: true });

    this.onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", this.onResize);

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    this.animationFrame = requestAnimationFrame(this.animate);
    window.addEventListener("beforeunload", () => this.destroy(), { once: true });
  }

  createPrelude() {
    this.prelude = document.createElement("section");
    this.prelude.id = "prelude-screen";
    Object.assign(this.prelude.style, {
      position: "fixed",
      inset: "0",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "28px",
      background: "#000",
      color: "#fff",
      zIndex: "50",
      fontFamily: "monospace",
      letterSpacing: ".18em"
    });

    const heading = document.createElement("div");
    heading.textContent = "A NEW DAWN";
    heading.style.fontSize = "clamp(20px, 5vw, 42px)";

    const skip = document.createElement("button");
    skip.type = "button";
    skip.textContent = "SKIP";
    Object.assign(skip.style, {
      padding: "10px 28px",
      border: "1px solid #79e99a",
      background: "transparent",
      color: "#dffff0",
      font: "inherit",
      cursor: "pointer"
    });
    skip.addEventListener("click", () => this.setStage("gameplay"));
    this.prelude.append(heading, skip);
    document.body.append(this.prelude);
  }

  setStage(stage) {
    this.state.stage = stage;
    this.titleScreen.setVisible(stage === "title");
    this.prelude.style.display = stage === "prelude" ? "flex" : "none";
    this.extranetButton.style.display = stage === "gameplay" ? "block" : "none";

    if (stage === "gameplay") this.loadEarth();
    else if (stage === "title") this.loadTitleWorld();
  }

  loadTitleWorld() {
    this.clearWorld();
    this.titleWorld = new SolarSystem(this.activeWorld);
    this.camera.position.set(0, 0, 600000);
    this.camera.lookAt(-137150, 0, 0);
    this.state.currentScene = "space";
  }

  loadEarth() {
    this.clearWorld();
    this.scene.background = new THREE.Color(Earth.WORLD.sky);
    this.scene.fog = new THREE.Fog(Earth.WORLD.sky, 180, 700);

    this.earth = new Earth(this.activeWorld);
    this.vehicle = new Rustbucket(this.activeWorld);
    this.vehicle.ship.position.set(0, 2, 34);

    this.crew = [
      new Ben({ HumanRig: Human }),
      new Gwen({ HumanRig: Human }),
      new Kevin({ HumanRig: Human }),
      new Rook({ HumanRig: Human })
    ];

    const positions = [
      [-4, 0, 8],
      [-1.4, 0, 8],
      [1.4, 0, 8],
      [4, 0, 8]
    ];
    this.crew.forEach((member, index) => {
      member.group.position.set(...positions[index]);
      this.activeWorld.add(member.group);
    });

    this.camera.position.set(0, 8, 23);
    this.camera.lookAt(0, 1.5, 0);
    this.cameraTarget = new THREE.Vector3(0, 1.5, 0);
    this.state.currentScene = "earth";
    this.currentPlanet = this.earth;
    this.extranet.setLocation("earth");
  }

  enterPlanet(key) {
    const PlanetClass = this.planetClasses[key];
    if (!PlanetClass) return false;

    this.clearWorld();
    this.currentPlanet = new PlanetClass(this.activeWorld);
    const world = PlanetClass.WORLD;
    this.scene.background = new THREE.Color(world.sky);
    this.scene.fog = new THREE.Fog(world.sky, 180, 700);
    this.camera.position.set(0, 8, 23);
    this.camera.lookAt(0, 1.5, 0);
    this.cameraTarget = new THREE.Vector3(0, 1.5, 0);
    this.state.stage = "gameplay";
    this.state.currentScene = key;
    this.titleScreen.setVisible(false);
    this.prelude.style.display = "none";
    this.extranetButton.style.display = "block";
    this.extranet.setLocation(key);
    return this.currentPlanet;
  }

  exitPlanet() {
    if (!this.currentPlanet) return false;

    const systemKey = this.currentPlanet.system;
    const SystemClass = this.systemClasses[systemKey];
    if (!SystemClass) return false;

    this.clearWorld();
    this.systemWorld = new SystemClass(this.activeWorld);
    this.currentPlanet = null;
    this.scene.background = new THREE.Color(0x02040a);
    this.scene.fog = null;
    this.camera.position.set(0, 0, 600000);
    this.camera.lookAt(0, 0, 0);
    this.state.currentScene = systemKey === "solar" ? "space" : "system-" + systemKey;
    this.extranet.setLocation(systemKey === "solar" ? "space" : systemKey);
    return this.systemWorld;
  }

  clearWorld() {
    this.activeWorld.traverse(object => {
      if (!object.isMesh) return;
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach(material => material.dispose());
    });
    this.activeWorld.clear();
    this.scene.fog = null;
    this.earth = null;
    this.currentPlanet = null;
    this.systemWorld = null;
    this.vehicle = null;
    this.crew = [];
  }

  animate() {
    this.animationFrame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    if (this.state.stage === "title" && this.titleWorld) {
      this.titleWorld.earth.rotation.y += delta * 0.07;
      this.titleWorld.moon.rotation.y += delta * 0.04;
      this.titleWorld.sunAura.material.opacity = 0.11 + Math.sin(elapsed * 0.7) * 0.025;
      this.titleWorld.sunOuterGlow.material.opacity = 0.05 + Math.sin(elapsed * 0.45) * 0.012;
      this.titleWorld.stars.rotation.y += delta * 0.0008;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.onResize);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.extranet.destroy();
    this.titleScreen.destroy();
    this.prelude.remove();
    this.renderer.dispose();
    this.omniverse.destroy();
  }
}

new React();
