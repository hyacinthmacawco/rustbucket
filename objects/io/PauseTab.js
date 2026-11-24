export class PauseTab {
  constructor({ name, label, onSelect = () => {}, active = false } = {}) {
    this.name = name;
    this.label = label;
    this.onSelect = onSelect;
    this.active = active;
    this.styles = {
      button: { padding: "10px 14px", border: "1px solid rgba(126,255,168,.35)", borderRadius: "4px", background: "rgba(5, 35, 18, .8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em" },
      active: { borderColor: "#8cffaa", background: "rgba(23, 90, 46, .8)" }
    };
  }

  create() {
    this.element = document.createElement("div");
    this.element.setAttribute("role", "button");
    this.element.tabIndex = 0;
    this.element.textContent = this.label;
    Object.assign(this.element.style, this.styles.button, this.active ? this.styles.active : {});
    this.element.addEventListener("click", this.handleClick);
    return this.element;
  }

  handleClick = () => this.onSelect(this.name);

  setActive(active) {
    this.active = Boolean(active);
    Object.assign(this.element.style, this.styles.button, this.active ? this.styles.active : {});
  }

  destroy() {
    this.element?.removeEventListener("click", this.handleClick);
    this.element?.remove();
  }
}