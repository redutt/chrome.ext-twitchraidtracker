console.log("this is a debug message that will be removed in the future", 1);

(async () => {
    console.log("this is a debug message that will be removed in the future", 2);
    const shared_js = chrome.runtime.getURL("content/shared.js");
    const {twitchHostname, ignoredPaths: ignoredPaths, debugLog, option_defaults} = await import(shared_js);
    console.log("this is a debug message that will be removed in the future", 3);

    debugLog("tooltip.js", "imported functions")

    const tooltip = document.createElement("div");
    tooltip.id = "raid-tracker-tooltip";
    tooltip.classList.add("raid-tracker-tooltip");
    document.body.appendChild(tooltip);

    document.addEventListener("mouseover", (event) => {
        debugLog('tooltip.js:mouseover-event-listener', `Received mouseover event`, event);
        const target = event.target.closest("a");
        if (!target) {
            debugLog('tooltip.js:mouseover-event-listener', "target was not a <a>-Tag");
            return;
        }
        const href = target.getAttribute("href");
        if (!href) {
            debugLog('tooltip.js:mouseover-event-listener', "target got no href-Attribute");
            return;
        }
        const url = new URL(href, window.location.origin);
        debugLog("tooltip.js:mouseover-event-listener", `creating tooltip for url`, url);
        if (url.hostname !== twitchHostname) {
            debugLog('tooltip.js:mouseover-event-listener', `${url.hostname} did not match ${twitchHostname}`);
            return;
        }
        const subPath = url.pathname.split('/')[1];
        if (!subPath || ignoredPaths.includes(subPath)) {
            debugLog('tooltip.js:mouseover-event-listener', `subpath ${subPath} was either null or in ignored list`, ignoredPaths);
            return;
        }
        const currentChannel = subPath;
        debugLog('tooltip.js:mouseover-event-listener', `currentChannel is ${currentChannel}`);

        chrome.storage.local.get(["raids"], (result) => {
            debugLog('tooltip.js:mouseover-event-listener', "loaded raids from storage", result)
            let raids = result.raids || []
            raids = raids.filter(r => r.target === currentChannel).reverse()
            chrome.storage.local.get(["tooltipItemNumber"], (result) => {
                debugLog('tooltip.js:mouseover-event-listener', "loaded tooltip item number from storage", result);
                const size = result.tooltipItemNumber || option_defaults.tooltipItemNumber;
                raids = raids.splice(0, size)
                debugLog('tooltip.js:mouseover-event-listener', `Raids where filtered so only the 5 newest raids that targeted the channel ${currentChannel} are in it`, raids)
                if (raids.length > 0) {
                    debugLog('tooltip.js:mouseover-event-listener', "Filtered raids had elements")
                    raids.forEach(raid => {
                        const div = document.createElement("div");
                        div.className = "raid-item";
                        div.innerHTML = `
                <div>
                    <span class="source">${raid.source}</span> -> <span class="target">${raid.target}</span>
                </div>                
                <div class="time">${raid.timestamp}</div>
            `;
                        tooltip.appendChild(div);
                        debugLog('tooltip.js:mouseover-event-listener', `Added raid to tooltip`, raid)
                    });

                    const rect = target.getBoundingClientRect();
                    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
                    tooltip.style.left = `${rect.left}px`;
                    tooltip.classList.add("show-tooltip");
                    debugLog('tooltip.js:mouseover-event-listener', "tooltip shown")
                }
            });
        });
    });

    document.addEventListener("mouseout", (event) => {
        debugLog('tooltip.js:mouseout-event-listener', `Received mouseout event`, event)
        const target = event.target.closest("a");
        if (target) {
            tooltip.classList.remove("show-tooltip");
            tooltip.replaceChildren()
            debugLog('tooltip.js:mouseout-event-listener', "Removed tooltip and cleared content")
        } else {
            debugLog('tooltip.js:mouseout-event-listener', "target was not a <a>-Tag")
        }
    });
})();
console.log("this is a debug message that will be removed in the future", 4);