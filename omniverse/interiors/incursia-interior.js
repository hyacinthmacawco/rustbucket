import { createPlanetInterior } from "./planet-interior.js";

export class IncursiaInterior {
  constructor(parent) {
    this.environment = createPlanetInterior(parent, "incursia");
    this.root = this.environment.root;
    this.marketplace = this.environment.marketplace;
  }
}
