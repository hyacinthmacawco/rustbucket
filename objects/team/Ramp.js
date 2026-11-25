export class Ramp {
  constructor({ onPress = () => {} } = {}) {
    this.onPress = onPress;
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.id = "ramp-toggle";
    this.element.textContent = "RAMP";
    this.element.setAttribute("aria-label", "Open or close the Rustbucket ramp");
    Object.assign(this.element.style, {
      position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: "42px", height: "40px", padding: "4px 9px",
      border: "1px solid rgba(126,255,168,.28)", borderRadius: "8px",
      background: "rgba(5,30,18,.8)", color: "#eaffef", font: "inherit",
      fontSize: "10px", letterSpacing: ".08em", cursor: "pointer",
      touchAction: "manipulation", pointerEvents: "auto"
    });
    this.element.addEventListener("click", this.handlePress);
  }

  handlePress = () => this.onPress();

  create() {
    document.body.append(this.element);
    return this.element;
  }

  setVisible(visible) {
    this.element.style.display = visible ? "inline-flex" : "none";
  }

  destroy() {
    this.element.removeEventListener("click", this.handlePress);
    this.element.remove();
  }
}
