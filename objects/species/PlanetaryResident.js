import { HumanRig } from "./Human.js";

const SPECIES_STYLE = {
  Human: { boneColor: 0x8bb8e8, jointColor: 0xf0bd72 },
  Highbreed: { boneColor: 0xe8f2f1, jointColor: 0xb91f26 },
  Anodite: { boneColor: 0xc17bf0, jointColor: 0xff78c9 },
  Galvan: { boneColor: 0x8d9b8c, jointColor: 0x20d51d },
  Incursean: { boneColor: 0xc88b61, jointColor: 0xe7a04f }
};

export class PlanetaryResident {
  constructor(species = "Human", index = 0) {
    this.species = species;
    this.index = index;
    this.rig = new HumanRig(SPECIES_STYLE[species] || SPECIES_STYLE.Human);
    this.group = this.rig.group;
    this.group.name = species + "Resident" + (index + 1);
    this.group.userData.species = species;
    this.group.userData.statusOwner = this.rig;
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
    this.rig._rig.setWalking(true);
    this.rig._rig.updateWalk(elapsed);
  }
}
