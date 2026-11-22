import * as THREE from "three";

const clamp = (n, min=0, max=100) => Math.max(min, Math.min(max, n));
const ENTITY_NAMES = ["Ben","Gwen","Kevin","Rook","Highbreed","Incursean","Anodite","Galvan","Human"];
const key = value => String(value).toLowerCase();
const species = ["Highbreed","Incursean","Anodite","Galvan","Human"];
const crew = ["Ben","Gwen","Kevin","Rook"];

const initialRelationships = {
  Ben: { Highbreed:85, Incursean:20, Anodite:60, Galvan:90, Human:98, Gwen:92, Kevin:95, Rook:90 },
  Gwen:{ Highbreed:60, Incursean:12, Anodite:80, Galvan:80, Human:84, Ben:90, Kevin:95, Rook:80 },
  Kevin:{ Highbreed:70, Incursean:5, Anodite:43, Galvan:85, Human:70, Ben:95, Gwen:95, Rook:85 },
  Rook:{ Highbreed:50, Incursean:15, Anodite:70, Galvan:90, Human:64, Ben:98, Gwen:80, Kevin:85 },
  Highbreed:{ Ben:70,Gwen:65,Kevin:60,Rook:55,Incursean:18,Anodite:45,Galvan:58,Human:22 },
  Incursean:{ Ben:35,Gwen:30,Kevin:25,Rook:28,Highbreed:18,Anodite:40,Galvan:55,Human:32 },
  Anodite:{ Ben:75,Gwen:85,Kevin:50,Rook:70,Highbreed:45,Incursean:40,Galvan:65,Human:70 },
  Galvan:{ Ben:90,Gwen:85,Kevin:88,Rook:92,Highbreed:58,Incursean:55,Anodite:65,Human:78 },
  Human:{ Ben:98,Gwen:90,Kevin:75,Rook:64,Highbreed:22,Incursean:32,Anodite:70,Galvan:78 }
};

const defaults = {
  relationships: initialRelationships,
  populations: { Highbreed:820000000, Incursean:540000000, Anodite:180000000, Galvan:240000000, Human:8100000000 },
  treasury: { Highbreed:920000, Incursean:510000, Anodite:740000, Galvan:1250000, Human:1800000 },
  revenue: { Highbreed:12500, Incursean:9200, Anodite:6500, Galvan:18000, Human:22000 },
  expenses: { Highbreed:14500, Incursean:16000, Anodite:6100, Galvan:12500, Human:19000 },
  team: { cash: 25000, health:100, energy:100, fuel:100, inventory: [
    {id:"medkit",name:"Medkit",quantity:3,weight:1,category:"Medical"},
    {id:"energy-cell",name:"Energy Cell",quantity:5,weight:1,category:"Energy"},
    {id:"taydenite",name:"Taydenite",quantity:120,weight:0.1,category:"Currency"},
    {id:"rations",name:"Rations",quantity:12,weight:0.5,category:"Supplies"}
  ], carried: {Ben:["Omnitrix"],Gwen:["Mana focus"],Kevin:["Absorbed alloy"],Rook:["Proto-Tool"]} },
  resources: {
    Highbreed:[{id:"bio-sample",name:"Bio samples",quantity:800,price:35},{id:"agri-goods",name:"Agricultural goods",quantity:1200,price:12},{id:"bio-tech",name:"Bio-tech",quantity:260,price:90}],
    Incursean:[{id:"mil-alloy",name:"Military alloy",quantity:900,price:55},{id:"weapon-parts",name:"Weapon parts",quantity:400,price:80},{id:"inc-energy",name:"Energy cells",quantity:700,price:28}],
    Anodite:[{id:"mana-crystal",name:"Mana crystals",quantity:350,price:110},{id:"raw-mana",name:"Raw mana",quantity:600,price:65},{id:"healing-herbs",name:"Healing herbs",quantity:900,price:18}],
    Galvan:[{id:"microchips",name:"Microchips",quantity:1500,price:24},{id:"tech-components",name:"Tech components",quantity:950,price:42},{id:"science-data",name:"Scientific data",quantity:300,price:75}],
    Human:[{id:"food",name:"Food supplies",quantity:2400,price:8},{id:"fuel",name:"Fuel",quantity:1600,price:20},{id:"medicine",name:"Medicine",quantity:850,price:32}]
  },
  transactions: [],
  eventLog: []
};

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem("rustbucket.phase2"));
    if (saved) return { ...structuredClone(defaults), ...saved,
      relationships:{...structuredClone(defaults.relationships),...(saved.relationships||{})},
      team:{...structuredClone(defaults.team),...(saved.team||{})} };
  } catch (error) { console.warn("Phase 2 save could not be read", error); }
  return structuredClone(defaults);
}

export function createPhaseTwo() {
  const data = loadData();
  const healthEnergy = {
    Ben:{health:100,energy:100,energyLabel:"OMNITRIX"},
    Gwen:{health:100,energy:100,energyLabel:"MANA"},
    Kevin:{health:100,energy:100,energyLabel:"ABSORBED MATERIAL"},
    Rook:{health:100,energy:100,energyLabel:"PROTO-TOOL"},
    Rustbucket:{health:100,energy:data.team.fuel,energyLabel:"FUEL"}
  };
  let elapsed = 0;
  let eventCooldown = 18;
  let chromastoneActive = false;
  let lastHostileAt = 0;
  let onEvent = () => {};

  function save() {
    try { localStorage.setItem("rustbucket.phase2", JSON.stringify(data)); }
    catch (error) { console.warn("Phase 2 save could not be stored", error); }
  }
  function getRelationship(from,to) {
    if (from === to) return 0;
    return clamp(Number(data.relationships[from]?.[to] ?? 50));
  }
  function setRelationship(from,to,value) {
    if (from === to) return;
    if (!data.relationships[from]) data.relationships[from] = {};
    data.relationships[from][to] = clamp(value);
    save();
  }
  function canTrade(from,to) { return getRelationship(from,to) >= 30; }
  function isHostile(from,to) { return getRelationship(from,to) < 30; }
  function recordEvent(type, description, details={}) {
    const event={id:Date.now()+"-"+Math.random().toString(36).slice(2,7),type,description,details,at:new Date().toISOString(),status:"active"};
    data.eventLog.unshift(event);
    data.eventLog=data.eventLog.slice(0,60);
    onEvent(event); save(); return event;
  }
  function startWar(attacker,defender) {
    if (attacker===defender || !species.includes(attacker) || !species.includes(defender)) return null;
    if (!isHostile(attacker,defender)) setRelationship(attacker,defender,25);
    return recordEvent("war",attacker+" has declared war on "+defender+" over resources.",{attacker,defender});
  }
  function update(dt, selected="Ben", location="earth", isNearHome=false) {
    elapsed+=dt; eventCooldown-=dt;
    if (elapsed>=30) {
      elapsed=0;
      for (const name of species) {
        const growth=(data.populations[name]||0)*0.00002;
        const warLoss=data.eventLog.some(e=>e.type==="war"&&e.status==="active"&&(e.details.attacker===name||e.details.defender===name)) ? (data.populations[name]||0)*0.00001 : 0;
        data.populations[name]=Math.max(0,Math.round(data.populations[name]+growth-warLoss));
        const net=(data.revenue[name]||0)-(data.expenses[name]||0);
        data.treasury[name]=Math.max(0,(data.treasury[name]||0)+net);
        if (data.expenses[name] > data.revenue[name]*1.5 && Math.random()<0.22) {
          const candidates=species.filter(other=>other!==name);
          const target=candidates[Math.floor(Math.random()*candidates.length)];
          startWar(name,target);
        }
      }
      save();
    }
    if (eventCooldown<=0) {
      eventCooldown=30+Math.random()*35;
      if (Math.random()<0.28) recordEvent("encounter","A passing trader convoy has been detected.",{location});
    }
    const person=crew.includes(selected)?selected:null;
    const worldSpecies=species.find(name=>key(name)===key(location));
    if (person && isNearHome && worldSpecies && isHostile(person,worldSpecies) && elapsed-lastHostileAt>12) {
      lastHostileAt=elapsed;
      healthEnergy[person].health=clamp(healthEnergy[person].health-8);
      recordEvent("attack",worldSpecies+" forces attacked "+person+" in "+worldSpecies+" territory.",{attacker:worldSpecies,target:person});
    }
    if (worldSpecies && elapsed-lastHostileAt>12) {
      const rival=species.find(name=>name!==worldSpecies&&isHostile(worldSpecies,name));
      if(rival){lastHostileAt=elapsed;recordEvent("attack",worldSpecies+" forces engaged "+rival+" near the homeworld.",{attacker:worldSpecies,target:rival});}
    }
  }
  function getStatus(name) { return healthEnergy[name] || healthEnergy.Ben; }
  function setHealth(name,value) { const s=getStatus(name);s.health=clamp(value); }
  function setEnergy(name,value) { const s=getStatus(name);s.energy=clamp(value); }
  function spendEnergy(name,amount) { const s=getStatus(name);if(s.energy<amount)return false;s.energy-=amount;return true; }
  function tradeWithSpecies(character,speciesName,resourceId,quantity=1) {
    const stock=(data.resources[speciesName]||[]).find(x=>x.id===resourceId);
    if(!stock||quantity<1||stock.quantity<quantity)return {ok:false,reason:"Insufficient stock."};
    if(!canTrade(character,speciesName))return {ok:false,reason:"Trade denied: relationship below 30%."};
    const cost=stock.price*quantity;
    if(data.team.cash<cost)return {ok:false,reason:"Insufficient Taydenite."};
    stock.quantity-=quantity;data.team.cash-=cost;
    data.revenue[speciesName]=(data.revenue[speciesName]||0)+cost;
    data.treasury[speciesName]=(data.treasury[speciesName]||0)+cost;
    addItem({id:stock.id,name:stock.name,category:"Trade goods",value:stock.price},quantity);
    data.transactions.unshift({type:"purchase",from:speciesName,item:stock.name,quantity,cost,at:new Date().toISOString()});
    data.transactions=data.transactions.slice(0,100);save();
    recordEvent("trade",character+" purchased "+quantity+" "+stock.name+" from "+speciesName+".",{character,species:speciesName,cost});
    return {ok:true,cost};
  }
  function addItem(item,quantity=1) {
    const found=data.team.inventory.find(x=>x.id===item.id);
    if(found)found.quantity+=quantity;else data.team.inventory.push({...item,quantity});
    save();
  }
  function removeItem(id,quantity=1) {
    const item=data.team.inventory.find(x=>x.id===id);
    if(!item||item.quantity<quantity)return false;
    item.quantity-=quantity;
    if(item.quantity===0)data.team.inventory=data.team.inventory.filter(x=>x.id!==id);
    save();return true;
  }
  function moveItemToCharacter(id,character,quantity=1) {
    const item=data.team.inventory.find(x=>x.id===id);
    if(!item||item.quantity<quantity)return false;
    item.quantity-=quantity;
    if(item.quantity===0)data.team.inventory=data.team.inventory.filter(x=>x.id!==id);
    const carried=data.team.carried[character]||(data.team.carried[character]=[]);
    carried.push(item.name+(quantity>1?" ×"+quantity:""));
    save();return true;
  }
  function moveItemToShip(character,index) {
    const carried=data.team.carried[character]||[];
    if(index<0||index>=carried.length)return false;
    const name=carried.splice(index,1)[0];
    addItem({id:key(name).replace(/[^a-z0-9]+/g,"-"),name,weight:1,category:"Recovered"});
    save();return true;
  }
  function useCarriedItem(character,index) {
    const carried=data.team.carried[character]||[];
    const item=carried[index];
    if(!item)return {ok:false,reason:"No item selected."};
    const name=item.toLowerCase();
    if(name.includes("medkit"))setHealth(character,getStatus(character).health+35);
    else if(name.includes("energy cell"))recharge(character,30);
    else return {ok:false,reason:"This item has no direct-use action yet."};
    carried.splice(index,1);save();return {ok:true};
  }
  function getChromastoneActive(){return chromastoneActive;}
  function setChromastoneActive(value){chromastoneActive=Boolean(value);}
  function consumeFuel(amount){const status=getStatus("Rustbucket");if(status.energy<amount)return false;status.energy=clamp(status.energy-amount);data.team.fuel=status.energy;save();return true;}
  function damage(name,amount){setHealth(name,getStatus(name).health-amount);}
  function recharge(name,amount){setEnergy(name,getStatus(name).energy+amount);}
  return {
    data, ENTITY_NAMES, crew, species, healthEnergy, getRelationship,setRelationship,canTrade,isHostile,
    recordEvent,startWar,update,getStatus,setHealth,setEnergy,spendEnergy,addItem,removeItem,moveItemToCharacter,moveItemToShip,useCarriedItem,tradeWithSpecies,
    getChromastoneActive,setChromastoneActive,damage,recharge,consumeFuel,save,
    set onEvent(fn){onEvent=fn||(()=>{});}
  };
}

export function createChromastone() {
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
  root.traverse(o=>{if(o.isMesh){const outline=new THREE.Mesh(o.geometry,new THREE.MeshBasicMaterial({color:0x050509,side:THREE.BackSide}));outline.scale.multiplyScalar(1.055);o.add(outline);}});
  root.visible=false;
  return root;
}
