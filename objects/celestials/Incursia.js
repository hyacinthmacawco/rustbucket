import { CelestialPlanet } from "./CelestialPlanet.js";

export class Incursia extends CelestialPlanet {
  static WORLD = {
    key: "incursia",
    name: "Incursia",
    species: "Incursean",
    sky: 0x6b4c35,
    ground: 0x3e2b21,
    accent: 0xd39b45,
    secondary: 0x8e5d36,
    emissive: 0x38200d
  };

  constructor(parent) {
    super(parent, Incursia.WORLD, "incursia");
  }
}
