import { AlienSystems } from "./AlienSystems.js";

export class AnodyneSystem {
  constructor(parent) {
    const result = new AlienSystems(parent, "anodyne");
    this.root = result.root;
    this.group = result.systems[0];
    this.root.position.copy(this.group.position).negate();
    this.starfield = result.starfield;
    this.starfield.position.copy(this.group.position);
  }
}
