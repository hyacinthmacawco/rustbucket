import * as THREE from "three";

export class Rustbucket {
  constructor(parent) {
    this.ship = new THREE.Group();
    this.ship.name = "Rustbucket";
    this.ship.position.set(0, 2, 0);
    this.ship.scale.setScalar(3);
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
    this.createSeats();
    this.createLighting();
    this.createRamp();
    this.createShadow(parent);

    // The movement joystick supplies camera-relative horizontal movement and
    // a vertical lift value. Keep the flight behavior on the vehicle itself.
    this.projectiles = [];
    this.rescuePassengers = [];
    this.rescueContext = { getCurrentPlanet: () => null, getResidents: () => [], account: null, onUpdate: () => {}, onPickup: () => null, onDrop: () => {} };
    this.ship.userData.performPickup = this.performRescueAction.bind(this);
    this.ship.userData.moveVehicle = this.moveVehicle.bind(this);
    this.ship.userData.performAttack = this.performAttack.bind(this);
  }


  setRescueContext(context = {}) {
    this.rescueContext = {
      getCurrentPlanet: context.getCurrentPlanet || (() => null),
      getResidents: context.getResidents || (() => []),
      account: context.account || null,
      onUpdate: context.onUpdate || (() => {}),
      onPickup: context.onPickup || (() => null),
      onDrop: context.onDrop || (() => {})
    };
  }

  performRescueAction() {
    const context = this.rescueContext;
    const planet = context.getCurrentPlanet();
    const residents = context.getResidents();
    if (!planet || !this.ship.parent) return;

    const nearby = residents.find(resident =>
      !resident.isAboard &&
      resident.group.parent === this.ship.parent &&
      resident.homeworld !== planet.world.key &&
      resident.group.position.distanceTo(this.ship.position) < 12
    );

    if (nearby) {
      nearby.isAboard = true;
      this.ship.attach(nearby.group);
      nearby.group.position.set(
        -0.65 + (this.rescuePassengers.length % 3) * 0.65,
        -0.25,
        -1.1 - Math.floor(this.rescuePassengers.length / 3) * 0.7
      );
      nearby.group.rotation.set(0, Math.PI, 0);
      const residentIndex = residents.indexOf(nearby);
      if (residentIndex >= 0) residents.splice(residentIndex, 1);
      this.rescuePassengers.push(nearby);
      nearby.taskId = context.onPickup(nearby);
      context.onUpdate();
      return;
    }

    const deliverable = this.rescuePassengers.find(resident => resident.homeworld === planet.world.key);
    if (!deliverable) return;

    deliverable.isAboard = false;
    this.ship.parent.attach(deliverable.group);
    deliverable.group.position.set(
      this.ship.position.x + 4 + Math.random() * 2,
      0,
      this.ship.position.z + 3 + Math.random() * 2
    );
    deliverable.group.rotation.set(0, Math.random() * Math.PI * 2, 0);
    this.rescuePassengers = this.rescuePassengers.filter(resident => resident !== deliverable);
    residents.push(deliverable);
    const balanceBefore = context.account?.balance ?? 0;
    deliverable.awardTaydenite(context.account, 10);
    const taydeniteIncrease = Math.max(0, (context.account?.balance ?? balanceBefore) - balanceBefore);
    context.onDrop(deliverable, 5, taydeniteIncrease);
    context.onUpdate();
  }

  updateRescueInteraction({ selected, interactControl } = {}) {
    if (!interactControl) return;
    if (selected !== "rustbucket") {
      interactControl.setMode("Pick");
      return;
    }
    const planet = this.rescueContext.getCurrentPlanet();
    const residents = this.rescueContext.getResidents();
    const nearby = planet && residents.some(resident =>
      !resident.isAboard &&
      resident.group.parent === this.ship.parent &&
      resident.homeworld !== planet.world.key &&
      resident.group.position.distanceTo(this.ship.position) < 12
    );
    const canDrop = planet && this.rescuePassengers.some(resident => resident.homeworld === planet.world.key);
    interactControl.setMode(nearby ? "Pick" : canDrop ? "Drop" : "Pick");
  }

  moveVehicle(moveX, moveZ, lift, delta, liftX = 0, heading = this.ship.rotation.y) {
    const horizontalSpeed = 18;
    const verticalSpeed = 12;
    this.ship.position.x += moveX * horizontalSpeed * delta;
    this.ship.position.z += moveZ * horizontalSpeed * delta;
    this.ship.position.y += lift * verticalSpeed * delta;
    this.ship.rotation.y = heading;
    this.ship.rotation.z = -THREE.MathUtils.clamp(liftX, -1, 1) * 0.24;
    this.ship.rotation.x = -THREE.MathUtils.clamp(lift, -1, 1) * 0.18;
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
    this.tailPanel = this.addMesh(new THREE.BoxGeometry(2.7, 2.5, 0.16), hull, [0, 0, -5.18]);
    this.addMesh(new THREE.BoxGeometry(2.82, 0.18, 10.7), hull, [0, 1.38, 0]);
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

    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(2.25, 1.25),
      new THREE.MeshStandardMaterial({
        color: 0x6eabbc, emissive: 0x17333d, transparent: true,
        opacity: 0.48, roughness: 0.2, metalness: 0.22,
        side: THREE.DoubleSide, depthWrite: false
      })
    );
    windshield.name = "FrontWindow";
    windshield.position.set(0, 0.58, 4.82);
    windshield.rotation.x = -0.12;
    windshield.userData.noPhysics = true;
    this.ship.add(windshield);
    this.addMesh(new THREE.BoxGeometry(0.12, 1.42, 0.16), hull, [-1.18, 0.58, 4.78]);
    this.addMesh(new THREE.BoxGeometry(0.12, 1.42, 0.16), hull, [1.18, 0.58, 4.78]);
    this.addMesh(new THREE.BoxGeometry(2.42, 0.12, 0.16), hull, [0, 1.27, 4.78]);
    this.addMesh(new THREE.BoxGeometry(2.42, 0.12, 0.16), hull, [0, -0.10, 4.78]);
  }

  createSeats() {
    this.seats = [
      { name: "Front Left", position: new THREE.Vector3(-0.72, -0.92, 3.45), rotation: 0 },
      { name: "Front Right", position: new THREE.Vector3(0.72, -0.92, 3.45), rotation: 0 },
      { name: "Left Side", position: new THREE.Vector3(-0.92, -0.92, 1.65), rotation: Math.PI / 2 },
      { name: "Right Side", position: new THREE.Vector3(0.92, -0.92, 1.65), rotation: -Math.PI / 2 }
    ];
    const cushionMaterial = new THREE.MeshStandardMaterial({ color: 0x303b38, roughness: 0.9 });
    const backMaterial = new THREE.MeshStandardMaterial({ color: 0x252f2d, roughness: 0.88 });
    this.seats.forEach((seat, index) => {
      const group = new THREE.Group();
      group.name = "RustbucketSeat" + (index + 1);
      group.position.set(seat.position.x, -0.94, seat.position.z);
      group.rotation.y = seat.rotation;
      group.scale.setScalar(1 / 3);
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 0.9), cushionMaterial);
      cushion.position.y = 0.82;
      cushion.castShadow = true;
      cushion.userData.noPhysics = true;
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.0, 0.16), backMaterial);
      back.position.set(0, 1.31, -0.36);
      back.castShadow = true;
      back.userData.noPhysics = true;
      group.add(cushion, back);
      group.userData.seatIndex = index;
      group.userData.noPhysics = true;
      this.ship.add(group);
      seat.group = group;
    });
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
    this.tailPanel.visible = !this.rampOpen;
    this.ramp.visible = true;
    this.rampPivot.rotation.x = this.rampOpen ? -Math.PI / 2 : 0;
    this.updateRearCollider();
  }

  updateRearCollider() {
    if (!this.vehicleBody || !this.physicsWorld || !this.physicsRapier) return;
    if (this.rearCollider) {
      this.physicsWorld.removeCollider(this.rearCollider, true);
      this.rearCollider = null;
    }
    if (!this.rampOpen) {
      const scale = this.ship.scale.x || 1;
      this.rearCollider = this.physicsWorld.createCollider(
        this.physicsRapier.ColliderDesc.cuboid(1.35 * scale, 1.22 * scale, 0.08 * scale)
          .setTranslation(0, 0, -5.18 * scale),
        this.vehicleBody
      );
    }
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
      bolt.userData.damage = 10;
      bolt.userData.remaining = 2.4;
      parent.add(bolt);
      this.projectiles.push(bolt);
    }
  }

  update(delta) {
    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const bolt = this.projectiles[index];
      bolt.userData.previousPosition = bolt.position.clone();
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

    this.physicsWorld = world;
    this.physicsRapier = RAPIER;
    this.rearCollider = null;
    const hullColliders = [
      RAPIER.ColliderDesc.cuboid(size(0.12), size(1.22), size(5.25)).setTranslation(size(-1.38), 0, 0),
      RAPIER.ColliderDesc.cuboid(size(0.12), size(1.22), size(5.25)).setTranslation(size(1.38), 0, 0),
      RAPIER.ColliderDesc.cuboid(size(1.32), size(1.22), size(0.12)).setTranslation(0, 0, size(5)),
      RAPIER.ColliderDesc.cuboid(size(1.36), size(0.09), size(5.15)).setTranslation(0, size(1.28), 0),
      RAPIER.ColliderDesc.cuboid(size(1.32), size(0.08), size(5.05)).setTranslation(0, size(-1.18), 0)
    ];
    for (const collider of hullColliders) world.createCollider(collider, this.vehicleBody);
    this.updateRearCollider();
    this.ship.userData.vehicleBody = this.vehicleBody;
    return this.vehicleBody;
  }
}
