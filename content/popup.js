import {debugLog, OBSERVATION_ORIGINS, option_defaults} from "./shared.js";

document.addEventListener("DOMContentLoaded", () => {
    debugLog("popup.js", "DOMContentLoaded event received");
    let currentPage = 1;
    let totalPages = 1;

    const raidList = document.getElementById("raid-list");
    const searchInput = document.getElementById("search-input");
    const periodFilter = document.getElementById("period-filter");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const pageInfo = document.getElementById("page-info");

    function loadRaids() {
        chrome.storage.local.get(["raids"], (result) => {
            debugLog("popup.js:loadRaids", `Raids loaded from storage`, result);
            let raids = result.raids || [];
            if (raids.length === 0) {
                raidList.innerHTML = "No raids tracked yet. Watch some streams and raid somebody!";
                pageInfo.textContent = "0/0";
                prevBtn.disabled = true;
                nextBtn.disabled = true;
                debugLog("popup.js:loadRaids", "No raids -> No content");
                return;
            }

            const searchTerm = searchInput.value.toLowerCase();
            const period = periodFilter.value;
            const now = new Date();

            debugLog("popup.js:loadRaids", `filtering raids (search term: ${searchTerm}; period: ${period})`);
            raids = raids.filter(raid => {
                const matchesSearch = searchTerm.length < 1 || raid.source.toLowerCase().includes(searchTerm) || raid.target.toLowerCase().includes(searchTerm);
                let matchesPeriod;
                if (period === "all") {
                    debugLog("popup.js:loadRaids", "period is all");
                    matchesPeriod = true;
                } else {
                    const rdt = new Date(raid.timestamp);
                    const diff = (now - rdt) / (1000 * 60 * 60);
                    matchesPeriod = diff <= parseInt(period);
                    debugLog("popup.js:loadRaids", `period is ${parseInt(period)}h, raid date was ${rdt}, time diff is ${diff}`);
                }
                debugLog("popup.js:loadRaids", `raid matches search? ${matchesSearch} | matches period? ${matchesPeriod}`);
                return matchesSearch && matchesPeriod;
            });
            debugLog("popup.js:loadRaids", `filtered raids (new count: ${raids.length})`, raids);

            chrome.storage.local.get(["overviewPageSize"], (result) => {
                const pageSize = result.overviewPageSize || option_defaults.overviewPageSize;
                debugLog("popup.js:loadRaids", `page size is ${pageSize}`);
                totalPages = Math.ceil(raids.length / pageSize) || 1;
                if (currentPage > totalPages) currentPage = 1;

                if (raids.length < 1) {
                    raidList.innerHTML = "No raids match your criteria.";
                    pageInfo.textContent = "0/0";
                    prevBtn.disabled = true;
                    nextBtn.disabled = true;
                    debugLog("popup.js:loadRaids", "No raids after filter -> No content");
                    return;
                }

                const startIndex = (currentPage - 1) * pageSize;
                raids = raids.splice(startIndex, startIndex + pageSize);
                debugLog("popup.js:loadRaids", `rendering page ${currentPage} (start at ${startIndex}, size ${pageSize})of ${totalPages}`);

                raidList.innerHTML = "";
                raids.reverse().forEach(raid => {
                    const div = document.createElement("div");
                    div.className = "raid-item";
                    let warning_text = "";
                    if (raid.dataOrigin && raid.dataOrigin === OBSERVATION_ORIGINS.CHAT) {
                        warning_text = ` <p class="passive-warning">${raid.dataOrigin}</p>`
                    }
                    div.innerHTML = `
                    <div>
                        <span>${raid.source}</span> -> <span>${raid.target}</span>
                    </div>                
                    <div class="time">${new Date(raid.timestamp).toLocaleString(undefined, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    })}${warning_text}</div>
                `;
                    raidList.appendChild(div);
                    debugLog("popup.js:loadRaids", `Processed raid`, raid);
                });

                pageInfo.textContent = `${currentPage} / ${totalPages}`;
                prevBtn.disabled = currentPage === 1;
                nextBtn.disabled = currentPage === totalPages;
                debugLog("popup.js:loadRaids", "Raids loaded, filtered, paged and rendered.");
            });
        });
    }

    searchInput.addEventListener("input", () => {
        debugLog("popup.js:sinput-event-listener", "got event on search input");
        loadRaids();
    });

    periodFilter.addEventListener("change", () => {
        debugLog("popup.js:change-event-listener", "got event on period select");
        loadRaids();
    });

    prevBtn.addEventListener("click", () => {
        debugLog("popup.js:click-event-listener", "got event on page-1 btn");
        if (currentPage > 1) {
            currentPage--;
            loadRaids();
        }
    });

    nextBtn.addEventListener("click", () => {
        debugLog("popup.js:click-event-listener", "got event on page+1 btn");
        if (currentPage < totalPages) {
            currentPage++;
            loadRaids();
        }
    })

    loadRaids();
});