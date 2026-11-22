export function createSimulationCloud(simulation) {
  const data = simulation.data;

  function row(label, value) {
    return '<div class="sim-row"><span>' + label + '</span><strong>' + value + '</strong></div>';
  }

  function renderAccounts(host) {
    host.innerHTML = '<section id="simulation-cloud-page"><h2 class="sim-page-title">ACCOUNTS</h2><nav class="sim-tabs"><button data-tab="balance">BALANCE SHEET</button><button data-tab="income">INCOME STATEMENT</button><button data-tab="cash">CASH FLOW</button></nav><div id="sim-ledger"></div></section>';
    const ledger = host.querySelector("#sim-ledger");
    const render = tab => {
      host.querySelectorAll("[data-tab]").forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
      if (tab === "balance") {
        const value = data.team.inventory.reduce((sum, item) => sum + item.quantity * (item.value || 10), 0);
        ledger.innerHTML = "<h3>TEAM BALANCE SHEET</h3>" +
          row("Cash and Taydenite", data.team.cash.toLocaleString() + " T") +
          row("Stored resources", value.toLocaleString() + " T") +
          row("Fuel", simulation.getStatus("Rustbucket").energy.toFixed(0) + "%") +
          row("Tracked assets", (data.team.cash + value).toLocaleString() + " T");
      } else if (tab === "income") {
        ledger.innerHTML = "<h3>SPECIES INCOME STATEMENT</h3>" +
          simulation.species.map(name => row(name, data.populations[name].toLocaleString() + " population • " + data.revenue[name].toLocaleString() + " T revenue / " + data.expenses[name].toLocaleString() + " T expenses")).join("");
      } else {
        ledger.innerHTML = "<h3>TEAM CASH FLOW STATEMENT</h3>" +
          row("Opening cash", data.team.cash.toLocaleString() + " T") +
          row("Operating cash flow", "0 T") +
          row("Investing cash flow", "0 T") +
          row("Financing cash flow", "0 T") +
          (data.transactions || []).map(transaction => row(transaction.item, transaction.cost.toLocaleString() + " T • " + transaction.from)).join("") +
          "<p>Recorded transactions</p>";
      }
    };
    host.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => render(button.dataset.tab)));
    render("balance");
  }

  function renderInventory(host) {
    host.innerHTML = '<section id="simulation-cloud-page"><h2 class="sim-page-title">INVENTORY</h2><h3>RUSTBUCKET INVENTORY</h3><div id="sim-inventory"></div><h3>CHARACTER CARRIED ITEMS</h3><label>CHARACTER <select id="sim-carrier"><option>Ben</option><option>Gwen</option><option>Kevin</option><option>Rook</option></select></label><div id="sim-carried"></div></section>';
    const inventory = host.querySelector("#sim-inventory");
    const carried = host.querySelector("#sim-carried");
    const carrier = host.querySelector("#sim-carrier");
    const refresh = () => {
      inventory.innerHTML = data.team.inventory.map(item =>
        '<div class="sim-item"><span>' + item.name + ' ×' + item.quantity + '<small>' + item.category + '</small></span><button data-carry="' + item.id + '">CARRY</button></div>'
      ).join("") || "<p>Empty.</p>";
      carried.innerHTML = (data.team.carried[carrier.value] || []).map((item, index) =>
        '<div class="sim-item"><span>' + item + '</span><button data-store="' + index + '">STORE</button></div>'
      ).join("") || "<p>No carried items.</p>";
      inventory.querySelectorAll("[data-carry]").forEach(button => button.addEventListener("click", () => {
        simulation.moveItemToCharacter(button.dataset.carry, carrier.value);
        refresh();
      }));
      carried.querySelectorAll("[data-store]").forEach(button => button.addEventListener("click", () => {
        simulation.moveItemToShip(carrier.value, Number(button.dataset.store));
        refresh();
      }));
    };
    carrier.addEventListener("change", refresh);
    refresh();
  }

  function renderEvents(host) {
    host.innerHTML = '<section id="simulation-cloud-page"><h2 class="sim-page-title">EVENT LOG</h2><div id="sim-event-list"></div></section>';
    const list = host.querySelector("#sim-event-list");
    list.innerHTML = data.eventLog.map(event =>
      '<article class="sim-event"><b>' + event.type.toUpperCase() + '</b><p>' + event.description + '</p><small>STARTED ' + new Date(event.at).toLocaleString() + ' • ' + event.status.toUpperCase() + (event.endedAt ? ' • ENDED ' + new Date(event.endedAt).toLocaleString() : "") + '</small></article>'
    ).join("") || "<p>No recorded events.</p>";
  }

  function render(view, host) {
    if (!host) return;
    if (view === "accounting") renderAccounts(host);
    else if (view === "items") renderInventory(host);
    else if (view === "events") renderEvents(host);
  }

  return { render };
}
