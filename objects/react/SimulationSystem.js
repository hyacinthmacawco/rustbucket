import { Ben } from "../team/Ben.js";
import { Gwen } from "../team/Gwen.js";
import { Kevin } from "../team/Kevin.js";
import { Rook } from "../team/Rook.js";
import { Highbreed } from "../species/Highbreed.js";
import { Incursean } from "../species/Incursean.js";
import { Anodite } from "../species/Anodite.js";
import { Galvan } from "../species/Galvan.js";
import { Human } from "../species/Human.js";

export class SimulationSystem {
  static ENTITY_NAMES = ["Ben", "Gwen", "Kevin", "Rook", "Highbreed", "Incursean", "Anodite", "Galvan", "Human"];
  static SPECIES = ["Highbreed", "Incursean", "Anodite", "Galvan", "Human"];
  static CREW = ["Ben", "Gwen", "Kevin", "Rook"];
  static ENTITY_CLASSES = { Ben, Gwen, Kevin, Rook, Highbreed, Incursean, Anodite, Galvan, Human };

  static clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }

  static key(value) {
    return String(value).toLowerCase();
  }

  static createInitialEntities() {
    return Object.fromEntries(
      this.ENTITY_NAMES.map(name => [
        name,
        { relationships: { ...(this.ENTITY_CLASSES[name].relationships || {}) } }
      ])
    );
  }

  static createDefaults() {
    return {
  entities: this.createInitialEntities(),
  populations: { Highbreed:820, Incursean:540, Anodite:180, Galvan:240, Human:810 },
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
}
  }

  constructor() {
    this.species = SimulationSystem.SPECIES;
    this.crew = SimulationSystem.CREW;
    this.data = this.loadData();
    this.healthEnergy = {
      Ben: { health: 100, energy: 100, energyLabel: "OMNITRIX" },
      Chromastone: { health: 100, energy: 100, energyLabel: "CHROMASTONE" },
      Gwen: { health: 100, energy: 100, energyLabel: "MANA" },
      Kevin: { health: 100, energy: 100, energyLabel: "ABSORBED MATERIAL" },
      Rook: { health: 100, energy: 100, energyLabel: "PROTO-TOOL" },
      Rustbucket: { health: 100, energy: this.data.team.fuel, energyLabel: "FUEL" }
    };
    this.elapsed = 0;
    this.healthRecoveryDelay = Object.fromEntries(Object.keys(this.healthEnergy).map(name => [name, 0]));
    this.energyRecoveryDelay = Object.fromEntries(Object.keys(this.healthEnergy).map(name => [name, 0]));
    this.chromastoneActive = false;
    this.lastHostileAt = 0;
    this._onEvent = () => {};
  }

loadData() {
    const defaults = SimulationSystem.createDefaults();
  try {
    const saved = JSON.parse(localStorage.getItem("rustbucket.simulation") || localStorage.getItem("rustbucket.phase2"));
    if (saved) {
      const merged = { ...structuredClone(defaults), ...saved,
        team:{...structuredClone(defaults.team),...(saved.team||{})},
        populations:{...structuredClone(defaults.populations),...(saved.populations||{})},
        entities: {}
      };
      for (const name of SimulationSystem.ENTITY_NAMES) {
        const base = structuredClone(defaults.entities[name] || {relationships:{}});
        const savedEntity = saved.entities?.[name] || {};
        const legacy = Object.fromEntries(Object.entries(saved.relationships?.[name] || {}).map(([other,value]) => [other, Number(value) * 2 - 100]));
        merged.entities[name] = {...base,...savedEntity,relationships:{...base.relationships,...legacy,...(savedEntity.relationships||{})}};
        for (const [other,value] of Object.entries(merged.entities[name].relationships)) {
          merged.entities[name].relationships[other] = Math.max(-100,Math.min(100,Number(value)||0));
        }
      }
      delete merged.relationships;
      merged.eventLog = (merged.eventLog || []).filter(event => !/passing trader convoy/i.test(event.description || ""));

      for (const name of SimulationSystem.SPECIES) merged.populations[name] = SimulationSystem.clamp(Number(merged.populations[name]) || 0, 0, 999);
      return merged;
    }
  } catch (error) { console.warn("Simulation save could not be read", error); }
  return structuredClone(defaults);
}

save() {
    try { localStorage.setItem("rustbucket.simulation", JSON.stringify(this.data)); }
    catch (error) { console.warn("Simulation save could not be stored", error); }
  }

getRelationship(from,to) {
    if (from === to) return 0;
    return Math.max(-100,Math.min(100,Number(this.data.entities[from]?.relationships?.[to] ?? 0)));
  }

setRelationship(from,to,value) {
    if (from === to) return;
    if (!this.data.entities[from]) this.data.entities[from] = {relationships:{}};
    if (!this.data.entities[from].relationships) this.data.entities[from].relationships = {};
    this.data.entities[from].relationships[to] = Math.max(-100,Math.min(100,Number(value)||0));
    this.save();
  }

canTrade(from,to) { return this.getRelationship(from,to) >= -30; }

isHostile(from,to) { return this.getRelationship(from,to) < -30; }

recordEvent(type, description, details={}

startWar(attacker,defender) {
    if (attacker===defender || !this.species.includes(attacker) || !this.species.includes(defender)) return null;
    if (!this.isHostile(attacker,defender)) this.setRelationship(attacker,defender,-55);
    const loot=Math.min(this.data.treasury[defender]||0,Math.max(100,Math.round((this.data.treasury[defender]||0)*0.025)));
    this.data.treasury[defender]=Math.max(0,(this.data.treasury[defender]||0)-loot);
    this.data.treasury[attacker]=(this.data.treasury[attacker]||0)+loot;
    const stock=(this.data.resources[defender]||[]).find(item=>item.quantity>0);
    let seized=null;
    if(stock){
      const quantity=Math.min(stock.quantity,Math.max(1,Math.floor(stock.quantity*0.01)));
      stock.quantity-=quantity;
      const target=(this.data.resources[attacker]||[]).find(item=>item.id===stock.id);
      if(target)target.quantity+=quantity;
      else (this.data.resources[attacker]||(this.data.resources[attacker]=[])).push({...stock,quantity});
      seized={resource:stock.name,quantity};
    }
    return this.recordEvent("war",attacker+" has declared war on "+defender+" to seize Taydenite and resources.",{attacker,defender,loot,seized});
  }

update(dt, selected="Ben", location="earth", isNearHome=false) {
    this.elapsed+=dt;
    for (const [name,status] of Object.entries(this.healthEnergy)) {
      this.healthRecoveryDelay[name] = Math.max(0,this.healthRecoveryDelay[name] - dt);
      this.energyRecoveryDelay[name] = Math.max(0,this.energyRecoveryDelay[name] - dt);
      if (this.healthRecoveryDelay[name] <= 0 && status.health < 100) status.health = Math.min(100,status.health + dt * 0.32);
      if (this.energyRecoveryDelay[name] <= 0 && status.energy < 100) status.energy = Math.min(100,status.energy + dt * 0.48);
      if (name === "Rustbucket") this.data.team.fuel = status.energy;
    }
    const now=Date.now();
    for(const event of this.data.eventLog){
      if(event.status==="active"&&now-Date.parse(event.at)>90000){
        event.status="ended";event.endedAt=new Date(now).toISOString();
      }
    }
    if (this.elapsed>=30) {
      this.elapsed=0;
      for (const name of this.species) {
        const growth=(this.data.populations[name]||0)*0.00002;
        const warLoss=this.data.eventLog.some(e=>e.type==="war"&&e.status==="active"&&(e.details.attacker===name||e.details.defender===name)) ? (this.data.populations[name]||0)*0.00001 : 0;
        this.data.populations[name]=SimulationSystem.clamp(Math.round(this.data.populations[name]+growth-warLoss),0,999);
        const net=(this.data.revenue[name]||0)-(this.data.expenses[name]||0);
        this.data.treasury[name]=Math.max(0,(this.data.treasury[name]||0)+net);
        if (this.data.expenses[name] > this.data.revenue[name]*1.5 && Math.random()<0.22) {
          const candidates=this.species.filter(other=>other!==name);
          const target=candidates[Math.floor(Math.random()*candidates.length)];
          this.startWar(name,target);
        }
      }
      this.save();
    }
    const person=this.crew.includes(selected)?selected:null;
    const worldSpecies=this.species.find(name=>SimulationSystem.key(name)===SimulationSystem.key(location));
    if (person && isNearHome && worldSpecies && this.isHostile(person,worldSpecies) && this.elapsed-this.lastHostileAt>12) {
      this.lastHostileAt=this.elapsed;
      this.setHealth(person,this.healthEnergy[person].health-8);
      this.recordEvent("attack",worldSpecies+" forces attacked "+person+" in "+worldSpecies+" territory.",{attacker:worldSpecies,target:person});
    }
    if (worldSpecies && this.elapsed-this.lastHostileAt>12) {
      const rival=this.species.find(name=>name!==worldSpecies&&this.isHostile(worldSpecies,name));
      if(rival){this.lastHostileAt=this.elapsed;this.recordEvent("attack",worldSpecies+" forces engaged "+rival+" near the homeworld.",{attacker:worldSpecies,target:rival});}
    }
  }

getStatus(name) { return this.healthEnergy[name] || this.healthEnergy.Ben; }

setHealth(name,value) {
    const s=this.getStatus(name), next=SimulationSystem.clamp(value);
    if (next < s.health) this.healthRecoveryDelay[name] = 4;
    s.health = next;
  }

setEnergy(name,value) {
    const s=this.getStatus(name), next=SimulationSystem.clamp(value);
    if (next < s.energy) this.energyRecoveryDelay[name] = 4;
    s.energy = next;
    if (name === "Rustbucket") this.data.team.fuel = next;
  }

spendEnergy(name,amount) {
    const s=this.getStatus(name);if(s.energy<amount)return false;
    this.setEnergy(name,s.energy-amount);return true;
  }

tradeWithSpecies(character,speciesName,resourceId,quantity=1) {
    const stock=(this.data.resources[speciesName]||[]).find(x=>x.id===resourceId);
    if(!stock||quantity<1||stock.quantity<quantity)return {ok:false,reason:"Insufficient stock."};
    if(!this.canTrade(character,speciesName))return {ok:false,reason:"Trade denied: relationship below 30%."};
    const cost=stock.price*quantity;
    if(this.data.team.cash<cost)return {ok:false,reason:"Insufficient Taydenite."};
    stock.quantity-=quantity;this.data.team.cash-=cost;
    this.data.revenue[speciesName]=(this.data.revenue[speciesName]||0)+cost;
    this.data.treasury[speciesName]=(this.data.treasury[speciesName]||0)+cost;
    this.addItem({id:stock.id,name:stock.name,category:"Trade goods",value:stock.price},quantity);
    this.data.transactions.unshift({type:"purchase",from:speciesName,item:stock.name,quantity,cost,at:new Date().toISOString()});
    this.data.transactions=this.data.transactions.slice(0,100);this.save();
    this.recordEvent("trade",character+" purchased "+quantity+" "+stock.name+" from "+speciesName+".",{ character, species: speciesName, cost });
    return {ok:true,cost};
  }

addItem(item,quantity=1) {
    const found=this.data.team.inventory.find(x=>x.id===item.id);
    if(found)found.quantity+=quantity;else this.data.team.inventory.push({...item,quantity});
    this.save();
  }

removeItem(id,quantity=1) {
    const item=this.data.team.inventory.find(x=>x.id===id);
    if(!item||item.quantity<quantity)return false;
    item.quantity-=quantity;
    if(item.quantity===0)this.data.team.inventory=this.data.team.inventory.filter(x=>x.id!==id);
    this.save();return true;
  }

moveItemToCharacter(id,character,quantity=1) {
    const item=this.data.team.inventory.find(x=>x.id===id);
    if(!item||item.quantity<quantity)return false;
    item.quantity-=quantity;
    if(item.quantity===0)this.data.team.inventory=this.data.team.inventory.filter(x=>x.id!==id);
    const carried=this.data.team.carried[character]||(this.data.team.carried[character]=[]);
    carried.push(item.name+(quantity>1?" ×"+quantity:""));
    this.save();return true;
  }

moveItemToShip(character,index) {
    const carried=this.data.team.carried[character]||[];
    if(index<0||index>=carried.length)return false;
    const name=carried.splice(index,1)[0];
    this.addItem({id:SimulationSystem.key(name).replace(/[^a-z0-9]+/g,"-"),name,weight:1,category:"Recovered"});
    this.save();return true;
  }

useCarriedItem(character,index) {
    const carried=this.data.team.carried[character]||[];
    const item=carried[index];
    if(!item)return {ok:false,reason:"No item selected."};
    const name=item.toLowerCase();
    if(name.includes("medkit"))this.setHealth(character,this.getStatus(character).health+35);
    else if(name.includes("energy cell"))this.recharge(character==="Ben"&&this.chromastoneActive?"Chromastone":character,30);
    else return {ok:false,reason:"This item has no direct-use action yet."};
    carried.splice(index,1);this.save();return {ok:true};
  }

getChromastoneActive(){return this.chromastoneActive;}

setChromastoneActive(value){this.chromastoneActive=Boolean(value);}

consumeFuel(amount){const status=this.getStatus("Rustbucket");if(status.energy<amount)return false;this.setEnergy("Rustbucket",status.energy-amount);this.save();return true;}

damage(name,amount){this.setHealth(name,this.getStatus(name).health-amount);}

recharge(name,amount){this.setEnergy(name,this.getStatus(name).energy+amount);}

  set onEvent(callback) {
    this._onEvent = callback || (() => {});
  }
}
