import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { Title } from "../io/Title.js";
import { Death } from "../team/Death.js";
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
import { Helix } from "../extranet/Helix.js";
import { AudioPlayer } from "../io/AudioPlayer.js";
import { Pause } from "../io/Pause.js";
import { Account } from "../io/Account.js";

const normalizeHomeworld = value => {
  const key = String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases = {
    anodite: "anodyne",
    anodine: "anodyne",
    anodyne: "anodyne",
    highbreed: "augstaka",
    augstaka: "augstaka",
    incursean: "incursia",
    incursian: "incursia",
    incursia: "incursia",
    galvanprime: "galvan",
    galvan: "galvan"
  };
  return aliases[key] || key;
};

export class Omniverse {
  static state = { stage: "title", currentScene: "space" };

  constructor() {
    this.state = Omniverse.state;
    this.firstPerson = false;
    this.installStyles();
    this.account = new Account();
    this.audioPlayer = new AudioPlayer();
    this.physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.physicsWorld.timestep = 1 / 60;
    this.characterController = this.physicsWorld.createCharacterController(0.04);
    this.characterController.setMaxSlopeClimbAngle(Math.PI / 4);
    this.characterController.setMinSlopeSlideAngle(Math.PI / 4);
    this.characterController.setApplyImpulsesToDynamicBodies(true);
    this.characterController.enableAutostep(0.45, 0.18, true);
    this.characterController.enableSnapToGround(0.22);
    this.physicsBodies = new Map();
    this.physicsGroundBody = null;
    this.dead = false;

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
      fontFamily: "Industry Light, sans-serif"
    });

    this.canvas.addEventListener("pointerdown", this.handleCanvasPointerDown);
    this.canvas.addEventListener("pointerup", this.handleCanvasPointerUp);
    this.canvas.addEventListener("pointercancel", this.handleCanvasPointerCancel);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerDown = null;
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
      getTarget: () => this.cameraTarget,
      getFirstPerson: () => this.firstPerson
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
      onNewGame: async () => {
        // Start the dialogue synchronously inside the user's click gesture.
        // Awaiting fullscreen first can consume the browser's audio activation.
        this.audioPlayer.unlock("prelude", this.titleScreen.song);
        this.setStage("prelude");
        await this.requestFullscreen();
      },
      onSkipPrelude: async () => {
        await this.requestFullscreen();
        this.audioPlayer.stopSfx();
        this.setStage("gameplay");
      }
    });
    this.titleScreen.setVisible(true);
    this.deathScreen = new Death();

    this.helix = new Helix({ account: this.account, audioPlayer: this.audioPlayer, onJumpSystem: key => this.jumpToSystem(key) });
    this.helixButton = this.helix.createButton();
    this.helixButton.style.display = "none";

    this.pause = new Pause({
      audioPlayer: this.audioPlayer,
      onResume: () => this.pause.setVisible(false),
      onCameraSensitivity: value => this.cameraController.setSensitivity?.(value)
    });
    this.pause.create();
    this.pauseButton = document.createElement("div");
    this.pauseButton.setAttribute("role", "button");
    this.pauseButton.tabIndex = 0;
    this.pauseButton.textContent = "PAUSE";
    this.pauseButton.setAttribute("aria-label", "Pause game");
    Object.assign(this.pauseButton.style, {
      position: "fixed",
      top: "max(14px, env(safe-area-inset-top))",
      right: "max(14px, env(safe-area-inset-right))",
      zIndex: "30",
      padding: "10px 14px",
      border: "none",
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
    // Browsers require a fresh user gesture to re-enter fullscreen after a tab switch.
    this.onFirstInteraction = () => {
      this.requestFullscreen();
      this.audioPlayer.unlock(this.state.stage, this.titleScreen.song);
    };
    document.addEventListener("pointerdown", this.onFirstInteraction, true);
    this.clock = new THREE.Clock();
    this.animationFrame = null;
    this.animate = this.animate.bind(this);
    window.addEventListener("beforeunload", () => this.destroy(), { once: true });

    this.loadTitleWorld();
    this.start();
  }

  updateAccountHUD() { this.helix?.updateAccount(); }

  handleRescuePickup(resident) {
    if (!resident) return null;
    const taskId = this.helix?.addTask(resident) ?? null;
    if (taskId != null) resident.taskId = taskId;
    return taskId;
  }

  handleRescueDrop(resident, relationshipIncrease = 0.5, taydeniteIncrease = 10) {
    if (!resident) return false;

    // Pickup creates and stores the task ID. Complete that exact task first;
    // if an old passenger has no ID, resolve the task by resident reference.
    let taskCompleted = this.helix?.completeTask(resident.taskId ?? resident) === true;
    if (!taskCompleted) taskCompleted = this.helix?.completeTask(resident) === true;

    // The caller only invokes this callback after the Rustbucket has been
    // unloaded on the passenger's homeworld. Do not reject completion here
    // based on a second, potentially stale scene/homeworld check.
    const species = resident.species || resident.group?.userData?.species || resident.constructor?.name;
    let actualRelationshipIncrease = relationshipIncrease;
    if (species && this.currentPlanet?.world?.key &&
        normalizeHomeworld(resident.homeworld || resident.group?.userData?.homeWorldKey || resident.constructor?.homeworld) === normalizeHomeworld(this.currentPlanet.world.key)) {
      const relationships = this.helix?.pages.relationships;
      const home = this.currentPlanet;
      const teamNames = ["Ben", "Gwen", "Kevin", "Rook"];
      for (const name of teamNames) {
        const before = relationships?.getRelationship(species, name) ?? Number(home?.constructor?.relationships?.[name] ?? 0);
        relationships?.addRelationship(species, name, 0.5);
        const next = relationships?.getRelationship(species, name) ?? Number(home?.constructor?.relationships?.[name] ?? before);
        actualRelationshipIncrease = next - before;
      }
    }

    if (!taskCompleted) {
      console.error("Rescue task was not found for delivered passenger; creating and completing a recovery task.", resident);
      const recoveryTaskId = this.helix?.addTask(resident);
      if (recoveryTaskId != null) taskCompleted = this.helix?.completeTask(recoveryTaskId) === true;
    }

    if (taskCompleted) {
      this.helix?.showTaskCompleted({ resident, relationshipIncrease: actualRelationshipIncrease, taydeniteIncrease });
    }
    return taskCompleted;
  }

  installStyles() {
    this.fontStyle = document.createElement("style");
    this.fontStyle.id = "rustbucket-fonts";
    this.fontStyle.textContent = `
      @font-face {
        font-family: "Industry Light";
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
        font-family: "Industry Light", sans-serif;
      }
      h1, h2, h3, h4, h5, h6, .rb-title, .rb-heading {
        font-family: "Industry Light", sans-serif !important;
        font-weight: 300 !important;
      }
      #title-screen, #prelude-screen, #pause-overlay, #helix-overlay {
        box-sizing: border-box;
      }
      #title-screen * { box-sizing: border-box; }
      button { border: 0 !important; outline-offset: 3px; }
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

  handleCanvasPointerDown = event => {
    if (event.button !== 0 || this.state.stage !== "gameplay") return;
    this.pointerDown = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };

  handleCanvasPointerCancel = event => {
    if (this.pointerDown?.id === event.pointerId) this.pointerDown = null;
  };

  handleCanvasPointerUp = event => {
    const start = this.pointerDown;
    this.pointerDown = null;
    if (!start || start.id !== event.pointerId || this.state.stage !== "gameplay") return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 9) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.celestial.children, true);
    for (const hit of hits) {
      let target = hit.object;
      while (target && target !== this.celestial) {
        if (typeof target.userData?.onClick === "function") {
          target.userData.onClick({ event, hit, omniverse: this });
          return;
        }
        target = target.parent;
      }
    }
  };

  attachObjectClickHandlers() {
    for (const bag of this.bags || []) bag.onClick = () => this.handleBagClick(bag);
    for (const resident of this.residents || []) resident.onClick = () => this.handleResidentClick(resident);
    if (this.vehicle) this.vehicle.onSeatClick = (seat, index) => {
      if (seat.occupiedBy) this.standTeamMember(seat.occupiedBy);
      else this.sitTeamMember(this.getTeamMember(this.joystick?.currentSelection), index);
    };
    this.celestial?.traverse(object => {
      if (object.userData?.market) object.userData.clickHandler = () => this.openMarket(this.getTeamMember(this.joystick?.currentSelection), object);
    });
  }

  handleBagClick(bag) {
    if (!bag) return false;
    const carrier = (this.crew || []).find(member => member.carryingBag === bag);
    if (carrier) {
      const position = carrier.group.getWorldPosition(new THREE.Vector3());
      this.celestial.attach(bag.group);
      bag.group.position.copy(position).add(new THREE.Vector3(0.55, 0, 0));
      bag.group.rotation.set(0, 0, 0);
      this.setBagPhysicsEnabled(bag, true);
      bag.pickable = true;
      bag.stored = false;
      bag.group.userData.pickable = true;
      carrier.carryingBag = null;
      return true;
    }
    const member = this.getTeamMember(this.joystick?.currentSelection);
    if (!member || member.carryingBag) return false;
    if (bag.stored) bag.setStored(false);
    if (!bag.pickable) return false;
    return this.pickTeamBag(member, bag);
  }

  handleResidentClick(resident) {
    if (!resident || !this.vehicle || !this.currentPlanet) return false;
    if (resident.isAboard) return this.vehicle.unboardResident(resident);
    if (String(resident.homeworld || resident.group?.userData?.homeWorldKey || "").toLowerCase().replace(/[^a-z0-9]/g, "") !== String(this.currentPlanet.world.key || "").toLowerCase().replace(/[^a-z0-9]/g, "")) return this.vehicle.boardResident(resident);
    return false;
  }

  setResidentAboard(resident, aboard) {
    if (!resident?.group) return;
    let entry = this.physicsBodies.get(resident.group);
    if (!entry && !aboard && resident.group.parent) {
      entry = this.registerPhysicsBody(resident.group, resident, resident.group.userData.collisionCapsule);
    }
    if (!aboard) {
      this.residents ||= [];
      if (!this.residents.includes(resident)) this.residents.push(resident);
    }
    if (!entry) return;
    if (aboard) {
      entry.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      entry.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      entry.body.setEnabled(false);
      entry.disabled = true;
      return;
    }
    resident.group.updateWorldMatrix(true, false);
    const p = resident.group.getWorldPosition(new THREE.Vector3());
    entry.body.setTranslation({ x: p.x, y: p.y, z: p.z }, true);
    entry.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    entry.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    entry.body.setEnabled(true);
    entry.disabled = false;
  }

  moveCharacterWithCollisions(object, dx, dz) {
    const vehicleEntry = this.physicsBodies.get(this.vehicle?.ship);
    if (vehicleEntry && this.vehicle?.ship?.parent) {
      const ship = this.vehicle.ship;
      ship.updateWorldMatrix(true, false);
      const shipPosition = ship.getWorldPosition(new THREE.Vector3());
      vehicleEntry.body.setTranslation({ x: shipPosition.x, y: shipPosition.y, z: shipPosition.z }, true);
      const yaw = new THREE.Euler().setFromQuaternion(ship.getWorldQuaternion(new THREE.Quaternion()), "YXZ").y;
      vehicleEntry.body.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), true);
    }
    const entry = this.physicsBodies.get(object);
    if (!entry || entry.disabled || !this.characterController) {
      const parent = object.parent;
      if (parent) {
        parent.updateWorldMatrix(true, false);
        const inverse = parent.matrixWorld.clone().invert();
        const origin = new THREE.Vector3().applyMatrix4(inverse);
        const target = new THREE.Vector3(dx, 0, dz).applyMatrix4(inverse);
        object.position.add(target.sub(origin));
      } else {
        object.position.x += dx;
        object.position.z += dz;
      }
      return;
    }
    this.physicsWorld.updateSceneQueries();
    const collider = entry.body.collider(0);
    if (!collider) return;
    this.characterController.computeColliderMovement(collider, { x: dx, y: 0, z: dz });
    const movement = this.characterController.computedMovement();
    const current = entry.body.translation();
    const next = { x: current.x + movement.x, y: current.y + movement.y, z: current.z + movement.z };
    entry.body.setTranslation(next, true);
    const worldPosition = new THREE.Vector3(next.x, next.y, next.z);
    object.parent?.updateWorldMatrix(true, false);
    object.position.copy(object.parent ? object.parent.worldToLocal(worldPosition) : worldPosition);
    object.updateMatrix();
  }

  setCharacterPhysicsEnabled(object, enabled) {
    const entry = this.physicsBodies.get(object);
    if (!entry) return;
    if (!enabled) {
      entry.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      entry.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      entry.body.setEnabled(false);
      entry.disabled = true;
      return;
    }
    object.updateWorldMatrix(true, false);
    const p = object.getWorldPosition(new THREE.Vector3());
    entry.body.setTranslation({ x: p.x, y: p.y, z: p.z }, true);
    entry.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    entry.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    entry.body.setGravityScale(1, true);
    entry.body.setEnabled(true);
    entry.disabled = false;
  }

  registerPhysicsBody(object, owner, capsule = object?.userData?.collisionCapsule) {
    if (!object || !owner || !capsule || !this.physicsWorld || this.physicsBodies.has(object)) return null;
    object.updateWorldMatrix(true, false);
    const position = object.getWorldPosition(new THREE.Vector3());
    const scale = object.getWorldScale(new THREE.Vector3());
    const body = this.physicsWorld.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z).setLinearDamping(5).setAngularDamping(5).lockRotations().setCanSleep(false)
    );
    // Crew bodies always use world gravity while they are outside the ship.
    body.setGravityScale(1, true);
    const worldRotation = object.getWorldQuaternion(new THREE.Quaternion());
    const yaw = new THREE.Euler().setFromQuaternion(worldRotation, "YXZ").y;
    body.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), true);
    this.physicsWorld.createCollider(
      RAPIER.ColliderDesc.capsule(capsule.halfHeight * scale.y, capsule.radius * scale.x)
        .setTranslation(0, capsule.centerY * scale.y, 0).setFriction(0.85).setRestitution(0),
      body
    );
    this.physicsBodies.set(object, { body, owner, disabled: false });
    return body;
  }

  registerBagPhysics(bag) {
    if (!bag?.group || !this.physicsWorld || this.physicsBodies.has(bag.group)) return null;
    bag.group.updateWorldMatrix(true, false);
    const p = bag.group.getWorldPosition(new THREE.Vector3());
    const scale = bag.group.getWorldScale(new THREE.Vector3());
    const body = this.physicsWorld.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z)
        .setLinearDamping(3).setAngularDamping(5).lockRotations().setCanSleep(false)
    );
    const [hx, hy, hz] = bag.group.userData.collisionBox?.halfExtents || [0.48, 0.38, 0.34];
    const center = bag.group.userData.collisionBox?.center || [0, 0, 0];
    this.physicsWorld.createCollider(
      RAPIER.ColliderDesc.cuboid(hx * scale.x, hy * scale.y, hz * scale.z)
        .setTranslation(center[0] * scale.x, center[1] * scale.y, center[2] * scale.z)
        .setFriction(0.8).setRestitution(0),
      body
    );
    this.physicsBodies.set(bag.group, { body, owner: bag, disabled: false });
    return body;
  }

  setBagPhysicsEnabled(bag, enabled) {
    const entry = this.physicsBodies.get(bag?.group);
    if (!entry) return;
    if (!enabled) {
      entry.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      entry.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      entry.body.setEnabled(false);
      entry.disabled = true;
      return;
    }
    bag.group.updateWorldMatrix(true, false);
    const p = bag.group.getWorldPosition(new THREE.Vector3());
    entry.body.setTranslation({ x: p.x, y: p.y, z: p.z }, true);
    entry.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    entry.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    entry.body.setEnabled(true);
    entry.disabled = false;
  }

  registerVehiclePhysics(vehicle) {
    if (!vehicle?.ship || !this.physicsWorld) return null;
    const body = vehicle.addVehicle(this.physicsWorld, RAPIER);
    const inSpace = this.state.currentScene === "space" || this.state.currentScene.startsWith("system-");
    body.setGravityScale(inSpace ? 0 : 1, true);
    this.physicsBodies.set(vehicle.ship, { body, owner: vehicle, disabled: false });
    return body;
  }

  setPhysicsGravity(y = 0) {
    if (!this.physicsWorld) return;
    this.physicsWorld.gravity = { x: 0, y, z: 0 };
    this.vehicle?.vehicleBody?.setGravityScale(y === 0 ? 0 : 1, true);
  }

  setPhysicsGround(enabled, includeStorageFloor = false) {
    if (this.physicsGroundBody) {
      this.physicsWorld.removeRigidBody(this.physicsGroundBody);
      this.physicsGroundBody = null;
    }
    if (!enabled || !this.physicsWorld) return;
    this.physicsGroundBody = this.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    // Planet visuals place the walkable surface at y = -0.6. Keep the
    // fixed Rapier collider exactly on that surface instead of floating at y = 0.
    this.physicsWorld.createCollider(
      RAPIER.ColliderDesc.cuboid(210, 0.5, 210).setTranslation(0, -1.1, 0).setFriction(0.9),
      this.physicsGroundBody
    );
    if (includeStorageFloor) {
      this.physicsWorld.createCollider(
        RAPIER.ColliderDesc.cuboid(17, 0.175, 16).setTranslation(0, -0.2, -31).setFriction(0.9),
        this.physicsGroundBody
      );
    }
  }

  stepPhysics(delta) {
    if (!this.physicsWorld || this.state.stage !== "gameplay") return;
    // Sync the vehicle first. Every object parented anywhere under its scene
    // graph is carried by the ship transform, not by an independent rigid body.
    const physicsEntries = [...this.physicsBodies.entries()];
    physicsEntries.sort(([a], [b]) => a === this.vehicle?.ship ? -1 : b === this.vehicle?.ship ? 1 : 0);
    for (const [object, entry] of physicsEntries) {
      if (!object.parent) continue;
      let attachedToVehicle = false;
      for (let ancestor = object.parent; ancestor; ancestor = ancestor.parent) {
        if (ancestor === this.vehicle?.ship) { attachedToVehicle = true; break; }
      }
      if (attachedToVehicle || entry.owner?.seated || entry.owner?.isAboard) {
        if (!entry.disabled) entry.body.setEnabled(false);
        entry.disabled = true;
        continue;
      }
      // Disabled bodies are intentionally attached to a hand, seat, passenger
      // cabin or other parent. Re-enable them only through their owner method.
      if (entry.disabled) continue;
      object.updateWorldMatrix(true, false);
      const position = object.getWorldPosition(new THREE.Vector3());
      const rotation = object.getWorldQuaternion(new THREE.Quaternion());
      entry.body.setTranslation({ x: position.x, y: position.y, z: position.z }, true);
      const yaw = new THREE.Euler().setFromQuaternion(rotation, "YXZ").y;
      const uprightRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      entry.body.setRotation({ x: uprightRotation.x, y: uprightRotation.y, z: uprightRotation.z, w: uprightRotation.w }, true);
    }
    this.physicsWorld.timestep = Math.max(1 / 120, Math.min(delta, 0.05));
    this.physicsWorld.step();
    for (const [object, entry] of physicsEntries) {
      if (!object.parent || entry.disabled) continue;
      const p = entry.body.translation(), q = entry.body.rotation(), parent = object.parent;
      parent.updateWorldMatrix(true, false);
      object.position.copy(parent.worldToLocal(new THREE.Vector3(p.x, p.y, p.z)));
      const parentRotation = parent.getWorldQuaternion(new THREE.Quaternion()).invert();
      object.quaternion.copy(parentRotation.multiply(new THREE.Quaternion(q.x, q.y, q.z, q.w)));
      object.updateMatrix();
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
      if (!this.vehicle?.ship) return;
      this.updateCamera();
      return;
    }
    const member = this.getTeamMember(selected);
    if (!member) return;
    // Selection is a camera/control change only. It must never change worlds,
    // recreate the vehicle, or reset the crew's saved world positions.
    this.updateCamera();
  }

  secureCrewInVehicle(ship, crew = this.crew || [], bags = this.bags || []) {
    if (!ship) return;
    crew.forEach((member, index) => {
      if (!member?.group) return;
      const seat = ship.seats?.[index];
      ship.attach(member.group);
      if (seat) {
        member.group.position.copy(seat.position);
        member.group.rotation.set(0, seat.rotation, 0);
        seat.occupiedBy = member;
        member.seated = true;
        member.seatIndex = index;
        member.group.userData.seated = true;
        this.getActiveRig(member)?.sit?.();
      }
      const physics = this.physicsBodies.get(member.group);
      if (physics) { physics.body.setEnabled(false); physics.disabled = true; }
    });
    bags.forEach((bag, index) => {
      if (!bag?.group || crew.some(member => member.carryingBag === bag)) return;
      ship.attach(bag.group);
      bag.group.position.set(-1.05 + index * 0.7, -0.95, -3.65);
      bag.group.rotation.set(0, 0, 0);
      bag.stored = true;
      bag.pickable = false;
      bag.group.userData.pickable = false;
      const physics = this.physicsBodies.get(bag.group);
      if (physics) { physics.body.setEnabled(false); physics.disabled = true; }
    });
  }

  setPOV(firstPerson) {
    const enabling = Boolean(firstPerson);
    if (enabling && !this.firstPerson) {
      this.thirdPersonOffset = this.camera.position.clone().sub(this.cameraTarget || new THREE.Vector3());
    }
    this.firstPerson = enabling;
    if (enabling) this._firstPersonJustEnabled = true;
    if (!enabling) {
      const selected = this.joystick?.currentSelection;
      const entity = selected === "rustbucket"
        ? this.vehicle?.ship
        : this.getTeamMember(selected)?.group;
      if (entity) {
        const target = entity.getWorldPosition(new THREE.Vector3());
        target.y += selected === "rustbucket" ? 1.5 : 1.15;
        const offset = this.thirdPersonOffset || new THREE.Vector3(0, 4, 42);
        this.camera.position.copy(target).add(offset);
        this.cameraTarget.copy(target);
        this.camera.lookAt(target);
        return;
      }
    }
    this.updateCamera();
  }

  updateCamera() {
    const selected = this.joystick?.currentSelection;
    const entity = selected === "rustbucket"
      ? this.vehicle?.ship
      : this.crew?.[["ben", "gwen", "kevin", "rook"].indexOf(selected)]?.group;
    if (!entity) return;

    if (this.firstPerson) {
      entity.updateWorldMatrix(true, false);
      const rotation = entity.getWorldQuaternion(new THREE.Quaternion());
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(rotation).normalize();
      const position = new THREE.Vector3();
      if (selected === "rustbucket") {
        position.set(0, 0.55, 3.65).applyMatrix4(entity.matrixWorld);
      } else {
        const head = this.getActiveRig(entity.userData.statusOwner)?.joints?.head;
        if (head) {
          head.getWorldPosition(position);
          position.add(new THREE.Vector3(0, 0.06, 0.2).applyQuaternion(rotation));
        } else {
          position.set(0, 1.55, 0).applyMatrix4(entity.matrixWorld);
        }
      }
      if (this._firstPersonJustEnabled) {
        this.camera.position.copy(position);
        this.camera.lookAt(position.clone().add(forward.multiplyScalar(12)));
        this.camera.rotation.order = "YXZ";
        this._firstPersonJustEnabled = false;
      } else {
        this.camera.position.copy(position);
      }
      this.cameraTarget.copy(position);
      return;
    }

    const target = entity.getWorldPosition(new THREE.Vector3());
    target.y += selected === "rustbucket" ? 1.5 : 1.15;
    if (!this.cameraTarget) this.cameraTarget = target.clone();
    const shift = target.clone().sub(this.cameraTarget);
    this.camera.position.add(shift);
    this.cameraTarget.copy(target);
    this.camera.lookAt(this.cameraTarget);
  }

  getTeamMember(selected) {
    const index = ["ben", "gwen", "kevin", "rook"].indexOf(selected);
    return index < 0 ? null : this.crew?.[index] || null;
  }

  getActiveRig(member) {
    return member?.activeTransformation === "Chromastone" ? member.chromastone?.rig : member?.rig;
  }

  findNearbyBag(member, range = 1.8) {
    if (!member?.group || member.carryingBag) return null;
    const position = member.group.getWorldPosition(new THREE.Vector3());
    let nearest = null;
    let nearestDistance = range;
    for (const bag of this.bags || []) {
      if (!bag.pickable || bag.stored || bag.group.parent !== this.celestial) continue;
      const distance = position.distanceTo(bag.group.getWorldPosition(new THREE.Vector3()));
      if (distance < nearestDistance) {
        nearest = bag;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  findNearbySeat(member, range = 2.6) {
    const seats = this.vehicle?.seats || [];
    if (!member?.group || !seats.length) return -1;
    const position = member.group.getWorldPosition(new THREE.Vector3());
    let nearestIndex = -1;
    let nearestDistance = range;
    for (let index = 0; index < seats.length; index++) {
      if (seats[index].occupiedBy && seats[index].occupiedBy !== member) continue;
      const seatPosition = seats[index].group.getWorldPosition(new THREE.Vector3());
      const distance = position.distanceTo(seatPosition);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }
    return nearestIndex;
  }

  pickTeamBag(member, bag) {
    if (!member || member.carryingBag || !bag || !bag.pickable) return false;
    member.group.updateWorldMatrix(true, false);
    const hand = this.getActiveRig(member)?.joints?.rightWrist;
    if (!hand) return false;
    hand.attach(bag.group);
    bag.group.position.set(0.08, -0.04, 0.1);
    bag.group.rotation.set(0, 0, 0);
    bag.pickable = false;
    bag.group.userData.pickable = false;
    member.carryingBag = bag;
    this.setBagPhysicsEnabled(bag, false);
    this.getActiveRig(member)?.pick?.();
    return true;
  }

  storeTeamBag(member) {
    const bag = member?.carryingBag;
    const ship = this.vehicle?.ship;
    if (!bag || !ship) return false;
    ship.attach(bag.group);
    const index = Math.max(0, this.crew.indexOf(member));
    bag.group.position.set(-1.05 + index * 0.7, -0.95, -3.65);
    bag.group.rotation.set(0, 0, 0);
    this.setBagPhysicsEnabled(bag, false);
    bag.stored = true;
    bag.pickable = false;
    bag.group.userData.pickable = false;
    member.carryingBag = null;
    return true;
  }

  sitTeamMember(member, seatIndex = -1) {
    const ship = this.vehicle?.ship;
    if (!member || !ship || member.seated) return false;
    if (seatIndex < 0) seatIndex = this.findNearbySeat(member);
    const seat = ship.seats?.[seatIndex];
    if (!seat) return false;
    const memberPosition = member.group.getWorldPosition(new THREE.Vector3());
    const seatPosition = seat.group?.getWorldPosition(new THREE.Vector3());
    if (!seatPosition || memberPosition.distanceTo(seatPosition) > 4.5) return false;
    ship.attach(member.group);
    member.group.position.copy(seat.position);
    member.group.rotation.set(0, seat.rotation, 0);
    this.getActiveRig(member)?.sit?.();
    member.seated = true;
    member.seatIndex = seatIndex;
    seat.occupiedBy = member;
    member.group.userData.seated = true;
    this.setCharacterPhysicsEnabled(member.group, false);
    return true;
  }

  standTeamMember(member) {
    const ship = this.vehicle?.ship;
    if (!member?.seated || !ship) return false;
    ship.updateWorldMatrix(true, false);
    const exit = ship.localToWorld(new THREE.Vector3(0, -1.18, -6.3));
    this.celestial.attach(member.group);
    member.group.position.copy(exit);
    member.group.rotation.y = ship.rotation.y;
    this.getActiveRig(member)?.stand?.();
    const seat = ship.seats?.[member.seatIndex];
    if (seat?.occupiedBy === member) seat.occupiedBy = null;
    member.seated = false;
    member.group.userData.seated = false;
    this.setCharacterPhysicsEnabled(member.group, true);
    if (member.automation) member.automation.phase = "manual";
    return true;
  }

  findNearbyMarket(member, range = 14) {
    const entity = member?.group || member?.ship || (member?.isObject3D ? member : null);
    if (!entity || !this.celestial) return null;
    if (member?.ship) range = Math.max(range, 42);
    const point = entity.getWorldPosition(new THREE.Vector3());
    let market = null;
    this.celestial.traverse(object => {
      if (!object.userData?.market) return;
      if (point.distanceTo(object.getWorldPosition(new THREE.Vector3())) <= range) market = object;
    });
    return market;
  }

  openMarket(member, market) {
    if (!market) return;
    this.marketDialog?.remove();
    const resource = "Grape Smoothie";
    const quantity = Math.max(0, Math.floor(Number(market.resources?.[resource]) || 0));
    const price = Math.max(0, Math.floor(Number(market.prices?.[resource]) || 5));
    const dialog = document.createElement("section");
    Object.assign(dialog.style, { position: "fixed", inset: "15% 8%", zIndex: "120", padding: "24px", background: "rgba(3,18,12,.96)", color: "#eaffef", border: "1px solid #79e99a", font: "inherit", display: "grid", alignContent: "start", gap: "14px" });
    const title = document.createElement("h2"); title.textContent = "MARKET";
    const stock = document.createElement("p");
    const balance = document.createElement("p");
    const buy = document.createElement("button"); buy.textContent = "BUY 1";
    Object.assign(buy.style, { padding: "12px", background: "#174c2c", color: "white", font: "inherit" });
    const refresh = () => {
      const currentStock = Math.max(0, Math.floor(Number(market.resources?.[resource]) || 0));
      stock.textContent = `${resource} — ${currentStock} available · ${price} Taydenite each`;
      balance.textContent = `YOUR BALANCE — ${this.account.balance} TAYDENITE`;
      buy.disabled = currentStock < 1 || this.account.balance < price;
      buy.textContent = this.account.balance < price ? "INSUFFICIENT TAYDENITE" : "BUY 1";
    };
    buy.onclick = () => {
      const currentStock = Math.max(0, Math.floor(Number(market.resources?.[resource]) || 0));
      if (currentStock < 1 || !this.account.spendTaydenite(price)) { refresh(); return; }
      const bag = member ? (member.carryingBag || this.bags?.[this.crew.indexOf(member)]) : null;
      if (bag) { bag.resources ||= {}; bag.resources[resource] = (bag.resources[resource] || 0) + 1; }
      else { this.vehicle.resources ||= {}; this.vehicle.resources[resource] = (this.vehicle.resources[resource] || 0) + 1; }
      market.resources[resource] = currentStock - 1;
      this.updateAccountHUD();
      refresh();
    };
    const close = document.createElement("button"); close.textContent = "CLOSE"; close.onclick = () => dialog.remove();
    dialog.append(title, stock, balance, buy, close); document.body.append(dialog); this.marketDialog = dialog;
    refresh();
  }

  moveCrewMember(member, target, delta, elapsed, local = false) {
    const position = member.group.position;
    const dx = target.x - position.x;
    const dz = target.z - position.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 0.08) {
      const parentScale = member.group.parent === this.vehicle?.ship ? (this.vehicle.ship.scale.x || 1) : 1;
      const step = Math.min(distance, (2.5 / parentScale) * delta);
      if (member.group.parent === this.vehicle?.ship) {
        position.x += dx / distance * step;
        position.z += dz / distance * step;
      } else {
        this.moveCharacterWithCollisions(member.group, dx / distance * step, dz / distance * step);
      }
      member.group.rotation.y = Math.atan2(dx, dz);
      this.getActiveRig(member)?._rig?.setWalking(true);
    } else {
      this.getActiveRig(member)?._rig?.setWalking(false);
    }
    this.getActiveRig(member)?._rig?.updateWalk(elapsed);
    return distance;
  }

  updateCrewAutomation(delta, elapsed) {
    if (!this.vehicle?.ship?.parent || this.currentPlanet !== this.crewHomePlanet || this.state.currentScene !== this.crewHomePlanet?.world?.key) return;
    const ship = this.vehicle.ship;
    for (const member of this.crew || []) {
      const task = member.automation;
      if (!task || task.phase === "done" || task.phase === "manual" || member.seated) continue;
      const selected = this.joystick?.currentSelection === ["ben", "gwen", "kevin", "rook"][this.crew.indexOf(member)];
      const input = this.joystick?.input;
      if (selected && input && (Math.hypot(input.x, input.y) > 0.08 || this.joystick.keys?.size > 0)) {
        task.phase = "manual";
        continue;
      }
      if (task.phase === "toBag") {
        if (member.carryingBag || !task.bag?.pickable || task.bag.stored) {
          task.phase = "toRamp";
        } else {
          const target = task.bag.group.getWorldPosition(new THREE.Vector3());
          const distance = this.moveCrewMember(member, target, delta, elapsed);
          if (distance < 0.85 && this.pickTeamBag(member, task.bag)) task.phase = "toRamp";
        }
      } else if (task.phase === "toRamp") {
        const target = ship.localToWorld(new THREE.Vector3(0, 0, -6.15));
        const distance = this.moveCrewMember(member, target, delta, elapsed);
        if (distance < 1.0) {
          this.storeTeamBag(member);
          ship.attach(member.group);
          this.setCharacterPhysicsEnabled(member.group, false);
          task.phase = "toSeat";
        }
      } else if (task.phase === "toSeat") {
        let seat = ship.seats?.[task.seatIndex];
        if (seat?.occupiedBy && seat.occupiedBy !== member) {
          const freeIndex = ship.seats.findIndex(candidate => !candidate.occupiedBy);
          if (freeIndex < 0) continue;
          task.seatIndex = freeIndex;
          seat = ship.seats[freeIndex];
        }
        if (!seat) continue;
        const distance = this.moveCrewMember(member, seat.position, delta, elapsed, true);
        if (distance < 0.14) {
          member.group.position.copy(seat.position);
          member.group.rotation.set(0, seat.rotation, 0);
          this.getActiveRig(member)?.sit?.();
          member.seated = true;
          member.seatIndex = task.seatIndex;
          seat.occupiedBy = member;
          member.group.userData.seated = true;
          const physicsEntry = this.physicsBodies.get(member.group);
          if (physicsEntry) { physicsEntry.body.setEnabled(false); physicsEntry.disabled = true; }
          task.phase = "done";
        }
      }
    }
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
    const persistentBags = this.bags || [];
    if (ship) this.secureCrewInVehicle(ship, crew, persistentBags);
    ship?.removeFromParent();

    this.clearWorld();
    this.bags = persistentBags;

    const SystemClass = this.systemClasses[systemKey] || SolarSystem;
    this.systemWorld = new SystemClass();
    this.celestial.add(this.systemWorld.model());
    this.setPhysicsGround(false);
    this.setPhysicsGravity(0);
    this.audioPlayer?.playSongs(this.systemWorld.songs);

    this.addSystemPlanets(systemKey);
    this.celestial.updateMatrixWorld(true);

    const destination = this.systemPlanets.find(entry => entry.planet.world.key === destinationKey)
      || this.systemPlanets[0];
    const center = destination?.model.position || new THREE.Vector3();

    this.vehicle = vehicle || (ship ? { ship } : null);
    this.crew = crew || [];
    this.vehicle?.vehicleBody?.setGravityScale(0, true);
    if (ship) {
      ship.position.set(center.x, center.y + 1500, center.z);
      ship.rotation.set(0, 0, 0);
      this.celestial.add(ship);
      this.vehicle.ship = ship;
    }

    this.scene.background = new THREE.Color(0x02040a);
    this.scene.fog = null;
    this.state.stage = "gameplay";
    this.state.currentScene = systemKey === "solar" ? "space" : "system-" + systemKey;
    this.vehicleSystem = systemKey;
    this.helix?.setLocation(systemKey === "solar" ? "space" : systemKey);
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
    const activeShip = ship || vehicle?.ship;
    const persistentBags = this.bags || [];
    if (activeShip) this.secureCrewInVehicle(activeShip, crew, persistentBags);
    activeShip?.removeFromParent();

    this.clearWorld();
    this.bags = persistentBags;
    this.celestial.add(planet.model("interior"));
    this.setPhysicsGround(true, planet.world.key === "earth");
    this.setPhysicsGravity(-9.81);
    this.currentPlanet = planet;
    this.audioPlayer?.playSongs(planet.songs);
    this.earth = planet.world.key === "earth" ? planet : null;
    this.scene.background = new THREE.Color(planet.world.sky);
    this.scene.fog = new THREE.Fog(planet.world.sky, 180, 700);

    this.vehicle = vehicle || (ship ? { ship } : null);
    this.crew = crew || [];
    this.vehicle?.vehicleBody?.setGravityScale(1, true);
    if (ship) {
      this.vehicle.ship = ship;
      ship.position.set(0, 3.54, 34);
      ship.rotation.set(0, 0, 0);
      this.celestial.add(ship);
      this.resetCameraToShip(ship);
    }

    if (!ship) {
      this.camera.position.set(0, 8, 23);
      this.camera.lookAt(0, 1.5, 0);
      this.cameraTarget.set(0, 1.5, 0);
    }

    this.state.stage = "gameplay";
    this.state.currentScene = planet.world.key;
    this.titleScreen.setVisible(false);
    this.titleScreen.newGame.setPreludeVisible(false);
    this.helixButton.style.display = "inline-flex";
    this.helix?.setLocation(planet.world.key);
    this.residents = planet.spawnResidents?.(this.celestial) || [];
    for (const resident of this.residents) {
      this.registerPhysicsBody(resident.group, resident, resident.group.userData.collisionCapsule);
      resident.moveWithCollisions = (dx, dz) => this.moveCharacterWithCollisions(resident.group, dx, dz);
    }
    this.attachObjectClickHandlers();
    this.vehicle?.setRescueContext({
      getCurrentPlanet: () => this.currentPlanet,
      getResidents: () => this.residents || [],
      account: this.account,
      onUpdate: () => this.updateAccountHUD(),
      onPickup: resident => this.handleRescuePickup(resident),
      onDrop: (resident, relationshipIncrease, taydeniteIncrease) => this.handleRescueDrop(resident, relationshipIncrease, taydeniteIncrease),
      onBoard: resident => this.setResidentAboard(resident, true),
      onUnboard: resident => this.setResidentAboard(resident, false)
    });
    return this.celestial;
  }

  updatePatrolShipHealthBars() {
    const patrols = this.systemWorld?.ships || [];
    if (!this.camera || !patrols.length) return;
    const cameraQuaternion = this.camera.getWorldQuaternion(new THREE.Quaternion());
    const parentQuaternion = new THREE.Quaternion();
    for (const patrol of patrols) {
      const bar = patrol.healthBar?.group;
      if (!bar || patrol.destroyed || !patrol.group?.parent) continue;
      patrol.group.updateWorldMatrix(true, false);
      patrol.group.getWorldQuaternion(parentQuaternion);
      bar.quaternion.copy(parentQuaternion.invert().multiply(cameraQuaternion));
    }
  }

  checkPatrolShipCollisions() {
    const patrols = this.systemWorld?.ships || [];
    const projectiles = this.vehicle?.projectiles || [];
    if (!patrols.length || !projectiles.length) return;

    const previous = new THREE.Vector3();
    const current = new THREE.Vector3();
    const segment = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const intersection = new THREE.Vector3();
    const bounds = new THREE.Box3();
    const ray = new THREE.Ray();

    for (let index = projectiles.length - 1; index >= 0; index--) {
      const bolt = projectiles[index];
      const parent = bolt?.parent;
      if (!parent) continue;
      parent.updateWorldMatrix(true, false);
      bolt.updateWorldMatrix(true, false);
      bolt.getWorldPosition(current);
      if (bolt.userData.previousWorldPosition) previous.copy(bolt.userData.previousWorldPosition);
      else if (bolt.userData.previousPosition) previous.copy(bolt.userData.previousPosition).applyMatrix4(parent.matrixWorld);
      else previous.copy(current);

      segment.subVectors(current, previous);
      const distance = segment.length();
      if (distance < 1e-5) continue;
      direction.copy(segment).multiplyScalar(1 / distance);
      ray.set(previous, direction);
      let hit = false;

      for (const patrol of patrols) {
        if (patrol.destroyed || !patrol.group?.visible || !patrol.group?.parent) continue;
        patrol.group.updateWorldMatrix(true, true);
        bounds.setFromObject(patrol.group).expandByScalar(2.5);
        if (!ray.intersectBox(bounds, intersection)) continue;
        if (intersection.distanceTo(previous) > distance) continue;

        patrol.takeDamage?.(bolt.userData.damage ?? 10);
        patrol.lastHitAt = performance.now();
        hit = true;
        break;
      }

      if (hit) {
        parent.remove(bolt);
        bolt.geometry?.dispose();
        if (Array.isArray(bolt.material)) bolt.material.forEach(material => material.dispose());
        else bolt.material?.dispose();
        projectiles.splice(index, 1);
      }
    }
  }

  handleCombatAttack(selected) {
    const attacker = this.getTeamMember(selected);
    if (!attacker || attacker.health <= 0 || attacker.seated) return false;
    const origin = attacker.group.getWorldPosition(new THREE.Vector3());
    let target = null, nearest = 3.2;
    for (const resident of this.residents || []) {
      const relationship = Number(
        resident.relationships?.[attacker.constructor.name]
        ?? resident.constructor?.relationships?.[attacker.constructor.name]
        ?? 0
      );
      if (resident.health <= 0 || resident.isAboard || relationship >= 0) continue;
      const distance = origin.distanceTo(resident.group.getWorldPosition(new THREE.Vector3()));
      if (distance < nearest) { nearest = distance; target = resident; }
    }
    if (target) return attacker.attack?.(target) ?? false;
    if (attacker.activeTransformation === "Chromastone") {
      attacker.rig?.attack?.();
      return true;
    }
    this.getActiveRig(attacker)?._rig?.playAnimation("punch");
    return false;
  }

  updateResidents(delta, elapsed) {
    for (const resident of this.residents || []) {
      if (!resident.isAboard && resident.health > 0) {
        resident.update(delta, elapsed);
        resident.attackCooldown = Math.max(0, (resident.attackCooldown || 0) - delta);
        if (resident.attackCooldown === 0) {
          const origin = resident.group.getWorldPosition(new THREE.Vector3());
          for (const member of this.crew || []) {
            if (member.health <= 0 || member.seated) continue;
            if (origin.distanceTo(member.group.getWorldPosition(new THREE.Vector3())) < 2.2 && resident.attack?.(member)) { resident.attackCooldown = 1.4; break; }
          }
        }
      }
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
    this.helix?.close();
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
      this.crew?.forEach(member => member.update?.(delta));
      const rigTime = performance.now() / 1000;
      for (const member of this.crew || []) {
        const rig = this.getActiveRig(member)?._rig;
        if (rig?.animating) rig.updateWalk(rigTime);
      }
      for (const member of this.crew || []) { if (member.health <= 0) { member.group.visible = false; member.dead = true; } }
      if (!this.dead && this.crew?.length === 4 && this.crew.every(member => member.health <= 0)) { this.dead = true; this.deathScreen.setVisible(true); this.audioPlayer.playMusic("./files/songs/af-end-credits-slowed.opus"); }
      this.updateCrewAutomation(delta, elapsed);
    }
    this.systemWorld?.animate?.(delta, elapsed);
    this.updatePatrolShipHealthBars();
    this.vehicle?.update?.(delta);
    if (this.state.stage === "gameplay") {
      this.stepPhysics(delta);
      this.checkPatrolShipCollisions();
      for (const patrol of this.systemWorld?.ships || []) {
        patrol.attackCooldown = Math.max(0, (patrol.attackCooldown || 0) - delta);
        if (patrol.destroyed || patrol.attackCooldown > 0) continue;
        const patrolPosition = patrol.group.getWorldPosition(new THREE.Vector3());
        for (const member of this.crew || []) {
          if (member.health <= 0 || !member.group?.parent) continue;
          if (patrolPosition.distanceTo(member.group.getWorldPosition(new THREE.Vector3())) < 42000 && patrol.attack(member)) { patrol.attackCooldown = 2.2; break; }
        }
      }
    }
    if (this.state.stage === "gameplay" && this.crew?.[0]?.group?.parent && this.crew[0].activeTransformation === "Chromastone") {
      this.crew[0].chromastone.checkLaserCollisions(this.vehicle?.projectiles || []);
    }
    if (this.state.stage !== "paused") this.renderer.render(this.scene, this.camera);
  }

  setStage(stage) {
    this.state.stage = stage;
    this.titleScreen.setVisible(stage === "title");
    this.titleScreen.newGame.setPreludeVisible(stage === "prelude");
    this.helixButton.style.display = stage === "gameplay" ? "inline-flex" : "none";
    this.pauseButton.style.display = stage === "gameplay" ? "block" : "none";

    this.titleScreen.newGame.setControlsVisible(stage === "gameplay");
    if (stage === "prelude") {
      this.audioPlayer.stopMusic();
      this.audioPlayer.stopSfx();
      this.audioPlayer.playSfx("./files/dialogues/ov-final-conversation.opus", () => {
        if (this.state.stage === "prelude") this.setStage("gameplay");
      });
    } else if (stage === "gameplay") {
      this.audioPlayer.stopSfx();
      this.titleScreen.newGame.initialize(this);
    } else if (stage === "title") {
      this.joystick?.setVisible(false);
      this.pause.setVisible(false);
      this.loadTitleWorld();
      if (this.audioPlayer.unlocked) this.audioPlayer.playMusic(this.titleScreen.song);
    }
  }

  loadTitleWorld() {
    for (const entry of this.physicsBodies.values()) this.physicsWorld.removeRigidBody(entry.body);
    this.physicsBodies.clear();
    this.setPhysicsGround(false);
    this.setPhysicsGravity(0);
    this.joystick?.destroy();
    this.joystick = null;
    this.pause?.setVisible(false);
    this.clearWorld();

    this.systemWorld = null;
    this.systemPlanets = [];

    this.camera.position.set(0, 0, 600000);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.cameraTarget.set(0, 0, 0);
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
    this.setPhysicsGround(false);
    for (const resident of this.residents || []) {
      const entry = this.physicsBodies.get(resident.group);
      if (entry) {
        this.physicsWorld.removeRigidBody(entry.body);
        this.physicsBodies.delete(resident.group);
      }
    }
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
    document.removeEventListener("pointerdown", this.onFirstInteraction, true);
    this.canvas.removeEventListener("pointerdown", this.handleCanvasPointerDown);
    this.canvas.removeEventListener("pointerup", this.handleCanvasPointerUp);
    this.canvas.removeEventListener("pointercancel", this.handleCanvasPointerCancel);
    this.cameraController.destroy();
    this.helix.destroy();
    this.titleScreen.destroy();
    this.deathScreen.destroy();
    this.pause.destroy();
    this.pauseButton.remove();
    this.marketDialog?.remove();
    this.fontStyle.remove();
    if (this.joystick) this.joystick.destroy();
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.audioPlayer?.destroy();
    for (const entry of this.physicsBodies.values()) this.physicsWorld.removeRigidBody(entry.body);
    this.physicsBodies.clear();
    if (this.physicsGroundBody) this.physicsWorld.removeRigidBody(this.physicsGroundBody);
    this.physicsWorld.free();
    this.renderer.dispose();
    this.canvas.remove();
  }
}

await RAPIER.init();
new Omniverse();
