export function createPhaseTwoCloud(phaseTwo) {
  const root=document.createElement("section"); root.id="phase2-cloud";
  root.innerHTML="<div id=\"phase2-cloud-window\"><header><b>PRIVATE CLOUD / OMNIVERSE DATA</b><button id=\"phase2-cloud-close\">×</button></header><nav id=\"phase2-cloud-nav\"><button data-view=\"relationships\">RELATIONSHIPS</button><button data-view=\"accounting\">ACCOUNTING</button><button data-view=\"items\">ITEMS</button><button data-view=\"resources\">RESOURCES / TRADE</button><button data-view=\"events\">EVENTS</button></nav><main id=\"phase2-cloud-content\"></main></div>";
  document.body.appendChild(root);
  const content=root.querySelector("#phase2-cloud-content");
  const data=phaseTwo.data;
  function relationships(){
    const names=phaseTwo.ENTITY_NAMES;
    content.innerHTML="<label>ENTITY <select id=\"p2-relationship-entity\">"+names.map(n=>"<option>"+n+"</option>").join("")+"</select></label><div id=\"p2-relationship-list\"></div>";
    const picker=content.querySelector("select"), list=content.querySelector("#p2-relationship-list");
    const render=()=>{list.innerHTML=names.filter(n=>n!==picker.value).map(n=>{const v=phaseTwo.getRelationship(picker.value,n);return "<div class=\"p2-row\"><span>"+n+"</span><i><b style=\"width:"+v+"%\"></b></i><strong>"+v.toFixed(0)+"%</strong></div>";}).join("");};
    picker.addEventListener("change",render);render();
  }
  function accounting(){
    content.innerHTML="<nav class=\"p2-tabs\"><button data-tab=\"balance\">BALANCE SHEET</button><button data-tab=\"income\">INCOME STATEMENT</button><button data-tab=\"cash\">CASH FLOW STATEMENT</button></nav><div id=\"p2-ledger\"></div>";
    const ledger=content.querySelector("#p2-ledger");
    const render=tab=>{content.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
      if(tab==="balance"){const value=data.team.inventory.reduce((n,x)=>n+x.quantity*(x.value||10),0);ledger.innerHTML="<h2>TEAM BALANCE SHEET</h2>"+row("Cash and Taydenite",data.team.cash+" T")+row("Stored resources",value+" T")+row("Fuel",phaseTwo.getStatus("Rustbucket").energy.toFixed(0)+"%")+row("Tracked assets",(data.team.cash+value).toLocaleString()+" T");}
      else if(tab==="income"){ledger.innerHTML="<h2>SPECIES INCOME STATEMENT</h2>"+phaseTwo.species.map(n=>row(n,data.populations[n].toLocaleString()+" population • "+data.revenue[n].toLocaleString()+" T revenue / "+data.expenses[n].toLocaleString()+" T expenses")).join("");}
      else {ledger.innerHTML="<h2>TEAM CASH FLOW STATEMENT</h2>"+row("Opening cash",data.team.cash.toLocaleString()+" T")+row("Operating cash flow","0 T")+row("Investing cash flow","0 T")+row("Financing cash flow","0 T")+((data.transactions||[]).map(t=>row(t.item,t.cost.toLocaleString()+" T • "+t.from)).join(""))+"<p>Recorded transactions</p>";}};
    content.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>render(b.dataset.tab)));render("balance");
  }
  function row(a,b){return "<div class=\"p2-row\"><span>"+a+"</span><strong>"+b+"</strong></div>";}
  function items(){
    content.innerHTML="<h2>RUSTBUCKET INVENTORY</h2><div id=\"p2-inventory\"></div><h2>CHARACTER CARRIED ITEMS</h2><label>CHARACTER <select id=\"p2-carrier\"><option>Ben</option><option>Gwen</option><option>Kevin</option><option>Rook</option></select></label><div id=\"p2-carried\"></div>";
    const inventory=content.querySelector("#p2-inventory"), carried=content.querySelector("#p2-carried"), carrier=content.querySelector("#p2-carrier");
    const render=()=>{inventory.innerHTML=data.team.inventory.map(x=>"<div class=\"p2-item\"><span>"+x.name+" ×"+x.quantity+"<small>"+x.category+"</small></span><button data-carry=\""+x.id+"\">CARRY</button></div>").join("")||"<p>Empty.</p>";
      carried.innerHTML=(data.team.carried[carrier.value]||[]).map((x,i)=>"<div class=\"p2-item\"><span>"+x+"</span><button data-store=\""+i+"\">STORE</button></div>").join("")||"<p>No carried items.</p>";
      inventory.querySelectorAll("[data-carry]").forEach(b=>b.onclick=()=>{phaseTwo.moveItemToCharacter(b.dataset.carry,carrier.value);render();});
      carried.querySelectorAll("[data-store]").forEach(b=>b.onclick=()=>{phaseTwo.moveItemToShip(carrier.value,Number(b.dataset.store));render();});};
    carrier.addEventListener("change",render);render();
  }
  function resources(){
    content.innerHTML="<h2>SPECIES RESOURCE MARKETS</h2><label>SPECIES <select id=\"p2-market-species\">"+phaseTwo.species.map(n=>"<option>"+n+"</option>").join("")+"</select></label><label>BUYING AS <select id=\"p2-market-person\"><option>Ben</option><option>Gwen</option><option>Kevin</option><option>Rook</option></select></label><div id=\"p2-market-stock\"></div><p id=\"p2-market-message\"></p>";
    const species=content.querySelector("#p2-market-species"),person=content.querySelector("#p2-market-person"),stock=content.querySelector("#p2-market-stock"),message=content.querySelector("#p2-market-message");
    const render=()=>{const allowed=phaseTwo.canTrade(person.value,species.value);stock.innerHTML=(data.resources[species.value]||[]).map(x=>"<div class=\"p2-item\"><span>"+x.name+" ×"+x.quantity+"<small>"+x.price+" Taydenite each</small></span><button data-buy=\""+x.id+"\" "+(!allowed?"disabled":"")+">BUY 1</button></div>").join("");stock.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{const result=phaseTwo.tradeWithSpecies(person.value,species.value,b.dataset.buy,1);message.textContent=result.ok?"PURCHASED • "+result.cost+" T":result.reason;render();});message.textContent=allowed?"TRADE PERMITTED • RELATIONSHIP "+phaseTwo.getRelationship(person.value,species.value).toFixed(0)+"%":"TRADE BLOCKED • RELATIONSHIP BELOW 30%";};
    species.addEventListener("change",render);person.addEventListener("change",render);render();
  }
  function events(){content.innerHTML="<h2>OMNIVERSE EVENT MANAGER</h2>"+(data.eventLog.map(e=>"<article class=\"p2-event\"><b>"+e.type.toUpperCase()+"</b><p>"+e.description+"</p><small>STARTED "+new Date(e.at).toLocaleString()+" • "+e.status.toUpperCase()+(e.endedAt?" • ENDED "+new Date(e.endedAt).toLocaleString():"")+"</small></article>").join("")||"<p>No recorded events.</p>");}
  function open(view="relationships"){root.style.display="flex";show(view);}
  function show(view){root.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));({relationships,accounting,items,resources,events}[view]||relationships)();}
  root.querySelector("#phase2-cloud-close").onclick=()=>root.style.display="none";
  root.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>show(b.dataset.view));
  root.style.display="none";
  return {open,close(){root.style.display="none";},refresh(){if(root.style.display==="flex")show(root.querySelector("[data-view].active")?.dataset.view||"events");}};
}