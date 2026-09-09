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

export function showConfirmationDialog(parentElement, message) {
    debugLog("shared.js:confirmDialog", "showing confirm dialog", parentElement, message);
    const dialogElem = document.createElement("dialog");
    parentElement.appendChild(dialogElem)

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
            parentElement.removeChild(dialogElem)
            resolve(result);
        }

        const onOk = () => finish(true);
        const onCancel = () => finish(false);

        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);

        dialogElem.showModal();
    });
}