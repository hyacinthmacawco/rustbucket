import { CelestialPlanet } from "./CelestialPlanet.js";

export class Anodyne extends CelestialPlanet {
  static WORLD = {
    key: "anodyne",
    name: "Anodyne",
    species: "Anodite",
    sky: 0x542b45,
    ground: 0x321d35,
    accent: 0xf08c55,
    secondary: 0xb94c68,
    emissive: 0x351021
  };

  constructor(parent) {
    super(parent, Anodyne.WORLD, "anodyne");
  }
}
