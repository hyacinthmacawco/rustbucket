import { PlanetInterior } from "./PlanetInterior.js";

export class AnodyneInterior {
  constructor(parent) {
    this.environment = new PlanetInterior(parent, "anodyne");
    this.root = this.environment.root;
    this.marketplace = this.environment.marketplace;
  }
}
