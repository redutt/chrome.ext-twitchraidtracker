const ignoresPaths = ["u", "privacy", "settings", "subscriptions", "drops", "wallet", "search", "directory", "downloads", "p", "jobs", "turbo"]
const lastChannelPerTab = {};

function saveRaid(source, target) {
    const raid = {
        uuid: crypto.randomUUID(),
        source: source,
        target: target,
        timestamp: new Date().toLocaleString()
    };

    chrome.storage.local.get(["raids"], (result) => {
        const raids = result.raids || [];
        raids.push(raid);
        chrome.storage.local.set({raids: raids}).then();
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && changeInfo.url.includes("twitch.tv")) {
        const url = new URL(changeInfo.url);
        if (url.hostname !== "www.twitch.tv") return; //ignores [dashboard | appeals | blog | dev | careers | safety | legal | help].twitch.tv

        const subPath = url.pathname.split('/')[1];
        if (!subPath || ignoresPaths.includes(subPath)) return; //ignores all subpaths not linking to channels
        const currentChannel = subPath;

        const isRaid = url.searchParams.get("referrer") === "raid"; //this params is added when getting raided
        const previousChannel = lastChannelPerTab[tabId];
        if (isRaid && previousChannel && previousChannel !== currentChannel) {
            saveRaid(previousChannel, currentChannel)
        }

        lastChannelPerTab[tabId] = currentChannel;
    }
});

chrome.tabs.onRemoved.addListener((tabId) => delete lastChannelPerTab[tabId]);