import { createPlanetInterior } from "./planet-interior.js";

export class AnodyneInterior {
  constructor(parent) {
    this.environment = createPlanetInterior(parent, "anodyne");
    this.root = this.environment.root;
    this.marketplace = this.environment.marketplace;
  }
}
