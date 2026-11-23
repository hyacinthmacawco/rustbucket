import * as THREE from "three";

export class ChromastoneTransformation {
  constructor() {
  const root=new THREE.Group();root.name="Chromastone";
  const dark=new THREE.MeshStandardMaterial({color:0x171526,roughness:.35,metalness:.35});
  const crystal=new THREE.MeshStandardMaterial({color:0x5d42c5,roughness:.2,metalness:.55,emissive:0x26105e,emissiveIntensity:.35});
  const pale=new THREE.MeshStandardMaterial({color:0xd6d2ff,roughness:.3,metalness:.2});
  const add=(geometry,material,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);root.add(m);return m;};
  add(new THREE.CapsuleGeometry(.43,.9,5,10),dark,0,1.55,0,.9,1,.65);
  add(new THREE.SphereGeometry(.37,12,10),dark,0,2.55,0,.85,1,.8);
  add(new THREE.ConeGeometry(.22,.65,6),crystal,0,2.98,0);
  add(new THREE.BoxGeometry(.28,.28,.12),crystal,-.29,2.56,.28);
  add(new THREE.BoxGeometry(.28,.28,.12),crystal,.29,2.56,.28);
  for(const side of [-1,1]){
    add(new THREE.CapsuleGeometry(.14,.72,4,8),dark,side*.56,1.7,0,1,1,1);
    add(new THREE.CapsuleGeometry(.12,.65,4,8),dark,side*.24,.52,0,1,1,1);
    add(new THREE.ConeGeometry(.13,.35,5),crystal,side*.56,2.0,.02);
  }
  for(let i=0;i<7;i++){
    const shard=add(new THREE.OctahedronGeometry(.17,0),i%2?crystal:pale,(Math.random()-.5)*.62,1.2+Math.random()*1.5,.32+Math.random()*.1,.7,1.2,.6);
    shard.rotation.set(Math.random(),Math.random(),Math.random());
  }
  // Snapshot the original meshes before adding outlines. Traversing while
  // appending children would visit each new outline and recursively outline it.
  const outlinedMeshes=[];
  root.traverse(object=>{if(object.isMesh)outlinedMeshes.push(object);});
  for(const object of outlinedMeshes){
    const outline=new THREE.Mesh(object.geometry,new THREE.MeshBasicMaterial({color:0x050509,side:THREE.BackSide}));
    outline.scale.multiplyScalar(1.055);
    outline.userData.isOutline=true;
    object.add(outline);
  }
  root.visible=false;
  this.model = root;
  }
}
