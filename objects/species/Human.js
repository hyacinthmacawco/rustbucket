import * as THREE from "three";

export class Human {
  static homeworld = "earth";
  constructor(options = {}) {
    this.leader = false;
    this.species = this.constructor.name;
    this.relationships = options.relationships || {};
    this.health = 30;
    this.energy = 100;
    this.maxHealth = 30;
    this.maxEnergy = 100;
    this.healthRecoveryDelay = 0;
    this.energyRecoveryDelay = 0;
    this.rig = new HumanRig();
    this.group = this.rig.group;
    this.group.userData.statusOwner = this;
    this.group.userData.rig = this.rig;
    this.group.userData.updateRigAnimation = (moving, time) => {
      this.rig._rig.setWalking(moving);
      this.rig._rig.updateWalk(time);
    };
    if (options.residentIndex !== undefined) {
      initializeResident(this, options.residentIndex, { species: "Human", homeworld: Human.homeworld, rig: this.rig });
    }
  }
  attack(target) {
    if (!target || target.health <= 0) return false;
    const relation = Number(this.relationships[target.species || target.constructor?.name] ?? 0);
    if (relation >= 0) return false;
    this.rig?._rig?.playAnimation("punch");
    target.takeDamage?.(2);
    return true;
  }

  awardTaydenite(account, amount = 10) { return account?.addTaydenite(amount) ?? 0; }
  updateStatus(delta) {
    this.healthRecoveryDelay = Math.max(0, this.healthRecoveryDelay - delta);
    this.energyRecoveryDelay = Math.max(0, this.energyRecoveryDelay - delta);
    if (this.healthRecoveryDelay === 0 && this.health < this.maxHealth) this.health = Math.min(this.maxHealth, this.health + delta * 0.32);
    if (this.energyRecoveryDelay === 0 && this.energy < this.maxEnergy) this.energy = Math.min(this.maxEnergy, this.energy + delta * 0.48);
  }
  takeDamage(amount) { this.health = Math.max(0, this.health - Math.max(0, amount)); this.healthRecoveryDelay = 4; return this.health; }
  useEnergy(amount) { if (this.energy < amount) return false; this.energy = Math.max(0, this.energy - amount); this.energyRecoveryDelay = 4; return true; }
  restoreEnergy(amount) { this.energy = Math.min(this.maxEnergy, this.energy + Math.max(0, amount)); return this.energy; }
}


export class HumanRig {
  static collisionCapsule = Object.freeze({ type: "capsule", radius: 0.23, halfHeight: 0.72, centerY: 0.95 });

  constructor(options = {}) {
    this.species = "Human";
    this.homeworld = Human.homeworld;
  const {
    walkSpeed = 1.8,
    walkAmplitude = 1
  } = options;

  const root = new THREE.Group();
  root.name = "Human";

  const joints = {};
  const bones = [];

  this.makeBone = (name, parent, position, exposeAsJoint = true) => {
    const bone = new THREE.Bone();
    bone.name = name;
    bone.position.set(position[0], position[1], position[2]);
    if (parent) parent.add(bone);
    else root.add(bone);
    if (exposeAsJoint) joints[name] = bone;
    bones.push(bone);
    return bone;
  };

  const hip = this.makeBone("hip", null, [0, 0.98, 0]);
  const spine = this.makeBone("spine", hip, [0, 0.30, 0]);

  // The neck is the parent of the clavicle bridge, so neck movement also
  // carries the clavicles and both shoulder joints with it.
  const neck = this.makeBone("neck", spine, [0, 0.51, 0]);
  const shoulderBridge = this.makeBone("shoulderBridge", neck, [0, -0.08, 0], false);
  const head = this.makeBone("head", neck, [0, 0.19, 0]);

  // Arms: upper arm 0.30, forearm 0.27, hand 0.12.
  for (const side of ["left", "right"]) {
    const sign = side === "left" ? -1 : 1;
    // Shorter clavicles bring the shoulder joints closer to the neck,
    // giving the shoulder girdle more natural human proportions.
    const shoulder = this.makeBone(side + "Shoulder", shoulderBridge, [sign * 0.17, 0, 0]);
    const elbow = this.makeBone(side + "Elbow", shoulder, [sign * 0.30, -0.015, 0]);
    const wrist = this.makeBone(side + "Wrist", elbow, [sign * 0.27, -0.005, 0]);
    this.makeBone(side + "HandEnd", wrist, [sign * 0.12, 0, 0], false);

    // Arm bones are authored along local +/-X. A 90-degree shoulder Z
    // rotation points each upper arm straight down. This also aligns the
    // elbow's local Y axis with the character's lateral axis, making Y the
    // correct hinge axis for forearm motion in the front-facing Y/Z plane.
    shoulder.rotation.z = -sign * THREE.MathUtils.degToRad(77);
    elbow.rotation.set(0, 0, 0);
  }

  // Legs: thigh 0.43, lower leg 0.43, ankle extension 0.12.
  for (const side of ["left", "right"]) {
    const sign = side === "left" ? -1 : 1;
    const thigh = this.makeBone(side + "Thigh", hip, [sign * 0.105, -0.06, 0]);
    const knee = this.makeBone(side + "Knee", thigh, [0, -0.43, 0]);
    this.makeBone(side + "Ankle", knee, [0, -0.43, 0]);
  }

  const skeleton = new THREE.Skeleton(bones);
  root.updateMatrixWorld(true);


  if (options.body !== false) {
  // Replace the diagnostic skeleton display with a complete articulated,
  // Ben-proportioned cuboid human body. Each garment segment is parented to
  // its corresponding joint so the walk cycle deforms the visible character.
  root.traverse(object => { if (object.isMesh) object.visible = false; });
  const palette = {
    shirt: [0x3977a8, 0x9b493c, 0x4b8b62, 0x72539b, 0xc18a3d, 0x3b6570],
    pants: [0x34465c, 0x5b493d, 0x414b42, 0x5d4263, 0x77715a, 0x30343c],
    hair: [0x241b18, 0x493024, 0x8a5832, 0xb68a50, 0x292d32, 0x6d3f35]
  };
  const pick = values => values[Math.floor(Math.random() * values.length)];
  const bodyMaterials = {
    skin: new THREE.MeshStandardMaterial({ color: 0xc98d78, roughness: 0.92 }),
    shirt: new THREE.MeshStandardMaterial({ color: pick(palette.shirt), roughness: 0.9 }),
    pants: new THREE.MeshStandardMaterial({ color: pick(palette.pants), roughness: 0.96 }),
    hair: new THREE.MeshStandardMaterial({ color: pick(palette.hair), roughness: 0.96 }),
    shoes: new THREE.MeshStandardMaterial({ color: 0x30343a, roughness: 0.92 })
  };
  const bodyBox = (parent, name, size, position, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const torsoMesh = bodyBox(spine, "HumanTorso", [0.45, 0.78, 0.28], [0, 0.02, 0], bodyMaterials.shirt);
  const headMesh = bodyBox(head, "HumanHead", [0.36, 0.42, 0.32], [0, 0.055, 0], bodyMaterials.skin);
  // Align the head bottom with the torso top through the neck hierarchy.
  torsoMesh.geometry.computeBoundingBox();
  headMesh.geometry.computeBoundingBox();
  headMesh.position.y = torsoMesh.geometry.boundingBox.max.y + torsoMesh.position.y
    - neck.position.y - head.position.y - headMesh.geometry.boundingBox.min.y;
  bodyBox(head, "HumanHair", [0.38, 0.14, 0.34], [0, 0.22, -0.005], bodyMaterials.hair);
  for (const side of ["left", "right"]) {
    const shoulder = joints[side + "Shoulder"];
    const elbow = joints[side + "Elbow"];
    const wrist = joints[side + "Wrist"];
    bodyBox(shoulder, side + "HumanSleeve", [Math.abs(elbow.position.x) + 0.04, 0.20, 0.22], [elbow.position.x * 0.5, elbow.position.y * 0.5, 0], bodyMaterials.shirt);
    bodyBox(elbow, side + "HumanForearm", [Math.abs(wrist.position.x) + 0.04, 0.15, 0.17], [wrist.position.x * 0.5, wrist.position.y * 0.5, 0], bodyMaterials.skin);
    bodyBox(wrist, side + "HumanHand", [0.15, 0.14, 0.16], [side === "left" ? -0.06 : 0.06, -0.015, 0], bodyMaterials.skin);
    const thigh = joints[side + "Thigh"];
    const knee = joints[side + "Knee"];
    const ankle = joints[side + "Ankle"];
    bodyBox(thigh, side + "HumanPantsUpper", [0.20, 0.48, 0.21], [0, -0.23, 0], bodyMaterials.pants);
    bodyBox(knee, side + "HumanPantsLower", [0.17, 0.43, 0.19], [0, -0.21, 0], bodyMaterials.pants);
    bodyBox(ankle, side + "HumanShoe", [0.20, 0.14, 0.29], [0, -0.06, 0.07], bodyMaterials.shoes);
  }
  }
  root.userData.collisionCapsule = HumanRig.collisionCapsule;

  const initialRotations = new Map(
    bones.map(bone => [bone, bone.rotation.clone()])
  );

  let walking = true;
  let sitting = false;
  let speed = walkSpeed;
  let amplitude = walkAmplitude;
  let activeAction = null;

  // Normalized keyframes are interpolated smoothly by updateWalk().
  const actionClips = {
    pickup: {
      duration: 0.9,
      frames: [
        { at: 0, pose: {} },
        // The shoulder rest pose now establishes a true lateral elbow hinge.
        // Rotate around local Y (not Z): this moves both forearms through the
        // character's front-facing Y/Z plane, with mirrored signs so both
        // hands travel in the same forward direction like a pitchfork.
        { at: 0.18, pose: { leftElbow: { y: 0.85 }, rightElbow: { y: -0.85 } } },
        { at: 0.42, pose: { leftElbow: { y: 1.55 }, rightElbow: { y: -1.55 } } },
        { at: 0.72, pose: { leftElbow: { y: 1.55 }, rightElbow: { y: -1.55 } } },
        { at: 1, pose: {} }
      ]
    },
    jump: {
      duration: 0.72,
      loop: false,
      frames: [
        { at: 0, pose: {} },
        { at: 0.18, pose: { rootY: 0.72, leftThigh: { x: -0.35 }, rightThigh: { x: -0.35 }, leftShoulder: { x: 0.35 }, rightShoulder: { x: -0.35 } } },
        { at: 0.42, pose: { rootY: 0.72, leftThigh: { x: 0.25 }, rightThigh: { x: 0.25 }, leftShoulder: { x: 0.2 }, rightShoulder: { x: -0.2 } } },
        { at: 1, pose: {} }
      ]
    },
    punch: {
      duration: 0.78,
      loop: false,
      frames: [
        { at: 0, pose: {} },
        { at: 0.045, pose: { rightShoulder: { z: -1.72, x: 0.12 }, rightElbow: { x: -1.22 } } },
        { at: 0.13, pose: { rightShoulder: { z: -1.82, x: -1.68 }, rightElbow: { x: 0.04 } } },
        { at: 0.21, pose: { rightShoulder: { x: -0.52 }, rightElbow: { x: -0.86 } } },
        { at: 0.28, pose: { leftShoulder: { z: 1.72, x: 0.12 }, leftElbow: { x: -1.22 } } },
        { at: 0.37, pose: { leftShoulder: { z: 1.82, x: -1.68 }, leftElbow: { x: 0.04 } } },
        { at: 0.46, pose: { leftShoulder: { x: -0.52 }, leftElbow: { x: -0.86 } } },
        { at: 0.56, pose: {} }
      ]
    },
    sit: {
      duration: 0.48,
      loop: false,
      frames: [
        { at: 0, pose: {} },
        { at: 0.45, pose: { leftThigh: { x: -0.58 }, rightThigh: { x: -0.58 }, spine: { x: 0.08 } } },
        { at: 1, pose: {
          leftThigh: { x: -1.15 }, rightThigh: { x: -1.15 },
          leftKnee: { x: 1.25 }, rightKnee: { x: 1.25 },
          leftShoulder: { x: -0.2 }, rightShoulder: { x: -0.2 },
          leftElbow: { x: -0.48 }, rightElbow: { x: -0.48 },
          spine: { x: 0.16 }
        } }
      ]
    },
    stand: {
      duration: 0.38,
      loop: false,
      frames: [
        { at: 0, pose: {
          leftThigh: { x: -1.15 }, rightThigh: { x: -1.15 },
          leftKnee: { x: 1.25 }, rightKnee: { x: 1.25 },
          leftShoulder: { x: -0.2 }, rightShoulder: { x: -0.2 },
          leftElbow: { x: -0.48 }, rightElbow: { x: -0.48 },
          spine: { x: 0.16 }
        } },
        { at: 1, pose: {} }
      ]
    }
  };

  const rig = {
    group: root,
    fitHeadToTorso(torsoMesh, headMesh) {
      if (!torsoMesh?.geometry || !headMesh?.geometry) throw new TypeError("fitHeadToTorso requires torso and head meshes.");
      torsoMesh.geometry.computeBoundingBox();
      headMesh.geometry.computeBoundingBox();
      const torsoTop = torsoMesh.geometry.boundingBox.max.y + torsoMesh.position.y;
      const headBottom = headMesh.geometry.boundingBox.min.y + headMesh.position.y;
      // Both meshes are descendants of spine; move the head mesh in its own
      // local frame until its lower edge meets the torso's upper edge.
      const neckOffset = joints.neck.position.y;
      const headOffset = joints.head.position.y;
      headMesh.position.y += (torsoTop - (neckOffset + headOffset + headBottom));
      root.updateMatrixWorld(true);
    },
    fitToTorso(torsoMesh) {
      if (!torsoMesh?.geometry) throw new TypeError("fitToTorso requires a torso mesh.");
      torsoMesh.geometry.computeBoundingBox();
      const bounds = torsoMesh.geometry.boundingBox;
      const localMinY = bounds.min.y + torsoMesh.position.y;
      const localMaxY = bounds.max.y + torsoMesh.position.y;
      const halfWidth = (bounds.max.x - bounds.min.x) * 0.5;
      const centerZ = (bounds.min.z + bounds.max.z) * 0.5 + torsoMesh.position.z;
      root.updateMatrixWorld(true);

      // Derive attachment points from the torso's real geometry bounds.
      const shoulderWorld = spine.localToWorld(new THREE.Vector3(0, localMaxY - 0.055, centerZ));
      const bridge = bones.find(bone => bone.name === "shoulderBridge");
      bridge.parent.worldToLocal(shoulderWorld);
      bridge.position.copy(shoulderWorld);
      for (const side of ["left", "right"]) {
        const sign = side === "left" ? -1 : 1;
        joints[side + "Shoulder"].position.set(sign * halfWidth * 0.78, 0, 0);
        const legWorld = spine.localToWorld(new THREE.Vector3(
          sign * halfWidth * 0.24, localMinY - 0.025, centerZ
        ));
        hip.worldToLocal(legWorld);
        joints[side + "Thigh"].position.copy(legWorld);
      }
      root.updateMatrixWorld(true);
      return { halfWidth, localMinY, localMaxY };
    },
    skeleton,
    bones,
    joints,
    get walking() { return walking; },
    setWalking(enabled) {
      if (sitting) return;
      walking = Boolean(enabled);
      if (!walking && !activeAction) {
        rig.resetPose();
        root.position.y = 0;
      }
    },
    setWalkSpeed(value) {
      speed = Math.max(0, Number(value) || 0);
    },
    attack() { return rig.playAnimation("punch"); },
    playAnimation(name) {
      if (sitting) sitting = false;
      if (!actionClips[name]) {
        console.warn("Unknown rig animation:", name);
        return false;
      }
      rig.resetPose();
      activeAction = { name, startedAt: null };
      walking = false;
      return true;
    },
    stopAnimation() {
      activeAction = null;
      rig.resetPose();
    },
    updateWalk(timeSeconds) {
      if (sitting) return;
      if (activeAction) {
        const clip = actionClips[activeAction.name];
        if (activeAction.startedAt === null) activeAction.startedAt = timeSeconds;
        const elapsed = Math.max(0, timeSeconds - activeAction.startedAt);
        const t = clip.loop
          ? (elapsed % clip.duration) / clip.duration
          : Math.min(1, elapsed / clip.duration);
        let index = 0;
        while (index < clip.frames.length - 2 && t > clip.frames[index + 1].at) index++;
        const a = clip.frames[index];
        const b = clip.frames[Math.min(index + 1, clip.frames.length - 1)];
        const span = Math.max(0.0001, b.at - a.at);
        const f = THREE.MathUtils.clamp((t - a.at) / span, 0, 1);
        const eased = f * f * (3 - 2 * f);
        const keys = new Set([...Object.keys(a.pose), ...Object.keys(b.pose)]);
        for (const key of keys) {
          if (key === "rootY") {
            root.position.y = THREE.MathUtils.lerp(a.pose.rootY || 0, b.pose.rootY || 0, eased);
            continue;
          }
          const joint = joints[key];
          if (!joint) continue;
          const av = a.pose[key] || {};
          const bv = b.pose[key] || {};
          for (const axis of ["x", "y", "z"]) {
            if (av[axis] !== undefined || bv[axis] !== undefined) {
              const rest = initialRotations.get(joint)?.[axis] ?? 0;
              const from = av[axis] !== undefined ? av[axis] : rest;
              const to = bv[axis] !== undefined ? bv[axis] : rest;
              joint.rotation[axis] = THREE.MathUtils.lerp(from, to, eased);
            }
          }
        }
        if (!clip.loop && t >= 1) {
          const completed = activeAction;
          activeAction = null;
          if (completed.name === "sit") {
            root.position.y = completed.rootY;
            sitting = true;
            walking = false;
          } else {
            rig.resetPose();
            if (completed.rootY !== undefined) root.position.y = completed.rootY;
            sitting = false;
            walking = true;
          }
        }
        return;
      }
      if (!walking) return;

      const cycle = timeSeconds * speed * Math.PI * 2;
      const stride = 0.62 * amplitude;
      const leftPhase = cycle;
      const rightPhase = cycle + Math.PI;

      // The rig's forward/backward axis is Z, so limbs swing around local X.
      // Opposite phases keep the legs alternating like a real gait.
      for (const [side, phase] of [["left", leftPhase], ["right", rightPhase]]) {
        const swing = Math.sin(phase);
        const recovery = Math.max(0, Math.cos(phase));
        joints[side + "Thigh"].rotation.x = swing * stride;
        joints[side + "Knee"].rotation.x = recovery * 0.78 * amplitude;
      }

      // Arms counter-swing against the legs. The arms hang down in their
      // rest pose, so their pendulum motion must rotate around the body's
      // lateral (world X) axis. Rotating around the old Y axis made them
      // sweep sideways, which looked unlike a natural walk.
      const bodyLateralAxis = new THREE.Vector3(1, 0, 0);
      const bodyWorldRotation = new THREE.Quaternion();
      const worldSwing = new THREE.Quaternion();
      const parentWorldInverse = new THREE.Quaternion();
      const parentWorldRotation = new THREE.Quaternion();
      const localDelta = new THREE.Quaternion();

      this.applyBodyRelativeSwing = (bone, restRotation, angle) => {
        // The swing hinge follows the character's own shoulder line. Using a
        // fixed world X axis made the arms swing sideways whenever the
        // character turned away from the world's default heading.
        root.updateWorldMatrix(true, false);
        root.getWorldQuaternion(bodyWorldRotation);
        bodyLateralAxis.set(1, 0, 0).applyQuaternion(bodyWorldRotation).normalize();

        bone.parent.updateWorldMatrix(true, false);
        bone.parent.getWorldQuaternion(parentWorldRotation);
        parentWorldInverse.copy(parentWorldRotation).invert();
        worldSwing.setFromAxisAngle(bodyLateralAxis, angle);

        // Convert the body-relative world hinge into the bone's parent space.
        localDelta.copy(parentWorldInverse)
          .multiply(worldSwing)
          .multiply(parentWorldRotation);
        const restQuaternion = new THREE.Quaternion().setFromEuler(restRotation);
        bone.quaternion.copy(localDelta).multiply(restQuaternion);
      };

      for (const [side, legPhase] of [["left", leftPhase], ["right", rightPhase]]) {
        const armPhase = legPhase + Math.PI;
        const armSwing = Math.sin(armPhase);
        const shoulder = joints[side + "Shoulder"];
        const elbow = joints[side + "Elbow"];
        const shoulderRest = initialRotations.get(shoulder);
        const elbowRest = initialRotations.get(elbow);

        // Shoulder controls the whole arm's forward/backward pendulum.
        this.applyBodyRelativeSwing(shoulder, shoulderRest, armSwing * 0.48 * amplitude);

        // The elbow hinges in the same forward-swing phase. Its flex changes
        // gradually through the cycle, so the forearm follows the upper arm
        // instead of looking like one rigid piece.
        const elbowFlex = (0.12 + (0.5 + 0.5 * armSwing) * 0.34) * amplitude;
        // Negative X rotation bends the forearm toward the character's
        // front (+Z); positive rotation was folding it behind the body.
        this.applyBodyRelativeSwing(elbow, elbowRest, -elbowFlex);
      }

      // Subtle torso counter-rotation; keep the body at a constant height.
      joints.hip.rotation.y = Math.sin(cycle) * 0.035 * amplitude;
      joints.spine.rotation.y = -Math.sin(cycle) * 0.025 * amplitude;
      root.position.y = 0;
    },
    sit() {
      if (sitting || activeAction?.name === "sit") return true;
      activeAction = { name: "sit", startedAt: null, rootY: root.position.y };
      sitting = false;
      walking = false;
      return true;
    },
    stand() {
      if (!sitting && activeAction?.name !== "sit") return true;
      activeAction = { name: "stand", startedAt: null, rootY: root.position.y };
      sitting = false;
      walking = false;
      return true;
    },
    get sitting() { return sitting; },
    get animating() { return Boolean(activeAction); },
    resetPose() {
      for (const [bone, rotation] of initialRotations) {
        bone.rotation.copy(rotation);
      }
      root.position.y = 0;
    },
    setPose(pose = {}) {
      for (const [name, rotation] of Object.entries(pose)) {
        const joint = joints[name];
        if (!joint || !rotation) continue;
        if (rotation.x !== undefined) joint.rotation.x = rotation.x;
        if (rotation.y !== undefined) joint.rotation.y = rotation.y;
        if (rotation.z !== undefined) joint.rotation.z = rotation.z;
      }
    }
  };

  this.group = root;
  this.skeleton = skeleton;
  this.bones = bones;
  this.joints = joints;
  this._rig = rig;
  root.userData.fitToTorso = rig.fitToTorso;
  root.userData.fitHeadToTorso = rig.fitHeadToTorso;
  root.userData.updateRigAnimation = (moving, timeSeconds) => {
    rig.setWalking(moving);
    rig.updateWalk(timeSeconds);
  };
  root.userData.playRigAction = name => rig.playAnimation(name);
  }

  sit() { this._rig.sit(); return this; }
  stand() { this._rig.stand(); return this; }
  get sitting() { return this._rig.sitting; }
  jump() { this.group.userData.playRigAction("jump"); }
  attack() { this.group.userData.playRigAction("punch"); }
  pick() { this.group.userData.playRigAction("pickup"); }
}


export function initializeResident(instance, index, { species, homeworld, style = {}, rig = null } = {}) {
  const residentRig = rig || new HumanRig({ ...style, body: false });
  if (!rig) {
    const modelParts = [...instance.group.children];
    instance.group.add(residentRig.group);
    instance.group.updateMatrixWorld(true);
    residentRig.group.updateMatrixWorld(true);
    // Bind the species' own model pieces to the shared articulated skeleton.
    for (const part of modelParts) {
      const position = part.position;
      let joint;
      if (position.y >= 2.35) joint = residentRig.joints.head;
      else if (position.y >= 1.0) joint = residentRig.joints.spine;
      else if (position.y >= 0.48) {
        const side = position.x < 0 ? "left" : "right";
        joint = residentRig.joints[side + "Shoulder"];
      } else {
        const side = position.x < 0 ? "left" : "right";
        joint = residentRig.joints[side + "Thigh"];
      }
      joint.attach(part);
    }
    instance.group.scale.setScalar(0.78);
  }
  instance.rig = residentRig;
  instance.index = index;
  instance.homeworld = homeworld;
  instance.isAboard = false;
  instance.group.name = species + "Resident" + (index + 1);
  instance.group.userData.species = species;
  instance.group.userData.statusOwner = instance;
  instance.group.userData.speciesInstance = instance;
  instance.onClick = null;
  instance.group.userData.onClick = event => instance.onClick?.(event);
  instance.group.userData.rig = residentRig;
  instance.group.userData.collisionCapsule = instance.constructor.collisionCapsule || HumanRig.collisionCapsule;
  instance.group.userData.updateRigAnimation = (moving, time) => residentRig._rig.updateWalk(time);
  instance.chooseTarget = () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = 12 + Math.random() * 42;
    instance.target = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius - 18 };
    instance.wait = 1 + Math.random() * 2.5;
  };
  instance.update = (delta, elapsed) => {
    if (instance.wait > 0) {
      instance.wait -= delta;
      residentRig._rig.setWalking(false);
      residentRig._rig.updateWalk(elapsed);
      return;
    }
    const dx = instance.target.x - instance.group.position.x;
    const dz = instance.target.z - instance.group.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.65) {
      instance.chooseTarget();
      residentRig._rig.setWalking(false);
      return;
    }
    const step = Math.min(distance, instance.speed * delta);
    if (instance.moveWithCollisions) instance.moveWithCollisions(dx / distance * step, dz / distance * step);
    else {
      instance.group.position.x += dx / distance * step;
      instance.group.position.z += dz / distance * step;
    }
    instance.group.rotation.y = Math.atan2(dx, dz);
    residentRig._rig.setWalking(true);
    residentRig._rig.updateWalk(elapsed);
  };
  instance.speed = 1.1 + Math.random() * 0.45;
  residentRig._rig.setWalking(false);
  instance.chooseTarget();
  return instance;
}
