import {ignoresPaths, twitchHostname, debugLog} from "./shared.js";

const lastChannelPerTab = {};

chrome.storage.local.get(["raids"], (result) => {
   const raids = result.raids || [];
   if (raids.length < 1) {
       raids.push({uuid: null, source: "dummyRaid", target: "nangijalatv", timestamp: new Date().toISOString()});
       raids.push({uuid: null, source: "dummyRaid", target: "liliaquak", timestamp: new Date().toISOString()});
       raids.push({uuid: null, source: "dummyRaid", target: "kartoffelaimr6", timestamp: new Date().toISOString()});
       chrome.storage.local.set({raids: raids}).then();
   }
});

function saveRaid(source, target) {
    debugLog("raid_tracker.js:saveRaid", `Saving Raid ${source} -> ${target}`)
    const raid = {
        uuid: crypto.randomUUID(),
        source: source,
        target: target,
        timestamp: new Date().toISOString()
    };

    chrome.storage.local.get(["raids"], (result) => {
        const raids = result.raids || [];
        debugLog("raid_tracker.js:saveRaid", `Loaded ${raids.length} raids from storage`)
        raids.push(raid);
        debugLog("raid_tracker.js:saveRaid", `added raid ${raid}`)
        chrome.storage.local.set({raids: raids}).then(() => debugLog("raid_tracker.js:saveRaid", `saved ${raids.length} raids`));
    });
}

chrome.tabs.onCreated.addListener((tab) => {
    debugLog("raid_tracker.js:tab-created-listener", `received creation of tab ${tab}`)
    if (!tab.id) {
        debugLog("raid_tracker.js:tab-created-listener", "Tab has no id");
        return;
    }

    let url = tab.url || tab.pendingUrl || null;
    if (!url) {
        debugLog("raid_tracker.js:tab-created-listener", "no url provided");
        return;
    }
    url = new URL(url);
    if (url.hostname !== twitchHostname) {
        debugLog("raid_tracker.js:tab-created-listener", `${url.hostname} did not match ${twitchHostname}`)
        return;
    }

    const subPath = url.pathname.split('/')[1];
    if (!subPath || ignoresPaths.includes(subPath)) {
        debugLog("raid_tracker.js:tab-created-listener", `subpath ${subPath} was either null or in ignored list ${ignoresPaths}`)
        return;
    }
    const currentChannel = subPath;
    debugLog("raid_tracker.js:tab-created-listener", `currentChannel is ${currentChannel}`)
    lastChannelPerTab[tab.id] = currentChannel;
    debugLog("raid_tracker.js:tab-created-listener", `saved current channel: ${tab.id} = ${lastChannelPerTab[tab.id]}`)
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
    debugLog("raid_tracker.js:tab-updated-listener", `received update on tab ${tabId}: ${changeInfo}`)
    if (changeInfo.url && changeInfo.url.includes("twitch.tv")) {
        debugLog("raid_tracker.js:tab-updated-listener", "updated url is a twitch domain")
        const url = new URL(changeInfo.url);
        if (url.hostname !== twitchHostname) {
            debugLog("raid_tracker.js:tab-updated-listener", `${url.hostname} did not match ${twitchHostname}`)
            return;
        }

        const subPath = url.pathname.split('/')[1];
        if (!subPath || ignoresPaths.includes(subPath)) {
            debugLog("raid_tracker.js:tab-updated-listener", `subpath ${subPath} was either null or in ignored list ${ignoresPaths}`)
            return;
        }
        const currentChannel = subPath;
        debugLog("raid_tracker.js:tab-updated-listener", `currentChannel is ${currentChannel}`)

        const isRaid = url.searchParams.get("referrer") === "raid"; //this param is added by twitch to the url when redirecting the user to the raid victim
        const previousChannel = lastChannelPerTab[tabId];
        debugLog(`checking isRaid: ${isRaid} && ${previousChannel} = ${currentChannel}`)
        if (isRaid && previousChannel && previousChannel !== currentChannel) {
            saveRaid(previousChannel, currentChannel)
            debugLog("raid_tracker.js:tab-updated-listener", "saved raid")
        } else {
            debugLog("raid_tracker.js:tab-updated-listener", "no raid detected")
        }

        lastChannelPerTab[tabId] = currentChannel;
        debugLog("raid_tracker.js:tab-updated-listener", `saved override last channel ${previousChannel} with current channel ${currentChannel}: ${tabId} = ${lastChannelPerTab[tabId]}`)
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    debugLog("raid_tracker.js:tab-removed-listener", `Received tab ${tabId} destroyed event`)
    return delete lastChannelPerTab[tabId];
});