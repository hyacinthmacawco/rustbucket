import * as THREE from "three";
import { Omniverse } from "../omniverse/Omniverse.js";
import { Title } from "../io/Title.js";
import { Camera } from "../team/Camera.js";
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

    this.cameraController = new Camera(THREE, { fov: 55, near: 0.1, far: 2000000 }, window.innerWidth / window.innerHeight);
    this.camera = this.cameraController.camera;
    this.camera.position.set(0, 0, 600000);
    this.camera.lookAt(-137150, 0, 0);
    this.scene.add(this.camera);
    this.cameraController.attach(this.canvas, {
      getStage: () => this.state.stage,
      getTarget: () => this.cameraTarget || new THREE.Vector3()
    });

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
    this.addSystemPlanets("solar");

    this.titleScreen = new Title({
      onNewGame: () => this.setStage("prelude"),
      onSkipPrelude: () => this.setStage("gameplay")
    });
    this.extranet = new Extranet();
    this.extranetButton = this.extranet.createButton();
    this.extranetButton.style.display = "none";

    this.onResize = () => {
      this.cameraController.resize(window.innerWidth / window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", this.onResize);

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    this.animationFrame = requestAnimationFrame(this.animate);
    window.addEventListener("beforeunload", () => this.destroy(), { once: true });
  }

  setStage(stage) {
    this.state.stage = stage;
    this.titleScreen.setVisible(stage === "title");
    this.titleScreen.newGame.setPreludeVisible(stage === "prelude");
    this.extranetButton.style.display = stage === "gameplay" ? "block" : "none";

    if (stage === "gameplay") this.loadEarth();
    else if (stage === "title") this.loadTitleWorld();
  }

  loadTitleWorld() {
    this.clearWorld();
    this.titleWorld = new SolarSystem(this.activeWorld);
    this.addSystemPlanets("solar");
    this.camera.position.set(0, 0, 600000);
    this.camera.lookAt(-137150, 0, 0);
    this.state.currentScene = "space";
  }

  loadEarth() {
    this.earth = new Earth();
    this.earth.enter(this);
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
      this.activeWorld.add(exterior);
      this.systemPlanets.push({ planet, exterior });
    }
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
    this.systemPlanets = [];
    this.systemWorld = null;
    this.vehicle = null;
    this.crew = [];
  }

  animate() {
    this.animationFrame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    if (this.state.stage === "title" && this.titleWorld) {
      for (const entry of this.systemPlanets || []) {
        entry.exterior.rotation.y += delta * 0.04;
      }
      this.titleWorld.sunAura.material.opacity = 0.11 + Math.sin(elapsed * 0.7) * 0.025;
      this.titleWorld.sunOuterGlow.material.opacity = 0.05 + Math.sin(elapsed * 0.45) * 0.012;
      this.titleWorld.stars.dome.rotation.y += delta * 0.0008;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.onResize);
    this.cameraController.destroy();
    this.extranet.destroy();
    this.titleScreen.destroy();
    this.renderer.dispose();
    this.omniverse.destroy();
  }
}

new React();
