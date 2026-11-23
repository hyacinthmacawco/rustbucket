export class Accounts {
  constructor(simulation) {
    this.simulation = simulation;
    this.data = simulation.data;
    this.styles = {
      page: { color: "#eaffef", fontFamily: "Industry, sans-serif" },
      title: { margin: "0 0 20px", color: "#9effb6", fontFamily: "Nulshock, sans-serif", letterSpacing: ".12em", fontSize: "1.2rem" },
      heading: { color: "#d8ffe2", letterSpacing: ".1em", fontSize: "1rem" },
      tabs: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" },
      tab: { padding: "9px 14px", border: "1px solid rgba(126,255,168,.4)", background: "rgba(4,25,14,.75)", color: "#d8ffe2", font: "inherit", letterSpacing: ".08em" },
      row: { display: "flex", justifyContent: "space-between", gap: "18px", padding: "12px 14px", borderBottom: "1px solid rgba(126,255,168,.16)", color: "#d8ffe2" }
    };
  }

  render(host) {
    host.replaceChildren();
    const section = document.createElement("section");
    Object.assign(section.style, this.styles.page);
    const title = document.createElement("h2");
    title.textContent = "ACCOUNTS";
    Object.assign(title.style, this.styles.title);
    this.tabs = document.createElement("nav");
    Object.assign(this.tabs.style, this.styles.tabs);
    this.ledger = document.createElement("div");
    section.append(title, this.tabs, this.ledger);
    host.append(section);
    this.renderTab("balance");
  }

  row(label, value) {
    const element = document.createElement("div");
    Object.assign(element.style, this.styles.row);
    const name = document.createElement("span");
    name.textContent = label;
    const amount = document.createElement("strong");
    amount.textContent = value;
    element.append(name, amount);
    return element;
  }

  renderTab(tab) {
    this.tabs.replaceChildren();
    for (const [key, label] of [["balance", "BALANCE SHEET"], ["income", "INCOME STATEMENT"], ["cash", "CASH FLOW"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      Object.assign(button.style, this.styles.tab);
      button.classList.toggle("active", key === tab);
      button.addEventListener("click", () => this.renderTab(key));
      this.tabs.append(button);
    }

    this.ledger.replaceChildren();
    const heading = document.createElement("h3");
    Object.assign(heading.style, this.styles.heading);

    if (tab === "balance") {
      heading.textContent = "TEAM BALANCE SHEET";
      this.ledger.append(
        heading,
        this.row("Cash and Taydenite", this.data.team.cash.toLocaleString() + " T"),
        this.row("Stored resources", this.data.team.inventory.reduce((sum, item) => sum + item.quantity * (item.value || 10), 0).toLocaleString() + " T"),
        this.row("Fuel", this.simulation.getStatus("Rustbucket").energy.toFixed(0) + "%")
      );
    } else if (tab === "income") {
      heading.textContent = "SPECIES INCOME STATEMENT";
      this.ledger.append(heading);
      for (const name of this.simulation.species) {
        this.ledger.append(this.row(name, this.data.populations[name].toLocaleString() + " population • " + this.data.revenue[name].toLocaleString() + " T revenue / " + this.data.expenses[name].toLocaleString() + " T expenses"));
      }
    } else {
      heading.textContent = "TEAM CASH FLOW STATEMENT";
      this.ledger.append(
        heading,
        this.row("Opening cash", this.data.team.cash.toLocaleString() + " T"),
        this.row("Operating cash flow", "0 T"),
        this.row("Investing cash flow", "0 T"),
        this.row("Financing cash flow", "0 T")
      );
      for (const transaction of this.data.transactions || []) {
        this.ledger.append(this.row(transaction.item, transaction.cost.toLocaleString() + " T • " + transaction.from));
      }
    }
  }
}
