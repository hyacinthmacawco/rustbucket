import * as THREE from "three";

const WORLDS = {
  augstaka:{name:"Augstaka",species:"Highbreed",sky:0x9fcfbd,ground:0x527b54,accent:0xb8d69a,resource:"BIOLOGICAL"},
  anodyne:{name:"Anodyne",species:"Anodite",sky:0x542b45,ground:0x321d35,accent:0xf08c55,resource:"MANA"},
  galvan:{name:"Galvan Prime",species:"Galvan",sky:0x8fc9bb,ground:0x456f43,accent:0x65d8c0,resource:"TECHNOLOGY"},
  incursia:{name:"Incursia",species:"Incursean",sky:0xe3a58d,ground:0x9b6252,accent:0x25202a,resource:"MILITARY"}
};

function signTexture(title, subtitle, color) {
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=160;
  const c=canvas.getContext("2d");c.fillStyle="#07150d";c.fillRect(0,0,512,160);
  c.strokeStyle=color;c.lineWidth=8;c.strokeRect(8,8,496,144);
  c.textAlign="center";c.fillStyle="#eaffef";c.font="bold 42px Arial";c.fillText(title.toUpperCase(),256,68);
  c.fillStyle=color;c.font="bold 21px Arial";c.fillText(subtitle.toUpperCase(),256,112);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export class PlanetInterior {
  constructor(parent, key) {
  const world=WORLDS[key];if(!world)throw new Error("Unknown planet: "+key);
  const root=new THREE.Group();root.name=world.name+"Interior";parent.add(root);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(420,420),new THREE.MeshStandardMaterial({color:world.ground,roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-.6;ground.receiveShadow=true;ground.userData.noPhysics=true;root.add(ground);
  root.add(new THREE.HemisphereLight(world.sky,world.ground,1.8));
  const sun=new THREE.DirectionalLight(0xffe0c0,2.1);sun.position.set(-35,70,25);root.add(sun);
  const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
  const accent=mat(world.accent,.45), dark=mat(0x17231c), wall=mat(world.accent,.72);
  // Distant terrain silhouettes establish a distinct alien horizon.
  for(let i=0;i<28;i++){
    const a=i*Math.PI*2/28,r=105+(i%4)*12,h=12+(i%7)*7;
    const hill=new THREE.Mesh(new THREE.ConeGeometry(12+(i%5)*3,h,7),mat(i%2?world.ground:world.accent));
    hill.position.set(Math.cos(a)*r,h/2-1,Math.sin(a)*r);root.add(hill);
  }
  // The marketplace is a prominent, walk-up building at the end of the landing avenue.
  const market=new THREE.Group();market.name="Marketplace";market.position.set(0,0,-24);root.add(market);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(10,12,1.2,8),dark);base.position.y=.1;market.add(base);
  const hall=new THREE.Mesh(new THREE.CylinderGeometry(8.5,9.5,7,8),wall);hall.position.y=4;hall.scale.z=.82;market.add(hall);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(10,4,8),accent);roof.position.y=9.5;roof.scale.z=.85;market.add(roof);
  const entrance=new THREE.Mesh(new THREE.BoxGeometry(3.2,4.8,.35),dark);entrance.position.set(0,2.5,7.45);market.add(entrance);
  for(let i=0;i<6;i++){
    const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.28,.38,6,8),accent);pillar.position.set(Math.cos(i*Math.PI/3)*7,3.3,Math.sin(i*Math.PI/3)*6);market.add(pillar);
  }
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(9,2.8),new THREE.MeshBasicMaterial({map:signTexture("Marketplace",world.species+" Trade Exchange",world.accent),side:THREE.DoubleSide}));
  sign.position.set(0,8,8.1);market.add(sign);
  const beacon=new THREE.PointLight(world.accent,90,38);beacon.position.set(0,7,0);market.add(beacon);
  // Landing markers and a broad path lead from the ship to the market.
  const path=new THREE.Mesh(new THREE.PlaneGeometry(9,36),new THREE.MeshBasicMaterial({color:world.accent,transparent:true,opacity:.16}));
  path.rotation.x=-Math.PI/2;path.position.set(0,-.48,-10);root.add(path);
  for(let i=0;i<8;i++){
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.35,12,8),new THREE.MeshBasicMaterial({color:world.accent}));
    lamp.position.set(i%2?5:-5,1,-i*5);root.add(lamp);
  }
  return {root,marketplace:market,marketPosition:new THREE.Vector3(0,0,-24),world};
}

export const PLANET_WORLDS=WORLDS;
