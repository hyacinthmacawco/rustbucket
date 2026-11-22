import * as THREE from "three";
import { toon, box, sphere, cylinder, part, finishModel } from "./model-utils.js";

export function createHighbreedShip(parent = null, options = {}) {
  const g=new THREE.Group();
  const black=toon(0x101116), charcoal=toon(0x34363a), silver=toon(0xc4c5bd), shade=toon(0x777b7a), red=toon(0xe31d20);
  // Black stealth wings with silver spherical engine nacelles and red ports.
  box(g,black,[1.25,.22,8.2],[0,0,0],[0,0,0]);
  for(const side of [-1,1]) {
    const wing=part(g,new THREE.ConeGeometry(1,1,4),black,[side*2.25,.02,-.15],[0,0,Math.PI/2],[2.4,.18,4.3]);
    wing.rotation.y=side*.03;
    box(g,charcoal,[.12,.08,6.9],[side*2.2,.15,-.1],[0,0,side*.015]);
    // Engine ball and ring.
    sphere(g,silver,.76,[side*2.15,-.04,2.25],[1,.86,1]);
    sphere(g,shade,.42,[side*2.15,-.05,2.86],[1,.85,.55]);
    cylinder(g,black,.82,.72,.32,[side*2.15,-.04,2.22],[Math.PI/2,0,0],20);
    for(let k=0;k<4;k++){
      const angle=k*Math.PI/2;
      const pod=part(g,new THREE.CapsuleGeometry(.16,.72,3,8),charcoal,[side*2.15+Math.cos(angle)*.83,-.1,2.25+Math.sin(angle)*.83],[Math.PI/2,0,angle]);
    }
    sphere(g,red,.085,[side*2.15,-.02,3.48],[1,1,.55],false);
  }
  // Central spine and forward-pointing nose.
  box(g,charcoal,[.7,.18,6.2],[0,.18,-.15]);
  part(g,new THREE.ConeGeometry(.48,2.4,5),black,[0,.1,-3.6],[Math.PI/2,0,0]);
  box(g,black,[.62,.24,2.2],[0,.04,3.5]);
  for(const side of [-1,1]) box(g,black,[.42,.16,3.4],[side*.72,.04,-1.8],[0,0,side*.12]);
  return finishModel(g,"HighbreedShip",parent,options.scale ?? 1);
}
