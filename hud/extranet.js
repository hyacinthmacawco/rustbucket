export function createExtranet({ onContinue = () => {}, onComplete = () => {} } = {}) {
  const root = document.createElement("section");
  root.id = "extranet-overlay";
  root.innerHTML = `
    <div id="extranet-window">
      <nav id="extranet-toolbar"><button id="extranet-back" aria-label="Back">‹</button><input id="extranet-address" aria-label="Web address" value="extranet://home"><button id="extranet-home" aria-label="Home">⌂</button><button id="extranet-close" aria-label="Close">×</button></nav>
      <main id="extranet-page"></main>
    </div>`;
  document.body.appendChild(root);
  const page = root.querySelector("#extranet-page");
  const address = root.querySelector("#extranet-address");
  // Directional relationship values: each character has an independent
  // opinion of every other character. Self-relationships remain zero.
  const relationshipNames = ["ben","gwen","kevin","rook"];
  const relationships = {
    ben:   { ben:0, gwen:92, kevin:95, rook:90 },
    gwen:  { ben:90, gwen:0, kevin:95, rook:80 },
    kevin: { ben:95, gwen:95, kevin:0, rook:85 },
    rook:  { ben:98, gwen:80, kevin:85, rook:0 }
  };
  const photos = [];
  let current = "home";
  let completed = false;
  let storedCount = 0;
  let completionPresented = false;
  let completionValues = [];
  let currentLocation = "earth";

  function home() {
    current = "home"; address.value = "extranet://home";
    page.innerHTML = `<div class="extranet-bookmarks"><button data-url="private">▣ <span><b>Private Cloud</b><small>ottps://bgkr.omnicloud.com</small></span></button><button data-url="omnidata">◎ <span><b>Omnidata</b><small>ottps://en.omnidata.org</small></span></button></div>`;
    page.querySelectorAll("[data-url]").forEach(b => b.addEventListener("click", () => b.dataset.url === "private" ? privateCloud() : omnidata()));
  }
  function privateCloud() {
    current = "private"; address.value = "ottps://bgkr.omnicloud.com";
    page.innerHTML = `<div class="cloud-links">
      <button data-page="tasks">▤ <span><b>Tasks</b><small>Current team objectives</small></span> ›</button>
      <button data-page="relationships">♡ <span><b>Relationships</b><small>Team connection status</small></span> ›</button>
      <button data-page="memories">▧ <span><b>Memories</b><small>Captured moments</small></span> ›</button></div>`;
    page.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => ({tasks,relationships:showRelationships,memories}[b.dataset.page])()));
  }
  function tasks() {
    current = "tasks"; address.value = "ottps://bgkr.omnicloud.com/tasks";
    const count = storedCount;
    page.innerHTML = `<article class="task-card"><h2>Put suitcases into Rustbucket</h2><div class="task-progress"><span style="width:${count*25}%"></span></div><b>${count}/4 SUITCASES STORED</b></article>`;
    if (completed) showCompletion();
  }
  function showRelationships() {
    current = "relationships"; address.value = "ottps://bgkr.omnicloud.com/relationships";
    const people = ["ben","gwen","kevin","rook"];
    page.innerHTML = `<div class="relationship-tabs">${people.map(p=>`<button data-person="${p}">${p.toUpperCase()}</button>`).join("")}</div><div id="relationship-list"></div>`;
    const render = selected => {
      page.querySelectorAll("[data-person]").forEach(b=>b.classList.toggle("active",b.dataset.person===selected));
      const list = page.querySelector("#relationship-list");
      list.innerHTML = relationshipNames.filter(name => name !== selected).map(name => {
        const value = relationships[selected][name];
        const label = name[0].toUpperCase() + name.slice(1);
        return `<div class="relationship-row"><span>${label}</span><div class="relationship-meter"><i style="width:${value}%"></i></div><b>${value.toFixed(1)}%</b></div>`;
      }).join("");
    };
    page.querySelectorAll("[data-person]").forEach(b=>b.addEventListener("click",()=>render(b.dataset.person)));
    render("ben");
  }
  function memories() {
    current = "memories"; address.value = "ottps://bgkr.omnicloud.com/memories";
    page.innerHTML = `<button id="capture-memory" class="cloud-action">◎ CAPTURE SCREEN</button><div id="memory-grid">${photos.map((src,i)=>`<figure><img src="${src}" alt="Captured memory ${i+1}"></figure>`).join("")}</div>`;
    page.querySelector("#capture-memory").addEventListener("click", capturePhoto);
  }
  function omnidata() {
    current = "omnidata"; address.value = "ottps://en.omnidata.org";
    const systems = {
      solar: {name:"SOLAR SYSTEM", body:"Earth, the Moon, Mars and other known worlds orbit the Sun. Earth is the team's homeworld.", worlds:"Earth • Moon • Mars • Saturn • Pluto", status:"ACTIVE / HOME SYSTEM", source:"https://ben10.fandom.com/wiki/Solar_System"},
      highbreed: {name:"HIGHBREED HOMEWORLD", body:"Augstaka is the Highbreed homeworld. It is described as a temperate world with rolling green hills, coastal waters and large cities. At least one moon is known; the wiki does not give this system a canonical name.", worlds:"Augstaka • at least one moon", status:"ACTIVE / AUGSTAKA", source:"https://ben10.fandom.com/wiki/Augstaka"},
      incursean: {name:"INCURSEAN HOMEWORLD", body:"Incursia was the Incursean homeworld. It was destroyed after an attempt to use Ascalon to end a civil war. The wiki does not give this system a canonical name.", worlds:"Incursia (destroyed)", status:"DESTROYED / HISTORICAL", source:"https://ben10.fandom.com/wiki/Incursia"},
      anodite: {name:"ANODITE HOMEWORLD", body:"Anodyne is the home planet of the Anodites. From space it appears dark red, with orange rings; the wiki does not give this system a canonical name.", worlds:"Anodyne", status:"ACTIVE / ANODYNE", source:"https://ben10.fandom.com/wiki/Anodyne"},
      galvan: {name:"GALVAN STAR SYSTEM", body:"Galvan is the system's star. Galvan Prime is the Galvan homeworld; Galvan B is its moon and home of the Galvanic Mechamorphs.", worlds:"Galvan • Galvan Prime • Galvan B", status:"ACTIVE / GALVAN PRIME", source:"https://ben10.fandom.com/wiki/Galvan_Star_System_(Classic)"}
    };
    page.innerHTML = `<div id="omnidata-layout">
        <div id="omnidata-map-wrap">
          <svg id="omnidata-map" viewBox="0 0 900 520" role="img" aria-label="Connected map of five Ben 10 star systems">
            <defs><radialGradient id="omni-nebula"><stop stop-color="#174d35" stop-opacity=".42"/><stop offset="1" stop-color="#07140f" stop-opacity="0"/></radialGradient></defs>
            <rect width="900" height="520" rx="14" fill="#06140e"/>
            <ellipse cx="455" cy="255" rx="420" ry="245" fill="url(#omni-nebula)"/>
            <g class="omni-routes"><path d="M130 370 L335 155 L560 105 L770 280 L565 425 L130 370"/><path d="M335 155 L565 425"/><path d="M560 105 L770 280"/></g>
            <g class="omni-stars"><circle cx="65" cy="65" r="1.5"/><circle cx="250" cy="70" r="2"/><circle cx="430" cy="65" r="1.4"/><circle cx="700" cy="70" r="1.6"/><circle cx="840" cy="150" r="1.5"/><circle cx="90" cy="250" r="1.4"/><circle cx="430" cy="300" r="1.4"/><circle cx="830" cy="440" r="2"/><circle cx="300" cy="450" r="1.5"/></g>
            <g class="omni-node" data-system="solar" tabindex="0" role="button" aria-label="Solar System"><circle class="omni-halo" cx="130" cy="370" r="30"/><circle class="omni-core solar" cx="130" cy="370" r="10"/><text x="130" y="414" text-anchor="middle">SOLAR</text></g>
            <g class="omni-node" data-system="highbreed" tabindex="0" role="button" aria-label="Highbreed System"><circle class="omni-halo" cx="335" cy="155" r="30"/><circle class="omni-core highbreed" cx="335" cy="155" r="10"/><text x="335" y="199" text-anchor="middle">HIGHBREED</text></g>
            <g class="omni-node" data-system="incursean" tabindex="0" role="button" aria-label="Incursean System"><circle class="omni-halo" cx="560" cy="105" r="30"/><circle class="omni-core incursean" cx="560" cy="105" r="10"/><text x="560" y="149" text-anchor="middle">INCURSEAN</text></g>
            <g class="omni-node" data-system="galvan" tabindex="0" role="button" aria-label="Galvan Star System"><circle class="omni-halo" cx="770" cy="280" r="30"/><circle class="omni-core galvan" cx="770" cy="280" r="10"/><text x="770" y="324" text-anchor="middle">GALVAN</text></g>
            <g class="omni-node" data-system="anodite" tabindex="0" role="button" aria-label="Anodite System"><circle class="omni-halo" cx="565" cy="425" r="30"/><circle class="omni-core anodite" cx="565" cy="425" r="10"/><text x="565" y="469" text-anchor="middle">ANODITE</text></g>
          </svg>
          <div id="omnidata-current-location"></div>
        </div>
        <aside id="omnidata-detail"></aside>
      </div>`;
    const detail = page.querySelector("#omnidata-detail");
    const selectSystem = key => {
      const item = systems[key]; if (!item) return;
      page.querySelectorAll(".omni-node").forEach(node => node.classList.toggle("selected",node.dataset.system===key));
      detail.innerHTML = `<h2>${item.name}</h2><p>${item.body}</p><div class="omni-worlds">${item.worlds}</div>`;
    };
    page.querySelectorAll(".omni-node").forEach(node => {
      node.addEventListener("click",()=>selectSystem(node.dataset.system));
      node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();selectSystem(node.dataset.system);}});
    });
    selectSystem("solar");
    setLocation(currentLocation);
  }
  function setLocation(location) {
    currentLocation = location === "space" ? "space" : "earth";
    const marker = page.querySelector("#omnidata-current-location");
    if (marker) marker.textContent = currentLocation === "space" ? "SOLAR SYSTEM" : "EARTH • BELLWOOD";
    page.querySelectorAll(".omni-node").forEach(node => node.classList.toggle("current-location", node.dataset.system === "solar"));
  }
  function capturePhoto() {
    const canvas = document.querySelector("#omniverse");
    if (!canvas) return;
    try { photos.unshift(canvas.toDataURL("image/jpeg",0.82)); memories(); }
    catch (error) { console.warn("Could not capture memory", error); }
  }
  function addRelationship(picker, owner) {
    picker = String(picker).toLowerCase();
    owner = String(owner).toLowerCase();
    if (picker === owner || !relationships[picker] || !relationships[owner]) return;
    const value = Math.min(100, relationships[picker][owner] + 0.1);
    relationships[picker][owner] = value;
    const pair = [picker, owner].sort((a,b) => relationshipNames.indexOf(a)-relationshipNames.indexOf(b));
    const label = pair.map(name => name[0].toUpperCase()+name.slice(1)).join("-");
    completionValues.push(label + " +0.1%");
  }
  function updateTask(count = storedCount + 1) {
    storedCount = Math.max(storedCount, count);
    if (current === "tasks") tasks();
    if (storedCount >= 4 && !completed) {
      completed = true;
      onComplete();
      showCompletion();
    }
  }
  function showCompletion() {
    if (completionPresented || document.getElementById("mission-complete")) return;
    completionPresented = true;
    const notice = document.createElement("div");
    notice.id = "mission-complete";
    notice.textContent = "TASK COMPLETED";
    document.body.appendChild(notice);
    window.setTimeout(() => notice.remove(), 5200);
  }

  root.querySelector("#extranet-close").addEventListener("click",close);
  root.querySelector("#extranet-back").addEventListener("click",()=>current==="home"?close():current==="private"||current==="omnidata"?home():privateCloud());
  root.querySelector("#extranet-home").addEventListener("click",home);
  address.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    const url = address.value.trim().toLowerCase();
    if (url.includes("bgkr.omnicloud.com")) {
      if (url.endsWith("/tasks")) tasks();
      else if (url.endsWith("/relationships")) showRelationships();
      else if (url.endsWith("/memories")) memories();
      else privateCloud();
    } else if (url.includes("en.omnidata.org")) omnidata();
    else if (url === "extranet://home") home();
  });
  function open() { root.style.display="flex"; home(); }
  function close() { root.style.display="none"; }
  home();
  return { open, close, addRelationship, updateTask, setLocation, get completed(){return completed;}, get relationships(){return relationships;} };
}
