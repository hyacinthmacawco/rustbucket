import * as THREE from "three";
import { toon, box, sphere, cylinder, capsule, part, finishModel } from "./model-utils.js";

export function createHighbreed(parent = null, options = {}) {
  const g = new THREE.Group();
  const white = toon(0xe8f2f1), shadow = toon(0x9ba9a9), black = toon(0x111319);
  const red = toon(0xb91f26), purple = toon(0x51228e), violet = toon(0x9a48d1);
  // Tall, narrow torso and the characteristic swept-back Highbreed crest.
  sphere(g, white, .42, [0,1.72,0], [.72,1.25,.48]);
  box(g, white, [.46,.58,.32], [0,2.05,0], [0,0,0]);
  sphere(g, shadow, .3, [0,2.38,0], [.7,.42,.62]);
  sphere(g, black, .34, [0,2.67,-.02], [.9,.75,.75]);
  // Crest tendrils: long, tapered black horns curling away from the skull.
  const tendril = (a,b,r1,r2) => {
    const A=new THREE.Vector3(...a), B=new THREE.Vector3(...b), d=B.clone().sub(A);
    const m=cylinder(g,black,r2,r1,d.length(),A.clone().add(B).multiplyScalar(.5).toArray());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  };
  tendril([-.18,2.88,0],[-.62,3.32,-.02],.19,.09);
  tendril([-.62,3.32,-.02],[-.9,3.55,-.02],.09,.015);
  tendril([.16,2.9,0],[.58,3.25,-.04],.17,.075);
  tendril([.58,3.25,-.04],[.78,3.48,-.04],.075,.012);
  tendril([0,2.96,-.08],[.04,3.52,-.12],.14,.025);
  // Red angular eyes and purple crystalline dorsal marking.
  for (const side of [-1,1]) {
    part(g,new THREE.ConeGeometry(.13,.24,3),red,[side*.2,2.69,.29],[0,0,side*.55],[1,1,1]);
    capsule(g,shadow,.12,.42,[side*.48,1.7,0],[0,0,side*.12]);
    capsule(g,white,.1,.42,[side*.48,1.28,0],[0,0,side*.06]);
    sphere(g,black,.15,[side*.48,.98,.02],[.9,1.2,.8]);
    capsule(g,white,.11,.43,[side*.18,.72,0],[0,0,side*.05]);
    sphere(g,black,.13,[side*.18,.42,.03],[1.1,.8,1]);
    capsule(g,black,.1,.4,[side*.72,1.92,0],[0,0,side*.25]);
    sphere(g,black,.12,[side*.78,1.68,.02],[1.1,.8,1]);
    sphere(g,red,.055,[side*.25,1.98,.27],[.8,1.7,.5]);
  }
  sphere(g,purple,.16,[.12,2.43,-.34],[.9,1.25,.22]);
  for(let i=0;i<5;i++) sphere(g,violet,.035,[.02+i*.055,2.4+(i%2)*.1,-.39],[.7,1.8,.7]);
  // Dark claws and feet.
  for(const side of [-1,1]) {
    capsule(g,black,.075,.24,[side*.18,.18,0]);
    for(let j=-1;j<=1;j++) cylinder(g,black,.015,.045,.18,[side*.18+j*.07,.04,.1],[.25,0,0],7);
  }
  return finishModel(g,"Highbreed",parent,options.scale ?? 1);
}
