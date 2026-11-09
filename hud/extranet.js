export function createExtranet({ onContinue = () => {} } = {}) {
  const root = document.createElement("section");
  root.id = "extranet-overlay";
  root.innerHTML = `
    <div id="extranet-window">
      <header id="extranet-header"><div><span class="extranet-mark">◉</span><strong>EXTRANET</strong><small>BEN 10 NETWORK</small></div><button id="extranet-close" aria-label="Close">×</button></header>
      <nav id="extranet-toolbar"><button id="extranet-back">‹</button><div id="extranet-address">extranet://home</div><button id="extranet-home">⌂</button></nav>
      <main id="extranet-page"></main>
    </div>`;
  document.body.appendChild(root);
  const page = root.querySelector("#extranet-page");
  const address = root.querySelector("#extranet-address");
  const relationships = {
    ben: { Gwen: 92, Kevin: 95, Rook: 90 },
    gwen: { Ben: 90, Kevin: 95, Rook: 80 },
    kevin: { Ben: 95, Gwen: 95, Rook: 85 },
    rook: { Ben: 98, Kevin: 85, Gwen: 80 }
  };
  const photos = [];
  let current = "home";
  let completed = false;
  let storedCount = 0;
  let completionPresented = false;
  let completionValues = [];

  function home() {
    current = "home"; address.textContent = "extranet://home";
    page.innerHTML = `<div class="extranet-welcome"><div class="extranet-orbit">◉</div><h1>Extranet</h1><p>Connected to the Plumber network</p></div>
      <div class="extranet-bookmarks"><button data-url="private">▣ <span><b>Private Cloud</b><small>ottps://bgkr.omnicloud.com</small></span></button><button data-url="omnidata">◎ <span><b>Omnidata</b><small>ottps://en.omnidata.org</small></span></button></div>`;
    page.querySelectorAll("[data-url]").forEach(b => b.addEventListener("click", () => b.dataset.url === "private" ? privateCloud() : omnidata()));
  }
  function privateCloud() {
    current = "private"; address.textContent = "ottps://bgkr.omnicloud.com";
    page.innerHTML = `<div class="cloud-heading"><div>PRIVATE CLOUD</div><small>BGKR • SECURE TEAM STORAGE</small></div><div class="cloud-links">
      <button data-page="tasks">▤ <span><b>Tasks</b><small>Current team objectives</small></span> ›</button>
      <button data-page="relationships">♡ <span><b>Relationships</b><small>Team connection status</small></span> ›</button>
      <button data-page="memories">▧ <span><b>Memories</b><small>Captured moments</small></span> ›</button></div>`;
    page.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => ({tasks,relationships:showRelationships,memories}[b.dataset.page])()));
  }
  function tasks() {
    current = "tasks"; address.textContent = "ottps://bgkr.omnicloud.com/tasks";
    const count = storedCount;
    page.innerHTML = `<div class="cloud-heading"><div>TASKS</div><small>ACTIVE MISSION</small></div><article class="task-card"><small>OBJECTIVE 01</small><h2>Put suitcases into Rustbucket</h2><p>Collect all four suitcases from the storage unit and load them aboard.</p><div class="task-progress"><span style="width:${count*25}%"></span></div><b>${count}/4 SUITCASES STORED</b></article>`;
    if (completed) showCompletion();
  }
  function showRelationships() {
    current = "relationships"; address.textContent = "ottps://bgkr.omnidata.org/relationships";
    const people = ["ben","gwen","kevin","rook"];
    page.innerHTML = `<div class="cloud-heading"><div>RELATIONSHIPS</div><small>TEAM CONNECTIONS</small></div><div class="relationship-tabs">${people.map(p=>`<button data-person="${p}">${p.toUpperCase()}</button>`).join("")}</div><div id="relationship-list"></div>`;
    const render = selected => {
      page.querySelectorAll("[data-person]").forEach(b=>b.classList.toggle("active",b.dataset.person===selected));
      const list = page.querySelector("#relationship-list");
      list.innerHTML = Object.entries(relationships[selected]).map(([name,value])=>`<div class="relationship-row"><span>${name}</span><div class="relationship-meter"><i style="width:${value}%"></i></div><b>${value.toFixed(1)}%</b></div>`).join("");
    };
    page.querySelectorAll("[data-person]").forEach(b=>b.addEventListener("click",()=>render(b.dataset.person)));
    render("ben");
  }
  function memories() {
    current = "memories"; address.textContent = "ottps://bgkr.omnicloud.com/memories";
    page.innerHTML = `<div class="cloud-heading"><div>MEMORIES</div><small>TEAM PHOTO ARCHIVE</small></div><button id="capture-memory" class="cloud-action">◎ CAPTURE SCREEN</button><div id="memory-grid">${photos.map((src,i)=>`<figure><img src="${src}" alt="Captured memory ${i+1}"><figcaption>MEMORY ${String(i+1).padStart(2,"0")}</figcaption></figure>`).join("")}</div>`;
    page.querySelector("#capture-memory").addEventListener("click", capturePhoto);
  }
  function omnidata() {
    current = "omnidata"; address.textContent = "ottps://en.omnidata.org";
    page.innerHTML = `<div class="cloud-heading"><div>OMNIDATA</div><small>INTERGALACTIC KNOWLEDGE INDEX</small></div><p class="extranet-copy">Welcome to Omnidata. The public knowledge portal is available from this terminal.</p>`;
  }
  function capturePhoto() {
    const canvas = document.querySelector("#omniverse");
    if (!canvas) return;
    try { photos.unshift(canvas.toDataURL("image/jpeg",0.82)); memories(); }
    catch (error) { console.warn("Could not capture memory", error); }
  }
  function addRelationship(picker, owner) {
    if (picker === owner) return;
    const key = picker[0].toUpperCase()+picker.slice(1);
    const other = owner[0].toUpperCase()+owner.slice(1);
    const record = relationships[picker];
    if (record && record[other] !== undefined) record[other] = Math.min(100, record[other] + 0.1);
    const reverse = relationships[owner];
    if (reverse && reverse[key] !== undefined) reverse[key] = Math.min(100, reverse[key] + 0.1);
    completionValues.push(`${key}-${other} +0.1%`);
  }
  function updateTask(count = storedCount + 1) {
    storedCount = Math.max(storedCount, count);
    tasks();
    if (storedCount >= 4 && !completed) {
      completed = true;
      showCompletion();
    }
  }
  function showCompletion() {
    if (completionPresented || document.getElementById("mission-complete")) return;
    completionPresented = true;
    const panel = document.createElement("div");
    panel.id = "mission-complete";
    panel.innerHTML = `<div class="mission-complete-title">TASK COMPLETED</div><div class="mission-complete-sub">RELATIONSHIP INCREASE</div><div class="mission-respect">${completionValues.map(v=>`<div>${v}</div>`).join("")}</div><button id="mission-continue">CONTINUE</button>`;
    document.body.appendChild(panel);
    panel.querySelector("#mission-continue").addEventListener("click",()=>{panel.remove();onContinue();});
  }
  root.querySelector("#extranet-close").addEventListener("click",close);
  root.querySelector("#extranet-back").addEventListener("click",()=>current==="home"?close():current==="private"||current==="omnidata"?home():privateCloud());
  root.querySelector("#extranet-home").addEventListener("click",home);
  function open() { root.style.display="flex"; home(); }
  function close() { root.style.display="none"; }
  home();
  return { open, close, addRelationship, updateTask, get completed(){return completed;}, get relationships(){return relationships;} };
}
