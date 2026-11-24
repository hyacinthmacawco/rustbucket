export class Death {
  constructor() {
    this.element = document.createElement("section");
    this.element.id = "death-screen";
    Object.assign(this.element.style, {
      position: "fixed",
      inset: "0",
      display: "none",
      placeItems: "center",
      background: "#000",
      color: "#fff",
      zIndex: "100",
      fontFamily: "Industry Light, sans-serif",
      fontWeight: "300",
      fontSize: "clamp(2rem, 8vw, 5rem)",
      letterSpacing: ".18em"
    });
    this.element.textContent = "YOU ARE DEAD";
    document.body.append(this.element);
  }

  setVisible(visible) {
    this.element.style.display = visible ? "grid" : "none";
  }

  destroy() {
    this.element.remove();
  }
}
