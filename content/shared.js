export class Raid {
    constructor(raid_source, raid_target, observation_origin) {
        debugLog("shared.js:raidConstructor", "new raid created", raid_source, raid_target, observation_origin)
        this.uuid = crypto.randomUUID();
        this.source = raid_source;
        this.target = raid_target;
        this.timestamp = new Date().toISOString();
        this.dataOrigin = observation_origin;
    }
}

export const OBSERVATION_ORIGINS = Object.freeze({
    CHAT: "passive chat",
    RAID: "active raid member"
});

export const ignoredPaths = ["u", "privacy", "settings", "subscriptions", "drops", "wallet", "search", "directory", "downloads", "p", "jobs", "turbo"]; //ignores all subpaths not linking to channels
export const twitchHostname = "www.twitch.tv"; //ignores [dashboard | appeals | blog | dev | careers | safety | legal | help].twitch.tv
export const option_defaults = {
    debugMode: false, tooltipItemNumber: 5, overviewPageSize: 15,
};

export function debugLog(origin, message, ...args) {
    chrome.storage.local.get(["debugMode"], (result) => {
        if (result.debugMode) {
            console.log(`[Raid Tracker][${origin}] ${message}`, args);
        }
    });
}

export function saveRaid(source, target, observation_source) {
    debugLog("shared.js:saveRaid", `Saving Raid ${source} -> ${target} from ${observation_source}`, source, target, observation_source);
    const raid = new Raid(source, target, observation_source);
    chrome.storage.local.get(["raids"], (result) => {
        const raids = result.raids || [];
        debugLog("shared.js:saveRaid", `Loaded ${raids.length} raids from storage`);
        raids.push(raid);
        debugLog("shared.js:saveRaid", `added raid`, raid);
        chrome.storage.local.set({raids: raids}).then(() => debugLog("shared.js:saveRaid", `saved ${raids.length} raids`));
    });
}

export function showConfirmationDialog(parentElement, message) {
    debugLog("shared.js:confirmDialog", "showing confirm dialog", parentElement, message);
    const dialogElem = document.createElement("dialog");
    parentElement.appendChild(dialogElem);

    const messageElem = document.createElement("p");
    messageElem.textContent = message;
    dialogElem.appendChild(messageElem);

    const okBtn = document.createElement("button");
    okBtn.type = "submit";
    okBtn.textContent = "OK";
    dialogElem.appendChild(okBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "reset";
    cancelBtn.textContent = "Cancel";
    dialogElem.appendChild(cancelBtn);

    debugLog("shared.js:confirmDialog", "created dialog", dialogElem);

    return new Promise((resolve) => {
        const finish = (result) => {
            debugLog("shared.js:confirmDialog", `dialog result is ${result}`);
            okBtn.removeEventListener("click", onOk);
            cancelBtn.removeEventListener("click", onCancel);
            dialogElem.close();
            parentElement.removeChild(dialogElem);
            resolve(result);
        }

        const onOk = () => finish(true);
        const onCancel = () => finish(false);

        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);

        dialogElem.showModal();
    });
}