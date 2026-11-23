export class Inventory {
  constructor({ items = [] } = {}) { this.items=items; }
  render(host) { const section=document.createElement("section"); section.className="extranet-page inventory-page"; section.innerHTML="<h2>INVENTORY</h2>"; for(const item of this.items){const row=document.createElement("p");row.textContent=`${item.name??"Item"} · ${item.quantity??0}`;section.append(row);} host.replaceChildren(section); return section; }
}