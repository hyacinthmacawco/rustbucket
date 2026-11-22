import * as THREE from "three";
export function createMoonInterior(parent) {
  parent.name="MoonSurface";
  parent.add(new THREE.AmbientLight(0x77809a,.35));
  const light=new THREE.DirectionalLight(0xe7e3d8,2.2);light.position.set(-30,50,25);parent.add(light);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(520,520),new THREE.MeshStandardMaterial({color:0x777a80,roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-.5;parent.add(ground);
  for(let i=0;i<26;i++){
    const radius=1.2+(i%5)*.75;
    const crater=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius*1.35,.22,16,1,true),new THREE.MeshStandardMaterial({color:0x555960,roughness:1,side:THREE.DoubleSide}));
    crater.rotation.x=0;crater.position.set(Math.sin(i*12.31)*(18+i%4*8),-.36,Math.cos(i*7.17)*(20+i%5*7));parent.add(crater);
  }
  return {ground};
}
export class MoonInterior {
  constructor(...args) {
    Object.assign(this, createMoonInterior(...args));
  }
}
