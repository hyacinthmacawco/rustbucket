import * as THREE from "three";
import { dimensions } from "../storage/state.js";
export function createRustbucket(parent) {
  const ship=new THREE.Group();ship.name="Rustbucket";
  ship.position.set(...dimensions.rustbucket.position);ship.scale.set(...dimensions.rustbucket.scale);parent.add(ship);
  const hull=new THREE.MeshStandardMaterial({color:0xd8d0ad,roughness:.72,side:THREE.DoubleSide});
  const inner=new THREE.MeshStandardMaterial({color:0x55534a,roughness:.9});
  const orange=new THREE.MeshStandardMaterial({color:0xb95f37,roughness:.68});
  const metal=new THREE.MeshStandardMaterial({color:0x424b50,metalness:.45,roughness:.5});
  function mesh(g,m,p,r=[0,0,0]){const o=new THREE.Mesh(g,m);o.position.set(...p);o.rotation.set(...r);o.castShadow=true;o.receiveShadow=true;o.userData.noPhysics=true;ship.add(o);return o;}
  // Open-ended fuselage shell: visibly hollow, with an interior floor.
  mesh(new THREE.CylinderGeometry(1.55,1.25,10.5,12,1,true,0.55,Math.PI*2-1.1),hull,[0,0,0],[Math.PI/2,0,0]);
  mesh(new THREE.CylinderGeometry(1.22,1.22,.16,12),inner,[0,-.48,-.2],[Math.PI/2,0,0]);
  mesh(new THREE.CylinderGeometry(1.56,1.56,.16,12),orange,[0,0,-5.1],[Math.PI/2,0,0]);
  mesh(new THREE.ConeGeometry(1.52,2.6,12),hull,[0,0,6.45],[Math.PI/2,0,0]);
  mesh(new THREE.CylinderGeometry(1.52,1.52,.22,12),orange,[0,0,5.25],[Math.PI/2,0,0]);
  for(let i=0;i<3;i++)mesh(new THREE.BoxGeometry(.42,.62,.08),metal,[-.48+i*.48,.7,3.5-i*.32],[-.12,0,0]);
  // Boarding steps beside the nose cone.
  for(let i=0;i<5;i++)mesh(new THREE.BoxGeometry(1.05,.18,.48),i===4?orange:metal,[2.05,-1.75+i*.34,3.45-i*.48]);
  mesh(new THREE.BoxGeometry(.12,1.6,2.45),metal,[2.58,-.95,2.45]);
  mesh(new THREE.BoxGeometry(.12,1.6,2.45),metal,[1.53,-.95,2.45]);
  for(const x of [-.9,.9]){
    mesh(new THREE.BoxGeometry(.16,.22,4.2),metal,[x,-1.45,-.1]);
    mesh(new THREE.BoxGeometry(.14,1.05,.16),metal,[x,-.9,1.1]);
    mesh(new THREE.BoxGeometry(.14,1.05,.16),metal,[x,-.9,-1.5]);
  }
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(7.2,32),new THREE.MeshBasicMaterial({color:0x080a0e,transparent:true,opacity:.25,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.025,0);shadow.scale.set(1.25,.62,1);shadow.userData.noPhysics=true;parent.add(shadow);
  return {ship,shadow};
}