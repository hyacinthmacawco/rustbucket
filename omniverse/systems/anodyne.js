import { createAlienSystems } from "./alien-systems.js";

export class AnodyneSystem {
  constructor(parent) {
    const result = createAlienSystems(parent, "anodyne");
    this.root = result.root;
    this.group = result.systems[0];
  }
}
