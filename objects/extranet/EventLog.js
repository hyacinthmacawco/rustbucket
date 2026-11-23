export class EventLog {
  constructor(simulation) {
    this.simulation = simulation;
    this.data = simulation.data;
    this.styles = {
      page: { color: "#eaffef", fontFamily: "Industry, sans-serif" },
      title: { margin: "0 0 20px", color: "#9effb6", fontFamily: "Nulshock, sans-serif", letterSpacing: ".12em", fontSize: "1.2rem" },
      event: { padding: "14px", marginBottom: "10px", border: "1px solid rgba(126,255,168,.2)", background: "rgba(4,20,12,.55)" },
      heading: { color: "#a6ffbd", letterSpacing: ".08em" },
      description: { color: "#d8ffe2" },
      date: { color: "#95c9a5", fontSize: ".78rem" }
    };
  }

  render(host) {
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
      Object.assign(heading.style, this.styles.heading);
      const description = document.createElement("p");
      description.textContent = event.description;
      Object.assign(description.style, this.styles.description);
      const date = document.createElement("small");
      date.textContent = "STARTED " + new Date(event.at).toLocaleString() + " • " + event.status.toUpperCase() + (event.endedAt ? " • ENDED " + new Date(event.endedAt).toLocaleString() : "");
      Object.assign(date.style, this.styles.date);
      article.append(heading, description, date);
      section.append(article);
    }

    if (!this.data.eventLog.length) section.append("No recorded events.");
    host.append(section);
  }
}
