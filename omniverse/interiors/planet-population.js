import * as THREE from "three";

const HOME_PLANETS = {
  Human: "earth",
  Highbreed: "augstaka",
  Anodite: "anodyne",
  Galvan: "galvan",
  Incursean: "incursia"
};

const SPECIES_STYLE = {
  Human: { skin: 0xc58d68, suit: 0x526c86, accent: 0xd7d9de },
  Highbreed: { skin: 0xa8c89a, suit: 0x355e45, accent: 0xd7e7bc },
  Anodite: { skin: 0xd99bc9, suit: 0x502b58, accent: 0xffa8df },
  Galvan: { skin: 0x8fae68, suit: 0x334b37, accent: 0x74d9b6 },
  Incursean: { skin: 0xc88b61, suit: 0x5b302b, accent: 0xe7a04f }
};

const NAMES = {
  Human: ["Mira","Jonas","Elena","Tomas","Rhea","Cal"],
  Highbreed: ["Veyra","Ossan","Leth","Soryn","Vael","Ilyra"],
  Anodite: ["Seren","Aural","Nim","Veya","Luma","Orris"],
  Galvan: ["Azmuth","Krell","Pip","Zenn","Tork","Milo"],
  Incursean: ["Attea","Krag","Vorn","Syla","Drex","Rakk"]
};

export class PlanetPopulation {
  constructor(parent, planetKey) {
    this.planetKey = planetKey;
    this.inhabitants = [];
    const localSpecies = Object.keys(HOME_PLANETS).find(name => HOME_PLANETS[name] === planetKey) || "Human";
    const visitors = planetKey === "earth" ? [] : Object.keys(HOME_PLANETS).filter(name => name !== localSpecies);
    this.clock = 0;
    const layout = [
      [-9, 0, 7], [-5, 0, 1], [0, 0, -3], [5, 0, 1], [9, 0, 7], [-11, 0, -8],
      [-7, 0, 10], [7, 0, 10]
    ];
    for (let i = 0; i < 8; i++) {
      const isVisitor = planetKey !== "earth" && i >= 6;
      const species = isVisitor ? visitors[(i - 6 + Object.keys(HOME_PLANETS).indexOf(localSpecies)) % visitors.length] : localSpecies;
      const nameList = NAMES[species];
      const name = nameList[(i + Object.keys(HOME_PLANETS).indexOf(localSpecies)) % nameList.length];
      const homePlanet = HOME_PLANETS[species];
      const person = this.createPerson(species, name, homePlanet, isVisitor, i);
      person.position.set(...layout[i]);
      person.rotation.y = (i % 2 ? 1 : -1) * 0.35;
      person.userData.wanderTarget = new THREE.Vector3(...layout[i]);
      person.userData.wanderTimer = 1 + Math.random() * 4;
      person.userData.wanderSpeed = 0.65 + Math.random() * 0.55;
      person.userData.walkPhase = Math.random() * Math.PI * 2;
      parent.add(person);
      this.inhabitants.push(person);
    }
  }

  createPerson(species, name, homePlanet, isVisitor, index) {
    const style = SPECIES_STYLE[species];
    const group = new THREE.Group();
    group.name = name + " (" + species + ")";
    const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.82 });
    const skin = material(style.skin);
    const suit = material(style.suit);
    const accent = material(style.accent);
    const add = (geometry, mat, position) => {
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.userData.noPhysics = true;
      group.add(mesh);
      return mesh;
    };
    add(new THREE.BoxGeometry(0.78, 1.0, 0.42), suit, [0, 1.15, 0]);
    add(new THREE.SphereGeometry(0.38, 12, 10), skin, [0, 1.92, 0]);
    add(new THREE.BoxGeometry(0.86, 0.14, 0.48), accent, [0, 1.48, 0]);
    const arms = [];
    const legs = [];
    for (const side of [-1, 1]) {
      arms.push(add(new THREE.BoxGeometry(0.2, 0.86, 0.22), suit, [side * 0.52, 1.2, 0]));
      legs.push(add(new THREE.BoxGeometry(0.25, 0.8, 0.28), suit, [side * 0.2, 0.42, 0]));
      add(new THREE.SphereGeometry(0.12, 8, 6), accent, [side * 0.13, 1.96, 0.31]);
    }
    if (species === "Anodite") {
      const aura = new THREE.Mesh(new THREE.SphereGeometry(1.28, 12, 10), new THREE.MeshBasicMaterial({ color: style.accent, transparent: true, opacity: 0.09, side: THREE.BackSide, depthWrite: false }));
      aura.position.y = 1.05;
      group.add(aura);
    }
    group.userData = {
      species,
      name,
      homePlanet,
      isVisitor,
      boarded: false,
      questAccepted: false,
      populationIndex: index,
      walkArms: arms,
      walkLegs: legs,
      noPhysics: true
    };
    return group;
  }

  update(delta) {
    this.clock += delta;
    for (const person of this.inhabitants) {
      const data = person.userData;
      if (data.boarded) continue;
      data.wanderTimer -= delta;
      if (data.wanderTimer <= 0 || !data.wanderTarget) {
        data.wanderTarget = new THREE.Vector3((Math.random() - 0.5) * 38, 0, (Math.random() - 0.5) * 38);
        data.wanderTimer = 4 + Math.random() * 7;
      }
      const dx = data.wanderTarget.x - person.position.x;
      const dz = data.wanderTarget.z - person.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 0.45) {
        const step = Math.min(distance, data.wanderSpeed * delta);
        person.position.x += dx / distance * step;
        person.position.z += dz / distance * step;
        const desired = Math.atan2(dx, dz);
        const angle = Math.atan2(Math.sin(desired - person.rotation.y), Math.cos(desired - person.rotation.y));
        person.rotation.y += angle * Math.min(1, delta * 3.5);
        data.walkPhase += delta * 7.5;
        const swing = Math.sin(data.walkPhase) * 0.32;
        data.walkArms[0].rotation.x = swing;
        data.walkArms[1].rotation.x = -swing;
        data.walkLegs[0].rotation.x = -swing;
        data.walkLegs[1].rotation.x = swing;
      } else {
        data.walkArms[0].rotation.x = THREE.MathUtils.damp(data.walkArms[0].rotation.x, 0, 5, delta);
        data.walkArms[1].rotation.x = THREE.MathUtils.damp(data.walkArms[1].rotation.x, 0, 5, delta);
        data.walkLegs[0].rotation.x = THREE.MathUtils.damp(data.walkLegs[0].rotation.x, 0, 5, delta);
        data.walkLegs[1].rotation.x = THREE.MathUtils.damp(data.walkLegs[1].rotation.x, 0, 5, delta);
      }
    }
  }
}
