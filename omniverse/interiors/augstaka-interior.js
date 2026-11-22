import { createPlanetInterior } from "./planet-interior.js";

export class AugstakaInterior {
  constructor(parent) {
    this.environment = createPlanetInterior(parent, "augstaka");
    this.root = this.environment.root;
    this.marketplace = this.environment.marketplace;
  }
}
