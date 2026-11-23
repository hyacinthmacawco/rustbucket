export class Omniverse {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "omniverse";
    this.canvas.setAttribute("aria-label", "Rustbucket 3D game");
    Object.assign(this.canvas.style, {
      position: "fixed",
      inset: "0",
      display: "block",
      width: "100%",
      height: "100%",
      touchAction: "none"
    });

    Object.assign(document.documentElement.style, {
      width: "100%",
      height: "100%",
      margin: "0",
      overflow: "hidden"
    });

    Object.assign(document.body.style, {
      width: "100%",
      height: "100%",
      margin: "0",
      overflow: "hidden",
      background: "#02040a"
    });

    document.body.appendChild(this.canvas);
  }

  destroy() {
    this.canvas.remove();
  }
}
