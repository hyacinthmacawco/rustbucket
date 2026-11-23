export class Pause {
  constructor({ onToggle = () => {} } = {}) {
    this.onToggle = onToggle;
    this.styles = { position: "fixed", top: "max(14px, env(safe-area-inset-top))", right: "max(14px, env(safe-area-inset-right))", zIndex: "30", width: "46px", height: "46px", border: "1px solid rgba(119,255,164,.55)", borderRadius: "50%", background: "rgba(5,30,18,.82)", color: "#eaffef", font: "inherit", fontSize: "1.25rem", cursor: "pointer" };
  }

  create() {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.textContent = "Ⅱ";
    this.element.setAttribute("aria-label", "Pause");
    Object.assign(this.element.style, this.styles);
    this.element.addEventListener("click", this.onToggle);
    document.body.append(this.element);
    return this.element;
  }

  destroy() {
    this.element?.removeEventListener("click", this.onToggle);
    this.element?.remove();
  }
}