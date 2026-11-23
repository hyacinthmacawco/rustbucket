export class Relationships {
  constructor({ relationships = {} } = {}) { this.relationships=relationships; }
  render(host) { const section=document.createElement("section"); section.className="extranet-page relationships-page"; section.innerHTML="<h2>RELATIONSHIPS</h2>"; for(const [name,value] of Object.entries(this.relationships)){const row=document.createElement("p");row.textContent=`${name} · ${value}`;section.append(row);} host.replaceChildren(section); return section; }
}