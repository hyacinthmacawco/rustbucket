export class Account {
  constructor(storageKey = "rustbucket-account") {
    this.storageKey = storageKey;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(this.storageKey) || "null"); } catch {}
    this.balance = Number.isFinite(saved?.taydenite) ? Math.max(0, saved.taydenite) : 0;
  }

  spendTaydenite(amount) {
    const cost = Math.max(0, Math.floor(Number(amount) || 0));
    if (cost > this.balance) return false;
    this.balance -= cost;
    try { localStorage.setItem(this.storageKey, JSON.stringify({ taydenite: this.balance })); } catch {}
    return true;
  }

  addTaydenite(amount) {
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    this.balance += value;
    try { localStorage.setItem(this.storageKey, JSON.stringify({ taydenite: this.balance })); } catch {}
    return this.balance;
  }
}
