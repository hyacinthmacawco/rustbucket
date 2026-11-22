import * as THREE from "three";
import { toon, box, sphere, cylinder, part, finishModel } from "./model-utils.js";

export function createGalvanShip(parent = null, options = {}) {
  const g=new THREE.Group();
  const green=toon(0x168e20), light=toon(0x43d83b), dark=toon(0x075014), glass=toon(0x063b21,{emissive:0x06240e}), lime=toon(0x60ff2d);
  // Compact, organic flying saucer with twin raised engine pods.
  sphere(g,green,1.55,[0,0,0],[1.6,.38,1.12]);
  sphere(g,dark,1.12,[0,-.12,0],[1.55,.25,1.08]);
  sphere(g,light,.82,[0,.28,.12],[1.12,.28,.82]);
  sphere(g,glass,.58,[0,.55,.2],[.92,.32,.74]);
  for(const side of [-1,1]) {
    const podGroup=new THREE.Group();podGroup.position.set(side*2.05,.42,-.05);g.add(podGroup);
    sphere(podGroup,green,.68,[0,0,0],[.78,.52,1.18]);
    sphere(podGroup,lime,.34,[0,.22,.05],[1,.55,1.05]);
    box(podGroup,dark,[.2,.1,.85],[0,-.4,0]);
    for(let i=0;i<3;i++) box(podGroup,light,[.09,.06,.35],[0,-.43,-.25+i*.24]);
  }
  // Forward landing lip and underside sensor.
  sphere(g,light,.42,[0,-.08,1.45],[1.3,.32,.5]);
  sphere(g,dark,.2,[0,-.35,1.52],[1,.6,.8]);
  for(let i=-2;i<=2;i++) sphere(g,lime,.055,[i*.28,-.02,1.83],[1,.7,.6],false);
  return finishModel(g,"GalvanShip",parent,options.scale ?? 1);
}
