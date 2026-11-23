export class Attack {
  constructor({ onStart = () => {}, onEnd = () => {} } = {}) {
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.styles = { padding: "12px 18px", border: "1px solid rgba(119,255,164,.5)", borderRadius: "50%", background: "rgba(5,30,18,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em", touchAction: "none" };
  }

  create() {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.textContent = "ATTACK";
    this.element.setAttribute("aria-label", "Attack");
    Object.assign(this.element.style, this.styles);
    this.element.addEventListener("pointerdown", this.handleStart);
    this.element.addEventListener("pointerup", this.handleEnd);
    this.element.addEventListener("pointercancel", this.handleEnd);
    this.element.addEventListener("lostpointercapture", this.handleEnd);
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

  destroy() {
    this.element?.removeEventListener("pointerdown", this.handleStart);
    this.element?.removeEventListener("pointerup", this.handleEnd);
    this.element?.removeEventListener("pointercancel", this.handleEnd);
    this.element?.removeEventListener("lostpointercapture", this.handleEnd);
    this.element?.remove();
  }
}