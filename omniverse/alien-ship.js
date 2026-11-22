import * as THREE from "three";

/**
 * Lightweight non-physics patrol fighter.
 * It circles its homeworld until its species is hostile to the crew, then
 * pursues Rustbucket and fires when it gets within range.
 */
export class AlienShip {
  constructor(parent, species, homePlanet, center, index = 0) {
    this.species = species;
    this.homePlanet = homePlanet;
    this.center = center.clone();
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
    const color = colors[species] || 0x9aa0a8;
    const hull = new THREE.MeshStandardMaterial({ color, metalness: 0.42, roughness: 0.48 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x18232b, metalness: 0.6, roughness: 0.4 });
    const glow = new THREE.MeshBasicMaterial({ color: species === "Incursean" ? 0xff482c : 0x72ffd0 });
    const add = (geometry, material, position, rotation = null) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      if (rotation) mesh.rotation.set(...rotation);
      mesh.castShadow = true;
      mesh.userData.noPhysics = true;
      this.group.add(mesh);
      return mesh;
    };
    add(new THREE.BoxGeometry(5.4, 1.5, 11), hull, [0, 0, 0]);
    add(new THREE.ConeGeometry(1.6, 5.8, 6), dark, [0, 0, 7.8], [Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(7.2, 0.35, 3.5), hull, [side * 5.1, 0, -1.3], [0, 0, side * 0.08]);
      add(new THREE.BoxGeometry(0.5, 0.45, 2.2), dark, [side * 1.5, -0.2, -5.8]);
      add(new THREE.SphereGeometry(0.48, 10, 8), glow, [side * 1.55, 0, -5.4]);
    }
    add(new THREE.BoxGeometry(2.5, 0.45, 2.6), dark, [0, 0.95, -1.2]);
    this.group.position.set(
      center.x + Math.cos(this.orbitAngle) * this.orbitRadius,
      center.y + 500 + index * 180,
      center.z + Math.sin(this.orbitAngle) * this.orbitRadius
    );
    this.group.userData.noPhysics = true;
    parent.add(this.group);
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
    if (this.destroyed) return;
    this.attackCooldown -= delta;
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
      if (distance > 1) { this.group.lookAt(target.position); this.group.rotateY(Math.PI); }
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
    const geometry = new THREE.BufferGeometry().setFromPoints([this.group.position.clone(),target.position.clone()]);
    const material = new THREE.LineBasicMaterial({color:0xff563d,transparent:true,opacity:.95});
    this.attackFlash = new THREE.Line(geometry,material);
    this.attackFlash.userData.noPhysics = true;
    parent.add(this.attackFlash);
    this.attackFlashLife = .14;
  }

  dispose() {
    this.group.parent?.remove(this.group);
    this.group.traverse(object => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
      else object.material.dispose();
    });
  }
}
