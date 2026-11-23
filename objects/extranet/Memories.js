export class Memories {
  constructor({ memories = [] } = {}) { this.memories=memories; }
  render(host) { const section=document.createElement("section"); section.className="extranet-page memories-page"; section.innerHTML="<h2>MEMORIES</h2>"; for(const memory of this.memories){const row=document.createElement("p");row.textContent=String(memory.title??memory);section.append(row);} host.replaceChildren(section); return section; }
}