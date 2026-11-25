export class POV {
  constructor({ onToggle = () => {} } = {}) {
    this.onToggle = onToggle;
    this.firstPerson = false;
    this.styles = {
      position: "static", display: "grid", placeItems: "center",
      width: "38px", minWidth: "38px", height: "40px", padding: "4px", fontSize: "10px",
      zIndex: "2147483647", border: "1px solid rgba(126,255,168,.28)", background: "rgba(5,30,18,.8)", color: "#eaffef",
      font: "inherit", letterSpacing: ".08em", touchAction: "none",
      pointerEvents: "auto", cursor: "pointer"
    };
  }

  create() {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.id = "pov-toggle";
    this.element.textContent = "3P";
    this.element.setAttribute("aria-label", "Switch to first person camera");
    Object.assign(this.element.style, this.styles);
    this.element.addEventListener("click", this.toggle);
    document.body.append(this.element);
    return this.element;
  }

  toggle = () => {
    this.firstPerson = !this.firstPerson;
    this.updateLabel();
    this.onToggle(this.firstPerson);
  };

  updateLabel() {
    if (!this.element) return;
    this.element.textContent = this.firstPerson ? "1P" : "3P";
    this.element.setAttribute("aria-label", this.firstPerson ? "Switch to third person camera" : "Switch to first person camera");
  }

  setFirstPerson(enabled) {
    this.firstPerson = Boolean(enabled);
    this.updateLabel();
    this.onToggle(this.firstPerson);
  }

  setVisible(visible) {
    if (this.element) this.element.style.display = visible ? "grid" : "none";
  }

  destroy() {
    this.element?.removeEventListener("click", this.toggle);
    this.element?.remove();
  }
}
