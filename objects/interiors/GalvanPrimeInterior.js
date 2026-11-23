import { PlanetInterior } from "./PlanetInterior.js";

export class GalvanPrimeInterior {
  constructor(parent) {
    this.environment = new PlanetInterior(parent, "galvan");
    this.root = this.environment.root;
    this.marketplace = this.environment.marketplace;
  }
}
