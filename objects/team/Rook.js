import * as THREE from "three";

export class Rook {
  static health = 100;
  static energy = 100;
  static relationships = {"Highbreed":0,"Incursean":-70,"Anodite":40,"Galvan":80,"Human":28,"Ben":96,"Gwen":60,"Kevin":70};

  constructor({ HumanRig }) {
    this.startPosition = [7,-0.5,-7];
    this.startScale = [0.52,0.52,0.52];
    this.health = this.constructor.health;
    this.damage = 1;
    this.dead = false;
    this.energy = this.constructor.energy;
    this.energyLabel = "PROTO-TOOL";
    this.maxHealth = 100;
    this.maxEnergy = 100;
    this.healthRecoveryDelay = 0;
    this.energyRecoveryDelay = 0;
  if (typeof HumanRig !== "function") throw new TypeError(" Rook requires the HumanRig class.");
  const rig = new HumanRig({ boneRadius: 0.05, jointRadius: 0.07 });
  const { group, joints } = rig;
  group.name = "RookBlonko";
  group.traverse(o => { if (o.isMesh) o.visible = false; });

  const mat = {
    skin: new THREE.MeshStandardMaterial({ color: 0x7183b6, roughness: 0.88 }),
    face: new THREE.MeshStandardMaterial({ color: 0xc3d5d9, roughness: 0.9 }),
    black: new THREE.MeshStandardMaterial({ color: 0x10121b, roughness: 0.92 }),
    armor: new THREE.MeshStandardMaterial({ color: 0x294b83, roughness: 0.78, metalness: 0.12 }),
    armorLight: new THREE.MeshStandardMaterial({ color: 0x8299b9, roughness: 0.78, metalness: 0.12 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x141c30, roughness: 0.8 }),
    boot: new THREE.MeshStandardMaterial({ color: 0x263f70, roughness: 0.82 }),
    sole: new THREE.MeshStandardMaterial({ color: 0x0d1322, roughness: 0.9 })
  };
  const faceMaterial = mat.face;
  this.makeHairTexture = (front = false) => {
    const canvas = document.createElement("canvas");
    canvas.width = 384; canvas.height = 384;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#c3d5d9"; ctx.fillRect(0, 0, 384, 384);
    ctx.fillStyle = "#10121b";
    if (front) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(384, 0); ctx.lineTo(384, 100);
      ctx.lineTo(320, 128); ctx.lineTo(258, 92); ctx.lineTo(192, 132);
      ctx.lineTo(126, 92); ctx.lineTo(60, 126); ctx.lineTo(0, 98);
      ctx.closePath(); ctx.fill();
    } else ctx.fillRect(0, 0, 384, 384);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  };
  const frontHairMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: this.makeHairTexture(true), transparent: false, roughness: 0.95 });
  const sideHairMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: this.makeHairTexture(false), roughness: 0.95 });
  this.box = (p, n, s, pos, m) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(...s), m);
    o.name = n; o.position.set(...pos); o.castShadow = true; o.receiveShadow = true; p.add(o); return o;
  };

  // Broad black undersuit with blue chest and shoulder armour.
  const torso = this.box(joints.spine, "RookBlackUndersuit", [0.53, 0.98, 0.32], [0, 0.035, 0], mat.black);
  group.userData.fitToTorso(torso);
  this.box(joints.spine, "RookBlueChestPlate", [0.47, 0.43, 0.075], [0, 0.24, 0.19], mat.armor);
  this.box(joints.spine, "RookChestInset", [0.28, 0.20, 0.025], [0, 0.12, 0.235], mat.trim);
  this.box(joints.spine, "RookNeckArmour", [0.34, 0.13, 0.33], [0, 0.49, 0], mat.armorLight);
  // Front fringe, side length and rear hair are all textures on the head mesh.
  const headMesh = this.box(joints.head, "RookHead", [0.39, 0.46, 0.34], [0, 0.055, 0],
    [sideHairMat, sideHairMat, mat.black, faceMaterial, frontHairMat, sideHairMat]);
  group.userData.fitHeadToTorso(torso, headMesh);

  for (const side of ["left", "right"]) {
    const sign = side === "left" ? -1 : 1;
    const shoulder = joints[side + "Shoulder"];
    const elbow = joints[side + "Elbow"];
    const wrist = joints[side + "Wrist"];
    this.box(shoulder, "RookLargeShoulderPad", [Math.abs(elbow.position.x) + 0.14, 0.29, 0.35],
      [elbow.position.x * 0.5, 0, 0], mat.armor);
    this.box(shoulder, "RookShoulderInset", [Math.abs(elbow.position.x) + 0.06, 0.20, 0.365],
      [elbow.position.x * 0.5, 0, 0.01], mat.armorLight);
    this.box(elbow, "RookBlackUpperForearm", [Math.abs(wrist.position.x) + 0.045, 0.18, 0.22],
      [wrist.position.x * 0.5, wrist.position.y * 0.5, 0], mat.black);
    this.box(elbow, "RookBlueForearmGuard", [Math.abs(wrist.position.x) + 0.06, 0.20, 0.24],
      [wrist.position.x * 0.5, wrist.position.y * 0.5 - 0.02, 0.045], mat.armorLight);
    this.box(joints[side + "Wrist"], "RookBlueGauntlet", [0.18, 0.19, 0.22], [sign * 0.08, 0, 0], mat.armor);
    this.box(joints[side + "Wrist"], "RookClawHand", [0.18, 0.16, 0.19], [sign * 0.08, -0.02, 0.04], mat.skin);
    this.box(joints[side + "Thigh"], "RookBlackLeg", [0.23, 0.64, 0.23], [0, -0.30, 0], mat.black);
    this.box(joints[side + "Thigh"], "RookHipSidePlate", [0.12, 0.27, 0.25], [sign * 0.10, -0.02, 0.025], mat.armorLight);
    this.box(joints[side + "Knee"], "RookLowerLeg", [0.19, 0.44, 0.20], [0, -0.21, 0], mat.black);
    this.box(joints[side + "Knee"], "RookShinGuard", [0.18, 0.35, 0.23], [0, -0.20, 0.055], mat.armor);
    this.box(joints[side + "Ankle"], "RookArmouredBoot", [0.23, 0.19, 0.34], [0, -0.09, 0.07], mat.boot);
    this.box(joints[side + "Ankle"], "RookBootSole", [0.24, 0.045, 0.35], [0, -0.19, 0.08], mat.sole);
  }
  // Compact back-mounted Proto-Tool silhouette, kept clear of the arms.
  const tool = this.box(joints.spine, "RookProtoToolPack", [0.23, 0.55, 0.16], [0.27, 0.18, -0.22], mat.trim);
  tool.rotation.z = -0.12;
  this.box(joints.spine, "RookProtoToolBluePanel", [0.13, 0.38, 0.025], [0.27, 0.19, -0.31], mat.armorLight);
  Object.assign(this, { group, rig, joints });
  group.userData.statusOwner = this;
  }

  attack(target) { if (!target || target.health <= 0) return false; const relation = Number(target.relationships?.Rook ?? target.constructor?.relationships?.Rook ?? -1); if (relation >= 0) return false; this.rig?._rig?.playAnimation("punch"); target.takeDamage?.(2); return true; }

  updateStatus(delta) {
    if (this.dead || this.health <= 0) { this.health = 0; this.dead = true; this.group.visible = false; return; }
    this.healthRecoveryDelay = Math.max(0, this.healthRecoveryDelay - delta);
    this.energyRecoveryDelay = Math.max(0, this.energyRecoveryDelay - delta);
    if (this.healthRecoveryDelay === 0 && this.health < this.maxHealth) this.health = Math.min(this.maxHealth, this.health + delta * 0.32);
    if (this.energyRecoveryDelay === 0 && this.energy < this.maxEnergy) this.energy = Math.min(this.maxEnergy, this.energy + delta * 0.48);
    this.constructor.health = this.health;
    this.constructor.energy = this.energy;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - Math.max(0, amount));
    if (this.health === 0) { this.dead = true; this.group.visible = false; }
    this.healthRecoveryDelay = 4;
    this.constructor.health = this.health;
    return this.health;
  }

  useEnergy(amount) {
    if (this.energy < amount) return false;
    this.energy = Math.max(0, this.energy - amount);
    this.energyRecoveryDelay = 4;
    this.constructor.energy = this.energy;
    return true;
  }

  restoreEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + Math.max(0, amount));
    this.constructor.energy = this.energy;
    return this.energy;
  }

  restoreHealth(amount) {
    this.health = Math.min(this.maxHealth, this.health + Math.max(0, amount));
    this.constructor.health = this.health;
    return this.health;
  }

}
