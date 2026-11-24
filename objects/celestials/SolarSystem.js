import * as THREE from "three";
import { Starfield } from "./Starfield.js";

export class SolarSystem {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = "SolarSystem";
    this.root.add(new THREE.AmbientLight(0x52617f, 0.45));

    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.sun = new THREE.Mesh(new THREE.SphereGeometry(13000, 64, 48), sunMaterial);
    this.sun.name = "Sun";
    this.sun.position.set(-274300, 0, 0);
    this.root.add(this.sun);
    new THREE.TextureLoader().load("./files/textures/sun.jpg", texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      sunMaterial.map = texture;
      sunMaterial.needsUpdate = true;
    });

    this.sunAura = new THREE.Mesh(
      new THREE.SphereGeometry(13780, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.11, side: THREE.BackSide, depthWrite: false })
    );
    this.sunAura.position.copy(this.sun.position);
    this.root.add(this.sunAura);
    this.sunOuterGlow = new THREE.Mesh(
      new THREE.SphereGeometry(15860, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xff671f, transparent: true, opacity: 0.05, side: THREE.BackSide, depthWrite: false })
    );
    this.sunOuterGlow.position.copy(this.sun.position);
    this.root.add(this.sunOuterGlow);
    this.sunlight = new THREE.PointLight(0xffb65c, 1800000000, 800000, 1.5);
    this.sunlight.position.copy(this.sun.position);
    this.root.add(this.sunlight);
    this.stars = new Starfield();
    this.root.add(this.stars.model());
    this.ships = [];
    for (let index = 0; index < 3; index++) {
      const group = new THREE.Group();
      group.name = "earthPatrolShip" + index;
      const hull = new THREE.Mesh(new THREE.ConeGeometry(1.4, 5, 5), new THREE.MeshStandardMaterial({ color: 0x657b8d, metalness: 0.55, roughness: 0.4 }));
      hull.rotation.x = Math.PI / 2;
      group.add(hull);
      group.position.set(24000 + index * 9000, 6000 + index * 1800, -18000 - index * 5000);
      this.root.add(group);
      const ship = { group, homePlanet: "earth", relationships: {"Human":-36,"Anodite":40,"Galvan":56,"Highbreed":-56,"Incursean":-36}, damage: 5, attack: target => {
        const species = target?.species || target?.constructor?.name;
        if (!target || target.health <= 0 || Number(ship.relationships[species] ?? 0) >= 0) return false;
        const start = group.getWorldPosition(new THREE.Vector3());
        const end = target.group?.getWorldPosition(new THREE.Vector3()) || target.getWorldPosition?.(new THREE.Vector3());
        if (end) {
          const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, start.distanceTo(end), 6), new THREE.MeshBasicMaterial({ color: 0x55ffb0 }));
          beam.position.copy(start).add(end).multiplyScalar(0.5);
          beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
          this.root.add(beam);
          setTimeout(() => { beam.remove(); beam.geometry.dispose(); beam.material.dispose(); }, 180);
        }
        target.takeDamage?.(5);
        return true;
      } };
      this.ships.push(ship);
    }
    this.root.traverse(object => { object.userData.noPhysics = true; });
  }
  animate(delta, elapsed) {
    for (const planet of this.root.parent?.children || []) {
      if (planet.name === "EarthExterior" || planet.name === "MoonExterior") {
        planet.rotation.y += delta * 0.04;
      }
    }

    this.sunAura.material.opacity = 0.11 + Math.sin(elapsed * 0.7) * 0.025;
    this.sunOuterGlow.material.opacity = 0.05 + Math.sin(elapsed * 0.45) * 0.012;
    this.stars.dome.rotation.y += delta * 0.0008;
  }

  model() {
    return this.root;
  }

}
