import { createAlienSystems } from "./alien-systems.js";

export class IncursiaSystem {
  constructor(parent) {
    const result = createAlienSystems(parent, "incursia");
    this.root = result.root;
    this.group = result.systems[0];
  }
}
