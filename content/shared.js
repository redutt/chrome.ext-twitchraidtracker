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
    CHAT: "passive chat", RAID: "active raid member"
});

export const ignoredPaths = ["u", "privacy", "settings", "subscriptions", "drops", "wallet", "search", "directory", "downloads", "p", "jobs", "turbo"]; //ignores all subpaths not linking to channels
export const twitchHostname = "www.twitch.tv"; //ignores [dashboard | appeals | blog | dev | careers | safety | legal | help].twitch.tv
export const option_defaults = {
    debugMode: false,
    tooltipItemNumber: 5,
    overviewPageSize: 15,
    trackPassiveRaids: false,
    showPassiveRaidsOnTooltip: false
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