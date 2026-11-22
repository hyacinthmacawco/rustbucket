import * as THREE from "three";
export class Rustbucket {
  constructor(parent) {
  const ship=new THREE.Group();ship.name="Rustbucket";
  ship.position.set(0, 2, 0);
  ship.scale.set(2, 2, 2);
  parent.add(ship);
  const hull=new THREE.MeshStandardMaterial({color:0xd8d0ad,roughness:.72,side:THREE.DoubleSide});
  const inner=new THREE.MeshStandardMaterial({color:0x55534a,roughness:.9});
  const orange=new THREE.MeshStandardMaterial({color:0xb95f37,roughness:.68});
  const metal=new THREE.MeshStandardMaterial({color:0x424b50,metalness:.45,roughness:.5});
  function mesh(g,m,p,r=[0,0,0]){const o=new THREE.Mesh(g,m);o.position.set(...p);o.rotation.set(...r);o.castShadow=true;o.receiveShadow=true;o.userData.noPhysics=true;ship.add(o);return o;}

  // Open-top cuboid fuselage. Flat walls and floor form a rectangular cabin;
  // the rear remains open for the loading ramp.
  mesh(new THREE.BoxGeometry(.16,2.5,10.5),hull,[-1.35,0,0]);
  mesh(new THREE.BoxGeometry(.16,2.5,10.5),hull,[1.35,0,0]);
  mesh(new THREE.BoxGeometry(2.7,.14,9.7),inner,[0,-1.18,0]);
  mesh(new THREE.BoxGeometry(.22,.16,10.5),hull,[-1.22,1.22,0]);
  mesh(new THREE.BoxGeometry(.22,.16,10.5),hull,[1.22,1.22,0]);
  mesh(new THREE.BoxGeometry(2.7,2.5,.16),hull,[0,0,-5.18]);
  // Nose only; no solid rear cap, so the troop/cargo bay stays accessible.
  mesh(new THREE.ConeGeometry(1.52,2.6,12),hull,[0,0,6.45],[Math.PI/2,0,0]);
  mesh(new THREE.BoxGeometry(2.78,.18,.24),orange,[0,0,5.12]);
  for(let i=0;i<3;i++)mesh(new THREE.BoxGeometry(.42,.62,.08),metal,[-.48+i*.48,.7,3.5-i*.32],[-.12,0,0]);
  for(const side of [-1,1]){
    mesh(new THREE.BoxGeometry(6.2,.16,2.1),hull,[side*3.8,-.08,-1.15],[0,0,side*.035]);
    mesh(new THREE.BoxGeometry(.72,.19,2),orange,[side*7.15,-.08,-1.15],[0,0,side*.035]);
  }

  // Hinged rear loading ramp: closed vertically, lowered onto the ground when open.
  const rampPivot=new THREE.Group();rampPivot.position.set(0,-1.25,-5.0);ship.add(rampPivot);
  const ramp=new THREE.Mesh(new THREE.BoxGeometry(2.55,3.0,.16),metal);
  ramp.position.set(0,1.25,0);ramp.castShadow=true;ramp.userData.noPhysics=true;rampPivot.add(ramp);
  const rampStripe=new THREE.Mesh(new THREE.BoxGeometry(2.4,.12,.18),orange);
  rampStripe.position.set(0,2.1,0);rampStripe.userData.noPhysics=true;rampPivot.add(rampStripe);
  let rampOpen=false;
  function setRamp(open){
    rampOpen=Boolean(open);
    rampPivot.rotation.x=rampOpen?-Math.PI/2:0;
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
      const shot=lasers[i];shot.previousWorldPosition = shot.previousWorldPosition || new THREE.Vector3();shot.mesh.getWorldPosition(shot.previousWorldPosition);shot.mesh.position.z+=60000*delta;shot.life-=delta;
      if(shot.life<=0){ship.remove(shot.mesh);shot.mesh.geometry.dispose();lasers.splice(i,1);}
    }
  };
  ship.userData.getLasers=()=>lasers;
  ship.userData.removeLaser=shot=>{
    const index=lasers.indexOf(shot);
    if(index<0)return;
    ship.remove(shot.mesh);shot.mesh.geometry.dispose();lasers.splice(index,1);
  };
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(7.2,32),new THREE.MeshBasicMaterial({color:0x080a0e,transparent:true,opacity:.25,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.025,0);shadow.scale.set(1.25,.62,1);shadow.userData.noPhysics=true;parent.add(shadow);
  Object.assign(this, { ship, shadow });
  }
}