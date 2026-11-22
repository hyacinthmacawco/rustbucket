export function createSimulationCloud(simulation) {
  const root=document.createElement("section"); root.id="simulation-cloud";
  root.innerHTML="<div id=\"simulation-cloud-window\"><header><b>PRIVATE CLOUD</b><button id=\"simulation-cloud-close\">×</button></header><nav id=\"simulation-cloud-nav\"><button data-view=\"accounting\">ACCOUNTS</button><button data-view=\"items\">INVENTORY</button><button data-view=\"events\">EVENT LOG</button></nav><main id=\"simulation-cloud-content\"></main></div>";
  document.body.appendChild(root);
  const content=root.querySelector("#simulation-cloud-content");
  const data=simulation.data;
  function relationships(){
    const names=simulation.ENTITY_NAMES;
    content.innerHTML="<label>ENTITY <select id=\"sim-relationship-entity\">"+names.map(n=>"<option>"+n+"</option>").join("")+"</select></label><div id=\"sim-relationship-list\"></div>";
    const picker=content.querySelector("select"), list=content.querySelector("#sim-relationship-list");
    const render=()=>{list.innerHTML=names.filter(n=>n!==picker.value).map(n=>{const v=simulation.getRelationship(picker.value,n);return "<div class=\"sim-row\"><span>"+n+"</span><i><b style=\"width:"+v+"%\"></b></i><strong>"+v.toFixed(0)+"%</strong></div>";}).join("");};
    picker.addEventListener("change",render);render();
  }
  function accounting(){
    content.innerHTML="<nav class=\"sim-tabs\"><button data-tab=\"balance\">BALANCE SHEET</button><button data-tab=\"income\">INCOME STATEMENT</button><button data-tab=\"cash\">CASH FLOW STATEMENT</button></nav><div id=\"sim-ledger\"></div>";
    const ledger=content.querySelector("#sim-ledger");
    const render=tab=>{content.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
      if(tab==="balance"){const value=data.team.inventory.reduce((n,x)=>n+x.quantity*(x.value||10),0);ledger.innerHTML="<h2>TEAM BALANCE SHEET</h2>"+row("Cash and Taydenite",data.team.cash+" T")+row("Stored resources",value+" T")+row("Fuel",simulation.getStatus("Rustbucket").energy.toFixed(0)+"%")+row("Tracked assets",(data.team.cash+value).toLocaleString()+" T");}
      else if(tab==="income"){ledger.innerHTML="<h2>SPECIES INCOME STATEMENT</h2>"+simulation.species.map(n=>row(n,data.populations[n].toLocaleString()+" population • "+data.revenue[n].toLocaleString()+" T revenue / "+data.expenses[n].toLocaleString()+" T expenses")).join("");}
      else {ledger.innerHTML="<h2>TEAM CASH FLOW STATEMENT</h2>"+row("Opening cash",data.team.cash.toLocaleString()+" T")+row("Operating cash flow","0 T")+row("Investing cash flow","0 T")+row("Financing cash flow","0 T")+((data.transactions||[]).map(t=>row(t.item,t.cost.toLocaleString()+" T • "+t.from)).join(""))+"<p>Recorded transactions</p>";}};
    content.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>render(b.dataset.tab)));render("balance");
  }
  function row(a,b){return "<div class=\"sim-row\"><span>"+a+"</span><strong>"+b+"</strong></div>";}
  function items(){
    content.innerHTML="<h2>RUSTBUCKET INVENTORY</h2><div id=\"sim-inventory\"></div><h2>CHARACTER CARRIED ITEMS</h2><label>CHARACTER <select id=\"sim-carrier\"><option>Ben</option><option>Gwen</option><option>Kevin</option><option>Rook</option></select></label><div id=\"sim-carried\"></div>";
    const inventory=content.querySelector("#sim-inventory"), carried=content.querySelector("#sim-carried"), carrier=content.querySelector("#sim-carrier");
    const render=()=>{inventory.innerHTML=data.team.inventory.map(x=>"<div class=\"sim-item\"><span>"+x.name+" ×"+x.quantity+"<small>"+x.category+"</small></span><button data-carry=\""+x.id+"\">CARRY</button></div>").join("")||"<p>Empty.</p>";
      carried.innerHTML=(data.team.carried[carrier.value]||[]).map((x,i)=>"<div class=\"sim-item\"><span>"+x+"</span><button data-store=\""+i+"\">STORE</button></div>").join("")||"<p>No carried items.</p>";
      inventory.querySelectorAll("[data-carry]").forEach(b=>b.onclick=()=>{simulation.moveItemToCharacter(b.dataset.carry,carrier.value);render();});
      carried.querySelectorAll("[data-store]").forEach(b=>b.onclick=()=>{simulation.moveItemToShip(carrier.value,Number(b.dataset.store));render();});};
    carrier.addEventListener("change",render);render();
  }
  function resources(){
    content.innerHTML="<h2>SPECIES RESOURCE MARKETS</h2><label>SPECIES <select id=\"sim-market-species\">"+simulation.species.map(n=>"<option>"+n+"</option>").join("")+"</select></label><label>BUYING AS <select id=\"sim-market-person\"><option>Ben</option><option>Gwen</option><option>Kevin</option><option>Rook</option></select></label><div id=\"sim-market-stock\"></div><p id=\"sim-market-message\"></p>";
    const species=content.querySelector("#sim-market-species"),person=content.querySelector("#sim-market-person"),stock=content.querySelector("#sim-market-stock"),message=content.querySelector("#sim-market-message");
    const render=()=>{const allowed=simulation.canTrade(person.value,species.value);stock.innerHTML=(data.resources[species.value]||[]).map(x=>"<div class=\"sim-item\"><span>"+x.name+" ×"+x.quantity+"<small>"+x.price+" Taydenite each</small></span><button data-buy=\""+x.id+"\" "+(!allowed?"disabled":"")+">BUY 1</button></div>").join("");stock.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{const result=simulation.tradeWithSpecies(person.value,species.value,b.dataset.buy,1);message.textContent=result.ok?"PURCHASED • "+result.cost+" T":result.reason;render();});message.textContent=allowed?"TRADE PERMITTED • RELATIONSHIP "+simulation.getRelationship(person.value,species.value).toFixed(0)+"%":"TRADE BLOCKED • RELATIONSHIP BELOW 30%";};
    species.addEventListener("change",render);person.addEventListener("change",render);render();
  }
  function events(){content.innerHTML="<h2>OMNIVERSE EVENT MANAGER</h2>"+(data.eventLog.map(e=>"<article class=\"sim-event\"><b>"+e.type.toUpperCase()+"</b><p>"+e.description+"</p><small>STARTED "+new Date(e.at).toLocaleString()+" • "+e.status.toUpperCase()+(e.endedAt?" • ENDED "+new Date(e.endedAt).toLocaleString():"")+"</small></article>").join("")||"<p>No recorded events.</p>");}
  function open(view="accounting", host=null){
    if(host){root.classList.add("embedded");host.appendChild(root);}else{root.classList.remove("embedded");if(!root.isConnected)document.body.appendChild(root);}
    root.style.display="flex";show(view);
  }
  function show(view){root.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));({accounting,items,events}[view]||accounting)();}
  root.querySelector("#simulation-cloud-close").onclick=()=>{root.style.display="none";root.classList.remove("embedded");document.body.appendChild(root);};
  root.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>show(b.dataset.view));
  root.style.display="none";
  return {open,close(){root.style.display="none";root.classList.remove("embedded");document.body.appendChild(root);},refresh(){if(root.style.display==="flex")show(root.querySelector("[data-view].active")?.dataset.view||"events");}};
}