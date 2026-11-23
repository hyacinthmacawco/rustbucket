import { CelestialPlanet } from "./CelestialPlanet.js";

export class Augstaka extends CelestialPlanet {
  static WORLD = {
    key: "augstaka",
    name: "Augstaka",
    species: "Highbreed",
    sky: 0x9fcfbd,
    ground: 0x527b54,
    accent: 0xb8d69a,
    secondary: 0x7b9f78,
    emissive: 0x172b1b
  };

  constructor(parent) {
    super(parent, Augstaka.WORLD, "augstaka");
  }
}
