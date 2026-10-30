import * as THREE from "three";

// Keyboard and joystick movement controller for gameplay stages.
// Camera orbit and joystick DOM/input handling remain in index.html
// and hud/joystick.js respectively.
export function createKeyboard({ ben, camera, joystick, updateCamera }) {
  const keys = new Set();

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
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
    const input = joystick.input;
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
      const speed = 3.5;

      ben.position.x += moveX * speed * dt;
      ben.position.z += moveZ * speed * dt;
      ben.rotation.y = Math.atan2(moveX, moveZ);
      ben.setAnimation("walk");
    } else {
      ben.setAnimation("idle");
    }

    ben.update(dt);
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
