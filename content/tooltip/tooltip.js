const ignoresPaths = ["u", "privacy", "settings", "subscriptions", "drops", "wallet", "search", "directory", "downloads", "p", "jobs", "turbo"]
let raids = [];

chrome.storage.local.get(["raids"], (result) => {
    raids = result.raids || [];
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.raids) {
        raids = changes.raids.newValue || [];
    }
});

const tooltip = document.createElement("div");
tooltip.id = "raid-tracker-tooltip";
tooltip.classList.add("raid-tracker-tooltip");
document.body.appendChild(tooltip);

document.addEventListener("mouseover", (event) => {
    const target = event.target.closest("a");
    if (!target) return;
    const href = target.getAttribute("href");
    if (!href) return;
    const url = new URL(href, window.location.origin);
    if (url.hostname !== "www.twitch.tv") return; //ignores [dashboard | appeals | blog | dev | careers | safety | legal | help].twitch.tv
    const subPath = url.pathname.split('/')[1];
    if (!subPath || ignoresPaths.includes(subPath)) return; //ignores all subpaths not linking to channels
    const currentChannel = subPath;

    let filteredRaids = raids.filter(r => r.target === currentChannel).reverse()
    filteredRaids = filteredRaids.splice(0,4)
    if (filteredRaids.length > 0) {
        filteredRaids.forEach(raid => {
            const div = document.createElement("div");
            div.className = "raid-item";
            div.innerHTML = `
                <div>
                    <span class="source">${raid.source}</span> -> <span class="target">${raid.target}</span>
                </div>                
                <div class="time">${raid.timestamp}</div>
            `;
            tooltip.appendChild(div);
        });

        const rect = target.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
        tooltip.style.left = `${rect.left}px`;
        tooltip.classList.add("show-tooltip");
    }
});

document.addEventListener("mouseout", (event) => {
    const target = event.target.closest("a");
    if (target) {
        tooltip.classList.remove("show-tooltip");
        tooltip.replaceChildren()
    }
});