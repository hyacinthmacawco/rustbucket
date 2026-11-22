import { AlienSystems } from "./alien-systems.js";

export class GalvanSystem {
  constructor(parent) {
    const result = new AlienSystems(parent, "galvan");
    this.root = result.root;
    this.group = result.systems[0];
    this.root.position.copy(this.group.position).negate();
    this.starfield = result.starfield;
  }
}
