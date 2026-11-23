export class LoadGame {
  constructor() {
    this.expanded = false;
    this.styles = {
      button: { padding: "14px 24px", border: "1px solid rgba(119,255,164,.35)", borderRadius: "4px", background: "rgba(5,22,14,.58)", color: "#d4ffe0", font: "inherit", letterSpacing: ".16em", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" },
      panel: { margin: "0", color: "#a9e9bd", letterSpacing: ".12em", fontSize: "1rem" }
    };
  }

  create() {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.textContent = "LOAD GAME";
    this.element.setAttribute("aria-expanded", "false");
    Object.assign(this.element.style, this.styles.button);
    this.element.addEventListener("click", this.toggle);
    this.panel = document.createElement("p");
    this.panel.textContent = "NO SAVED GAMES";
    this.panel.hidden = true;
    Object.assign(this.panel.style, this.styles.panel);
    return this.element;
  }

  toggle = () => {
    this.expanded = !this.expanded;
    this.element.setAttribute("aria-expanded", String(this.expanded));
    this.panel.hidden = !this.expanded;
  };

  destroy() {
    this.element?.removeEventListener("click", this.toggle);
    this.element?.remove();
    this.panel?.remove();
  }
}