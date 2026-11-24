export class Accounts {
  constructor(account) {
    this.account = account;
    this.element = null;
  }

  render(container) {
    container.replaceChildren();
    this.element = document.createElement("section");
    Object.assign(this.element.style, {
      minHeight: "100%",
      display: "grid",
      placeContent: "center",
      justifyItems: "center",
      gap: "12px",
      color: "#eaffef",
      textAlign: "center"
    });
    const heading = document.createElement("h1");
    heading.textContent = "ACCOUNTS";
    const label = document.createElement("div");
    label.textContent = "TAYDENITE BALANCE";
    label.style.letterSpacing = ".12em";
    this.balance = document.createElement("div");
    this.balance.style.fontSize = "clamp(28px, 6vw, 48px)";
    this.balance.style.fontWeight = "700";
    this.element.append(heading, label, this.balance);
    container.append(this.element);
    this.update();
  }

  update() {
    if (this.balance) this.balance.textContent = String(this.account?.balance ?? 0);
  }

  destroy() {
    this.element?.remove();
    this.element = null;
    this.balance = null;
  }
}
