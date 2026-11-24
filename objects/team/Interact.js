export class Interact {
  constructor({ onPress = () => {} } = {}) {
    this.onPress = onPress;
    this.mode = "Pick";
    this.styles = { position: "static", display: "grid", placeItems: "center", width: "42px", minWidth: "42px", height: "42px", padding: "8px", zIndex: "2147483647", border: "none", borderRadius: "8px", background: "rgba(5,30,18,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em", touchAction: "none", pointerEvents: "auto", cursor: "pointer" };
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
    this.mode = mode === "Drop" ? "Drop" : "Pick";
    if (!this.element) return;
    this.element.textContent = this.mode.toUpperCase();
    this.element.setAttribute("aria-label", this.mode === "Pick" ? "Pick up rescued individual" : "Drop off rescued individual");
  }

  setVisible(visible) {
    if (this.element) this.element.style.display = visible ? "grid" : "none";
  }

  destroy() {
    this.element?.removeEventListener("pointerdown", this.handlePress);
    this.element?.remove();
  }
}