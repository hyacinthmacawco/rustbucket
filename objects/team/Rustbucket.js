import * as THREE from "three";

export class Rustbucket {
  constructor(parent) {
    this.ship = new THREE.Group();
    this.ship.name = "Rustbucket";
    this.ship.position.set(0, 2, 0);
    this.ship.scale.setScalar(2);
    parent.add(this.ship);

    this.materials = {
      hull: new THREE.MeshStandardMaterial({
        color: 0xd8d0ad,
        roughness: 0.72,
        side: THREE.DoubleSide
      }),
      interior: new THREE.MeshStandardMaterial({ color: 0x55534a, roughness: 0.9 }),
      orange: new THREE.MeshStandardMaterial({ color: 0xb95f37, roughness: 0.68 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x424b50, metalness: 0.45, roughness: 0.5 }),
      glass: new THREE.MeshStandardMaterial({
        color: 0x253a42,
        emissive: 0x10252d,
        roughness: 0.25,
        metalness: 0.35
      })
    };

    this.createHull();
    this.createLighting();
    this.createRamp();
    this.createShadow(parent);

    // The movement joystick supplies camera-relative horizontal movement and
    // a vertical lift value. Keep the flight behavior on the vehicle itself.
    this.projectiles = [];
    this.ship.userData.moveVehicle = this.moveVehicle.bind(this);
    this.ship.userData.performAttack = this.performAttack.bind(this);
  }

  moveVehicle(moveX, moveZ, lift, delta, liftX = 0, heading = this.ship.rotation.y) {
    const horizontalSpeed = 18;
    const verticalSpeed = 12;
    this.ship.position.x += moveX * horizontalSpeed * delta;
    this.ship.position.z += moveZ * horizontalSpeed * delta;
    this.ship.position.y += lift * verticalSpeed * delta;
    this.ship.rotation.y = heading;
    this.ship.rotation.z = -THREE.MathUtils.clamp(liftX, -1, 1) * 0.24;
    this.ship.rotation.x = THREE.MathUtils.clamp(lift, -1, 1) * 0.18;
  }

  addMesh(geometry, material, position, rotation = [0, 0, 0], parent = this.ship) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.noPhysics = true;
    parent.add(mesh);
    return mesh;
  }

  createHull() {
    const { hull, interior, orange, metal, glass } = this.materials;

    this.addMesh(new THREE.BoxGeometry(0.16, 2.5, 10.5), hull, [-1.35, 0, 0]);
    this.addMesh(new THREE.BoxGeometry(0.16, 2.5, 10.5), hull, [1.35, 0, 0]);
    this.addMesh(new THREE.BoxGeometry(2.7, 0.14, 9.7), interior, [0, -1.18, 0]);
    this.addMesh(new THREE.BoxGeometry(0.22, 0.16, 10.5), hull, [-1.22, 1.22, 0]);
    this.addMesh(new THREE.BoxGeometry(0.22, 0.16, 10.5), hull, [1.22, 1.22, 0]);
    this.addMesh(new THREE.BoxGeometry(2.7, 2.5, 0.16), hull, [0, 0, -5.18]);
    this.addMesh(new THREE.BoxGeometry(2.82, 0.18, 10.7), hull, [0, 1.38, 0]);
    this.addMesh(new THREE.ConeGeometry(1.52, 2.6, 12), hull, [0, 0, 6.45], [Math.PI / 2, 0, 0]);
    this.addMesh(new THREE.BoxGeometry(2.78, 0.18, 0.24), orange, [0, 0, 5.12]);

    for (let index = 0; index < 3; index++) {
      this.addMesh(
        new THREE.BoxGeometry(0.42, 0.62, 0.08),
        metal,
        [-0.48 + index * 0.48, 0.7, 3.5 - index * 0.32],
        [-0.12, 0, 0]
      );
    }

    for (const side of [-1, 1]) {
      this.addMesh(
        new THREE.BoxGeometry(6.2, 0.16, 2.1),
        hull,
        [side * 3.8, -0.08, -1.15],
        [0, 0, side * 0.035]
      );
      this.addMesh(
        new THREE.BoxGeometry(0.72, 0.19, 2),
        orange,
        [side * 7.15, -0.08, -1.15],
        [0, 0, side * 0.035]
      );
    }

    this.addMesh(new THREE.BoxGeometry(1.8, 0.1, 0.8), glass, [0, 0.75, 2.7]);
  }

  createLighting() {
    const lamp = new THREE.PointLight(0xbfe5ff, 85, 110, 1.5);
    lamp.position.set(0, 1.9, 0);
    this.ship.add(lamp);

    const lens = new THREE.MeshStandardMaterial({
      color: 0xe8f5ff,
      emissive: 0xc9e7ff,
      emissiveIntensity: 3,
      roughness: 0.25
    });

    for (const side of [-1, 1]) {
      this.addMesh(new THREE.SphereGeometry(0.19, 12, 8), lens, [side * 0.62, 0.12, 7.72]);
      const headlight = new THREE.SpotLight(0xd9edff, 720, 220, Math.PI / 5.2, 0.62, 1.1);
      headlight.position.set(side * 0.62, 0.12, 7.72);
      headlight.target.position.set(side * 0.62, -0.15, 90);
      this.ship.add(headlight, headlight.target);
    }
  }

  createRamp() {
    this.rampPivot = new THREE.Group();
    this.rampPivot.position.set(0, -1.25, -5);
    this.ship.add(this.rampPivot);

    const ramp = this.addMesh(
      new THREE.BoxGeometry(2.55, 3, 0.16),
      this.materials.metal,
      [0, 1.25, 0],
      [0, 0, 0],
      this.rampPivot
    );
    this.addMesh(
      new THREE.BoxGeometry(2.4, 0.12, 0.18),
      this.materials.orange,
      [0, 2.1, 0],
      [0, 0, 0],
      this.rampPivot
    );
    this.ramp = ramp;
    this.rampOpen = false;
  }

  setRamp(open) {
    this.rampOpen = Boolean(open);
    this.rampPivot.rotation.x = this.rampOpen ? -Math.PI / 2 : 0;
  }

  toggleRamp() {
    this.setRamp(!this.rampOpen);
    return this.rampOpen;
  }

  createShadow(parent) {
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(7.2, 32),
      new THREE.MeshBasicMaterial({
        color: 0x080a0e,
        transparent: true,
        opacity: 0.25,
        depthWrite: false
      })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.set(0, 0.025, 0);
    this.shadow.scale.set(1.25, 0.62, 1);
    this.shadow.userData.noPhysics = true;
    parent.add(this.shadow);
  }

  performAttack() {
    const parent = this.ship.parent;
    if (!parent) return;
    this.ship.updateWorldMatrix(true, false);
    const shipRotation = this.ship.getWorldQuaternion(new THREE.Quaternion());
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(shipRotation).normalize();

    for (const offset of [-0.62, 0.62]) {
      const muzzle = new THREE.Vector3(offset, 0.12, 7.75).applyMatrix4(this.ship.matrixWorld);
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 2.8, 8),
        new THREE.MeshBasicMaterial({ color: 0x8dff4f, toneMapped: false })
      );
      bolt.position.copy(muzzle);
      bolt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      bolt.userData.velocity = direction.clone().multiplyScalar(260);
      bolt.userData.remaining = 2.4;
      parent.add(bolt);
      this.projectiles.push(bolt);
    }
  }

  update(delta) {
    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const bolt = this.projectiles[index];
      bolt.position.addScaledVector(bolt.userData.velocity, delta);
      bolt.userData.remaining -= delta;
      if (bolt.userData.remaining <= 0) {
        bolt.parent?.remove(bolt);
        bolt.geometry.dispose();
        bolt.material.dispose();
        this.projectiles.splice(index, 1);
      }
    }
  }

  addVehicle(world, RAPIER) {
    const position = this.ship.position;
    const scale = this.ship.scale.x || 1;
    const size = value => value * scale;

    this.vehicleBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(position.x, position.y, position.z)
        .setLinearDamping(0)
        .setAngularDamping(0)
        .setCanSleep(false)
    );
    this.vehicleBody.setGravityScale(0, true);

    const hullColliders = [
      RAPIER.ColliderDesc.cuboid(size(0.12), size(0.82), size(5)).setTranslation(size(-1.38), 0, 0),
      RAPIER.ColliderDesc.cuboid(size(0.12), size(0.82), size(5)).setTranslation(size(1.38), 0, 0),
      RAPIER.ColliderDesc.cuboid(size(1.32), size(0.82), size(0.12)).setTranslation(0, 0, size(5)),
      RAPIER.ColliderDesc.cuboid(size(1.36), size(0.09), size(5.15)).setTranslation(0, size(1.28), 0)
    ];

    for (const collider of hullColliders) {
      world.createCollider(collider, this.vehicleBody);
    }

    this.ship.userData.vehicleBody = this.vehicleBody;
    return this.vehicleBody;
  }
}
