import * as THREE from "three";

export class AlienShip {
  constructor(parent = null, options = {}) {
    this.group = new THREE.Group();
    this.group.name = this.constructor.name;
    this.createShip(options);
    this.finishShip(parent, options);
  }

  createShip() {
    const hull = this.createMaterial(0x536b78);
    const dark = this.createMaterial(0x18232b);
    const glow = new THREE.MeshBasicMaterial({ color: 0x72ffd0 });
    this.addBox([5.4, 1.5, 11], [0, 0, 0], hull);
    this.addPart(new THREE.ConeGeometry(1.6, 5.8, 6), dark, [0, 0, 7.8], [Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) {
      this.addBox([7.2, 0.35, 3.5], [side * 5.1, 0, -1.3], hull, [0, 0, side * 0.08]);
      this.addBox([0.5, 0.45, 2.2], [side * 1.5, -0.2, -5.8], dark);
      this.addSphere(0.48, [side * 1.55, 0, -5.4], [1, 1, 1], glow);
    }
    this.addBox([2.5, 0.45, 2.6], [0, 0.95, -1.2], dark);
  }

  createMaterial(color, options = {}) {
    return new THREE.MeshToonMaterial({ color, ...options });
  }

  addPart(geometry, material, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.noPhysics = true;
    this.group.add(mesh);

    const outline = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0x08090d, side: THREE.BackSide })
    );
    outline.position.copy(mesh.position);
    outline.rotation.copy(mesh.rotation);
    outline.scale.copy(mesh.scale).multiplyScalar(1.035);
    outline.renderOrder = 1;
    outline.userData.noPhysics = true;
    this.group.add(outline);
    return mesh;
  }

  addBox(size, position, material, rotation = [0, 0, 0]) {
    return this.addPart(new THREE.BoxGeometry(...size), material, position, rotation);
  }

  addSphere(radius, position, scale, material) {
    return this.addPart(new THREE.SphereGeometry(radius, 20, 16), material, position, [0, 0, 0], scale);
  }

  addCylinder(radiusTop, radiusBottom, height, position, material, rotation = [0, 0, 0], radial = 16) {
    return this.addPart(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial),
      material,
      position,
      rotation
    );
  }

  finishShip(parent, options = {}) {
    this.group.scale.setScalar(options.scale ?? 1);
    this.group.userData.noPhysics = true;
    this.model = this.group;
    this.mesh = this.group;
    this.ship = this.group;
    if (parent) parent.add(this.group);
  }
}
