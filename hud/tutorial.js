export function createTutorialLabel({ isMobile = false } = {}) {
  const element = document.createElement("div");
  element.id = "tutorial-step-label";
  element.setAttribute("aria-live", "polite");
  document.body.appendChild(element);

  const steps = {
    1: isMobile
      ? "USE JOYSTICK TO MOVE"
      : "USE WASD OR ARROW KEYS TO MOVE",
    2: isMobile
      ? "USE THE TEAMSTICK TO SWITCH BETWEEN BEN, ROOK, GWEN, KEVIN AND THE RUSTBUCKET"
      : "USE SHIFT + WASDF OR SHIFT + ARROW KEYS AND PERIOD TO SWITCH BETWEEN BEN, ROOK, GWEN, KEVIN AND THE RUSTBUCKET"
  };

  function setStep(step) {
    const number = document.createElement("div");
    number.className = "tutorial-step-number";
    number.textContent = "STEP " + step;

    const content = document.createElement("div");
    content.className = "tutorial-step-content";
    content.textContent = steps[step] || "";

    element.replaceChildren(number, content);
  }

  return {
    setStep,
    setVisible(value) {
      element.style.display = value ? "block" : "none";
    },
    destroy() {
      element.remove();
    }
  };
}
