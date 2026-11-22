import { PlanetInterior } from "./planet-interior.js";

export class IncursiaInterior {
  constructor(parent) {
    this.environment = new PlanetInterior(parent, "incursia");
    this.root = this.environment.root;
    this.marketplace = this.environment.marketplace;
  }
}
