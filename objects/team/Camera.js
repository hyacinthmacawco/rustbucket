export class Camera {
  constructor(THREE, preset, aspect) {
    this.THREE = THREE;
    this.camera = new THREE.PerspectiveCamera(preset.fov, aspect, preset.near, preset.far);
    this.setPreset(preset, aspect);
    this.pointer = null;
    this.sensitivity = 0.004;
  }

  setPreset(preset, aspect = this.camera.aspect) {
    this.preset = preset;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.8 ? Math.max(preset.fov, 65) : preset.fov;
    this.camera.near = preset.near;
    this.camera.far = preset.far;
    this.camera.updateProjectionMatrix();
    return this.camera;
  }

  resize(aspect) {
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.8 ? Math.max(this.preset.fov, 65) : this.preset.fov;
    this.camera.updateProjectionMatrix();
    return this.camera;
  }

  setSensitivity(value) {
    this.sensitivity = Math.max(0.001, Math.min(0.02, Number(value) || 0.004));
  }

  attach(canvas, { getStage = () => "gameplay", getTarget = () => new this.THREE.Vector3() } = {}) {
    this.canvas = canvas;
    this.getStage = getStage;
    this.getTarget = getTarget;
    this.onPointerDown = event => {
      if (event.button !== 0 || this.getStage() === "title") return;
      if (event.target !== this.canvas) return;
      this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      this.canvas.setPointerCapture?.(event.pointerId);
    };
    this.onPointerMove = event => {
      if (!this.pointer || event.pointerId !== this.pointer.id || this.getStage() === "title") return;
      const dx = event.clientX - this.pointer.x;
      const dy = event.clientY - this.pointer.y;
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;

      const target = this.getTarget();
      const offset = this.camera.position.clone().sub(target);
      const spherical = new this.THREE.Spherical().setFromVector3(offset);
      spherical.theta -= dx * this.sensitivity;
      spherical.phi = this.THREE.MathUtils.clamp(
        spherical.phi - dy * this.sensitivity,
        0.12,
        Math.PI - 0.12
      );
      offset.setFromSpherical(spherical);
      this.camera.position.copy(target).add(offset);
      this.camera.lookAt(target);
    };
    this.onPointerUp = event => {
      if (!this.pointer || (event && event.pointerId !== this.pointer.id)) return;
      this.pointer = null;
    };
    this.onWheel = event => {
      if (this.getStage() === "title") return;
      const target = this.getTarget();
      const offset = this.camera.position.clone().sub(target);
      const distance = offset.length();
      const nextDistance = this.THREE.MathUtils.clamp(distance * (1 + event.deltaY * 0.001), 4, 250);
      offset.setLength(nextDistance);
      this.camera.position.copy(target).add(offset);
      this.camera.lookAt(target);
    };
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: true });
    return this;
  }

  destroy() {
    if (!this.canvas) return;
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.pointer = null;
  }
}
