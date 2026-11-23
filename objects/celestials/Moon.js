import { CelestialPlanet } from "./CelestialPlanet.js";

export class Moon extends CelestialPlanet {
  static WORLD = {
    key: "moon",
    name: "The Moon",
    species: "Human",
    sky: 0x343943,
    ground: 0x777b82,
    accent: 0xb8c0cb,
    secondary: 0x8f969f,
    emissive: 0x171a20
  };

  constructor(parent) {
    super(parent, Moon.WORLD, "solar");
  }
}
