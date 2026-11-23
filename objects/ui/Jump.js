export class Jump {
  constructor({ onPress = () => {} } = {}) {
    this.onPress = onPress;
    this.styles = { padding: "12px 18px", border: "1px solid rgba(119,255,164,.5)", borderRadius: "50%", background: "rgba(5,30,18,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em", touchAction: "none" };
  }

  create() {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.textContent = "JUMP";
    this.element.setAttribute("aria-label", "Jump");
    Object.assign(this.element.style, this.styles);
    this.element.addEventListener("pointerdown", this.handlePress);
    return this.element;
  }

  handlePress = event => {
    event.preventDefault();
    this.onPress();
  };

  destroy() {
    this.element?.removeEventListener("pointerdown", this.handlePress);
    this.element?.remove();
  }
}