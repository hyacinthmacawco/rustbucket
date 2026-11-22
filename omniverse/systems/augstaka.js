import { createAlienSystems } from "./alien-systems.js";

export class AugstakaSystem {
  constructor(parent) {
    const result = createAlienSystems(parent, "augstaka");
    this.root = result.root;
    this.group = result.systems[0];
  }
}
