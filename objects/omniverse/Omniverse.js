import * as THREE from "three";

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

    this.scene = new THREE.Scene();
    this.scene.name = "Rustbucket";
    this.scene.background = new THREE.Color(0x02040a);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)),
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this._celestial = new THREE.Group();
    this._celestial.name = "ActiveCelestial";
    this.scene.add(this._celestial);
    this.camera = null;
    this.clock = new THREE.Clock();
    this.animationFrame = null;
    this.animate = this.animate.bind(this);
    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize);
    window.addEventListener("beforeunload", () => this.destroy(), { once: true });
  }

  get celestial() {
    return this._celestial;
  }

  set celestial(celestial) {
    if (!celestial || celestial === this._celestial) return;
    this.scene.remove(this._celestial);
    this._celestial = celestial;
    this.scene.add(this._celestial);
  }

  setCamera(camera) {
    this.camera = camera;
    return camera;
  }

  resize() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    if (this.animationFrame !== null) return;
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  animate() {
    this.animationFrame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    this.celestial.animate?.(delta, elapsed);
    if (this.camera) this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.canvas.remove();
  }
}
