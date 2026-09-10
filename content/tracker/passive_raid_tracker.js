

(async () => {
    const shared_js = chrome.runtime.getURL("content/shared.js");
    const {twitchHostname, OBSERVATION_ORIGINS, debugLog, saveRaid, ignoredPaths} = await import(shared_js);
    debugLog("passive_raid_tracker.js", "imported functions");

    let findChatTryCounter = 0;
    let chatObserver = null;

    function observeChat(currentChannel) {
        debugLog("passive_raid_tracker.js:observeChat", `starting chat observation, counter: ${findChatTryCounter}`)
        const chatContainer = document.querySelector('.chat-scrollable-area__message-container');
        if (!chatContainer) {
            if (findChatTryCounter >= 10) {
                alert("Unable to find chat container, disabling the raid tracking through chat. To reactivate go to the raid tracker options. Please inform the developer.");
                chrome.storage.local.set({trackPassiveRaids: false}, () => debugLog("passive_raid_tracker", "disabled passive raid tracking"));
            } else {
                findChatTryCounter++;
                setTimeout(observeChat, 2000, currentChannel);
            }
            return;
        }
        debugLog("passive_raid_tracker.js:observeChat", "found chat container", chatContainer);

        if (chatObserver) {
            chatObserver.disconnect();
            debugLog("passive_raid_tracker.js:observeChat", "disconnected old observer", chatObserver)
        }

        chatObserver = new MutationObserver((mutations) => {
            debugLog("passive_raid_tracker.js:observeChat", "mutation on side observed", mutations);
            mutations.forEach((mutation) => {
                debugLog("passive_raid_tracker.js:observeChat", "working on mutation", mutation);
                mutation.addedNodes.forEach((node) => {
                    debugLog("passive_raid_tracker.js:observeChat", "working on added node", node);
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const text = node.textContent || "";
                        debugLog("passive_raid_tracker.js:observeChat", `element node text extracted`, text);

                        //finds channel name form raid message and if it's a raid message
                        const matchResult = text.match(/^(.+?)\s+(is raiding with a party of|raidet mit einer Gruppe von)/i);
                        if (matchResult && matchResult[1]) {
                            const raider = matchResult[1].trim().toLowerCase();
                            debugLog("passive_raid_tracker.js:observeChat", "saving raid", raider, currentChannel);

                            chrome.storage.local.get(["raids"], (result) => {
                                debugLog("shared.js:saveRaid", `Loaded raids from storage`, result);
                                const raids = result.raids || [];

                                const isDuplicateEntry = raids.slice(-15).some(raid => {
                                    debugLog("passive_raid_tracker.js:observeChat", "checking raid", raid, raider, currentChannel);
                                    const timeDiff = Date.now() - new Date(raid.timestamp);
                                    const flag = raid.source === raider && raid.target === currentChannel && timeDiff < 60000;
                                    debugLog("passive_raid_tracker.js:observeChat", `is raid duplicate? ${flag}`, timeDiff);
                                    return flag;
                                });

                                debugLog("passive_raid_tracker.js:observeChat", `found duplicate? ${isDuplicateEntry}`);
                                if (!isDuplicateEntry) {
                                    saveRaid(raider, currentChannel, OBSERVATION_ORIGINS.CHAT);
                                    debugLog("passive_raid_tracker.js:observeChat", `raid saved`);
                                }
                            });
                        } else {
                            debugLog("passive_raid_tracker.js:observeChat", "no raid or unable to find raiders name", matchResult);
                        }
                    } else {
                        debugLog("passive_raid_tracker.js:observeChat", `nodeType (${node.nodeType}) != ELEMENT_NODE (${Node.ELEMENT_NODE})`);
                    }
                });
            });
        });

        chatObserver.observe(chatContainer, {childList: true, subtree: true});
    }

    function startChatObserver() {
        const windowUrlStr = window.location.href;
        if (!windowUrlStr) {
            debugLog("passive_raid_tracker.js", "unable to get window url");
            return;
        }
        const windowUrl = new URL(windowUrlStr);
        if (windowUrl.hostname !== twitchHostname) {
            debugLog("passive_raid_tracker.js", `${windowUrl.hostname} did not match ${twitchHostname}`);
            return;
        }
        const subPath = windowUrl.pathname.split('/')[1];
        if (!subPath || ignoredPaths.includes(subPath)) {
            debugLog("passive_raid_tracker.js", `subpath ${subPath} was either null or in ignored list`, ignoredPaths);
            return;
        }
        const currentChannel = subPath;
        debugLog("passive_raid_tracker.js", `currentChannel is ${currentChannel}; extracted from ${windowUrlStr}`);
        observeChat(currentChannel);
    }

    startChatObserver();

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        debugLog("passive_raid_tracker.js", "received message", request, sender, sendResponse);
        if (request.action === "trtSideNavigationEvent") {
            debugLog("passive_raid_tracker.js", "navigation detected")
            findChatTryCounter = 0;
            startChatObserver();
        }
    });
})();