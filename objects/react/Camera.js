export class Camera {
  constructor(THREE, preset, aspect) {
    this.THREE = THREE;
    this.camera = new THREE.PerspectiveCamera(preset.fov, aspect, preset.near, preset.far);
    this.setPreset(preset, aspect);
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
}
