export function debugLog(origin, message, ...args) {
    chrome.storage.local.get(["debugMode"], (result) => {
        if (result.debugMode) {
            console.log(`[Raid Tracker][${origin}] ${message}`, args);
        }
    });
}

export const ignoredPaths = ["u", "privacy", "settings", "subscriptions", "drops", "wallet", "search", "directory", "downloads", "p", "jobs", "turbo"]; //ignores all subpaths not linking to channels
export const twitchHostname = "www.twitch.tv"; //ignores [dashboard | appeals | blog | dev | careers | safety | legal | help].twitch.tv

export const option_defaults = {
    debugMode: false,
    tooltipItemNumber: 5,
    overviewPageSize: 15
};