import { Relationships } from "./Relationships.js";
import { Omnipedia } from "./Omnipedia.js";
import { Accounts } from "./Accounts.js";

export class Helix {
  constructor({ onJumpSystem = () => {}, account = null, audioPlayer = null } = {}) {
    this.onJumpSystem = onJumpSystem;
    this.account = account;
    this.audioPlayer = audioPlayer;
    this.current = "home";
    this.currentLocation = "earth";
    this.history = [];
    this.historyIndex = -1;
    this.tabs = [{ id: 1, title: "New Tab", url: "extranet://home" }];
    this.activeTabId = 1;
    this.nextTabId = 2;
    this.pages = {
      relationships: new Relationships(),
      accounts: new Accounts(this.account)
    };
    this.sites = [
      { title: "Private Cloud", url: "ottps://bgkr.omnicloud.com" },
      { title: "Relationships — Private Cloud", url: "ottps://bgkr.omnicloud.com/relationships" },
      { title: "Accounts — Private Cloud", url: "ottps://bgkr.omnicloud.com/accounts" },
      { title: "Omnidata", url: "ottps://en.omnidata.org" },
      { title: "Helix Home", url: "extranet://home" }
    ];
    this.systems = {
      solar: { name: "SOLAR SYSTEM", body: "The Solar System, also known as the Sol System, is a system of eight planets that orbit the sun, located in the Milky Way Galaxy.", worlds: "Earth", status: "ACTIVE / HOME SYSTEM" },
      highbreed: { name: "HIGHBREED HOMEWORLD", body: "Augstaka is the Highbreed homeworld, known for its temperate climate, rolling green hills and coastal waters.", worlds: "Augstaka • at least one moon", status: "ACTIVE / AUGSTAKA" },
      incursean: { name: "INCURSEAN HOMEWORLD", body: "Incursia was the Incursean homeworld. It was destroyed after an attempt to use Ascalon to end a civil war.", worlds: "Incursia (destroyed)", status: "DESTROYED / HISTORICAL" },
      anodite: { name: "ANODITE HOMEWORLD", body: "Anodyne is the home planet of the Anodites.", worlds: "Anodyne", status: "ACTIVE / ANODYNE" },
      galvan: { name: "GALVAN STAR SYSTEM", body: "Galvan is the system's star. Galvan Prime is the Galvan homeworld; Galvan B is its moon and home of the Galvanic Mechamorphs.", worlds: "Galvan • Galvan Prime • Galvan B", status: "ACTIVE / GALVAN PRIME" }
    };
    this.omnipedia = new Omnipedia({ systems: this.systems, onJumpSystem: this.onJumpSystem });
    this.styles = {
      root: { position: "fixed", inset: "0", display: "none", alignItems: "center", justifyContent: "center", padding: "max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))", background: "rgba(0, 8, 4, .72)", zIndex: "100" },
      window: { width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(126,255,168,.42)", borderRadius: "12px", background: "rgba(3, 18, 10, .96)", boxShadow: "0 0 45px rgba(56,255,128,.14)" },
      toolbar: { display: "flex", alignItems: "center", gap: "6px", padding: "9px", background: "rgba(7,32,17,.94)" },
      button: { padding: "9px 10px", border: "1px solid rgba(126,255,168,.38)", borderRadius: "5px", background: "rgba(7,42,22,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".06em", cursor: "pointer", whiteSpace: "nowrap" },
      address: { width: "100%", minWidth: "0", padding: "9px 10px", border: "1px solid rgba(126,255,168,.25)", borderRadius: "5px", background: "rgba(0,10,5,.7)", color: "#baffcb", font: "inherit", boxSizing: "border-box" },
      page: { flex: "1", minHeight: "0", overflow: "auto", padding: "clamp(14px, 3vw, 28px)", color: "#eaffef", fontFamily: "Industry, sans-serif" },
      bookmarkGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" },
      bookmark: { minHeight: "110px", padding: "18px", border: "1px solid rgba(126,255,168,.35)", borderRadius: "8px", background: "rgba(5,35,18,.78)", color: "#eaffef", font: "inherit", fontSize: "1.1rem", letterSpacing: ".1em", textAlign: "left", cursor: "pointer" },
      launchButton: { position: "fixed", bottom: "max(98px, calc(env(safe-area-inset-bottom) + 76px))", right: "max(22px, env(safe-area-inset-right))", zIndex: "30", padding: "10px 14px", border: "none", borderRadius: "20px", background: "rgba(5,30,18,.84)", color: "#eaffef", font: "inherit", letterSpacing: ".08em" }
    };

    this.root = document.createElement("section");
    this.root.id = "helix-overlay";
    Object.assign(this.root.style, this.styles.root);
    this.window = document.createElement("div");
    Object.assign(this.window.style, this.styles.window);
    this.toolbar = document.createElement("nav");
    Object.assign(this.toolbar.style, this.styles.toolbar);
    this.backButton = this.createToolbarButton("BACK", "Back");
    this.addressWrap = document.createElement("div");
    Object.assign(this.addressWrap.style, { position: "relative", flex: "1", minWidth: "0" });
    this.address = document.createElement("input");
    this.address.type = "text";
    this.address.value = "extranet://home";
    this.address.setAttribute("aria-label", "Web address");
    Object.assign(this.address.style, this.styles.address);
    this.suggestions = document.createElement("div");
    Object.assign(this.suggestions.style, { display: "none", position: "absolute", top: "calc(100% + 4px)", left: "0", right: "0", maxHeight: "220px", overflowY: "auto", zIndex: "5", border: "1px solid rgba(126,255,168,.35)", borderRadius: "5px", background: "rgba(2,18,9,.98)" });
    this.addressWrap.append(this.address, this.suggestions);
    this.goButton = this.createToolbarButton("GO", "Go to address");
    this.homeButton = this.createToolbarButton("HOME", "Home");
    this.newTabButton = this.createToolbarButton("+", "New tab");
    this.closeButton = this.createToolbarButton("CLOSE", "Close Helix");
    this.toolbar.append(this.backButton, this.addressWrap, this.goButton, this.homeButton, this.newTabButton, this.closeButton);
    this.tabsBar = document.createElement("nav");
    Object.assign(this.tabsBar.style, { display: "flex", gap: "5px", overflowX: "auto", padding: "5px 9px", borderTop: "1px solid rgba(126,255,168,.12)", background: "rgba(3,18,10,.96)" });
    this.page = document.createElement("main");
    Object.assign(this.page.style, this.styles.page);
    this.window.append(this.toolbar, this.tabsBar, this.page);
    this.root.append(this.window);
    document.body.append(this.root);

    this.taskCompletedPage = document.createElement("section");
    Object.assign(this.taskCompletedPage.style, { display: "none", width: "min(92vw, 560px)", minHeight: "300px", boxSizing: "border-box", padding: "clamp(24px, 6vw, 54px)", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", textAlign: "center", color: "#eaffef", border: "1px solid rgba(126,255,168,.5)", borderRadius: "12px", background: "rgba(3,18,10,.98)", boxShadow: "0 0 45px rgba(56,255,128,.2)" });
    this.taskHeading = document.createElement("h1");
    this.taskHeading.textContent = "TASK COMPLETED";
    Object.assign(this.taskHeading.style, { margin: "0", color: "#9effb6", letterSpacing: ".12em" });
    this.taskSummary = document.createElement("div");
    Object.assign(this.taskSummary.style, { display: "grid", gap: "12px", fontSize: "1.05rem", letterSpacing: ".06em" });
    this.continueButton = this.createToolbarButton("CONTINUE", "Continue");
    this.taskCompletedPage.append(this.taskHeading, this.taskSummary, this.continueButton);
    this.root.append(this.taskCompletedPage);

    this.backButton.addEventListener("click", this.goBack);
    this.goButton.addEventListener("click", this.goToAddress);
    this.homeButton.addEventListener("click", this.home);
    this.newTabButton.addEventListener("click", this.createTab);
    this.closeButton.addEventListener("click", this.close);
    this.continueButton.addEventListener("click", this.continueAfterTask);
    this.address.addEventListener("keydown", this.handleAddressKey);
    this.address.addEventListener("input", this.updateSuggestions);
    this.address.addEventListener("focus", this.updateSuggestions);
    this.home();
    this.renderTabs();
  }

  createToolbarButton(label, ariaLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    Object.assign(button.style, this.styles.button);
    return button;
  }

  createButton() {
    this.launchButton = document.createElement("button");
    this.launchButton.type = "button";
    this.launchButton.id = "helix-button";
    this.launchButton.textContent = "HELIX";
    Object.assign(this.launchButton.style, this.styles.launchButton);
    this.launchButton.addEventListener("click", this.open);
    document.body.append(this.launchButton);
    return this.launchButton;
  }

  get activeTab() { return this.tabs.find(tab => tab.id === this.activeTabId) || this.tabs[0]; }

  renderTabs() {
    this.tabsBar.replaceChildren();
    for (const tab of this.tabs) {
      const item = document.createElement("div");
      Object.assign(item.style, { display: "flex", alignItems: "center", gap: "7px", minWidth: "100px", maxWidth: "190px", padding: "6px 8px", borderRadius: "5px", background: tab.id === this.activeTabId ? "rgba(25,82,43,.9)" : "rgba(4,28,14,.8)", color: "#dfffe8", fontSize: "11px", whiteSpace: "nowrap" });
      const title = document.createElement("button");
      title.type = "button";
      title.textContent = tab.title;
      Object.assign(title.style, { flex: "1", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", background: "transparent", color: "inherit", border: "0", textAlign: "left", font: "inherit" });
      title.addEventListener("click", () => this.activateTab(tab.id));
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "×";
      close.setAttribute("aria-label", "Close " + tab.title);
      Object.assign(close.style, { background: "transparent", color: "inherit", border: "0", font: "16px sans-serif", cursor: "pointer" });
      close.addEventListener("click", event => { event.stopPropagation(); this.closeTab(tab.id); });
      item.append(title, close);
      this.tabsBar.append(item);
    }
  }

  createTab = () => {
    const tab = { id: this.nextTabId++, title: "New Tab", url: "extranet://home" };
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.renderTabs();
    this.navigate(tab.url);
  };

  activateTab(id) {
    const tab = this.tabs.find(item => item.id === id);
    if (!tab) return;
    this.activeTabId = id;
    this.renderTabs();
    this.navigate(tab.url, { record: false });
  }

  closeTab(id) {
    if (this.tabs.length === 1) {
      this.activeTab.url = "extranet://home";
      this.activeTab.title = "New Tab";
      this.activeTabId = this.activeTab.id;
      this.navigate("extranet://home");
      this.renderTabs();
      return;
    }
    const index = this.tabs.findIndex(tab => tab.id === id);
    this.tabs = this.tabs.filter(tab => tab.id !== id);
    if (this.activeTabId === id) {
      const next = this.tabs[Math.max(0, index - 1)];
      this.activeTabId = next.id;
      this.navigate(next.url, { record: false });
    }
    this.renderTabs();
  }

  updateSuggestions = () => {
    const query = this.address.value.trim().toLowerCase();
    this.suggestions.replaceChildren();
    const matches = this.sites.filter(site => !query || site.title.toLowerCase().includes(query) || site.url.toLowerCase().includes(query));
    for (const site of matches.slice(0, 6)) {
      const option = document.createElement("button");
      option.type = "button";
      option.textContent = site.title + "   " + site.url;
      Object.assign(option.style, { display: "block", width: "100%", padding: "10px", border: "0", borderBottom: "1px solid rgba(126,255,168,.12)", background: "transparent", color: "#dfffe8", textAlign: "left", font: "11px Industry, sans-serif", cursor: "pointer" });
      option.addEventListener("click", () => { this.address.value = site.url; this.suggestions.style.display = "none"; this.navigate(site.url); });
      this.suggestions.append(option);
    }
    this.suggestions.style.display = matches.length ? "block" : "none";
  };

  handleAddressKey = event => {
    if (event.key === "Enter") { event.preventDefault(); this.goToAddress(); }
    if (event.key === "Escape") this.suggestions.style.display = "none";
  };

  goToAddress = () => {
    this.suggestions.style.display = "none";
    this.navigate(this.address.value);
    this.address.blur();
  };

  navigate(rawUrl, { record = true, allowSystemJump = false } = {}) {
    let url = String(rawUrl || "").trim().toLowerCase();
    if (!url) return false;
    if (url.endsWith("/") && url !== "extranet://home") url = url.slice(0, -1);
    if (url.startsWith("bgkr.omnicloud.com")) url = "ottps://" + url;
    if (url.startsWith("en.omnidata.org")) url = "ottps://" + url;
    const valid = url === "extranet://home" ||
      url === "ottps://bgkr.omnicloud.com" ||
      ["relationships", "accounts"].some(path => url === "ottps://bgkr.omnicloud.com/" + path) ||
      url === "ottps://en.omnidata.org";
    if (!valid) {
      this.current = "notfound";
      this.address.value = rawUrl;
      this.page.replaceChildren();
      const message = document.createElement("h2");
      message.textContent = "THIS SITE CANNOT BE REACHED";
      this.page.append(message);
      this.setTabDetails("Unavailable", rawUrl);
      return false;
    }
    if (record) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(url);
      this.historyIndex = this.history.length - 1;
    }
    this.activeTab.url = url;
    this.address.value = url;
    this.suggestions.style.display = "none";
    if (url === "extranet://home") this.renderHome();
    else if (url === "ottps://bgkr.omnicloud.com") this.renderPrivateCloud();
    else if (url.endsWith("/relationships")) this.renderRelationships();
    else if (url.endsWith("/accounts")) this.renderAccounts();
    else this.renderOmnidata(allowSystemJump);
    this.renderTabs();
    return true;
  }

  setTabDetails(title, url = this.activeTab.url) {
    this.activeTab.title = title;
    this.activeTab.url = url;
    this.renderTabs();
  }

  goBack = () => {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.navigate(this.history[this.historyIndex], { record: false });
    } else this.close();
  };

  renderHome() {
    this.current = "home";
    this.setTabDetails("Home", "extranet://home");
    this.page.replaceChildren();
    const grid = document.createElement("div");
    Object.assign(grid.style, this.styles.bookmarkGrid);
    for (const site of this.sites.filter(item => item.url === "ottps://bgkr.omnicloud.com" || item.url === "ottps://en.omnidata.org")) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = site.title;
      Object.assign(button.style, this.styles.bookmark);
      button.addEventListener("click", () => this.navigate(site.url));
      grid.append(button);
    }
    this.page.append(grid);
  }

  renderPrivateCloud() {
    this.current = "private";
    this.setTabDetails("Private Cloud");
    this.page.replaceChildren();
    const grid = document.createElement("div");
    Object.assign(grid.style, this.styles.bookmarkGrid);
    for (const [label, path] of [["Relationships", "relationships"], ["Accounts", "accounts"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      Object.assign(button.style, this.styles.bookmark);
      button.addEventListener("click", () => this.navigate("ottps://bgkr.omnicloud.com/" + path));
      grid.append(button);
    }
    this.page.append(grid);
  }

  renderRelationships() {
    this.current = "relationships";
    this.setTabDetails("Relationships");
    this.pages.relationships.render(this.page);
  }

  renderAccounts() {
    this.current = "accounts";
    this.setTabDetails("Accounts");
    this.pages.accounts.render(this.page);
  }

  renderOmnidata(allowSystemJump = false) {
    this.current = "omnidata";
    this.setTabDetails("Omnidata");
    this.omnipedia.render(this.page, { allowSystemJump, currentLocation: this.currentLocation });
  }

  home = () => this.navigate("extranet://home");
  privateCloud = () => this.navigate("ottps://bgkr.omnicloud.com");
  showRelationships = () => this.navigate("ottps://bgkr.omnicloud.com/relationships");
  accounts = () => this.navigate("ottps://bgkr.omnicloud.com/accounts");
  omnidata = (allowSystemJump = false) => this.navigate("ottps://en.omnidata.org", { allowSystemJump });
  updateAccount() { this.pages.accounts.update(); }

  setLocation(location) {
    this.currentLocation = location;
    this.omnipedia.setLocation(location);
  }

  open = () => {
    this.root.style.display = "flex";
    this.window.style.display = "flex";
    this.taskCompletedPage.style.display = "none";
    this.home();
  };

  openOmnidata = () => {
    this.root.style.display = "flex";
    this.window.style.display = "flex";
    this.taskCompletedPage.style.display = "none";
    this.omnidata(true);
  };

  close = () => { this.root.style.display = "none"; };

  destroy() {
    this.pages.relationships.destroy?.();
    this.pages.accounts.destroy?.();
    this.backButton.removeEventListener("click", this.goBack);
    this.goButton.removeEventListener("click", this.goToAddress);
    this.homeButton.removeEventListener("click", this.home);
    this.newTabButton.removeEventListener("click", this.createTab);
    this.closeButton.removeEventListener("click", this.close);
    this.continueButton.removeEventListener("click", this.continueAfterTask);
    this.address.removeEventListener("keydown", this.handleAddressKey);
    this.address.removeEventListener("input", this.updateSuggestions);
    this.address.removeEventListener("focus", this.updateSuggestions);
    this.launchButton?.removeEventListener("click", this.open);
    this.launchButton?.remove();
    this.root.remove();
  }
}
