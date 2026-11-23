import { CelestialPlanet } from "./CelestialPlanet.js";

export class GalvanPrime extends CelestialPlanet {
  static WORLD = {
    key: "galvan",
    name: "Galvan Prime",
    species: "Galvan",
    sky: 0x496d68,
    ground: 0x263e38,
    accent: 0x77d6a2,
    secondary: 0x4c9b78,
    emissive: 0x123d2b
  };

  constructor(parent) {
    super(parent, GalvanPrime.WORLD, "galvan");
  }
}
