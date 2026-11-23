export class Tasks {
  constructor({ tasks = [] } = {}) { this.tasks=tasks; }
  render(host) { const section=document.createElement("section"); section.className="extranet-page tasks-page"; section.innerHTML="<h2>TASKS</h2>"; for(const task of this.tasks){const row=document.createElement("p");row.textContent=String(task.title??task);section.append(row);} host.replaceChildren(section); return section; }
}