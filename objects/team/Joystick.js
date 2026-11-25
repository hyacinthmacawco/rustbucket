import * as THREE from "three";

export class Joystick {
  static TEAM_MEMBERS = ["ben", "gwen", "kevin", "rook", "rustbucket"];
  static TEAM_NAMES = { ben: "Ben", gwen: "Gwen", kevin: "Kevin", rook: "Rook", rustbucket: "Rustbucket" };

  constructor() {
    this.onAttack = null;
    this.styles = {
      joystick: { position: "relative", width: "84px", height: "84px", flex: "0 0 84px", zIndex: "2147483647", touchAction: "none", userSelect: "none", pointerEvents: "auto" },
      base: { position: "absolute", inset: "0", pointerEvents: "auto", touchAction: "none", border: "1px solid rgba(126,255,168,.55)", borderRadius: "50%", background: "radial-gradient(circle, rgba(15,70,40,.62), rgba(2,16,10,.74))", boxShadow: "0 0 24px rgba(60,255,130,.18)" },
      knob: { position: "absolute", left: "50%", top: "50%", width: "46px", height: "46px", margin: "-23px", border: "1px solid rgba(188,255,205,.8)", borderRadius: "50%", background: "rgba(66,190,111,.65)", transform: "translate(0px,0px)", display: "grid", placeItems: "center", color: "#effff2", fontSize: "1.1rem" },
      lift: { position: "fixed", right: "max(14px, env(safe-area-inset-right))", bottom: "max(14px, env(safe-area-inset-bottom))", width: "84px", height: "84px", flex: "0 0 84px", zIndex: "2147483647", touchAction: "none", pointerEvents: "auto" },
      liftBase: { position: "absolute", inset: "0", border: "1px solid rgba(126,255,168,.5)", borderRadius: "50%", background: "rgba(2,16,10,.68)" },
      teamPanel: { position: "fixed", left: "max(22px, env(safe-area-inset-left))", bottom: "max(174px, calc(env(safe-area-inset-bottom) + 154px))", width: "142px", display: "grid", gap: "5px", padding: "8px", border: "1px solid rgba(126,255,168,.45)", borderRadius: "7px", background: "rgba(2,16,10,.86)", boxShadow: "0 0 20px rgba(60,255,130,.14)", zIndex: "90", boxSizing: "border-box" },
      teamButton: { width: "100%", minHeight: "25px", padding: "4px 8px", color: "#c8ffd7", font: "11px Industry, sans-serif", letterSpacing: ".08em", textAlign: "left", border: "none", borderRadius: "3px", background: "rgba(5,30,18,.7)", cursor: "pointer", touchAction: "manipulation" },
      transformation: { position: "fixed", left: "max(22px, env(safe-area-inset-left))", bottom: "max(320px, calc(env(safe-area-inset-bottom) + 300px))", width: "142px", padding: "9px 10px", zIndex: "2147483646", border: "1px solid rgba(126,255,168,.5)", borderRadius: "6px", background: "rgba(2,16,10,.9)", color: "#c8ffd7", font: "11px Industry, sans-serif", letterSpacing: ".08em" }
    };

    this.input = {
      active: false,
      pointerId: null,
      x: 0,
      y: 0,
       liftX: 0,
      liftY: 0,
      jumpRequested: false,
      pickRequested: false,
      attackHeld: false
    };
    this.vehicleMode = false;
     this.liftPointerId = null;
    this.element = document.createElement("div");
    this.element.id = "movement-joystick";
    this.element.setAttribute("aria-label", "Movement joystick");
    Object.assign(this.element.style, this.styles.joystick);

    this.base = document.createElement("div");
    this.base.id = "joystick-base";
    Object.assign(this.base.style, this.styles.base);
    this.knob = document.createElement("div");
    this.knob.id = "joystick-knob";
    Object.assign(this.knob.style, this.styles.knob);
    this.base.append(this.knob);
    this.element.append(this.base);

    this.teamPanel = document.createElement("nav");
    this.teamPanel.id = "team-member-list";
    this.teamPanel.setAttribute("aria-label", "Select team member");
    Object.assign(this.teamPanel.style, this.styles.teamPanel);
    this.teamButtons = new Map();
    for (const name of Joystick.TEAM_MEMBERS) {
      const button = document.createElement("div");
      button.setAttribute("role", "button");
      button.tabIndex = 0;
      button.textContent = Joystick.TEAM_NAMES[name];
      button.dataset.member = name;
      Object.assign(button.style, this.styles.teamButton);
      button.addEventListener("click", () => this.selectMember(name));
      button.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.selectMember(name); } });
      this.teamPanel.append(button);
      this.teamButtons.set(name, button);
    }
    this.bottomBar = document.createElement("div");
    this.bottomBar.id = "game-bottom-controls";
    Object.assign(this.bottomBar.style, {
      position: "fixed", left: "0", right: "0",
      bottom: "max(6px, env(safe-area-inset-bottom))",
      width: "100%", minHeight: "64px", padding: "4px 6px",
      boxSizing: "border-box", display: "contents", alignItems: "center",
      justifyContent: "space-between", gap: "12px",
      zIndex: "2147483647", pointerEvents: "none"
    });
    Object.assign(this.element.style, { position: "fixed", left: "max(16px, env(safe-area-inset-left))", bottom: "max(14px, env(safe-area-inset-bottom))", width: "84px", height: "84px", pointerEvents: "auto", zIndex: "2147483647" });
    this.statusBars = document.createElement("div");
    this.statusBars.id = "selected-member-status";
    Object.assign(this.statusBars.style, {
      position: "fixed", left: "50%", bottom: "max(108px, calc(env(safe-area-inset-bottom) + 94px))", transform: "translateX(-50%)", width: "min(34vw, 220px)",
      display: "flex", flexDirection: "column", justifyContent: "center",
      gap: "5px", minWidth: "90px", maxWidth: "220px",
      color: "#dfffe8", font: "9px Industry, sans-serif", letterSpacing: ".06em",
      pointerEvents: "none"
    });
    this.healthFill = this.createStatusBar("#ff4545");
    this.energyFill = this.createStatusBar("#45e878");

    this.actionControls = document.createElement("div");
    this.actionControls.id = "game-action-controls";
    Object.assign(this.actionControls.style, {
      position: "fixed", right: "max(112px, calc(env(safe-area-inset-right) + 96px))", bottom: "max(14px, env(safe-area-inset-bottom))",
      display: "flex", alignItems: "center", gap: "6px", maxWidth: "calc(100vw - 220px)", overflowX: "auto",
      flex: "0 0 auto", pointerEvents: "auto", zIndex: "2147483647"
    });

    document.body.append(this.element, this.statusBars, this.actionControls, this.teamPanel);

    this.transformationSelect = document.createElement("select");
    this.transformationSelect.id = "ben-transformations";
    this.transformationSelect.setAttribute("aria-label", "Ben transformations");
    Object.assign(this.transformationSelect.style, this.styles.transformation);
    for (const name of ["Ben", "Chromastone"]) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      this.transformationSelect.append(option);
    }
    this.transformationSelect.addEventListener("change", () => {
      this.onTransformationChange?.(this.transformationSelect.value);
    });
    document.body.append(this.transformationSelect);
    this.transformationSelect.style.display = "none";

    this.liftElement = document.createElement("div");
    this.liftElement.id = "lift-joystick";
    Object.assign(this.liftElement.style, { position: "fixed", right: "max(16px, env(safe-area-inset-right))", bottom: "max(112px, calc(env(safe-area-inset-bottom) + 100px))", width: "84px", height: "84px", zIndex: "2147483647" });
    this.liftElement.setAttribute("aria-label", "Rustbucket altitude control");
    Object.assign(this.liftElement.style, this.styles.lift);
    this.liftBase = document.createElement("div");
    this.liftBase.id = "lift-joystick-base";
    Object.assign(this.liftBase.style, this.styles.liftBase);
    this.liftKnob = document.createElement("div");
    this.liftKnob.id = "lift-joystick-knob";
    Object.assign(this.liftKnob.style, this.styles.knob);
    this.liftBase.append(this.liftKnob);
    this.liftElement.append(this.liftBase);
    document.body.append(this.liftElement);


    this.handleBaseDown = this.handleBaseDown.bind(this);
    this.handleBaseMove = this.handleBaseMove.bind(this);
    this.handleBaseUp = this.handleBaseUp.bind(this);
    this.handleLiftDown = this.handleLiftDown.bind(this);
    this.handleLiftMove = this.handleLiftMove.bind(this);
    this.handleLiftUp = this.handleLiftUp.bind(this);
    this.base.addEventListener("pointerdown", this.handleBaseDown);
    this.base.addEventListener("pointermove", this.handleBaseMove);
    this.base.addEventListener("pointerup", this.handleBaseUp);
    this.base.addEventListener("pointercancel", this.handleBaseUp);
    this.liftBase.addEventListener("pointerdown", this.handleLiftDown);
    this.liftBase.addEventListener("pointermove", this.handleLiftMove);
    this.liftBase.addEventListener("pointerup", this.handleLiftUp);
    this.liftBase.addEventListener("pointercancel", this.handleLiftUp);
    this.liftElement.style.display = "none";
  }


  createStatusBar(color) {
    const row = document.createElement("div");
    Object.assign(row.style, { display: "flex", alignItems: "center", minWidth: "0" });
    const track = document.createElement("div");
    Object.assign(track.style, { height: "7px", width: "100%", borderRadius: "5px", overflow: "hidden", background: "rgba(255,255,255,.18)" });
    const fill = document.createElement("div");
    Object.assign(fill.style, { width: "100%", height: "100%", background: color, transition: "width .12s linear" });
    track.append(fill);
    row.append(track);
    this.statusBars.append(row);
    return fill;
  }

  updateStatusBars() {
    const entity = this.entities?.[this.selected];
    const owner = entity?.userData?.statusOwner;
    this.statusBars.style.display = owner ? "flex" : "none";
    const health = Number(owner?.health ?? 0);
    const maxHealth = Math.max(1, Number(owner?.maxHealth ?? 100));
    const energy = Number(owner?.energy ?? 0);
    const maxEnergy = Math.max(1, Number(owner?.maxEnergy ?? 100));
    this.healthFill.style.width = (THREE.MathUtils.clamp(health / maxHealth, 0, 1) * 100) + "%";
    this.energyFill.style.width = (THREE.MathUtils.clamp(energy / maxEnergy, 0, 1) * 100) + "%";
  }

  setActionControls(controls = []) {
    const items = controls.filter(Boolean);
    for (const item of items) {
      Object.assign(item.style, { position: "relative", right: "auto", bottom: "auto", left: "auto", top: "auto", margin: "0", flex: "0 0 auto" });
    }
    this.actionControls.replaceChildren(...items);
  }

  updateBase(event) {
    const rect = this.base.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const max = rect.width * 0.32;
    const distance = Math.hypot(dx, dy);
    const factor = distance > max ? max / distance : 1;
    const x = dx * factor;
    const y = dy * factor;
    this.input.x = x / max;
    this.input.y = -y / max;
    this.knob.style.transform = `translate(${x}px,${y}px)`;
  }

  resetBase() {
    this.input.active = false;
    this.input.pointerId = null;
    this.input.x = 0;
    this.input.y = 0;
    this.knob.style.transform = "translate(0px,0px)";
  }

  handleBaseDown(event) {
    event.preventDefault();
    this.input.active = true;
    this.input.pointerId = event.pointerId;
    try { this.base.setPointerCapture(event.pointerId); } catch {}

    this.updateBase(event);
  }

  handleBaseMove(event) {
    if (!this.input.active || event.pointerId !== this.input.pointerId) return;
    event.preventDefault();
    this.updateBase(event);
  }

  handleBaseUp(event) {
    if (event.pointerId !== this.input.pointerId) return;
    if (event.type === "pointercancel") {
      this.resetBase();
      return;
    }

    this.resetBase();
  }

  updateLift(event) {
    const rect = this.liftBase.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const max = rect.width * 0.32;
    const distance = Math.hypot(dx, dy);
    const factor = distance > max ? max / distance : 1;
    const x = dx * factor;
    const y = dy * factor;
    this.input.liftX = x / max;
    this.input.liftY = -y / max;
    this.liftKnob.style.transform = `translate(${x}px,${y}px)`;
  }

  resetLift() {
    this.liftPointerId = null;
    this.input.liftX = 0;
    this.input.liftY = 0;
    this.liftKnob.style.transform = "translate(0px,0px)";
  }

  handleLiftDown(event) {
    event.preventDefault();
    event.stopPropagation();
    this.liftPointerId = event.pointerId;
    try { this.liftBase.setPointerCapture(event.pointerId); } catch {}
    this.updateLift(event);
  }

  handleLiftMove(event) {
    if (event.pointerId !== this.liftPointerId) return;
    event.preventDefault();
    this.updateLift(event);
  }

  handleLiftUp(event) {
    if (event.pointerId !== this.liftPointerId) return;
    event.preventDefault();
    this.resetLift();
  }

   setVisible(visible, showJoystick = true) {
    this.bottomBar.style.display = visible && showJoystick ? "contents" : "none";
    this.element.style.display = visible && showJoystick ? "block" : "none";
    this.teamPanel.style.display = visible && showJoystick ? "grid" : "none";
    this.liftElement.style.display = visible && showJoystick && this.vehicleMode ? "block" : "none";
    this.transformationSelect.style.display = visible && showJoystick && this.selected === "ben" ? "block" : "none";
    if (!visible) {
      this.resetBase();
      this.resetLift();
    }
  }

  setVehicleMode(active) {
    this.vehicleMode = Boolean(active);
    this.liftElement.style.display = this.vehicleMode && this.bottomBar.style.display !== "none" ? "block" : "none";
    if (!this.vehicleMode) this.resetLift();
  }

  setTeamOptions(selected) {
    for (const [name, button] of this.teamButtons) {
      const active = name === selected;
      button.setAttribute("aria-pressed", String(active));
      button.style.background = active ? "rgba(34,105,61,.9)" : "rgba(5,30,18,.7)";
      button.style.borderColor = active ? "rgba(188,255,205,.9)" : "rgba(126,255,168,.28)";
      button.style.color = active ? "#effff2" : "#c8ffd7";
    }
  }

  createKeyboard({ entities, camera, updateCamera, isMobile = false, onSelect = () => {}, onJump = () => {}, onToggleRamp = () => {}, onAtmosphereCheck = () => {}, onTransformationChange = () => {}, onInteract = null, initialSelected = "ben" }) {
    this.keys = new Set();
    this.entities = entities;
    this.camera = camera;
    this.updateCamera = updateCamera;
     this.onSelect = onSelect;
    this.onTransformationChange = onTransformationChange;
    this.onInteract = onInteract;
    this.onJump = onJump;
    this.onToggleRamp = onToggleRamp;
    this.onAtmosphereCheck = onAtmosphereCheck;
    this.selected = initialSelected;
    this.lastAttackAt = 0;
    this.selectableMembers = Joystick.TEAM_MEMBERS.filter(name => entities[name]);
    this.setTeamOptions(this.selected);
    this.setVehicleMode(this.selected === "rustbucket");
    this.updateStatusBars();
    this.onSelect(this.selected);
    this.transformationSelect.style.display = this.selected === "ben" ? "block" : "none";
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
    return this;
  }

  handleKeyDown = event => {
    const key = event.key.toLowerCase();
     if (key === "r" && !event.repeat && this.selected === "rustbucket") {
      this.onToggleRamp();
      event.preventDefault();
      return;
    }
    if (["w", "a", "s", "d", " ", "q"].includes(key)) {
      this.keys.add(key);
      event.preventDefault();
    }
    if (key === " " && !event.repeat) this.input.jumpRequested = true;
    if (key === "e" && !event.repeat) this.input.pickRequested = true;
  };

  handleKeyUp = event => {
    this.keys.delete(event.key.toLowerCase());
  };

  handleBlur = () => {
    this.keys.clear();
  };

  selectMember(next) {
    if (!this.selectableMembers?.includes(next) || next === this.selected) return;
    this.selected = next;
    this.setTeamOptions(this.selected);
    this.setVehicleMode(this.selected === "rustbucket");
    this.transformationSelect.style.display = this.selected === "ben" && this.element.style.display !== "none" ? "block" : "none";
    this.onSelect(this.selected);
    this.updateStatusBars();
    this.updateCamera();
  }

   update(dt) {
    const joy = this.input;
    const object = this.entities[this.selected];
    if (!object) return;
    const forward = (this.keys.has("w") ? 1 : 0) - (this.keys.has("s") ? 1 : 0) + joy.y;
    const right = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0) + joy.x;
    const magnitude = Math.hypot(forward, right);
    const direction = this.camera.getWorldDirection(new THREE.Vector3());
    const length = Math.hypot(direction.x, direction.z) || 1;
    const fx = direction.x / length;
    const fz = direction.z / length;
    const rx = -fz;
    const rz = fx;
    const mx = magnitude > 0.08 ? (fx * forward + rx * right) / Math.max(1, magnitude) : 0;
    const mz = magnitude > 0.08 ? (fz * forward + rz * right) / Math.max(1, magnitude) : 0;
    const speed = this.selected === "rustbucket" ? 18 : 3.5;

    // Convert camera-relative world movement into the selected object's
    // parent space. This matters for crew members walking inside the ship.
    const localForward = new THREE.Vector3(fx, 0, fz);
    const localMovement = new THREE.Vector3(mx, 0, mz);
    if (object.parent) {
      object.parent.updateWorldMatrix(true, false);
      const inverseParent = object.parent.matrixWorld.clone().invert();
      const origin = new THREE.Vector3(0, 0, 0).applyMatrix4(inverseParent);
      localForward.copy(new THREE.Vector3(fx, 0, fz).applyMatrix4(inverseParent).sub(origin)).normalize();
      localMovement.copy(new THREE.Vector3(mx, 0, mz).applyMatrix4(inverseParent).sub(origin));
    }
    // Player-controlled movement follows the camera heading. Preserve AI
    // facing and seat orientation while no movement input is being applied.
    const seated = Boolean(object.userData.statusOwner?.seated);
    if (!seated && (this.selected === "rustbucket" || magnitude > 0.08)) {
      object.rotation.y = Math.atan2(localForward.x, localForward.z);
    }

    if (joy.jumpRequested) {
      if (!seated) {
        if (this.selected === "rustbucket") this.onJump();
        else object.userData.statusOwner?.rig?.jump();
      }
      joy.jumpRequested = false;
    }

    if (seated) {
      // A seated crew member must stand up before moving.
    } else if (this.selected === "rustbucket" && object.userData.moveVehicle) {
      const lift = Math.abs(joy.liftY) < 0.08 ? 0 : THREE.MathUtils.clamp(joy.liftY, -1, 1);
      const fuelDemand = magnitude > 0.08 || Math.abs(lift) > 0.05;
      const hasFuel = !fuelDemand || object.userData.onFuelUse?.((magnitude + Math.abs(lift)) * dt) !== false;
      if (hasFuel) object.userData.moveVehicle(mx, mz, lift, dt, joy.liftX, Math.atan2(fx, fz));
    } else if (object.userData.moveWithCollisions) {
      object.userData.moveWithCollisions(mx * speed * dt, mz * speed * dt, dt);
    } else if (magnitude > 0.08) {
      object.position.add(localMovement.multiplyScalar(speed * dt));
    }

    if (joy.pickRequested) {
      if (this.onInteract) this.onInteract(this.selected, object);
      else if (this.selected === "rustbucket") object.userData.performPickup?.();
      else object.userData.statusOwner?.rig?.pick();
      joy.pickRequested = false;
    }

    const attackHeld = joy.attackHeld || this.keys.has("q");
    const attackInterval = this.selected === "rustbucket" ? 280 : 720;
    const now = performance.now();
    if (!seated && attackHeld && now - this.lastAttackAt >= attackInterval) {
      if (this.selected === "rustbucket") object.userData.performAttack?.();
      else if (this.onAttack) this.onAttack(this.selected, object);
      else object.userData.statusOwner?.rig?.attack();
      this.lastAttackAt = now;
    }

    object.userData.updateRigAnimation?.(magnitude > 0.08, performance.now() / 1000);
    object.update?.(dt);
    this.updateStatusBars();
    if (this.selected === "rustbucket") this.onAtmosphereCheck();
    this.updateCamera();
  }

  get currentSelection() {
    return this.selected;
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
    this.keys?.clear();
    this.base.removeEventListener("pointerdown", this.handleBaseDown);
    this.base.removeEventListener("pointermove", this.handleBaseMove);
    this.base.removeEventListener("pointerup", this.handleBaseUp);
    this.base.removeEventListener("pointercancel", this.handleBaseUp);
    this.liftBase.removeEventListener("pointerdown", this.handleLiftDown);
    this.liftBase.removeEventListener("pointermove", this.handleLiftMove);
    this.liftBase.removeEventListener("pointerup", this.handleLiftUp);
    this.liftBase.removeEventListener("pointercancel", this.handleLiftUp);
    this.element.remove();
    this.bottomBar.remove();
    this.teamPanel.remove();
    this.liftElement.remove();
  }
}
