import * as THREE from "three";
import { Starfield } from "./Starfield.js";
import { IncurseanShip } from "../resources/IncurseanShip.js";
import { Incursia } from "./Incursia.js";

export class IncursiaSystem {
  constructor() {
    this.songs = ["./files/songs/baird-ten.m4a","./files/songs/daydreams-af-lofi.m4a"];
    this.root = new THREE.Group();
    this.root.name = "IncursiaSystem";
    this.root.add(new THREE.AmbientLight(0x8794a8, 0.8));
    this.star = new THREE.Mesh(
      new THREE.SphereGeometry(13000, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xffc17b })
    );
    this.star.name = "IncursiaStar";
    this.root.add(this.star);
    this.starGlow = new THREE.Mesh(
      new THREE.SphereGeometry(19500, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0xffc17b, transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false })
    );
    this.root.add(this.starGlow);
    this.starlight = new THREE.PointLight(0xffc17b, 1800000000, 520000, 1.8);
    this.root.add(this.starlight);
    this.stars = new Starfield("IncursiaStarfield");
    this.root.add(this.stars.model());
    this.ships = [];
    for (let index = 0; index < 3; index++) {
      const visual = new IncurseanShip(this.root, { scale: 3 });
      const group = visual.group;
      group.name = "incursiaPatrolShip" + index;
      const orbit = 1650 + index * 260;
      const angle = (index / 3) * Math.PI * 2;
      group.position.set(274300 + Math.cos(angle) * orbit, 180 + index * 110, Math.sin(angle) * orbit);
      const ship = { group, homePlanet: "incursia", relationships: Incursia.relationships, damage: 5, health: 50, destroyed: false, takeDamage: amount => { ship.health = Math.max(0, ship.health - Math.max(0, amount)); if (ship.health === 0 && !ship.destroyed) { ship.destroyed = true; group.visible = false; for (const name of ["Ben", "Gwen", "Kevin", "Rook"]) ship.relationships[name] = Math.max(-100, Number(ship.relationships[name] ?? 0) - 0.5); try { const key = "rustbucket.planet." + ship.homePlanet; const saved = JSON.parse(localStorage.getItem(key) || "null") || {}; saved.relationships = { ...(saved.relationships || {}), ...ship.relationships }; localStorage.setItem(key, JSON.stringify(saved)); } catch (error) {} } return ship.health; }, attack: target => {
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

  model() {
    return this.root;
  }

}
