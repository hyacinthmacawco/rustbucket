export class Attack {
  constructor({ onStart = () => {}, onEnd = () => {} } = {}) {
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.styles = { position: "fixed", right: "calc(max(22px, env(safe-area-inset-right)) + 148px)", bottom: "max(22px, env(safe-area-inset-bottom))", width: "64px", height: "64px", padding: "8px", background: "rgba(5,30,18,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em", touchAction: "none", pointerEvents: "auto", cursor: "pointer" };
  }

  create() {
    this.element = document.createElement("div");
    this.element.setAttribute("role", "button");
    this.element.tabIndex = 0;
    this.element.textContent = "ATTACK";
    this.element.setAttribute("aria-label", "Attack");
    Object.assign(this.element.style, this.styles);
    this.element.addEventListener("pointerdown", this.handleStart);
    this.element.addEventListener("pointerup", this.handleEnd);
    this.element.addEventListener("pointercancel", this.handleEnd);
    this.element.addEventListener("lostpointercapture", this.handleEnd);
    document.body.append(this.element);
    return this.element;
  }

  handleStart = event => {
    event.preventDefault();
    this.element.setPointerCapture?.(event.pointerId);
    this.onStart();
  };

  handleEnd = event => {
    if (event) event.preventDefault();
    this.onEnd();
  };

  setVisible(visible) {
    if (this.element) this.element.style.display = visible ? "grid" : "none";
  }

  destroy() {
    this.element?.removeEventListener("pointerdown", this.handleStart);
    this.element?.removeEventListener("pointerup", this.handleEnd);
    this.element?.removeEventListener("pointercancel", this.handleEnd);
    this.element?.removeEventListener("lostpointercapture", this.handleEnd);
    this.element?.remove();
  }
}
