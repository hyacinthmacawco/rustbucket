export class Pick {
  constructor({ onPress = () => {} } = {}) {
    this.onPress = onPress;
    this.styles = { position: "fixed", right: "calc(max(22px, env(safe-area-inset-right)) + 74px)", bottom: "max(22px, env(safe-area-inset-bottom))", width: "64px", height: "64px", padding: "8px", zIndex: "2147483647", border: "none", borderRadius: "8px", background: "rgba(5,30,18,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em", touchAction: "none", pointerEvents: "auto", cursor: "pointer" };
  }

  create() {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.textContent = "PICK";
    this.element.setAttribute("aria-label", "Pick up");
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

  setLabel(label) {
    if (!this.element) return;
    this.element.textContent = label;
    this.element.setAttribute("aria-label", label === "PICK" ? "Pick up rescued individual" : "Drop off rescued individual");
  }

  setVisible(visible) {
    if (this.element) this.element.style.display = visible ? "grid" : "none";
  }

  destroy() {
    this.element?.removeEventListener("pointerdown", this.handlePress);
    this.element?.remove();
  }
}