import * as THREE from "three";

const TEAM_MEMBERS = ["ben", "gwen", "kevin", "rook", "rustbucket"];
const TEAM_LABELS = { ben: "B", gwen: "G", kevin: "K", rook: "R", rustbucket: "T" };

export function createJoystick() {
  const element = document.createElement("div");
  element.id = "movement-joystick";
  element.setAttribute("aria-label", "Movement and team selector");
  element.innerHTML = '<div id="joystick-base"><div id="team-ring-labels"><span class="team-label team-ben"></span><span class="team-label team-gwen"></span><span class="team-label team-kevin"></span><span class="team-label team-rook"></span></div><div id="joystick-knob"></div></div>';
  document.body.appendChild(element);

  const base = element.firstElementChild;
  const knob = base.querySelector("#joystick-knob");
  const labelElements = [...base.querySelectorAll(".team-label")];
  const input = {
    active: false, pointerId: null, x: 0, y: 0, mode: "move",
    selection: null, jumpRequested: false,
    pickRequested: false, attackHeld: false
  };

  const buttons = document.createElement("div");
  buttons.id = "action-controls";
  buttons.innerHTML = '<button id="jump-button" type="button" aria-label="Jump">↑</button><button id="pick-button" type="button" aria-label="Pick up">✋</button><button id="attack-button" type="button" aria-label="Attack">✊</button>';
  document.body.appendChild(buttons);

  const jump = buttons.querySelector("#jump-button");
  const pick = buttons.querySelector("#pick-button");
  const attack = buttons.querySelector("#attack-button");
  const request = (name, event) => { event.preventDefault(); event.stopPropagation(); input[name] = true; };
  jump.addEventListener("pointerdown", event => request("jumpRequested", event));
  pick.addEventListener("pointerdown", event => request("pickRequested", event));
  attack.addEventListener("pointerdown", event => {
    event.preventDefault(); event.stopPropagation();
    input.attackHeld = true;
    attack.setPointerCapture?.(event.pointerId);
  });
  const releaseAttack = event => {
    event.preventDefault(); event.stopPropagation();
    input.attackHeld = false;
  };
  attack.addEventListener("pointerup", releaseAttack);
  attack.addEventListener("pointercancel", releaseAttack);
  attack.addEventListener("lostpointercapture", () => { input.attackHeld = false; });

  let lastCenterTap = 0;
  function applyMode(mode) {
    input.mode = mode;
    element.classList.toggle("team-mode", mode === "switch");
    knob.textContent = mode === "switch" ? "↔" : "";
  }
  function reset() {
    input.active = false;
    input.pointerId = null;
    input.x = 0;
    input.y = 0;
    knob.style.transform = "translate(0px,0px)";
  }
  function update(event) {
    const rect = base.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const max = rect.width * 0.32;
    const distance = Math.hypot(dx, dy);
    const factor = distance > max ? max / distance : 1;
    const x = dx * factor, y = dy * factor;
    input.x = x / max;
    input.y = -y / max;
    knob.style.transform = `translate(${x}px,${y}px)`;
  }
  function down(event) {
    event.preventDefault();
    input.active = true;
    input.pointerId = event.pointerId;
    base.setPointerCapture(event.pointerId);
    update(event);
  }
  function move(event) {
    if (input.active && event.pointerId === input.pointerId) {
      event.preventDefault();
      update(event);
    }
  }
  function up(event) {
    if (event.pointerId !== input.pointerId) return;
    if (event.type === "pointercancel") { reset(); return; }
    const centered = Math.hypot(input.x, input.y) < 0.22;
    if (centered) {
      const now = performance.now();
      if (lastCenterTap && now - lastCenterTap <= 420) {
        lastCenterTap = 0;
        applyMode(input.mode === "switch" ? "move" : "switch");
      } else {
        lastCenterTap = now;
        window.setTimeout(() => {
          if (lastCenterTap === now) lastCenterTap = 0;
        }, 420);
      }
    } else if (input.mode === "switch") {
      lastCenterTap = 0;
      input.selection = { x: input.x, y: input.y };
    }
    reset();
  }

  base.addEventListener("pointerdown", down);
  base.addEventListener("pointermove", move);
  base.addEventListener("pointerup", up);
  base.addEventListener("pointercancel", up);

  return {
    input, element, buttons,
    setVisible(visible) {
      element.style.display = visible ? "block" : "none";
      buttons.style.display = visible ? "flex" : "none";
      if (!visible) reset();
    },
    setMode(mode) { applyMode(mode); },
    setTeamOptions(selected, members = TEAM_MEMBERS) {
      const available = members.filter(name => name !== selected);
      labelElements.forEach((label, index) => {
        label.textContent = TEAM_LABELS[available[index]] || "";
        label.setAttribute("aria-label", available[index] || "");
      });
    },
    destroy() {
      base.removeEventListener("pointerdown", down);
      base.removeEventListener("pointermove", move);
      base.removeEventListener("pointerup", up);
      base.removeEventListener("pointercancel", up);
      jump.remove(); pick.remove(); attack.remove();
      element.remove(); buttons.remove();
    }
  };
}

export function createKeyboard({ entities, camera, joystick, updateCamera, isMobile = false, onSelect = () => {}, getLift = () => 0, onJump = () => {}, onToggleRamp = () => {}, initialSelected = "ben" }) {
  const keys = new Set();
  let selected = initialSelected;
  let lastAttackAt = 0;
  const selectableMembers = TEAM_MEMBERS.filter(name => entities[name]);
  joystick.setTeamOptions(selected, selectableMembers);
  onSelect(selected);

  function keydown(event) {
    const key = event.key.toLowerCase();
    if (key === "f") {
      if (event.repeat) return;
      joystick.setMode(joystick.input.mode === "switch" ? "move" : "switch");
      keys.clear();
      event.preventDefault();
      return;
    }
    if (key === "r" && !event.repeat && selected === "rustbucket") { onToggleRamp(); event.preventDefault(); return; }
    if (["w", "a", "s", "d", " ", "q"].includes(key)) {
      keys.add(key);
      event.preventDefault();
    }
    if (key === " " && !event.repeat) joystick.input.jumpRequested = true;
    if (key === "e" && !event.repeat) joystick.input.pickRequested = true;
  }
  function keyup(event) { keys.delete(event.key.toLowerCase()); }
  function blur() { keys.clear(); }
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("blur", blur);

  function choose(x, y) {
    const available = selectableMembers.filter(name => name !== selected);
    let index;
    if (Math.abs(x) > Math.abs(y)) index = x > 0 ? 1 : 3;
    else index = y > 0 ? 0 : 2;
    const next = available[index];
    if (!next) return;
    selected = next;
    joystick.setTeamOptions(selected, selectableMembers);
    onSelect(selected);
    updateCamera();
  }

  function update(dt) {
    const joy = joystick.input;
    if (joy.selection) {
      choose(joy.selection.x, joy.selection.y);
      joy.selection = null;
    }
    if (joystick.input.mode === "switch") {
      if (!isMobile) {
        const x = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
        const y = (keys.has("w") ? 1 : 0) - (keys.has("s") ? 1 : 0);
        if (x || y) { choose(x, y); keys.clear(); }
      }
      return;
    }

    const object = entities[selected];
    if (!object) return;
    const forward = (keys.has("w") ? 1 : 0) - (keys.has("s") ? 1 : 0) + (isMobile ? joy.y : 0);
    const right = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0) + (isMobile ? joy.x : 0);
    const magnitude = Math.hypot(forward, right);
    const direction = camera.getWorldDirection(new THREE.Vector3());
    const length = Math.hypot(direction.x, direction.z) || 1;
    const fx = direction.x / length, fz = direction.z / length;
    const rx = -fz, rz = fx;
    if (selected !== "rustbucket") object.rotation.y = Math.atan2(fx, fz);
    const mx = magnitude > 0.08 ? (fx * forward + rx * right) / Math.max(1, magnitude) : 0;
    const mz = magnitude > 0.08 ? (fz * forward + rz * right) / Math.max(1, magnitude) : 0;
    const speed = selected === "rustbucket" ? 18 : 3.5;

    if (joy.jumpRequested) {
      if (selected === "rustbucket") onJump();
      else object.userData.requestJump?.();
      joy.jumpRequested = false;
    }
    if (selected === "rustbucket" && object.userData.moveVehicle) {
      const fuelDemand=magnitude>0.08||Math.abs(getLift())>0.05;
      const hasFuel=!fuelDemand||object.userData.onFuelUse?.((magnitude+Math.abs(getLift()))*dt)!==false;
      if(hasFuel)object.userData.moveVehicle(mx, mz, getLift(), dt, right, Math.atan2(fx, fz));
    } else if (object.userData.moveWithCollisions) {
      object.userData.moveWithCollisions(mx * speed * dt, mz * speed * dt, dt);
    } else if (magnitude > 0.08) {
      object.position.x += mx * speed * dt;
      object.position.z += mz * speed * dt;
    }

    if (joy.pickRequested) { object.userData.performPickup?.(); joy.pickRequested = false; }
    const attackHeld = joy.attackHeld || keys.has("q");
    const attackInterval = selected === "rustbucket" ? 280 : 720;
    const now = performance.now();
    if (attackHeld && now - lastAttackAt >= attackInterval) {
      object.userData.performAttack?.();
      lastAttackAt = now;
    }
    object.setAnimation?.(magnitude > 0.08 ? "walk" : "idle");
    object.update?.(dt);
    updateCamera();
  }

  return {
    update,
    get selected() { return selected; },
    destroy() {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      keys.clear();
    }
  };
}
