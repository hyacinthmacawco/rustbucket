export class ExtranetBrowser {
  constructor(simulation) {
    this.simulation = simulation;
    this.data = simulation.data;
    this.styles = {
      page: { minHeight: "100%", padding: "clamp(14px, 3vw, 30px)", color: "#eaffef", fontFamily: "Industry, sans-serif" },
      title: { margin: "0 0 20px", color: "#9effb6", fontFamily: "Nulshock, sans-serif", letterSpacing: ".12em", fontSize: "1.2rem" },
      heading: { color: "#d8ffe2", letterSpacing: ".1em", fontSize: "1rem" },
      tabs: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" },
      tab: { padding: "9px 14px", border: "1px solid rgba(126,255,168,.4)", background: "rgba(4,25,14,.75)", color: "#d8ffe2", font: "inherit", letterSpacing: ".08em" },
      row: { display: "flex", justifyContent: "space-between", gap: "18px", padding: "12px 14px", borderBottom: "1px solid rgba(126,255,168,.16)", color: "#d8ffe2" },
      item: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "12px", borderBottom: "1px solid rgba(126,255,168,.16)" },
      button: { padding: "8px 12px", border: "1px solid rgba(126,255,168,.45)", background: "rgba(7,42,22,.8)", color: "#eaffef", font: "inherit" },
      event: { padding: "14px", marginBottom: "10px", border: "1px solid rgba(126,255,168,.2)", background: "rgba(4,20,12,.55)" }
    };
  }

  row(label, value) {
    const element = document.createElement("div");
    element.className = "sim-row";
    Object.assign(element.style, this.styles.row);
    const name = document.createElement("span");
    name.textContent = label;
    const amount = document.createElement("strong");
    amount.textContent = value;
    element.append(name, amount);
    return element;
  }

  renderAccounts(host) {
    host.replaceChildren();
    const section = document.createElement("section");
    Object.assign(section.style, this.styles.page);
    const title = document.createElement("h2");
    title.textContent = "ACCOUNTS";
    Object.assign(title.style, this.styles.title);
    const tabs = document.createElement("nav");
    Object.assign(tabs.style, this.styles.tabs);
    const ledger = document.createElement("div");
    section.append(title, tabs, ledger);
    host.append(section);

    const render = tab => {
      tabs.replaceChildren();
      for (const [key, label] of [["balance", "BALANCE SHEET"], ["income", "INCOME STATEMENT"], ["cash", "CASH FLOW"]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        Object.assign(button.style, this.styles.tab);
        button.classList.toggle("active", key === tab);
        button.addEventListener("click", () => render(key));
        tabs.append(button);
      }
      ledger.replaceChildren();
      const heading = document.createElement("h3");
      Object.assign(heading.style, this.styles.heading);
      if (tab === "balance") {
        heading.textContent = "TEAM BALANCE SHEET";
        ledger.append(heading,
          this.row("Cash and Taydenite", this.data.team.cash.toLocaleString() + " T"),
          this.row("Stored resources", this.data.team.inventory.reduce((sum, item) => sum + item.quantity * (item.value || 10), 0).toLocaleString() + " T"),
          this.row("Fuel", this.simulation.getStatus("Rustbucket").energy.toFixed(0) + "%"));
      } else if (tab === "income") {
        heading.textContent = "SPECIES INCOME STATEMENT";
        ledger.append(heading);
        for (const name of this.simulation.species) {
          ledger.append(this.row(name, this.data.populations[name].toLocaleString() + " population • " + this.data.revenue[name].toLocaleString() + " T revenue / " + this.data.expenses[name].toLocaleString() + " T expenses"));
        }
      } else {
        heading.textContent = "TEAM CASH FLOW STATEMENT";
        ledger.append(heading,
          this.row("Opening cash", this.data.team.cash.toLocaleString() + " T"),
          this.row("Operating cash flow", "0 T"),
          this.row("Investing cash flow", "0 T"),
          this.row("Financing cash flow", "0 T"));
        for (const transaction of this.data.transactions || []) {
          ledger.append(this.row(transaction.item, transaction.cost.toLocaleString() + " T • " + transaction.from));
        }
      }
    };
    render("balance");
  }

  renderInventory(host) {
    host.replaceChildren();
    const section = document.createElement("section");
    Object.assign(section.style, this.styles.page);
    const title = document.createElement("h2");
    title.textContent = "INVENTORY";
    Object.assign(title.style, this.styles.title);
    const shipHeading = document.createElement("h3");
    shipHeading.textContent = "RUSTBUCKET INVENTORY";
    Object.assign(shipHeading.style, this.styles.heading);
    const inventory = document.createElement("div");
    const carrierHeading = document.createElement("h3");
    carrierHeading.textContent = "CHARACTER CARRIED ITEMS";
    Object.assign(carrierHeading.style, this.styles.heading);
    const label = document.createElement("label");
    label.textContent = "CHARACTER ";
    const carrier = document.createElement("select");
    for (const name of ["Ben", "Gwen", "Kevin", "Rook"]) {
      const option = document.createElement("option");
      option.textContent = name;
      carrier.append(option);
    }
    label.append(carrier);
    const carried = document.createElement("div");
    section.append(title, shipHeading, inventory, carrierHeading, label, carried);
    host.append(section);

    const refresh = () => {
      inventory.replaceChildren();
      carried.replaceChildren();
      for (const item of this.data.team.inventory) {
        const row = document.createElement("div");
        Object.assign(row.style, this.styles.item);
        const label = document.createElement("span");
        label.textContent = item.name + " ×" + item.quantity + " · " + item.category;
        const button = document.createElement("button");
        button.textContent = "CARRY";
        Object.assign(button.style, this.styles.button);
        button.addEventListener("click", () => {
          this.simulation.moveItemToCharacter(item.id, carrier.value);
          refresh();
        });
        row.append(label, button);
        inventory.append(row);
      }
      const carriedItems = this.data.team.carried[carrier.value] || [];
      for (const [index, item] of carriedItems.entries()) {
        const row = document.createElement("div");
        Object.assign(row.style, this.styles.item);
        const name = document.createElement("span");
        name.textContent = item;
        const button = document.createElement("button");
        button.textContent = "STORE";
        Object.assign(button.style, this.styles.button);
        button.addEventListener("click", () => {
          this.simulation.moveItemToShip(carrier.value, index);
          refresh();
        });
        row.append(name, button);
        carried.append(row);
      }
    };
    carrier.addEventListener("change", refresh);
    refresh();
  }

  renderEvents(host) {
    host.replaceChildren();
    const section = document.createElement("section");
    Object.assign(section.style, this.styles.page);
    const title = document.createElement("h2");
    title.textContent = "EVENT LOG";
    Object.assign(title.style, this.styles.title);
    section.append(title);
    for (const event of this.data.eventLog) {
      const article = document.createElement("article");
      Object.assign(article.style, this.styles.event);
      const heading = document.createElement("b");
      heading.textContent = event.type.toUpperCase();
      const description = document.createElement("p");
      description.textContent = event.description;
      const date = document.createElement("small");
      date.textContent = "STARTED " + new Date(event.at).toLocaleString() + " • " + event.status.toUpperCase() + (event.endedAt ? " • ENDED " + new Date(event.endedAt).toLocaleString() : "");
      article.append(heading, description, date);
      section.append(article);
    }
    if (!this.data.eventLog.length) section.append("No recorded events.");
    host.append(section);
  }

  render(view, host) {
    if (!host) return;
    if (view === "accounting") this.renderAccounts(host);
    else if (view === "items") this.renderInventory(host);
    else if (view === "events") this.renderEvents(host);
  }
}
