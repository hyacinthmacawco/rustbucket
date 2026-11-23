export class Accounts {
  constructor({ accounts = [] } = {}) { this.accounts=accounts; }
  render(host) { const section=document.createElement("section"); section.className="extranet-page accounts-page"; section.innerHTML="<h2>ACCOUNTS</h2>"; for(const account of this.accounts){const row=document.createElement("p");row.textContent=String(account.name??account);section.append(row);} host.replaceChildren(section); return section; }
}