import * as THREE from "three";

export class AlienShip {
  constructor(parent = null, options = {}, homePlanet = null, center = null, index = 0) {
    if (typeof options === "string") {
      this.createPatrol(parent, options, homePlanet, center, index);
      return;
    }

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
    this.group.traverse(object => {
      object.userData.noPhysics = true;
    });
    this.group.userData.noPhysics = true;
    this.model = this.group;
    this.mesh = this.group;
    if (parent) parent.add(this.group);
  }

  createPatrol(parent, species, homePlanet, center, index = 0) {
    this.isPatrol = true;
    this.species = species;
    this.homePlanet = homePlanet;
    this.center = center ? center.clone() : new THREE.Vector3();
    this.health = 100;
    this.maxHealth = 100;
    this.destroyed = false;
    this.attackCooldown = 1.2 + index * 0.35;
    this.orbitAngle = index * Math.PI * 2 / 3;
    this.orbitRadius = 2600 + index * 600;
    this.orbitSpeed = 0.12 + index * 0.035;
    this.chaseSpeed = 42000;
    this.attackRange = 260;
    this.group = new THREE.Group();
    this.group.name = species + " Patrol Fighter";

    const colors = {
      Highbreed: 0x9fcf9d,
      Incursean: 0xc66d42,
      Anodite: 0xe77cb4,
      Galvan: 0x64c6a4,
      Human: 0x8797a8
    };
    const hull = this.createMaterial(colors[species] || 0x9aa0a8);
    const dark = this.createMaterial(0x18232b);
    const glow = new THREE.MeshBasicMaterial({ color: species === "Incursean" ? 0xff482c : 0x72ffd0 });

    this.addBox([5.4, 1.5, 11], [0, 0, 0], hull);
    this.addPart(new THREE.ConeGeometry(1.6, 5.8, 6), dark, [0, 0, 7.8], [Math.PI / 2, 0, 0]);

    for (const side of [-1, 1]) {
      this.addBox([7.2, 0.35, 3.5], [side * 5.1, 0, -1.3], hull, [0, 0, side * 0.08]);
      this.addBox([0.5, 0.45, 2.2], [side * 1.5, -0.2, -5.8], dark);
      this.addSphere(0.48, [side * 1.55, 0, -5.4], [1, 1, 1], glow);
    }

    this.addBox([2.5, 0.45, 2.6], [0, 0.95, -1.2], dark);
    this.group.position.set(
      this.center.x + Math.cos(this.orbitAngle) * this.orbitRadius,
      this.center.y + 500 + index * 180,
      this.center.z + Math.sin(this.orbitAngle) * this.orbitRadius
    );
    this.group.userData.noPhysics = true;
    this.model = this.group;
    this.mesh = this.group;
    parent?.add(this.group);
  }

  takeDamage(amount = 5) {
    if (this.destroyed) return this.health;
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.destroyed = true;
      this.group.visible = false;
    }
    return this.health;
  }

  update(delta, target, hostile, onAttack = () => {}) {
    if (!this.isPatrol || this.destroyed) return;
    this.attackCooldown -= delta;

    if (this.attackFlash) {
      this.attackFlashLife -= delta;
      if (this.attackFlashLife <= 0) {
        this.attackFlash.parent?.remove(this.attackFlash);
        this.attackFlash.geometry.dispose();
        this.attackFlash.material.dispose();
        this.attackFlash = null;
      }
    }

    const position = this.group.position;
    if (hostile && target) {
      const direction = new THREE.Vector3().subVectors(target.position, position);
      const distance = direction.length();

      if (distance > this.attackRange * 0.8) {
        direction.normalize();
        position.addScaledVector(direction, this.chaseSpeed * delta);
      } else if (this.attackCooldown <= 0) {
        this.attackCooldown = 1.8;
        this.fireBeam(target);
        onAttack(this);
      }

      if (distance > 1) {
        this.group.lookAt(target.position);
        this.group.rotateY(Math.PI);
      }
    } else {
      this.orbitAngle += delta * this.orbitSpeed;
      const destination = new THREE.Vector3(
        this.center.x + Math.cos(this.orbitAngle) * this.orbitRadius,
        this.center.y + 500 + Math.sin(this.orbitAngle * 1.7) * 140,
        this.center.z + Math.sin(this.orbitAngle) * this.orbitRadius
      );
      position.lerp(destination, Math.min(1, delta * 0.8));
      this.group.lookAt(this.center);
    }
  }

  fireBeam(target) {
    const parent = this.group.parent;
    if (!parent) return;

    if (this.attackFlash) {
      this.attackFlash.parent?.remove(this.attackFlash);
      this.attackFlash.geometry.dispose();
      this.attackFlash.material.dispose();
    }

    const geometry = new THREE.BufferGeometry().setFromPoints([
      this.group.position.clone(),
      target.position.clone()
    ]);
    const material = new THREE.LineBasicMaterial({
      color: 0xff563d,
      transparent: true,
      opacity: 0.95
    });

    this.attackFlash = new THREE.Line(geometry, material);
    this.attackFlash.userData.noPhysics = true;
    parent.add(this.attackFlash);
    this.attackFlashLife = 0.14;
  }

  dispose() {
    if (this.attackFlash) {
      this.attackFlash.parent?.remove(this.attackFlash);
      this.attackFlash.geometry.dispose();
      this.attackFlash.material.dispose();
      this.attackFlash = null;
    }

    this.group.parent?.remove(this.group);
    this.group.traverse(object => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
      else object.material.dispose();
    });
  }
}
