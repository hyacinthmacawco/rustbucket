export function createTutorialLabel({ isMobile = false } = {}) {
  const element = document.createElement("div");
  element.id = "tutorial-step-label";
  element.setAttribute("aria-live", "polite");
  document.body.appendChild(element);
  const steps = {
    1: isMobile ? "USE JOYSTICK TO MOVE" : "USE WASD OR ARROW KEYS TO MOVE",
    2: isMobile
      ? "USE THE TEAMSTICK TO SWITCH BETWEEN BEN, ROOK, GWEN, KEVIN AND THE RUSTBUCKET"
      : "USE SHIFT + WASDF OR SHIFT + ARROW KEYS AND PERIOD TO SWITCH BETWEEN BEN, ROOK, GWEN, KEVIN AND THE RUSTBUCKET"
  };
  let currentStep = 1;
  let completionTimer = null;
  let finished = false;
  function setStep(step) {
    currentStep = step;
    finished = false;
    element.textContent = steps[step] || "";
    element.style.display = steps[step] ? "block" : "none";
  }
  function completeStep(step) {
    if (step !== currentStep || completionTimer !== null || finished) return;
    completionTimer = window.setTimeout(() => {
      completionTimer = null;
      if (step === 1) setStep(2);
      else {
        finished = true;
        element.style.display = "none";
      }
    }, 2000);
  }
  return {
    setStep, completeStep,
    setVisible(value) {
      element.style.display = value && !finished && steps[currentStep] ? "block" : "none";
    },
    destroy() {
      if (completionTimer !== null) window.clearTimeout(completionTimer);
      element.remove();
    }
  };
}
