import * as THREE from "three";
import { toon, box, sphere, cylinder, part, finishModel } from "../model-utils.js";

export function createIncurseanShip(parent = null, options = {}) {
  const g=new THREE.Group();
  const olive=toon(0x477d19), gold=toon(0xb5a51a), dark=toon(0x203c18), purple=toon(0x7626a6), pink=toon(0xff3bd0), glass=toon(0x3c1768,{emissive:0x210a3a});
  // Flattened green/gold hull with pointed swept wings.
  sphere(g,olive,1.45,[0,0,0],[1.9,.42,1.05]);
  part(g,new THREE.ConeGeometry(1.15,2.8,8),gold,[0,.02,1.35],[Math.PI/2,0,0],[1,.45,1]);
  for(const side of [-1,1]) {
    part(g,new THREE.ConeGeometry(.9,4.3,5),gold,[side*2.2,-.04,-.2],[0,0,side*.12],[1,.22,1]);
    box(g,dark,[.18,.12,2.7],[side*2.1,-.25,-.15],[0,0,side*.1]);
    sphere(g,olive,.72,[side*2.35,.28,-.55],[.8,.65,1.15]);
    sphere(g,purple,.5,[side*2.35,.72,-.55],[1,.68,1]);
    sphere(g,pink,.24,[side*2.35,1.05,-.55],[1,.35,1]);
    // Magenta underside weapon tips.
    part(g,new THREE.ConeGeometry(.15,.6,6),pink,[side*3.9,-.02,1.05],[Math.PI/2,0,side*.1]);
  }
  sphere(g,purple,.64,[0,.54,.2],[1.05,.62,1.1]);
  sphere(g,glass,.48,[0,.85,.28],[1,.38,.9]);
  cylinder(g,gold,.14,.18,1.8,[0,-.08,-1.55],[Math.PI/2,0,0],10);
  for(let i=-3;i<=3;i++) box(g,pink,[.12,.06,.48],[i*.24,-.28,-.05],[0,0,0],false);
  return finishModel(g,"IncurseanShip",parent,options.scale ?? 1);
}
