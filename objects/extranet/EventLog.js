export class EventLog {
  constructor({ events = [] } = {}) { this.events=events; }
  render(host) { const section=document.createElement("section"); section.className="extranet-page event-log-page"; section.innerHTML="<h2>EVENT LOG</h2>"; for(const event of this.events){const row=document.createElement("p");row.textContent=String(event.description??event);section.append(row);} host.replaceChildren(section); return section; }
}