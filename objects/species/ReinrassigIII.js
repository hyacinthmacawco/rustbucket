import { Highbreed } from "./Highbreed.js";

export class ReinrassigIII extends Highbreed {
  constructor(parent = null, options = {}) {
    super(parent, options);
    this.leader = true;
    this.group.name = options.name || "Reinrassig III";
  }
}
