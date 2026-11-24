import * as THREE from "three";
import { Jump } from "./Jump.js";
import { Attack } from "./Attack.js";
import { Pick } from "./Pick.js";

export class Joystick {
  static TEAM_MEMBERS = ["ben", "gwen", "kevin", "rook", "rustbucket"];
  static TEAM_LABELS = { ben: "B", gwen: "G", kevin: "K", rook: "R", rustbucket: "T" };

  constructor() {
    this.styles = {
      joystick: { position: "fixed", left: "max(22px, env(safe-area-inset-left))", bottom: "max(22px, env(safe-area-inset-bottom))", width: "132px", height: "132px", zIndex: "10000", touchAction: "none", userSelect: "none", pointerEvents: "auto" },
      base: { position: "absolute", inset: "0", border: "1px solid rgba(126,255,168,.55)", borderRadius: "50%", background: "radial-gradient(circle, rgba(15,70,40,.62), rgba(2,16,10,.74))", boxShadow: "0 0 24px rgba(60,255,130,.18)" },
      knob: { position: "absolute", left: "50%", top: "50%", width: "48px", height: "48px", margin: "-24px", border: "1px solid rgba(188,255,205,.8)", borderRadius: "50%", background: "rgba(66,190,111,.65)", transform: "translate(0px,0px)", display: "grid", placeItems: "center", color: "#effff2", fontSize: "1.1rem" },
      lift: { position: "fixed", right: "max(22px, env(safe-area-inset-right))", bottom: "max(22px, env(safe-area-inset-bottom))", width: "112px", height: "112px", zIndex: "10000", touchAction: "none", pointerEvents: "auto" },
      liftBase: { position: "absolute", inset: "0", border: "1px solid rgba(126,255,168,.5)", borderRadius: "50%", background: "rgba(2,16,10,.68)" },
      actionGroup: { position: "fixed", right: "max(22px, env(safe-area-inset-right))", bottom: "max(150px, calc(env(safe-area-inset-bottom) + 150px))", display: "flex", gap: "10px", zIndex: "10000", pointerEvents: "auto" },
      label: { position: "absolute", color: "#c8ffd7", fontSize: "11px", fontFamily: "Industry, sans-serif", textShadow: "0 0 8px #0a3", padding: "5px 9px", minWidth: "22px", textAlign: "center", border: "1px solid rgba(126,255,168,.7)", borderRadius: "4px", background: "rgba(2,24,12,.88)", pointerEvents: "none" }
    };

    this.input = {
      active: false,
      pointerId: null,
      x: 0,
      y: 0,
      mode: "move",
      selection: null,
      liftY: 0,
      jumpRequested: false,
      pickRequested: false,
      attackHeld: false
    };
    this.vehicleMode = false;
    this.lastCenterTap = 0;
    this.liftPointerId = null;
    this.element = document.createElement("div");
    this.element.id = "movement-joystick";
    this.element.setAttribute("aria-label", "Movement and team selector");
    Object.assign(this.element.style, this.styles.joystick);

    this.base = document.createElement("div");
    this.base.id = "joystick-base";
    Object.assign(this.base.style, this.styles.base);
    this.knob = document.createElement("div");
    this.knob.id = "joystick-knob";
    Object.assign(this.knob.style, this.styles.knob);
    this.labels = [];
    for (const [index, name] of ["ben", "gwen", "kevin", "rook"].entries()) {
      const label = document.createElement("span");
      label.className = "team-label team-" + name;
      label.textContent = Joystick.TEAM_LABELS[name];
      Object.assign(label.style, this.styles.label);
      label.style.left = index % 2 ? "78%" : "22%";
      label.style.top = index < 2 ? "22%" : "78%";
      this.base.append(label);
      this.labels.push(label);
    }
    this.base.append(this.knob);
    this.element.append(this.base);
    document.body.append(this.element);

    this.liftElement = document.createElement("div");
    this.liftElement.id = "lift-joystick";
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

    this.buttons = document.createElement("div");
    this.buttons.id = "action-controls";
    Object.assign(this.buttons.style, this.styles.actionGroup);
    this.jump = new Jump({
      onPress: () => {
        this.input.jumpRequested = true;
      }
    });
    this.pick = new Pick({
      onPress: () => {
        this.input.pickRequested = true;
      }
    });
    this.attack = new Attack({
      onStart: () => {
        this.input.attackHeld = true;
      },
      onEnd: () => {
        this.input.attackHeld = false;
      }
    });

    this.jumpButton = this.jump.create();
    this.pickButton = this.pick.create();
    this.attackButton = this.attack.create();
    this.buttons.append(this.jumpButton, this.pickButton, this.attackButton);
    document.body.append(this.buttons);

    this.handleBaseDown = this.handleBaseDown.bind(this);
    this.handleBaseMove = this.handleBaseMove.bind(this);
    this.handleBaseUp = this.handleBaseUp.bind(this);
    this.handleLiftDown = this.handleLiftDown.bind(this);
    this.handleLiftMove = this.handleLiftMove.bind(this);
    this.handleLiftUp = this.handleLiftUp.bind(this);
    this.handleAttackDown = this.handleAttackDown.bind(this);
    this.handleAttackUp = this.handleAttackUp.bind(this);
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
    this.base.setPointerCapture(event.pointerId);
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

    if (Math.hypot(this.input.x, this.input.y) < 0.22) {
      const now = performance.now();
      if (this.lastCenterTap && now - this.lastCenterTap <= 420) {
        this.lastCenterTap = 0;
        this.setMode(this.input.mode === "switch" ? "move" : "switch");
      } else {
        this.lastCenterTap = now;
        window.setTimeout(() => {
          if (this.lastCenterTap === now) this.lastCenterTap = 0;
        }, 420);
      }
    } else if (this.input.mode === "switch") {
      this.lastCenterTap = 0;
      this.input.selection = { x: this.input.x, y: this.input.y };
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
    this.input.liftY = -y / max;
    this.liftKnob.style.transform = `translate(${x}px,${y}px)`;
  }

  resetLift() {
    this.liftPointerId = null;
    this.input.liftY = 0;
    this.liftKnob.style.transform = "translate(0px,0px)";
  }

  handleLiftDown(event) {
    event.preventDefault();
    event.stopPropagation();
    this.liftPointerId = event.pointerId;
    this.liftBase.setPointerCapture(event.pointerId);
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

  setMode(mode) {
    this.input.mode = mode;
    this.element.classList.toggle("team-mode", mode === "switch");
    this.knob.textContent = mode === "switch" ? "↔" : "";
  }

  setVisible(visible, showJoystick = true) {
    this.element.style.display = visible && showJoystick ? "block" : "none";
    this.buttons.style.display = visible ? "flex" : "none";
    this.liftElement.style.display = visible && showJoystick && this.vehicleMode ? "block" : "none";
    if (!visible) {
      this.resetBase();
      this.resetLift();
    }
  }

  setVehicleMode(active) {
    this.vehicleMode = Boolean(active);
    this.liftElement.style.display = this.vehicleMode && this.element.style.display !== "none" ? "block" : "none";
    if (!this.vehicleMode) this.resetLift();
  }

  setTeamOptions(selected, members = Joystick.TEAM_MEMBERS) {
    const available = members.filter(name => name !== selected);
    this.labels.forEach((label, index) => {
      label.textContent = Joystick.TEAM_LABELS[available[index]] || "";
      label.setAttribute("aria-label", available[index] || "");
    });
  }

  createKeyboard({ entities, camera, updateCamera, isMobile = false, onSelect = () => {}, onJump = () => {}, onToggleRamp = () => {}, initialSelected = "ben" }) {
    this.keys = new Set();
    this.entities = entities;
    this.camera = camera;
    this.updateCamera = updateCamera;
    this.isMobile = isMobile;
    this.onSelect = onSelect;
    this.onJump = onJump;
    this.jump.setAction(this.onJump);
    this.onToggleRamp = onToggleRamp;
    this.selected = initialSelected;
    this.lastAttackAt = 0;
    this.selectableMembers = Joystick.TEAM_MEMBERS.filter(name => entities[name]);
    this.setTeamOptions(this.selected, this.selectableMembers);
    this.setVehicleMode(this.selected === "rustbucket");
    this.onSelect(this.selected);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
    return this;
  }

  handleKeyDown = event => {
    const key = event.key.toLowerCase();
    if (key === "f") {
      if (event.repeat) return;
      this.setMode(this.input.mode === "switch" ? "move" : "switch");
      this.keys.clear();
      event.preventDefault();
      return;
    }
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

  chooseMember(x, y) {
    const available = this.selectableMembers.filter(name => name !== this.selected);
    let index;
    if (Math.abs(x) > Math.abs(y)) index = x > 0 ? 1 : 3;
    else index = y > 0 ? 0 : 2;
    const next = available[index];
    if (!next) return;
    this.selected = next;
    this.setTeamOptions(this.selected, this.selectableMembers);
    this.setVehicleMode(this.selected === "rustbucket");
    this.onSelect(this.selected);
    this.updateCamera();
  }

  update(dt) {
    const joy = this.input;
    if (joy.selection) {
      this.chooseMember(joy.selection.x, joy.selection.y);
      joy.selection = null;
    }
    if (joy.mode === "switch") {
      if (!this.isMobile) {
        const x = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0);
        const y = (this.keys.has("w") ? 1 : 0) - (this.keys.has("s") ? 1 : 0);
        if (x || y) {
          this.chooseMember(x, y);
          this.keys.clear();
        }
      }
      return;
    }

    const object = this.entities[this.selected];
    if (!object) return;
    const forward = (this.keys.has("w") ? 1 : 0) - (this.keys.has("s") ? 1 : 0) + (this.isMobile ? joy.y : 0);
    const right = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0) + (this.isMobile ? joy.x : 0);
    const magnitude = Math.hypot(forward, right);
    const direction = this.camera.getWorldDirection(new THREE.Vector3());
    const length = Math.hypot(direction.x, direction.z) || 1;
    const fx = direction.x / length;
    const fz = direction.z / length;
    const rx = -fz;
    const rz = fx;
    if (this.selected !== "rustbucket") object.rotation.y = Math.atan2(fx, fz);
    const mx = magnitude > 0.08 ? (fx * forward + rx * right) / Math.max(1, magnitude) : 0;
    const mz = magnitude > 0.08 ? (fz * forward + rz * right) / Math.max(1, magnitude) : 0;
    const speed = this.selected === "rustbucket" ? 18 : 3.5;

    if (joy.jumpRequested) {
      if (this.selected === "rustbucket") this.jump.activate();
      else object.userData.requestJump?.();
      joy.jumpRequested = false;
    }

    if (this.selected === "rustbucket" && object.userData.moveVehicle) {
      const lift = Math.abs(joy.liftY) < 0.08 ? 0 : THREE.MathUtils.clamp(joy.liftY, -1, 1);
      const fuelDemand = magnitude > 0.08 || Math.abs(lift) > 0.05;
      const hasFuel = !fuelDemand || object.userData.onFuelUse?.((magnitude + Math.abs(lift)) * dt) !== false;
      if (hasFuel) object.userData.moveVehicle(mx, mz, lift, dt, right, Math.atan2(fx, fz));
    } else if (object.userData.moveWithCollisions) {
      object.userData.moveWithCollisions(mx * speed * dt, mz * speed * dt, dt);
    } else if (magnitude > 0.08) {
      object.position.x += mx * speed * dt;
      object.position.z += mz * speed * dt;
    }

    if (joy.pickRequested) {
      object.userData.performPickup?.();
      joy.pickRequested = false;
    }

    const attackHeld = joy.attackHeld || this.keys.has("q");
    const attackInterval = this.selected === "rustbucket" ? 280 : 720;
    const now = performance.now();
    if (attackHeld && now - this.lastAttackAt >= attackInterval) {
      object.userData.performAttack?.();
      this.lastAttackAt = now;
    }

    object.setAnimation?.(magnitude > 0.08 ? "walk" : "idle");
    object.update?.(dt);
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
    this.jump.destroy();
    this.pick.destroy();
    this.attack.destroy();
    this.element.remove();
    this.liftElement.remove();
    this.buttons.remove();
  }
}
