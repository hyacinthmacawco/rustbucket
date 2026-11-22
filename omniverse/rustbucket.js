import * as THREE from "three";
import { dimensions } from "../storage/state.js";

export function createRustbucket(parent) {
  const ship=new THREE.Group();ship.name="Rustbucket";
  ship.position.set(...dimensions.rustbucket.position);
  ship.scale.set(...dimensions.rustbucket.scale);
  parent.add(ship);
  const hull=new THREE.MeshStandardMaterial({color:0xd8d0ad,roughness:.72,side:THREE.DoubleSide});
  const inner=new THREE.MeshStandardMaterial({color:0x55534a,roughness:.9});
  const orange=new THREE.MeshStandardMaterial({color:0xb95f37,roughness:.68});
  const metal=new THREE.MeshStandardMaterial({color:0x424b50,metalness:.45,roughness:.5});
  function mesh(g,m,p,r=[0,0,0]){const o=new THREE.Mesh(g,m);o.position.set(...p);o.rotation.set(...r);o.castShadow=true;o.receiveShadow=true;o.userData.noPhysics=true;ship.add(o);return o;}

  // Hollow fuselage: the aft end is left open for the cargo ramp.
  function createFuselageGeometry(){
    const axial=32,radial=64,length=10.5,positions=[],indices=[];
    for(let j=0;j<=axial;j++){
      const along=j/axial,axisY=-length/2+along*length,radius=1.25+along*.3;
      for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2;positions.push(radius*Math.cos(a),axisY,radius*Math.sin(a));}
    }
    for(let j=0;j<axial;j++)for(let i=0;i<radial;i++){
      const a=j*(radial+1)+i,b=a+radial+1,c=b+1,d=a+1;
      indices.push(a,b,d,b,c,d);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    g.setIndex(indices);g.computeVertexNormals();return g;
  }
  mesh(createFuselageGeometry(),hull,[0,0,0],[Math.PI/2,0,0]);
  mesh(new THREE.BoxGeometry(2.5,.12,9.7),inner,[0,-.55,0]);
  // Nose only; no solid rear cap, so the troop/cargo bay stays accessible.
  mesh(new THREE.ConeGeometry(1.52,2.6,12),hull,[0,0,6.45],[Math.PI/2,0,0]);
  mesh(new THREE.CylinderGeometry(1.52,1.52,.22,12),orange,[0,0,5.25],[Math.PI/2,0,0]);
  for(let i=0;i<3;i++)mesh(new THREE.BoxGeometry(.42,.62,.08),metal,[-.48+i*.48,.7,3.5-i*.32],[-.12,0,0]);
  for(const side of [-1,1]){
    mesh(new THREE.BoxGeometry(6.2,.16,2.1),hull,[side*3.8,-.08,-1.15],[0,0,side*.035]);
    mesh(new THREE.BoxGeometry(.72,.19,2),orange,[side*7.15,-.08,-1.15],[0,0,side*.035]);
  }

  // Hinged rear loading ramp: closed vertically, lowered onto the ground when open.
  const rampPivot=new THREE.Group();rampPivot.position.set(0,-.45,-5.0);ship.add(rampPivot);
  const ramp=new THREE.Mesh(new THREE.BoxGeometry(2.55,3.0,.16),metal);
  ramp.position.set(0,-1.5,0);ramp.castShadow=true;ramp.userData.noPhysics=true;rampPivot.add(ramp);
  const rampStripe=new THREE.Mesh(new THREE.BoxGeometry(2.4,.12,.18),orange);
  rampStripe.position.set(0,-.3,0);rampStripe.userData.noPhysics=true;rampPivot.add(rampStripe);
  let rampOpen=false;
  function setRamp(open){
    rampOpen=Boolean(open);
    rampPivot.rotation.x=rampOpen?Math.PI/2:0;
    rampPivot.position.z=rampOpen?-5.0:-5.0;
    ship.userData.rampOpen=rampOpen;
  }
  ship.userData.toggleRamp=()=>setRamp(!rampOpen);
  ship.userData.setRamp=setRamp;
  ship.userData.getRampOpen=()=>rampOpen;

  const laserMaterial=new THREE.MeshBasicMaterial({color:0x7dffbd});
  const lasers=[];let lastShot=-1;
  ship.userData.performAttack=()=>{
    const now=performance.now();if(now-lastShot<260)return;lastShot=now;
    for(const x of [-.62,.62]){
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,6.5,10),laserMaterial);
      beam.rotation.x=Math.PI/2;beam.position.set(x*1.15,.16,7.55);ship.add(beam);lasers.push({mesh:beam,life:.55});
    }
  };
  ship.userData.updateVehicle=delta=>{
    for(let i=lasers.length-1;i>=0;i--){
      const shot=lasers[i];shot.mesh.position.z+=46*delta;shot.life-=delta;
      if(shot.life<=0){ship.remove(shot.mesh);shot.mesh.geometry.dispose();lasers.splice(i,1);}
    }
  };
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(7.2,32),new THREE.MeshBasicMaterial({color:0x080a0e,transparent:true,opacity:.25,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.025,0);shadow.scale.set(1.25,.62,1);shadow.userData.noPhysics=true;parent.add(shadow);
  return {ship,shadow};
}