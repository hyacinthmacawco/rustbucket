export function createExtranet({ onContinue = () => {}, onComplete = () => {}, simulation = null, onData = () => {}, onJumpSystem = () => {} } = {}) {
  const root = document.createElement("section");
  root.id = "extranet-overlay";
  root.innerHTML = `
    <div id="extranet-window">
      <nav id="extranet-toolbar"><button id="extranet-back" aria-label="Back">BACK</button><input id="extranet-address" aria-label="Web address" value="extranet://home"><button id="extranet-home" aria-label="Home">HOME</button><button id="extranet-close" aria-label="Close">CLOSE</button></nav>
      <main id="extranet-page"></main>
    </div>`;
  document.body.appendChild(root);
  const page = root.querySelector("#extranet-page");
  const address = root.querySelector("#extranet-address");
  const relationshipNames = ["Ben","Gwen","Kevin","Rook","Highbreed","Incursean","Anodite","Galvan","Human"];
  const photos = [];
  let current = "home";
  let completed = false;
  let storedCount = 0;
  let completionPresented = false;
  let completionValues = [];
  let currentLocation = "earth";

  function home() {
    current = "home"; address.value = "extranet://home";
    page.innerHTML = `<div class="extranet-bookmarks"><button data-url="private"><span><b>Private Cloud</b></span></button><button data-url="omnidata"><span><b>Omnidata</b></span></button></div>`;
    page.querySelectorAll("[data-url]").forEach(b => b.addEventListener("click", () => b.dataset.url === "private" ? privateCloud() : omnidata()));
  }
  function privateCloud() {
    current = "private"; address.value = "ottps://bgkr.omnicloud.com";
    page.innerHTML = '<div class="cloud-links">' +
      '<button data-page="tasks"><span><b>Tasks</b></span></button>' +
      '<button data-page="relationships"><span><b>Relationships</b></span></button>' +
      '<button data-page="memories"><span><b>Memories</b></span></button>' +
      '<button data-page="accounts"><span><b>Accounts</b></span></button>' +
      '<button data-page="inventory"><span><b>Inventory</b></span></button>' +
      '<button data-page="event-log"><span><b>Event Log</b></span></button></div>';
    page.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", () => {
      const target = button.dataset.page;
      const views = { accounts: "accounting", inventory: "items", "event-log": "events" };
      if (views[target]) {
        current = target;
        address.value = "ottps://bgkr.omnicloud.com/" + target;
        onData(page, views[target]);
      } else ({ tasks, relationships: showRelationships, memories })[target]();
    }));
  }

  function tasks() {
    current = "tasks"; address.value = "ottps://bgkr.omnicloud.com/tasks";
    const count = storedCount;
    page.innerHTML = `<article class="task-card"><h2>Put suitcases into Rustbucket</h2><div class="task-progress"><span style="width:${count*25}%"></span></div><b>${count}/4 SUITCASES STORED</b></article>`;
    if (completed) showCompletion();
  }
  function showRelationships() {
    current = "relationships";
    address.value = "ottps://bgkr.omnicloud.com/relationships";
    const header = "<thead><tr><th>FROM / TO</th>" + relationshipNames.map(name => "<th>" + name + "</th>").join("") + "</tr></thead>";
    const body = relationshipNames.map(from => {
      const cells = relationshipNames.map(to => {
        const value = from === to ? 0 : (simulation?.getRelationship(from, to) ?? 50);
        return "<td class=\"" + (from === to ? "self" : "") + "\"><span>" + Number(value).toFixed(0) + "%</span><i><b style=\"width:" + value + "%\"></b></i></td>";
      }).join("");
      return "<tr><th>" + from + "</th>" + cells + "</tr>";
    }).join("");
    page.innerHTML = "<div class=\"relationship-matrix-wrap\"><table class=\"relationship-matrix\">" + header + "<tbody>" + body + "</tbody></table></div>";
  }

  function memories() {
    current = "memories"; address.value = "ottps://bgkr.omnicloud.com/memories";
    page.innerHTML = `<button id="capture-memory" class="cloud-action">◎ CAPTURE SCREEN</button><div id="memory-grid">${photos.map((src,i)=>`<figure><img src="${src}" alt="Captured memory ${i+1}"></figure>`).join("")}</div>`;
    page.querySelector("#capture-memory").addEventListener("click", capturePhoto);
  }
  function omnidata(allowSystemJump = false) {
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
          <svg id="omnidata-map" viewBox="0 0 900 520" role="img" aria-label="Omnidata directory of five separate Ben 10 star systems">
            <defs><radialGradient id="omni-nebula"><stop stop-color="#174d35" stop-opacity=".42"/><stop offset="1" stop-color="#07140f" stop-opacity="0"/></radialGradient></defs>
            <rect width="900" height="520" rx="14" fill="#06140e"/>
            <ellipse cx="455" cy="255" rx="420" ry="245" fill="url(#omni-nebula)"/>
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
      detail.innerHTML = "<h2>" + item.name + "</h2><p>" + item.body + "</p><div class=\"omni-worlds\">" + item.worlds + "</div><p class=\"omni-status\">" + item.status + "</p>" + (allowSystemJump ? '<button id="omnidata-jump" type="button">JUMP TO SYSTEM</button>' : "");
      if (allowSystemJump) detail.querySelector("#omnidata-jump").addEventListener("click",()=>onJumpSystem(key));
    };
    page.querySelectorAll(".omni-node").forEach(node => {
      node.addEventListener("click",()=>selectSystem(node.dataset.system));
      node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();selectSystem(node.dataset.system);}});
    });
    selectSystem("solar");
    setLocation(currentLocation);
  }
  function setLocation(location) {
    const labels = {space:"SOLAR SYSTEM",earth:"EARTH • BELLWOOD",moon:"THE MOON",augstaka:"AUGSTAKA",anodyne:"ANODYNE",galvan:"GALVAN PRIME",incursia:"INCURSIA"};
    const nextLocation = labels[location] ? location : "earth";
    const changed = nextLocation !== currentLocation;
    currentLocation = nextLocation;
    const marker = page.querySelector("#omnidata-current-location");
    const label = labels[currentLocation];
    const markerChanged = Boolean(marker && marker.textContent !== label);
    if (markerChanged) marker.textContent = label;
    if (changed || markerChanged) {
      const nodeKey = ({earth:"solar",moon:"solar",space:"solar",augstaka:"highbreed",anodyne:"anodite",galvan:"galvan",incursia:"incursean"})[currentLocation];
      page.querySelectorAll(".omni-node").forEach(node => node.classList.toggle("current-location", node.dataset.system === nodeKey));
    }
  }
  function capturePhoto() {
    const canvas = document.querySelector("#omniverse");
    if (!canvas) return;
    try { photos.unshift(canvas.toDataURL("image/jpeg",0.82)); memories(); }
    catch (error) { console.warn("Could not capture memory", error); }
  }
  function addRelationship(picker, owner) {
    if (!simulation) return;
    const from=String(picker).toLowerCase().replace(/^./,c=>c.toUpperCase());
    const to=String(owner).toLowerCase().replace(/^./,c=>c.toUpperCase());
    simulation.setRelationship(from,to,simulation.getRelationship(from,to)+0.1);
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
      else if (url.endsWith("/accounts")) { current="accounts"; onData(page,"accounting"); }
      else if (url.endsWith("/inventory")) { current="inventory"; onData(page,"items"); }
      else if (url.endsWith("/event-log")) { current="event-log"; onData(page,"events"); }
      else privateCloud();
    } else if (url.includes("en.omnidata.org")) omnidata();
    else if (url === "extranet://home") home();
  });
  function open() { root.style.display="flex"; home(); }
  function openOmnidata() { root.style.display="flex"; omnidata(true); }
  function close() { root.style.display="none"; }
  home();
  return { open, openOmnidata, close, addRelationship, updateTask, setLocation, get completed(){return completed;}, get relationships(){return simulation?.data?.relationships || {};} };
}
