import { Incursean } from "./Incursean.js";

export class EmperorMilleus extends Incursean {
  constructor(parent = null, options = {}) {
    super(parent, { ...options, name: options.name || "Emperor Milleus" });
    this.leader = true;
  }
}
