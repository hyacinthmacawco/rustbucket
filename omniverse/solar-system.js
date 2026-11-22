import * as THREE from "three";
import { createSun } from "./sun.js";
import { createMoon } from "./moon.js";
import { createStarfield } from "./starfield.js";
import { dimensions } from "../storage/state.js";

export function createSolarSystem(parent) {
  parent.name="SolarSystem";
  parent.add(new THREE.AmbientLight(0x52617f,.45));
  const sun=createSun(parent);
  const moon=createMoon(parent);
  const earthMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,metalness:.05});
  const earth=new THREE.Mesh(new THREE.SphereGeometry(dimensions.earth.radius,64,48),earthMaterial);
  earth.position.set(...dimensions.earth.position);parent.add(earth);
  new THREE.TextureLoader().load("./omniverse/earth.jpg",texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;earthMaterial.map=texture;earthMaterial.needsUpdate=true;
  },undefined,error=>console.warn("Could not load Earth texture:",error));
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(dimensions.earth.radius*1.045,64,48),new THREE.MeshBasicMaterial({color:0x4b9fff,transparent:true,opacity:.12,side:THREE.BackSide,depthWrite:false}));
  atmosphere.position.copy(earth.position);parent.add(atmosphere);
  const outer=new THREE.Mesh(new THREE.SphereGeometry(dimensions.earth.radius*1.12,64,48),new THREE.MeshBasicMaterial({color:0x216eff,transparent:true,opacity:.04,side:THREE.BackSide,depthWrite:false}));
  outer.position.copy(earth.position);parent.add(outer);
  const stars=createStarfield(parent);
  parent.traverse(o=>{o.userData.noPhysics=true;});
  return {...sun,...moon,earth,stars};
}