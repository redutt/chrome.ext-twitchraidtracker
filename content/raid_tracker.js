import {ignoredPaths, twitchHostname, debugLog} from "./shared.js";

function saveRaid(source, target) {
    debugLog("raid_tracker.js:saveRaid", `Saving Raid ${source} -> ${target}`)
    const raid = {
        uuid: crypto.randomUUID(), source: source, target: target, timestamp: new Date().toISOString()
    };

    chrome.storage.local.get(["raids"], (result) => {
        const raids = result.raids || [];
        debugLog("raid_tracker.js:saveRaid", `Loaded ${raids.length} raids from storage`)
        raids.push(raid);
        debugLog("raid_tracker.js:saveRaid", `added raid`, raid)
        chrome.storage.local.set({raids: raids}).then(() => debugLog("raid_tracker.js:saveRaid", `saved ${raids.length} raids`));
    });
}

chrome.tabs.onCreated.addListener((tab) => {
    debugLog("raid_tracker.js:tab-created-listener", `received creation of tab`, tab)
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
    if (!subPath || ignoredPaths.includes(subPath)) {
        debugLog("raid_tracker.js:tab-created-listener", `subpath ${subPath} was either null or in ignored list`, ignoredPaths)
        return;
    }
    const currentChannel = subPath;
    debugLog("raid_tracker.js:tab-created-listener", `currentChannel is ${currentChannel}`)
    const tabKey = `tab_${tab.id}`;
    chrome.storage.session.set({[tabKey]: currentChannel}, () => {
        debugLog("raid_tracker.js:tab-created-listener", `saved current channel for ${tabKey}`)
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
    debugLog("raid_tracker.js:tab-updated-listener", `received update on tab ${tabId}`, changeInfo, _tab)
    if (changeInfo.url && changeInfo.url.includes("twitch.tv")) {
        debugLog("raid_tracker.js:tab-updated-listener", "updated url is a twitch domain")
        const url = new URL(changeInfo.url);
        if (url.hostname !== twitchHostname) {
            debugLog("raid_tracker.js:tab-updated-listener", `${url.hostname} did not match ${twitchHostname}`)
            return;
        }

        const subPath = url.pathname.split('/')[1];
        if (!subPath || ignoredPaths.includes(subPath)) {
            debugLog("raid_tracker.js:tab-updated-listener", `subpath ${subPath} was either null or in ignored list`, ignoredPaths)
            return;
        }
        const currentChannel = subPath;
        debugLog("raid_tracker.js:tab-updated-listener", `currentChannel is ${currentChannel}`)

        const isRaid = url.searchParams.get("referrer") === "raid"; //this param is added by twitch to the url when redirecting the user to the raid victim
        const tabKey = `tab_${tabId}`;
        chrome.storage.session.get([tabKey], (result) => {
            debugLog("raid_tracker.js:tab-updated-listener", `loaded session data for ${tabKey}`, result);
            const previousChannel = result[tabKey];
            debugLog("raid_tracker.js:tab-updated-listener", `checking ${isRaid} && ${previousChannel} != ${currentChannel}`)
            if (isRaid && previousChannel && previousChannel !== currentChannel) {
                saveRaid(previousChannel, currentChannel)
                debugLog("raid_tracker.js:tab-updated-listener", "saved raid")
            } else {
                debugLog("raid_tracker.js:tab-updated-listener", "no raid detected")
            }
            chrome.storage.session.set({[tabKey]: currentChannel}, () => {
                debugLog("raid_tracker.js:tab-updated-listener", `saved override last channel ${previousChannel} with current channel ${currentChannel} for ${tabKey}`);
            });
        });
    } else {
        debugLog("raid_tracker.js:tab-updated-listener", "update does not contain url or url does not the twitch channel hostname", changeInfo.url);
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    debugLog("raid_tracker.js:tab-removed-listener", `Received tab ${tabId} destroyed event`);
    const tabKey = `tab_${tabId}`;
    chrome.storage.session.remove([`${tabKey}`], () => {
        debugLog("raid_tracker.js:tab-removed-listener", `removed session data for ${tabKey}`);
    });
});