import {ignoredPaths, twitchHostname, debugLog, saveRaid, OBSERVATION_ORIGINS} from "../shared.js";

chrome.tabs.onCreated.addListener((tab) => {
    debugLog("active_raid_tracker.js:tab-created-listener", `received creation of tab`, tab);
    if (!tab.id) {
        debugLog("active_raid_tracker.js:tab-created-listener", "Tab has no id");
        return;
    }

    let url = tab.url || tab.pendingUrl || null;
    if (!url) {
        debugLog("active_raid_tracker.js:tab-created-listener", "no url provided");
        return;
    }
    url = new URL(url);
    if (url.hostname !== twitchHostname) {
        debugLog("active_raid_tracker.js:tab-created-listener", `${url.hostname} did not match ${twitchHostname}`);
        return;
    }

    const subPath = url.pathname.split('/')[1];
    if (!subPath || ignoredPaths.includes(subPath)) {
        debugLog("active_raid_tracker.js:tab-created-listener", `subpath ${subPath} was either null or in ignored list`, ignoredPaths);
        return;
    }
    const currentChannel = subPath;
    debugLog("active_raid_tracker.js:tab-created-listener", `currentChannel is ${currentChannel}`);
    const tabKey = `tab_${tab.id}`;
    chrome.storage.session.set({[tabKey]: currentChannel}, () => {
        debugLog("active_raid_tracker.js:tab-created-listener", `saved current channel for ${tabKey}`);
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
    debugLog("active_raid_tracker.js:tab-updated-listener", `received update on tab ${tabId}`, changeInfo, _tab);
    if (changeInfo.url && changeInfo.url.includes("twitch.tv")) {
        debugLog("active_raid_tracker.js:tab-updated-listener", "updated url is a twitch domain");
        const url = new URL(changeInfo.url);
        if (url.hostname !== twitchHostname) {
            debugLog("active_raid_tracker.js:tab-updated-listener", `${url.hostname} did not match ${twitchHostname}`);
            return;
        }

        const subPath = url.pathname.split('/')[1];
        if (!subPath || ignoredPaths.includes(subPath)) {
            debugLog("active_raid_tracker.js:tab-updated-listener", `subpath ${subPath} was either null or in ignored list`, ignoredPaths);
            return;
        }
        const currentChannel = subPath;
        debugLog("active_raid_tracker.js:tab-updated-listener", `currentChannel is ${currentChannel}`);

        chrome.tabs.sendMessage(tabId, {action: "trtSideNavigationEvent"})
            .then(() => debugLog("active_raid_tracker.js:tab-updated-listener", "send message to restart passive tracker"))
            .catch((err) => debugLog("active_raid_tracker.js:tab-updated-listener", "encountered error while restarting passive tracker", err));

        const isRaid = url.searchParams.get("referrer") === "raid"; //this param is added by twitch to the url when redirecting the user to the raid victim
        const tabKey = `tab_${tabId}`;
        chrome.storage.session.get([tabKey], (result) => {
            debugLog("active_raid_tracker.js:tab-updated-listener", `loaded session data for ${tabKey}`, result);
            const previousChannel = result[tabKey];
            debugLog("active_raid_tracker.js:tab-updated-listener", `checking ${isRaid} && ${previousChannel} != ${currentChannel}`)
            if (isRaid && previousChannel && previousChannel !== currentChannel) {
                saveRaid(previousChannel, currentChannel, OBSERVATION_ORIGINS.RAID);
                debugLog("active_raid_tracker.js:tab-updated-listener", "saved raid");
            } else {
                debugLog("active_raid_tracker.js:tab-updated-listener", "no raid detected");
            }
            chrome.storage.session.set({[tabKey]: currentChannel}, () => {
                debugLog("active_raid_tracker.js:tab-updated-listener", `saved override last channel ${previousChannel} with current channel ${currentChannel} for ${tabKey}`);
            });
        });
    } else {
        debugLog("active_raid_tracker.js:tab-updated-listener", "update does not contain url or url does not the twitch channel hostname", changeInfo.url);
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    debugLog("active_raid_tracker.js:tab-removed-listener", `Received tab ${tabId} destroyed event`);
    const tabKey = `tab_${tabId}`;
    chrome.storage.session.remove([`${tabKey}`], () => {
        debugLog("active_raid_tracker.js:tab-removed-listener", `removed session data for ${tabKey}`);
    });
});