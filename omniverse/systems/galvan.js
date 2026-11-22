import { createAlienSystems } from "./alien-systems.js";

export class GalvanSystem {
  constructor(parent) {
    const result = createAlienSystems(parent, "galvan");
    this.root = result.root;
    this.group = result.systems[0];
  }
}
