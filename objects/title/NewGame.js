export class NewGame {
  constructor({ onSelect = () => {} } = {}) {
    this.onSelect = onSelect;
    this.styles = {
      button: { padding: "14px 24px", border: "1px solid rgba(119,255,164,.55)", borderRadius: "4px", background: "rgba(5,22,14,.76)", color: "#eaffef", font: "inherit", letterSpacing: ".16em", cursor: "pointer", boxShadow: "0 0 20px rgba(69,255,131,.12)" }
    };
  }

  create() {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.className = "rb-title-action";
    this.element.textContent = "NEW GAME";
    Object.assign(this.element.style, this.styles.button);
    this.element.addEventListener("click", this.onSelect);
    return this.element;
  }

  destroy() {
    this.element?.removeEventListener("click", this.onSelect);
    this.element?.remove();
    this.element = null;
  }
}