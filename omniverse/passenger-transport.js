import * as THREE from "three";

export class PassengerTransport {
  constructor(simulation) {
    this.simulation = simulation;
    this.passengers = [];
    this.pending = null;
    this.panel = document.createElement("section");
    this.panel.id = "passenger-quest-panel";
    this.panel.style.cssText = "display:none;position:fixed;z-index:1500;left:50%;top:50%;transform:translate(-50%,-50%);width:min(360px,calc(100vw - 32px));padding:20px;background:rgba(0,0,0,.9);color:#eaffef;font:13px/1.5 Industry,Arial,sans-serif;text-align:center";
    this.panel.innerHTML = '<h2 id="passenger-quest-title">PASSENGER REQUEST</h2><p id="passenger-quest-description"></p><button id="passenger-quest-accept" type="button">ACCEPT</button><button id="passenger-quest-decline" type="button">DECLINE</button>';
    document.body.appendChild(this.panel);
    this.description = this.panel.querySelector("#passenger-quest-description");
    this.panel.querySelectorAll("button").forEach(button => { button.style.cssText = "margin:6px;padding:10px 16px;border:0;border-radius:0;background:rgba(0,0,0,.3);color:#eaffef;font:inherit;letter-spacing:.08em"; });
    this.panel.querySelector("#passenger-quest-accept").addEventListener("click", () => this.accept());
    this.panel.querySelector("#passenger-quest-decline").addEventListener("click", () => this.decline());
    this.ship = null;
  }

  createVisual(passenger) {
    const palettes = {
      Highbreed:[0xa8c89a,0x355e45], Incursean:[0xc88b61,0x5b302b],
      Anodite:[0xd99bc9,0x502b58], Galvan:[0x8fae68,0x334b37],
      Human:[0xc58d68,0x526c86]
    };
    const colors = palettes[passenger.species] || [0xb0b0b0,0x454545];
    const group = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({color:colors[0],roughness:.8});
    const suit = new THREE.MeshStandardMaterial({color:colors[1],roughness:.75});
    const torso = new THREE.Mesh(new THREE.BoxGeometry(.65,.9,.4),suit);
    torso.position.y=.85;group.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.29,10,8),skin);
    head.position.y=1.48;group.add(head);
    for (const side of [-1,1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(.2,.62,.24),suit);
      leg.position.set(side*.16,.16,0);group.add(leg);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(.17,.7,.2),suit);
      arm.position.set(side*.42,.9,0);group.add(arm);
    }
    group.name = passenger.name + " Passenger";
    group.traverse(object => { object.userData.noPhysics = true; });
    return group;
  }

  attachShip(ship) {
    if (!ship) return;
    this.ship = ship;
    for (const visual of ship.userData.passengerVisuals || []) {
      ship.remove(visual);
      visual.traverse(object => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
        else object.material.dispose();
      });
    }
    ship.userData.passengerVisuals = [];
    const seats = [[-.42,-1.15,-1.55],[.42,-1.15,-1.55],[-.42,-1.15,-3.0],[.42,-1.15,-3.0]];
    this.passengers.slice(0,4).forEach((passenger,index) => {
      const visual = this.createVisual(passenger);
      visual.position.set(...seats[index]);
      visual.rotation.y = Math.PI;
      ship.add(visual);
      ship.userData.passengerVisuals.push(visual);
    });
  }

  bindShip(ship, inhabitants) {
    ship.userData.performPickup = () => {
      if (this.pending || this.passengers.length >= 4) return;
      let nearest = null;
      let distance = 18;
      for (const npc of inhabitants || []) {
        if (!npc.visible || !npc.userData.isVisitor || npc.userData.boarded) continue;
        const next = ship.position.distanceTo(npc.position);
        if (next < distance) { nearest = npc; distance = next; }
      }
      if (nearest) this.offer(nearest);
    };
  }

  offer(npc) {
    this.pending = npc;
    const data = npc.userData;
    this.panel.querySelector("#passenger-quest-title").textContent = data.name.toUpperCase() + " • " + data.species.toUpperCase();
    this.description.textContent = "I need a lift to my homeworld. Take me to " + data.homePlanet.toUpperCase() + " and I'll pay you 350–600 Taydenite when we arrive. Will you take me?";
    this.panel.style.display = "block";
  }

  accept() {
    if (!this.pending || this.passengers.length >= 4) return;
    const data = this.pending.userData;
    const passenger = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2,7),
      name:data.name, species:data.species, homePlanet:data.homePlanet,
      reward:350 + Math.floor(Math.random() * 251)
    };
    this.passengers.push(passenger);
    this.pending.userData.boarded = true;
    this.pending.visible = false;
    this.attachShip(this.ship);
    this.simulation.recordEvent("passenger", passenger.name + " boarded Rustbucket for a trip to " + passenger.homePlanet + ".", passenger);
    this.pending = null;
    this.panel.style.display = "none";
  }

  decline() {
    this.pending = null;
    this.panel.style.display = "none";
  }

  complete(homePlanet, ship = this.ship) {
    const delivered = this.passengers.filter(passenger => passenger.homePlanet === homePlanet);
    if (!delivered.length) return;
    for (const passenger of delivered) {
      this.simulation.data.team.cash += passenger.reward;
      this.simulation.data.transactions.unshift({
        type:"passenger-delivery",from:passenger.name,item:"Safe passage to " + homePlanet,
        quantity:1,cost:-passenger.reward,at:new Date().toISOString()
      });
      this.simulation.recordEvent("delivery", passenger.name + " reached " + homePlanet + " safely. Received " + passenger.reward + " Taydenite.", passenger);
    }
    this.passengers = this.passengers.filter(passenger => passenger.homePlanet !== homePlanet);
    this.simulation.save();
    this.attachShip(ship);
  }

  destroy() {
    this.panel.remove();
    this.pending = null;
    this.ship = null;
  }
}
