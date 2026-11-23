import * as THREE from "three";
import { Model } from "../Model.js";

export class GalvanShip {
  constructor(parent = null, options = {}) {
  const g=new THREE.Group();
  const green=Model.toon(0x168e20), light=Model.toon(0x43d83b), dark=Model.toon(0x075014), glass=Model.toon(0x063b21,{emissive:0x06240e}), lime=Model.toon(0x60ff2d);
  // Compact, organic flying saucer with twin raised engine pods.
  Model.sphere(g,green,1.55,[0,0,0],[1.6,.38,1.12]);
  Model.sphere(g,dark,1.12,[0,-.12,0],[1.55,.25,1.08]);
  Model.sphere(g,light,.82,[0,.28,.12],[1.12,.28,.82]);
  Model.sphere(g,glass,.58,[0,.55,.2],[.92,.32,.74]);
  for(const side of [-1,1]) {
    const podGroup=new THREE.Group();podGroup.position.set(side*2.05,.42,-.05);g.add(podGroup);
    Model.sphere(podGroup,green,.68,[0,0,0],[.78,.52,1.18]);
    Model.sphere(podGroup,lime,.34,[0,.22,.05],[1,.55,1.05]);
    Model.box(podGroup,dark,[.2,.1,.85],[0,-.4,0]);
    for(let i=0;i<3;i++) Model.box(podGroup,light,[.09,.06,.35],[0,-.43,-.25+i*.24]);
  }
  // Forward landing lip and underside sensor.
  Model.sphere(g,light,.42,[0,-.08,1.45],[1.3,.32,.5]);
  Model.sphere(g,dark,.2,[0,-.35,1.52],[1,.6,.8]);
  for(let i=-2;i<=2;i++) Model.sphere(g,lime,.055,[i*.28,-.02,1.83],[1,.7,.6],false);
  this.group = Model.finishModel(g,"GalvanShip",parent,options.scale ?? 1);
  this.model = this.group;
  }
}