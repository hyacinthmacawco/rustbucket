export class Attack {
  constructor({ onStart = () => {}, onEnd = () => {} } = {}) {
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.styles = { position: "static", display: "grid", placeItems: "center", width: "38px", minWidth: "38px", height: "40px", padding: "4px", fontSize: "10px", border: "1px solid rgba(126,255,168,.28)", background: "rgba(5,30,18,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em", touchAction: "none", pointerEvents: "auto", cursor: "pointer" };
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
    this.element.addEventListener("keydown", this.handleKeyDown);
    this.element.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleEnd);
    document.body.append(this.element);
    return this.element;
  }

  handleStart = event => {
    event.preventDefault();
    event.stopPropagation();
    if (this.active) return;
    this.active = true;
    if (event.pointerId !== undefined) this.element.setPointerCapture?.(event.pointerId);
    this.onStart();
  };

  handleKeyDown = event => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      this.handleStart(event);
    }
  };

  handleKeyUp = event => {
    if (event.key === " " || event.key === "Enter") this.handleEnd(event);
  };

  handleEnd = event => {
    if (event?.preventDefault) event.preventDefault();
    if (!this.active) return;
    this.active = false;
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
    this.element?.removeEventListener("keydown", this.handleKeyDown);
    this.element?.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleEnd);
    this.handleEnd();
    this.element?.remove();
  }
}
