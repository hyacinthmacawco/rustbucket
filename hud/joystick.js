import * as THREE from "three";

export function createJoystick() {
  const element = document.createElement("div");
  element.id = "movement-joystick";
  element.setAttribute("aria-label", "Movement and team selector");
  element.innerHTML = '<div id="joystick-base"><div id="team-ring-labels"><span class="team-label team-ben">B</span><span class="team-label team-gwen">G</span><span class="team-label team-kevin">K</span><span class="team-label team-rook">R</span><span class="team-label team-rustbucket">T</span></div><div id="joystick-knob"></div></div>';
  document.body.appendChild(element);

  const base = element.firstElementChild;
  const knob = base.querySelector("#joystick-knob");
  const input = {
    active: false, pointerId: null, x: 0, y: 0, mode: "move",
    selection: null, jumpRequested: false,
    pickRequested: false, attackRequested: false
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
  attack.addEventListener("pointerdown", event => request("attackRequested", event));

  let lastCenterTap = 0;
  let centerSelectionTimer = 0;
  function applyMode(mode) {
    input.mode = mode;
    element.classList.toggle("team-mode", mode === "switch");
    knob.textContent = mode === "switch" ? "T" : "";
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
        clearTimeout(centerSelectionTimer);
        centerSelectionTimer = 0;
        lastCenterTap = 0;
        applyMode(input.mode === "switch" ? "move" : "switch");
      } else {
        lastCenterTap = now;
        if (input.mode === "switch") {
          centerSelectionTimer = window.setTimeout(() => {
            input.selection = { x: 0, y: 0 };
            centerSelectionTimer = 0;
            lastCenterTap = 0;
          }, 420);
        }
      }
    } else if (input.mode === "switch") {
      clearTimeout(centerSelectionTimer);
      centerSelectionTimer = 0;
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
    setMode(mode) {
      applyMode(mode);
    },
    destroy() {
      clearTimeout(centerSelectionTimer);
      base.removeEventListener("pointerdown", down);
      base.removeEventListener("pointermove", move);
      base.removeEventListener("pointerup", up);
      base.removeEventListener("pointercancel", up);
      jump.remove(); pick.remove(); attack.remove();
      element.remove(); buttons.remove();
    }
  };
}

export function createKeyboard({ entities, camera, joystick, updateCamera, isMobile = false, onSelect = () => {}, getLift = () => 0 }) {
  const keys = new Set();
  let selected = "ben";
  let switchMode = false;

  function keydown(event) {
    const key = event.key.toLowerCase();
    if (key === "f") {
      if (event.repeat) return;
      switchMode = joystick.input.mode !== "switch";
      joystick.setMode(switchMode ? "switch" : "move");
      keys.clear();
      event.preventDefault();
      return;
    }
    if (["w", "a", "s", "d", " "].includes(key)) {
      keys.add(key);
      event.preventDefault();
    }
    if (key === " " && !event.repeat) joystick.input.jumpRequested = true;
    if (key === "e" && !event.repeat) joystick.input.pickRequested = true;
    if (key === "q" && !event.repeat) joystick.input.attackRequested = true;
  }
  function keyup(event) { keys.delete(event.key.toLowerCase()); }
  function blur() { keys.clear(); }
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("blur", blur);

  function choose(x, y) {
    if (Math.hypot(x, y) < 0.22) selected = "rustbucket";
    else if (Math.abs(x) > Math.abs(y)) selected = x > 0 ? "gwen" : "rook";
    else selected = y > 0 ? "ben" : "kevin";
    onSelect(selected);
    updateCamera();
  }

  function update(dt) {
    const joy = joystick.input;
    switchMode = joy.mode === "switch";
    if (joy.selection) {
      choose(joy.selection.x, joy.selection.y);
      joy.selection = null;
    }
    if (!isMobile && switchMode) {
      const x = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
      const y = (keys.has("w") ? 1 : 0) - (keys.has("s") ? 1 : 0);
      if (x || y) { choose(x, y); keys.clear(); }
      return;
    }

    const object = entities[selected];
    if (!object) return;
    const forward = (keys.has("w") ? 1 : 0) - (keys.has("s") ? 1 : 0) + (isMobile && !switchMode ? joy.y : 0);
    const right = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0) + (isMobile && !switchMode ? joy.x : 0);
    const magnitude = Math.hypot(forward, right);
    const direction = camera.getWorldDirection(new THREE.Vector3());
    const length = Math.hypot(direction.x, direction.z) || 1;
    const fx = direction.x / length, fz = direction.z / length;
    const rx = -fz, rz = fx;
    const mx = magnitude > 0.08 ? (fx * forward + rx * right) / Math.max(1, magnitude) : 0;
    const mz = magnitude > 0.08 ? (fz * forward + rz * right) / Math.max(1, magnitude) : 0;
    const speed = selected === "rustbucket" ? 18 : 3.5;

    if (joy.jumpRequested) {
      object.userData.requestJump?.();
      joy.jumpRequested = false;
    }
    if (selected === "rustbucket" && object.userData.moveVehicle) {
      object.userData.moveVehicle(mx * speed * dt, mz * speed * dt, getLift(), dt, right);
    } else if (object.userData.moveWithCollisions) {
      object.userData.moveWithCollisions(mx * speed * dt, mz * speed * dt, dt);
    } else if (magnitude > 0.08) {
      object.position.x += mx * speed * dt;
      object.position.z += mz * speed * dt;
    }

    if (joy.pickRequested) { object.userData.performPickup?.(); joy.pickRequested = false; }
    if (joy.attackRequested) { object.userData.performAttack?.(); joy.attackRequested = false; }
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
