import { Accounts } from "./Accounts.js";
import { Inventory } from "./Inventory.js";
import { EventLog } from "./EventLog.js";

export class ExtranetBrowser {
  constructor(simulation) {
    this.simulation = simulation;
    this.pages = {
      accounting: new Accounts(simulation),
      items: new Inventory(simulation),
      events: new EventLog(simulation)
    };
    this.styles = {
      host: {
        minHeight: "100%",
        color: "#eaffef",
        fontFamily: "Industry, sans-serif"
      }
    };
  }

  render(view, host) {
    if (!host) return;
    Object.assign(host.style, this.styles.host);
    const page = this.pages[view];
    if (page) page.render(host);
    else host.replaceChildren();
  }

  destroy() {
    for (const page of Object.values(this.pages)) {
      page.destroy?.();
    }
    this.pages = {};
  }
}
