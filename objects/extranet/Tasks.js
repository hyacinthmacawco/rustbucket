export class Tasks {
  constructor({ onComplete = () => {} } = {}) {
    this.onComplete = onComplete;
    this.storedCount = 0;
    this.completed = false;
    this.styles = {
      card: { padding: "18px", border: "1px solid rgba(126,255,168,.28)", borderRadius: "8px", background: "rgba(5,30,16,.72)" },
      title: { margin: "0 0 20px", color: "#9effb6", fontFamily: "Nulshock, sans-serif", letterSpacing: ".12em", fontSize: "1.2rem" },
      progress: { width: "100%", height: "8px", margin: "14px 0", overflow: "hidden", borderRadius: "8px", background: "rgba(126,255,168,.14)" },
      fill: { height: "100%", background: "#75f59a", transition: "width .2s ease" },
      label: { color: "#dfffe8", letterSpacing: ".08em" }
    };
  }

  render(host) {
    host.replaceChildren();
    const card = document.createElement("article");
    Object.assign(card.style, this.styles.card);
    const title = document.createElement("h2");
    title.textContent = "Put bags into Rustbucket";
    Object.assign(title.style, this.styles.title);
    const progress = document.createElement("div");
    Object.assign(progress.style, this.styles.progress);
    this.progressFill = document.createElement("div");
    Object.assign(this.progressFill.style, this.styles.fill);
    progress.append(this.progressFill);
    this.progressLabel = document.createElement("b");
    Object.assign(this.progressLabel.style, this.styles.label);
    card.append(title, progress, this.progressLabel);
    host.append(card);
    this.updateProgress();
  }

  updateProgress() {
    if (!this.progressFill || !this.progressLabel) return;
    this.progressFill.style.width = Math.min(100, this.storedCount * 25) + "%";
    this.progressLabel.textContent = this.storedCount + "/4 BAGS STORED";
  }

  update(count = this.storedCount + 1) {
    this.storedCount = Math.max(this.storedCount, count);
    this.updateProgress();

    if (this.storedCount >= 4 && !this.completed) {
      this.completed = true;
      this.onComplete();
    }

    return this.completed;
  }
}
