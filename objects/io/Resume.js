export class Resume {
  constructor({ onResume = () => {} } = {}) {
    this.onResume = onResume;
    this.styles = { width: "100%", marginTop: "20px", padding: "13px", border: "none", borderRadius: "4px", background: "rgba(16, 82, 39, .9)", color: "#f1fff4", font: "inherit", letterSpacing: ".14em" };
  }

  create() {
    this.element = document.createElement("div");
    this.element.setAttribute("role", "button");
    this.element.tabIndex = 0;
    this.element.textContent = "RESUME";
    Object.assign(this.element.style, this.styles);
    this.element.addEventListener("click", this.onResume);
    return this.element;
  }

  destroy() {
    this.element?.removeEventListener("click", this.onResume);
    this.element?.remove();
  }
}