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
import { Helix } from "../extranet/Helix.js";
import { AudioPlayer } from "../io/AudioPlayer.js";
import { Pause } from "../io/Pause.js";
import { Account } from "../io/Account.js";

export class Omniverse {
  static state = { stage: "title", currentScene: "space" };

  constructor() {
    this.state = Omniverse.state;
    this.firstPerson = false;
    this.installStyles();
    this.account = new Account();
    this.audioPlayer = new AudioPlayer();

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
    this.onFirstInteraction = () => { this.requestFullscreen(); this.audioPlayer.unlock(this.state.stage); };
    document.addEventListener("pointerdown", this.onFirstInteraction, { once: true });
    this.clock = new THREE.Clock();
    this.animationFrame = null;
    this.animate = this.animate.bind(this);
    window.addEventListener("beforeunload", () => this.destroy(), { once: true });

    this.loadTitleWorld();
    this.start();
  }

  updateAccountHUD() { this.helix?.updateAccount(); }

  handleRescuePickup(resident) {
    return this.helix?.addTask(resident) ?? null;
  }

  handleRescueDrop(resident, relationshipIncrease = 5, taydeniteIncrease = 10) {
    this.helix?.completeTask(resident?.taskId);
    const species = resident?.species || resident?.group?.userData?.species;
    let actualRelationshipIncrease = relationshipIncrease;
    if (species) {
      const relationships = this.helix?.pages.relationships;
      const before = relationships?.getRelationship(species, "Ben") ?? 0;
      relationships?.addRelationship(species, "Ben", relationshipIncrease);
      actualRelationshipIncrease = (relationships?.getRelationship(species, "Ben") ?? before) - before;
    }
    this.helix?.showTaskCompleted({ resident, relationshipIncrease: actualRelationshipIncrease, taydeniteIncrease });
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
    if (this.state.currentScene !== home.world.key) {
      this.enterPlanetScene(home, this.vehicle?.ship || null, [...(this.crew || [])]);
    }
    this.updateCamera();
  }

  setPOV(firstPerson) {
    const enabling = Boolean(firstPerson);
    if (enabling && !this.firstPerson) {
      this.thirdPersonOffset = this.camera.position.clone().sub(this.cameraTarget || new THREE.Vector3());
    }
    this.firstPerson = enabling;
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
      this.camera.position.copy(position);
      this.camera.lookAt(position.clone().add(forward.multiplyScalar(12)));
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
    bag.group.rotation.set(0, 0, Math.PI / 2);
    bag.pickable = false;
    bag.group.userData.pickable = false;
    member.carryingBag = bag;
    this.getActiveRig(member)?.pick?.();
    return true;
  }

  storeTeamBag(member) {
    const bag = member?.carryingBag;
    const ship = this.vehicle?.ship;
    if (!bag || !ship) return false;
    ship.attach(bag.group);
    const index = Math.max(0, this.crew.indexOf(member));
    bag.group.position.set(-1.05 + index * 0.7, -0.68, -3.65);
    bag.group.rotation.set(0, 0, Math.PI / 2);
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
    ship.attach(member.group);
    member.group.position.copy(seat.position);
    member.group.rotation.set(0, seat.rotation, 0);
    this.getActiveRig(member)?.sit?.();
    member.seated = true;
    member.seatIndex = seatIndex;
    seat.occupiedBy = member;
    member.group.userData.seated = true;
    return true;
  }

  standTeamMember(member) {
    const ship = this.vehicle?.ship;
    if (!member?.seated || !ship) return false;
    ship.updateWorldMatrix(true, false);
    const exit = ship.localToWorld(new THREE.Vector3(0, -0.65, -6.3));
    this.celestial.attach(member.group);
    member.group.position.copy(exit);
    member.group.rotation.y = ship.rotation.y;
    this.getActiveRig(member)?.stand?.();
    const seat = ship.seats?.[member.seatIndex];
    if (seat?.occupiedBy === member) seat.occupiedBy = null;
    member.seated = false;
    member.group.userData.seated = false;
    if (member.automation) member.automation.phase = "manual";
    return true;
  }

  handleTeamInteraction(selected) {
    if (selected === "rustbucket") {
      this.vehicle?.performRescueAction();
      return;
    }
    const member = this.getTeamMember(selected);
    if (!member) return;
    if (member.seated) {
      this.standTeamMember(member);
      return;
    }
    if (member.carryingBag) {
      const shipPosition = this.vehicle?.ship?.getWorldPosition(new THREE.Vector3());
      const memberPosition = member.group.getWorldPosition(new THREE.Vector3());
      if (shipPosition && memberPosition.distanceTo(shipPosition) < 12) {
        this.storeTeamBag(member);
      } else {
        const bag = member.carryingBag;
        this.celestial.attach(bag.group);
        bag.group.position.copy(memberPosition).add(new THREE.Vector3(0.6, 0, 0));
        bag.pickable = true;
        bag.group.userData.pickable = true;
        member.carryingBag = null;
      }
      return;
    }
    const bag = this.findNearbyBag(member);
    if (bag) {
      this.pickTeamBag(member, bag);
      return;
    }
    const seatIndex = this.findNearbySeat(member);
    if (seatIndex >= 0) this.sitTeamMember(member, seatIndex);
  }

  updateTeamInteractionMode() {
    const selected = this.joystick?.currentSelection;
    const control = this.titleScreen?.newGame?.interactControl;
    if (!control) return;
    if (selected === "rustbucket") {
      this.vehicle?.updateRescueInteraction({ selected, interactControl: control });
      return;
    }
    const member = this.getTeamMember(selected);
    if (!member) return;
    if (member.seated) control.setMode("Stand");
    else if (member.carryingBag) control.setMode("Drop");
    else if (this.findNearbyBag(member)) control.setMode("Pick");
    else if (this.findNearbySeat(member) >= 0) control.setMode("Sit");
    else control.setMode("Pick");
  }

  moveCrewMember(member, target, delta, elapsed, local = false) {
    const position = member.group.position;
    const dx = target.x - position.x;
    const dz = target.z - position.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 0.08) {
      const step = Math.min(distance, 2.5 * delta);
      position.x += dx / distance * step;
      position.z += dz / distance * step;
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
          task.phase = "toSeat";
        }
      } else if (task.phase === "toSeat") {
        const seat = ship.seats?.[task.seatIndex];
        if (!seat) continue;
        const distance = this.moveCrewMember(member, seat.position, delta, elapsed, true);
        if (distance < 0.14) {
          member.group.position.copy(seat.position);
          member.group.rotation.set(0, seat.rotation, 0);
          member.rig?.sit?.();
          member.seated = true;
          member.seatIndex = task.seatIndex;
          seat.occupiedBy = member;
          member.group.userData.seated = true;
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

    this.vehicle = vehicle || (ship ? { ship } : null);
    this.crew = crew || [];
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
    activeShip?.removeFromParent();
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
    }
    if (planet === this.crewHomePlanet) {
      this.crew.forEach((member, index) => {
        if (member.seated) {
          const seat = vehicle?.seats?.[member.seatIndex];
          if (seat?.occupiedBy === member) seat.occupiedBy = null;
        }
        member.seated = false;
        member.group.userData.seated = false;
        this.getActiveRig(member)?.stand?.();
        member.group.position.set(-4 + index * 2.6, 0, 8);
        this.celestial.add(member.group);
      });
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
    this.helixButton.style.display = "block";
    this.helix?.setLocation(planet.world.key);
    this.residents = planet.spawnResidents?.(this.celestial) || [];
    this.vehicle?.setRescueContext({
      getCurrentPlanet: () => this.currentPlanet,
      getResidents: () => this.residents || [],
      account: this.account,
      onUpdate: () => this.updateAccountHUD(),
      onPickup: resident => this.handleRescuePickup(resident),
      onDrop: (resident, relationshipIncrease, taydeniteIncrease) => this.handleRescueDrop(resident, relationshipIncrease, taydeniteIncrease)
    });
    return this.celestial;
  }

  updateResidents(delta, elapsed) {
    for (const resident of this.residents || []) {
      if (!resident.isAboard) resident.update(delta, elapsed);
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
      this.updateCrewAutomation(delta, elapsed);
      this.updateTeamInteractionMode();
    }
    this.systemWorld?.animate?.(delta, elapsed);
    this.vehicle?.update?.(delta);
    if (this.state.stage === "gameplay" && this.crew?.[0]?.group?.parent && this.crew[0].activeTransformation === "Chromastone") {
      this.crew[0].chromastone.checkLaserCollisions(this.vehicle?.projectiles || []);
    }
    if (this.state.stage !== "paused") this.renderer.render(this.scene, this.camera);
  }

  setStage(stage) {
    this.state.stage = stage;
    this.titleScreen.setVisible(stage === "title");
    this.titleScreen.newGame.setPreludeVisible(stage === "prelude");
    this.helixButton.style.display = stage === "gameplay" ? "block" : "none";
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
    this.helix.destroy();
    this.titleScreen.destroy();
    this.pause.destroy();
    this.pauseButton.remove();
    this.fontStyle.remove();
    if (this.joystick) this.joystick.destroy();
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.audioPlayer?.destroy();
    this.renderer.dispose();
    this.canvas.remove();
  }
}

new Omniverse();
