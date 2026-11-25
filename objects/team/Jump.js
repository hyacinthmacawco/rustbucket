export class Jump {
  constructor({ onPress = () => {} } = {}) {
    this.onPress = onPress;
    this.onAction = () => {};
    this.styles = { position: "static", display: "grid", placeItems: "center", width: "52px", minWidth: "52px", height: "40px", padding: "4px 6px", boxSizing: "border-box", whiteSpace: "nowrap", fontSize: "9px", zIndex: "2147483647", border: "none", background: "rgba(5,30,18,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em", touchAction: "none", pointerEvents: "auto", cursor: "pointer" };
  }

  setAction(action = () => {}) {
    this.onAction = action;
  }

  activate() {
    this.onAction();
  }

  create() {
    this.element = document.createElement("div");
    this.element.setAttribute("role", "button");
    this.element.tabIndex = 0;
    this.element.textContent = "JUMP";
    this.element.setAttribute("aria-label", "Jump");
    Object.assign(this.element.style, this.styles);
    this.element.addEventListener("pointerdown", this.handlePress);
    document.body.append(this.element);
    return this.element;
  }

  handlePress = event => {
    event.preventDefault();
    this.onPress();
  };

  setVisible(visible) {
    if (this.element) this.element.style.display = visible ? "grid" : "none";
  }

  destroy() {
    this.element?.removeEventListener("pointerdown", this.handlePress);
    this.element?.remove();
  }
}