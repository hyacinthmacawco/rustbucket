import * as THREE from "three";
import { Model } from "../Model.js";

export class Anodite {
  static relationships = {"Ben":50,"Gwen":70,"Kevin":0,"Rook":40,"Highbreed":-10,"Incursean":-20,"Galvan":3,"Human":40};

  constructor(parent = null, options = {}) {
  const g = new THREE.Group();
  const purple=Model.toon(0x873bd0), lilac=Model.toon(0xc17bf0), deep=Model.toon(0x271044), black=Model.toon(0x090812);
  const white=Model.toon(0xf7f1ff), pink=Model.toon(0xff78c9), glow=Model.toon(0xb64cff,{emissive:0x542080});
  // Slim energy-being silhouette with a dark central body and purple limbs.
  Model.sphere(g,black,.31,[0,2.35,0],[.78,1.15,.55]);
  Model.sphere(g,purple,.37,[0,2.82,0],[.9,1.05,.78]);
  Model.sphere(g,deep,.22,[0,2.83,.31],[.92,1.05,.25]);
  // Face mask and eyes.
  Model.sphere(g,black,.14,[-.12,2.88,.48],[.72,.85,.25]);
  for(const side of [-1,1]) {
    Model.part(g,new THREE.ConeGeometry(.095,.18,3),white,[side*.15,2.88,.54],[0,0,side*.5]);
    Model.sphere(g,deep,.055,[side*.15,2.72,.55],[1,.45,.3]);
  }
  Model.capsule(g,purple,.105,.52,[-.42,1.9,0],[0,0,-.12]);
  Model.capsule(g,purple,.105,.52,[.42,1.9,0],[0,0,.12]);
  Model.sphere(g,lilac,.12,[-.48,1.56,.02]);
  Model.sphere(g,lilac,.12,[.48,1.56,.02]);
  Model.capsule(g,black,.12,.58,[-.14,1.25,0],[0,0,-.03]);
  Model.capsule(g,black,.12,.58,[.14,1.25,0],[0,0,.03]);
  Model.capsule(g,purple,.095,.5,[-.14,.72,0]);
  Model.capsule(g,purple,.095,.5,[.14,.72,0]);
  Model.sphere(g,deep,.11,[-.14,.39,.02],[.8,.5,1.4]);
  Model.sphere(g,deep,.11,[.14,.39,.02],[.8,.5,1.4]);
  // Long flowing white hair, outlined in pink, built from curved ribbon-like tubes.
  const strands=[
    [[-.18,3.05,-.12],[-.55,3.2,-.2],[-.8,2.75,-.24],[-.72,2.15,-.2],[-.3,1.9,-.15]],
    [[.12,3.08,-.12],[.55,3.28,-.2],[.88,2.8,-.22],[.95,2.15,-.2],[.56,1.75,-.15]],
    [[.12,2.98,-.12],[.48,2.7,-.3],[.7,2.15,-.32],[.35,1.72,-.24],[-.18,1.45,-.2]],
    [[-.12,3.02,-.12],[-.48,2.6,-.28],[-.6,2.1,-.3],[-.3,1.65,-.25],[.15,1.48,-.2]]
  ];
  for(const points of strands) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const outer=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.105,8,false),pink); outer.castShadow=true; g.add(outer);
    const inner=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.075,8,false),white); inner.position.z=.015; g.add(inner);
  }
  // A luminous aura edge around the shoulders and hips.
  for(const side of [-1,1]) {
    Model.sphere(g,glow,.045,[side*.48,1.9,.1],[1,2.5,1]);
    Model.sphere(g,lilac,.035,[side*.15,.98,.13],[1,3,1]);
  }
  this.group = Model.finishModel(g,"Anodite",parent,options.scale ?? 1);
  this.model = this.group;
  }
}