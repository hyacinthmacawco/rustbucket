import * as THREE from "three";
import { Model } from "../Model.js";

export class Galvan {
  static relationships = {"Ben":80,"Gwen":70,"Kevin":76,"Rook":84,"Highbreed":16,"Incursean":10,"Anodite":3,"Human":56};

  constructor(parent = null, options = {}) {
  const g = new THREE.Group();
  const skin=Model.toon(0x8d9b8c), light=Model.toon(0xb8c5ae), dark=Model.toon(0x202b25);
  const green=Model.toon(0x20d51d), suit=Model.toon(0x087d2b), trim=Model.toon(0x101b18);
  // Large wedge-shaped head, tiny shoulders, and short compact limbs.
  Model.sphere(g,skin,.52,[0,2.12,0],[1.2,.86,.82]);
  Model.sphere(g,light,.36,[0,2.02,.32],[1.2,.58,.5]);
  for(const side of [-1,1]) {
    Model.sphere(g,dark,.22,[side*.3,2.17,.55],[1.25,.95,.35]);
    Model.sphere(g,green,.155,[side*.3,2.18,.72],[1.15,.86,.28]);
    Model.box(g,dark,[.16,.045,.045],[side*.3,2.18,.9]);
  }
  Model.box(g,skin,[.23,.16,.2],[0,1.7,.3]);
  Model.box(g,suit,[.48,.48,.28],[0,1.35,0]);
  Model.box(g,trim,[.32,.12,.3],[0,1.08,0]);
  Model.box(g,suit,[.22,.4,.2],[-.17,.78,0]);
  Model.box(g,suit,[.22,.4,.2],[.17,.78,0]);
  for(const side of [-1,1]) {
    Model.capsule(g,skin,.09,.32,[side*.34,1.37,0],[0,0,side*.12]);
    Model.sphere(g,skin,.12,[side*.42,1.1,.03],[1,.85,.8]);
    for(let j=-1;j<=1;j++) Model.cylinder(g,skin,.018,.028,.13,[side*.42+j*.045,1.0,.08],[.2,0,0],7);
    Model.capsule(g,suit,.085,.26,[side*.14,.45,0]);
    Model.sphere(g,dark,.1,[side*.14,.28,.05],[1,.55,1.3]);
  }
  // Small black-and-green chest panel evokes the Galvan tech uniform.
  Model.box(g,dark,[.26,.23,.04],[0,1.43,.155]);
  Model.box(g,green,[.12,.12,.025],[0,1.43,.185]);
  this.group = Model.finishModel(g,"Galvan",parent,options.scale ?? 1);
  this.model = this.group;
  }
}