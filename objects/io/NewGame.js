export class NewGame {
  constructor({ onSelect = () => {}, onSkip = () => {} } = {}) {
    this.onSelect = onSelect;
    this.onSkip = onSkip;
    this.styles = {
      button: { padding: "14px 24px", border: "1px solid rgba(119,255,164,.55)", borderRadius: "4px", background: "rgba(5,22,14,.76)", color: "#eaffef", font: "inherit", letterSpacing: ".16em", cursor: "pointer", boxShadow: "0 0 20px rgba(69,255,131,.12)" },
      prelude: { position: "fixed", inset: "0", display: "none", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "28px", background: "#000", color: "#fff", zIndex: "50", fontFamily: "monospace", letterSpacing: ".18em" },
      heading: { fontSize: "clamp(20px, 5vw, 42px)" },
      skip: { padding: "10px 28px", border: "1px solid #79e99a", background: "transparent", color: "#dffff0", font: "inherit", cursor: "pointer" }
    };
  }

  create() {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.className = "rb-title-action";
    this.element.textContent = "NEW GAME";
    Object.assign(this.element.style, this.styles.button);
    this.element.addEventListener("click", this.onSelect);

    this.prelude = document.createElement("section");
    this.prelude.id = "prelude-screen";
    Object.assign(this.prelude.style, this.styles.prelude);
    this.heading = document.createElement("div");
    this.heading.textContent = "A NEW DAWN";
    Object.assign(this.heading.style, this.styles.heading);
    this.skip = document.createElement("button");
    this.skip.type = "button";
    this.skip.textContent = "SKIP";
    Object.assign(this.skip.style, this.styles.skip);
    this.skip.addEventListener("click", this.onSkip);
    this.prelude.append(this.heading, this.skip);
    document.body.append(this.prelude);
    return this.element;
  }

  setPreludeVisible(visible) {
    if (this.prelude) this.prelude.style.display = visible ? "flex" : "none";
  }

  destroy() {
    this.element?.removeEventListener("click", this.onSelect);
    this.skip?.removeEventListener("click", this.onSkip);
    this.element?.remove();
    this.prelude?.remove();
  }
}