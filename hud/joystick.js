import * as THREE from "three";
export function createJoystick(){
 const element=document.createElement("div");element.id="movement-joystick";element.setAttribute("aria-label","Movement and team controls");element.innerHTML='<div id="joystick-knob"></div>';document.body.appendChild(element);
 const knob=element.firstElementChild,input={active:false,pointerId:null,x:0,y:0,mode:"move",toggleRequested:false,selection:null};
 function reset(){input.active=false;input.pointerId=null;input.x=0;input.y=0;knob.style.transform="translate(0px,0px)";}
 function update(e){const r=element.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.29,d=Math.hypot(dx,dy),f=d>max?max/d:1,x=dx*f,y=dy*f;input.x=x/max;input.y=-y/max;knob.style.transform=`translate(${x}px,${y}px)`;}
 function down(e){e.preventDefault();input.active=true;input.pointerId=e.pointerId;element.setPointerCapture(e.pointerId);update(e);}
 function move(e){if(input.active&&e.pointerId===input.pointerId){e.preventDefault();update(e);}}
 function up(e){if(e.pointerId!==input.pointerId)return;if(Math.hypot(input.x,input.y)<.22)input.toggleRequested=true;else if(input.mode==="switch")input.selection={x:input.x,y:input.y};reset();}
 element.addEventListener("pointerdown",down);element.addEventListener("pointermove",move);element.addEventListener("pointerup",up);element.addEventListener("pointercancel",up);
 return {input,element,setVisible(v){element.style.display=v?"block":"none";if(!v)reset();},destroy(){element.removeEventListener("pointerdown",down);element.removeEventListener("pointermove",move);element.removeEventListener("pointerup",up);element.removeEventListener("pointercancel",up);element.remove();}};
}
export function createKeyboard({entities,camera,joystick,updateCamera,isMobile=false,onSelect=()=>{}}){
 const keys=new Set(),names=["ben","gwen","kevin","rook","rustbucket"];let selected="ben",switchMode=false;
 function keydown(e){const k=e.key.toLowerCase();if(k==="f"){switchMode=!switchMode;keys.clear();e.preventDefault();return;}if(["w","a","s","d"].includes(k)){keys.add(k);e.preventDefault();}}
 function keyup(e){keys.delete(e.key.toLowerCase());}function blur(){keys.clear();}
 window.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);window.addEventListener("blur",blur);
 function choose(x,y){const options=names.filter(n=>n!==selected),index=Math.abs(x)>Math.abs(y)?(x>0?1:3):(y>0?0:2);selected=options[index]||options[0];onSelect(selected);}
 function update(dt){
  const joy=joystick.input;if(joy.toggleRequested){joy.toggleRequested=false;switchMode=!switchMode;joy.mode=switchMode?"switch":"move";keys.clear();}
  if(joy.selection){choose(joy.selection.x,joy.selection.y);joy.selection=null;}
  if(!isMobile&&switchMode){const x=(keys.has("d")?1:0)-(keys.has("a")?1:0),y=(keys.has("w")?1:0)-(keys.has("s")?1:0);if(x||y){choose(x,y);keys.clear();}return;}
  const object=entities[selected];if(!object)return;
  const f=(keys.has("w")?1:0)-(keys.has("s")?1:0)+(isMobile&&!switchMode?joy.y:0),r=(keys.has("d")?1:0)-(keys.has("a")?1:0)+(isMobile&&!switchMode?joy.x:0),m=Math.hypot(f,r);
  if(m>.08){const d=camera.getWorldDirection(new THREE.Vector3()),l=Math.hypot(d.x,d.z)||1,fx=d.x/l,fz=d.z/l,rx=-fz,rz=fx,mx=(fx*f+rx*r)/Math.max(1,m),mz=(fz*f+rz*r)/Math.max(1,m),speed=selected==="rustbucket"?5:3.5;
   if(object.userData.physicsBody)object.userData.physicsBody.setNextKinematicTranslation({x:object.position.x+mx*speed*dt,y:object.position.y+0.9,z:object.position.z+mz*speed*dt});else{object.position.x+=mx*speed*dt;object.position.z+=mz*speed*dt;}
   object.rotation.y=Math.atan2(mx,mz);object.setAnimation?.("walk");
  }else object.setAnimation?.("idle");
  object.update?.(dt);updateCamera();
 }
 return {update,get selected(){return selected;},destroy(){window.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);window.removeEventListener("blur",blur);keys.clear();}};
}
