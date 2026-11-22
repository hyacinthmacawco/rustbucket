import { createPlanetInterior } from "./planet-interior.js";

export class GalvanPrimeInterior {
  constructor(parent) {
    this.environment = createPlanetInterior(parent, "galvan");
    this.root = this.environment.root;
    this.marketplace = this.environment.marketplace;
  }
}
