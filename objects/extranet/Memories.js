export class Memories {
  constructor() {
    this.photos = [];
    this.styles = {
      button: { padding: "9px 12px", border: "1px solid rgba(126,255,168,.38)", borderRadius: "5px", background: "rgba(7,42,22,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em" },
      grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px", marginTop: "18px" },
      image: { width: "100%", borderRadius: "6px", border: "1px solid rgba(126,255,168,.25)" }
    };
  }

  render(host) {
    host.replaceChildren();
    this.host = host;
    this.captureButton = document.createElement("button");
    this.captureButton.type = "button";
    this.captureButton.textContent = "CAPTURE SCREEN";
    Object.assign(this.captureButton.style, this.styles.button);
    this.captureButton.addEventListener("click", this.capturePhoto);
    this.grid = document.createElement("div");
    Object.assign(this.grid.style, this.styles.grid);
    host.append(this.captureButton, this.grid);
    this.renderMemories();
  }

  capturePhoto = () => {
    const canvas = document.querySelector("#omniverse");
    if (!canvas) return;

    try {
      this.photos.unshift(canvas.toDataURL("image/jpeg", 0.82));
      this.renderMemories();
    } catch (error) {
      console.warn("Could not capture memory", error);
    }
  };

  renderMemories() {
    if (!this.grid) return;
    this.grid.replaceChildren();

    for (const [index, source] of this.photos.entries()) {
      const figure = document.createElement("figure");
      const photo = document.createElement("img");
      photo.src = source;
      photo.alt = "Captured memory " + (index + 1);
      Object.assign(photo.style, this.styles.image);
      figure.append(photo);
      this.grid.append(figure);
    }
  }

  destroy() {
    this.captureButton?.removeEventListener("click", this.capturePhoto);
    this.grid?.remove();
  }
}
