import * as THREE from "three";

// Shared camera-relative movement controller for the selected team member or Rustbucket.
export function createKeyboard({ entities, camera, joystick, teamstick, updateCamera, isMobile = false, onMove = () => {} }) {
  const keys = new Set();

  const switchTargets = ["ben", "rook", "gwen", "kevin", "rustbucket"];
  const switchKeys = ["w", "a", "s", "d", "f"];
  let hasMoved = false;
  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (event.shiftKey) {
      const index = switchKeys.indexOf(key);
      const arrowIndex = ["arrowup", "arrowleft", "arrowdown", "arrowright", "."].indexOf(key);
      const targetIndex = index >= 0 ? index : arrowIndex;
      if (targetIndex >= 0) {
        event.preventDefault();
        teamstick.select(switchTargets[targetIndex]);
        return;
      }
    }
    if (["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(key)) {
      event.preventDefault();
      keys.add(key);
    }
  }
  function onKeyUp(event) { keys.delete(event.key.toLowerCase()); }
  function onBlur() { keys.clear(); }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  function update(deltaTime) {
    const dt = Math.min(deltaTime, 0.05);
    const selected = entities[teamstick.selected];
    if (!selected) return;

    const input = isMobile ? joystick.input : { x: 0, y: 0 };
    const forwardInput =
      (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
    const rightInput =
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0);

    let forward = forwardInput + input.y;
    let right = rightInput + input.x;
    const magnitude = Math.hypot(forward, right);
    if (magnitude > 1) {
      forward /= magnitude;
      right /= magnitude;
    }

    if (magnitude > 0.08) {
      const direction = camera.getWorldDirection(new THREE.Vector3());
      const length = Math.hypot(direction.x, direction.z) || 1;
      const fx = direction.x / length;
      const fz = direction.z / length;
      const rx = -fz;
      const rz = fx;
      const moveX = fx * forward + rx * right;
      const moveZ = fz * forward + rz * right;
      const speed = teamstick.selected === "rustbucket" ? 5 : 3.5;

      selected.position.x += moveX * speed * dt;
      selected.position.z += moveZ * speed * dt;
      selected.rotation.y = Math.atan2(moveX, moveZ);
      if (typeof selected.setAnimation === "function") selected.setAnimation("walk");
      if (!hasMoved) { hasMoved = true; onMove(); }
    } else if (typeof selected.setAnimation === "function") {
      selected.setAnimation("idle");
    }

    if (typeof selected.update === "function") selected.update(dt);
    updateCamera();
  }

  return {
    update,
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      keys.clear();
    }
  };
}
