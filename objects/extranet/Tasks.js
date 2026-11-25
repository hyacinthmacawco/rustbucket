export class Tasks {
  constructor() {
    this.items = [];
    this.nextId = 1;
    this.host = null;
    this.styles = {
      card: { padding: "18px", border: "1px solid rgba(126,255,168,.28)", borderRadius: "8px", background: "rgba(5,30,16,.72)" },
      title: { margin: "0 0 20px", color: "#9effb6", fontFamily: "Nulshock, sans-serif", letterSpacing: ".12em", fontSize: "1.2rem" },
      label: { color: "#dfffe8", letterSpacing: ".06em", padding: "12px 0", borderBottom: "1px solid rgba(126,255,168,.14)" }
    };
  }

  addTask(resident) {
    const existing = this.items.find(item => item.resident === resident && !item.completed);
    if (existing) return existing.id;
    const task = {
      id: this.nextId++,
      resident,
      title: "Return " + (resident.species || resident.group?.userData?.species || "rescued individual") + " to " + resident.homeworld,
      completed: false
    };
    this.items.push(task);
    resident.taskId = task.id;
    this.renderItems();
    return task.id;
  }

  completeTask(idOrResident) {
    const task = this.items.find(item =>
      item.id === idOrResident ||
      item.resident === idOrResident ||
      (idOrResident?.group && item.resident?.group === idOrResident.group)
    );
    if (!task) return false;
    task.completed = true;
    this.renderItems();
    return true;
  }

  render(host) {
    this.host = host;
    host.replaceChildren();
    this.card = document.createElement("article");
    Object.assign(this.card.style, this.styles.card);
    const title = document.createElement("h2");
    title.textContent = "TASKS";
    Object.assign(title.style, this.styles.title);
    this.list = document.createElement("div");
    this.card.append(title, this.list);
    host.append(this.card);
    this.renderItems();
  }

  renderItems() {
    if (!this.list) return;
    this.list.replaceChildren();
    if (!this.items.length) {
      const empty = document.createElement("p");
      empty.textContent = "No active tasks.";
      Object.assign(empty.style, this.styles.label);
      this.list.append(empty);
      return;
    }
    for (const task of this.items) {
      const row = document.createElement("div");
      Object.assign(row.style, this.styles.label);
      row.textContent = (task.completed ? "✓ " : "• ") + task.title + (task.completed ? " — COMPLETED" : "");
      if (task.completed) row.style.opacity = ".58";
      this.list.append(row);
    }
  }

  destroy() {
    this.host = null;
    this.list = null;
    this.card?.remove();
  }
}
