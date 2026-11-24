import * as THREE from "three";
import { HumanRig } from "./Human.js";
import { Galvan } from "./Galvan.js";
import { Highbreed } from "./Highbreed.js";
import { Incursean } from "./Incursean.js";
import { Anodite } from "./Anodite.js";

const SPECIES_TYPES = {
  Human: null,
  Highbreed,
  Anodite,
  Galvan,
  Incursean
};

const SPECIES_STYLE = {
  Human: { boneColor: 0x8bb8e8, jointColor: 0xf0bd72 },
  Highbreed: { boneColor: 0xe8f2f1, jointColor: 0xb91f26 },
  Anodite: { boneColor: 0xc17bf0, jointColor: 0xff78c9 },
  Galvan: { boneColor: 0x8d9b8c, jointColor: 0x20d51d },
  Incursean: { boneColor: 0xc88b61, jointColor: 0xe7a04f }
};

export class PlanetaryResident {
  constructor(species = "Human", index = 0, homeWorldKey = null) {
    this.species = species;
    this.index = index;
    const homeKeys = { Human: "earth", Highbreed: "augstaka", Anodite: "anodyne", Galvan: "galvan", Incursean: "incursia" };
    this.homeWorldKey = homeWorldKey || homeKeys[species] || "earth";
    this.rig = new HumanRig(SPECIES_STYLE[species] || SPECIES_STYLE.Human);
    this.speciesInstance = SPECIES_TYPES[species] ? new SPECIES_TYPES[species]() : null;

    if (this.speciesInstance?.group) {
      this.group = this.speciesInstance.group;
      this.rig.group.traverse(object => {
        if (object.isMesh) object.visible = false;
      });
      this.group.add(this.rig.group);
      this.group.scale.setScalar(0.78);
    } else {
      this.group = this.rig.group;
    }

    this.group.name = species + "Resident" + (index + 1);
    this.limbPivots = this.group.children
      .filter(part => (part.isMesh || part.isGroup) && part.position.y < 1.1 && Math.abs(part.position.x) > 0.1)
      .map(part => ({ part, rest: part.rotation.x, phase: part.position.x < 0 ? 0 : Math.PI }));
    this.group.userData.species = species;
    this.group.userData.homeWorldKey = this.homeWorldKey;
    this.group.userData.statusOwner = this.speciesInstance || this.rig;
    this.group.userData.rig = this.rig;
    this.group.userData.updateRigAnimation = (moving, time) => this.rig._rig.updateWalk(time);
    this.target = null;
    this.wait = Math.random() * 2;
    this.rig._rig.setWalking(false);
    this.speed = 1.1 + Math.random() * 0.45;
    this.chooseTarget();
  }

  chooseTarget() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 12 + Math.random() * 42;
    this.target = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius - 18 };
    this.wait = 1 + Math.random() * 2.5;
  }

  update(delta, elapsed) {
    if (this.wait > 0) {
      this.wait -= delta;
      this.rig._rig.setWalking(false);
      this.rig._rig.updateWalk(elapsed);
      return;
    }
    const dx = this.target.x - this.group.position.x;
    const dz = this.target.z - this.group.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.65) {
      this.chooseTarget();
      this.rig._rig.setWalking(false);
      return;
    }
    const step = Math.min(distance, this.speed * delta);
    this.group.position.x += dx / distance * step;
    this.group.position.z += dz / distance * step;
    this.group.rotation.y = Math.atan2(dx, dz);
    const stride = Math.sin(elapsed * 7.5 + this.index * 0.7) * 0.28;
    for (const limb of this.limbPivots) {
      limb.part.rotation.x = limb.rest + Math.sin(elapsed * 7.5 + limb.phase) * 0.28;
    }
    this.group.position.y = Math.abs(stride) * 0.045;
    this.rig._rig.setWalking(true);
    this.rig._rig.updateWalk(elapsed);
  }
}
