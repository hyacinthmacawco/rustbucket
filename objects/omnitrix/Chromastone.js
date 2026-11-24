import * as THREE from "three";

export class Chromastone {
  constructor({ HumanRig }) {
    if (typeof HumanRig !== "function") {
      throw new TypeError("Chromastone requires the HumanRig class.");
    }

    this.health = 30;
    this.maxHealth = 30;
    this.energy = 100;
    this.maxEnergy = 100;
    this.damage = 10;
    this.energyRecoveryDelay = 0;

    this.rig = new HumanRig();
    this.group = this.rig.group;
    this.group.name = "Chromastone";

    // Keep the shared articulated skeleton, but never display its diagnostic
    // bone or joint geometry.
    this.group.traverse(object => {
      if (object.isMesh) object.visible = false;
    });

    const dark = new THREE.MeshStandardMaterial({
      color: 0x171526, roughness: 0.38, metalness: 0.32
    });
    const crystal = new THREE.MeshStandardMaterial({
      color: 0x6747d2, roughness: 0.2, metalness: 0.48,
      emissive: 0x29105f, emissiveIntensity: 0.32
    });
    const pale = new THREE.MeshStandardMaterial({
      color: 0xd9d3ff, roughness: 0.28, metalness: 0.2,
      emissive: 0x30205c, emissiveIntensity: 0.12
    });

    this.box = (parent, name, size, position, material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.name = name;
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);

      const outline = new THREE.Mesh(
        mesh.geometry,
        new THREE.MeshBasicMaterial({ color: 0x050509, side: THREE.BackSide })
      );
      outline.scale.setScalar(1.045);
      mesh.add(outline);
      return mesh;
    };

    const joints = this.rig.joints;
    const torso = this.box(joints.spine, "ChromastoneTorso",
      [0.48, 0.96, 0.31], [0, 0.025, 0], dark);
    this.group.userData.fitToTorso(torso);

    const chest = this.box(joints.spine, "ChromastoneChestCrystal",
      [0.32, 0.47, 0.075], [0, 0.08, 0.19], crystal);
    chest.rotation.z = 0.04;

    const head = this.box(joints.head, "ChromastoneHead",
      [0.38, 0.43, 0.33], [0, 0.055, 0], dark);
    this.group.userData.fitHeadToTorso(torso, head);

    // Angular crystal crest and facial crystal plates.
    this.box(joints.head, "ChromastoneCrown",
      [0.22, 0.18, 0.24], [0, 0.27, -0.015], crystal);
    this.box(joints.head, "ChromastoneFacePlate",
      [0.25, 0.13, 0.045], [0, -0.055, 0.174], pale);

    for (const side of ["left", "right"]) {
      const sign = side === "left" ? -1 : 1;
      const shoulder = joints[side + "Shoulder"];
      const elbow = joints[side + "Elbow"];
      const wrist = joints[side + "Wrist"];
      const thigh = joints[side + "Thigh"];
      const knee = joints[side + "Knee"];
      const ankle = joints[side + "Ankle"];

      this.box(shoulder, "ChromastoneUpperArm",
        [Math.abs(elbow.position.x) + 0.07, 0.25, 0.29],
        [elbow.position.x * 0.5, elbow.position.y * 0.5, 0], dark);
      this.box(shoulder, "ChromastoneShoulderCrystal",
        [0.24, 0.30, 0.32], [sign * 0.16, -0.02, 0.02], crystal);
      this.box(elbow, "ChromastoneForearm",
        [Math.abs(wrist.position.x) + 0.06, 0.20, 0.22],
        [wrist.position.x * 0.5, wrist.position.y * 0.5, 0], dark);
      this.box(wrist, "ChromastoneHand",
        [0.17, 0.16, 0.19], [sign * 0.075, 0, 0], crystal);

      this.box(thigh, "ChromastoneUpperLeg",
        [0.22, 0.62, 0.23], [0, -0.30, 0], dark);
      this.box(knee, "ChromastoneLowerLeg",
        [0.19, 0.44, 0.21], [0, -0.21, 0], dark);
      this.box(ankle, "ChromastoneFoot",
        [0.22, 0.16, 0.31], [0, -0.08, 0.07], crystal);

      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), pale);
      shard.position.set(sign * 0.22, 0.08, 0.22);
      shard.rotation.set(0.2, 0, sign * 0.3);
      shard.castShadow = true;
      joints.spine.add(shard);
    }

    this.group.userData.statusOwner = this;
    this.group.userData.rig = this.rig;
    this.beam = null;
  }

  attack() {
    if (this.energy < 10) return false;
    this.energy = Math.max(0, this.energy - 10);
    this.energyRecoveryDelay = 4;

    if (this.beam) {
      this.beam.removeFromParent();
      this.beam.traverse(object => {
        object.geometry?.dispose();
        if (object.material) object.material.dispose();
      });
    }

    const beam = new THREE.Group();
    beam.name = "ChromastoneRainbowLaser";
    const colors = [0xff3030, 0xffa52f, 0xffed3b, 0x39e85b, 0x35baff, 0x9a55ff];
    colors.forEach((color, index) => {
      const ray = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 18, 8),
        new THREE.MeshBasicMaterial({ color, toneMapped: false })
      );
      ray.rotation.x = Math.PI / 2;
      ray.position.set((index - 2.5) * 0.075, 0, 9);
      ray.userData.damage = this.damage;
      beam.add(ray);
    });
    beam.position.set(0, 1.55, 0.35);
    this.group.add(beam);
    beam.userData.remaining = 0.16;
    this.beam = beam;
    return true;
  }

  restoreEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + Math.max(0, amount));
    return this.energy;
  }

  absorbLaser(damage) {
    return this.restoreEnergy(damage);
  }

  checkLaserCollisions(projectiles = []) {
    if (!this.group.parent || !projectiles.length) return;
    this.group.updateWorldMatrix(true, false);
    const center = this.group.getWorldPosition(new THREE.Vector3());
    center.y += 1.45;
    for (let index = projectiles.length - 1; index >= 0; index--) {
      const projectile = projectiles[index];
      if (!projectile?.parent) continue;
      projectile.parent.updateWorldMatrix(true, false);
      const position = projectile.getWorldPosition(new THREE.Vector3());
      const previous = projectile.userData.previousPosition
        ? projectile.userData.previousPosition.clone().applyMatrix4(projectile.parent.matrixWorld)
        : position.clone();
      const closest = new THREE.Vector3();
      new THREE.Line3(previous, position).closestPointToPoint(center, closest);
      if (closest.distanceTo(center) > 1.25) continue;
      this.absorbLaser(projectile.userData.damage ?? 10);
      projectile.parent.remove(projectile);
      projectile.geometry?.dispose();
      projectile.material?.dispose();
      projectiles.splice(index, 1);
    }
  }

  update(delta) {
    this.energyRecoveryDelay = Math.max(0, this.energyRecoveryDelay - delta);
    if (this.beam) {
      this.beam.userData.remaining -= delta;
      if (this.beam.userData.remaining <= 0) {
        this.beam.removeFromParent();
        this.beam.traverse(object => {
          object.geometry?.dispose();
          if (object.material) object.material.dispose();
        });
        this.beam = null;
      }
    }
  }
}
