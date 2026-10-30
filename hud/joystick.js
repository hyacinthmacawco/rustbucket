// Touch-first movement joystick. It is created by the main stage loop
// and shown for gameplay stages only.
export function createJoystick() {
  const element = document.createElement("div");
  element.id = "movement-joystick";
  element.setAttribute("aria-label", "Movement joystick");
  element.innerHTML = '<div id="joystick-knob"></div>';
  document.body.appendChild(element);

  const knob = element.querySelector("#joystick-knob");
  const input = { active: false, pointerId: null, x: 0, y: 0 };

  function update(event) {
    const rect = element.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const maxRadius = rect.width * 0.32;
    const distance = Math.hypot(dx, dy);
    const factor = distance > maxRadius ? maxRadius / distance : 1;
    const knobX = dx * factor;
    const knobY = dy * factor;

    input.x = knobX / maxRadius;
    input.y = -knobY / maxRadius;
    knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
  }

  function onDown(event) {
    event.preventDefault();
    input.active = true;
    input.pointerId = event.pointerId;
    element.setPointerCapture(event.pointerId);
    update(event);
  }
  function onMove(event) {
    if (!input.active || event.pointerId !== input.pointerId) return;
    event.preventDefault();
    update(event);
  }
  function onUp(event) {
    if (event.pointerId !== input.pointerId) return;
    input.active = false;
    input.pointerId = null;
    input.x = 0;
    input.y = 0;
    knob.style.transform = "translate(0px, 0px)";
  }

  element.addEventListener("pointerdown", onDown);
  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerup", onUp);
  element.addEventListener("pointercancel", onUp);

  return {
    input,
    element,
    setVisible(visible) {
      element.style.display = visible ? "" : "none";
      if (!visible) {
        input.active = false;
        input.pointerId = null;
        input.x = 0;
        input.y = 0;
        knob.style.transform = "translate(0px, 0px)";
      }
    },
    destroy() {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
      element.remove();
    }
  };
}
