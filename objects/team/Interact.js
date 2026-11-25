export class Interact {
  constructor({ onPress = () => {} } = {}) {
    this.onPress = onPress;
    this.mode = "Pick";
    this.styles = { position: "static", display: "grid", placeItems: "center", width: "38px", minWidth: "38px", height: "40px", padding: "4px", fontSize: "10px", zIndex: "2147483647", border: "none",  background: "rgba(5,30,18,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em", touchAction: "none", pointerEvents: "auto", cursor: "pointer" };
  }

  create() {
    this.element = document.createElement("div");
    this.element.setAttribute("role", "button");
    this.element.tabIndex = 0;
    this.element.textContent = this.mode;
    this.element.setAttribute("aria-label", this.mode);
    Object.assign(this.element.style, this.styles);
    this.element.addEventListener("pointerdown", this.handlePress);
    document.body.append(this.element);
    return this.element;
  }

  handlePress = event => {
    event.preventDefault();
    event.stopPropagation();
    this.onPress();
  };

  setMode(mode) {
    this.mode = ["Pick", "Drop", "Sit", "Stand", "Shop"].includes(mode) ? mode : "Pick";
    if (!this.element) return;
    this.element.textContent = this.mode;
    const labels = { Pick: "Pick up", Drop: "Drop", Sit: "Sit", Stand: "Stand", Shop: "Shop" };
    this.element.setAttribute("aria-label", labels[this.mode]);
  }

  setVisible(visible) {
    if (this.element) this.element.style.display = visible ? "grid" : "none";
  }

  destroy() {
    this.element?.removeEventListener("pointerdown", this.handlePress);
    this.element?.remove();
  }
}