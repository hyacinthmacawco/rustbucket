import { PlanetInterior } from "./planet-interior.js";

export class AugstakaInterior {
  constructor(parent) {
    this.environment = new PlanetInterior(parent, "augstaka");
    this.root = this.environment.root;
    this.marketplace = this.environment.marketplace;
  }
}
