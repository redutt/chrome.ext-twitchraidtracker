import {debugLog, option_defaults, showConfirmationDialog} from "../shared.js";

const statusText = document.getElementById("status");

function clearStatusTextLater() {
    setTimeout(() => statusText.textContent = "", 2000);
}

const debugCheckbox = document.getElementById("debug-mode");
chrome.storage.local.get(["debugMode"], (result) => {
    debugLog('options.js:debugLog', `Loaded settings from storage`, result);
    if (!result.debugMode) {
        result.debugMode = option_defaults.debugMode;
        chrome.storage.local.set(result).then(() => debugLog('options.js:tooltipItemNumber', "saved default value"));
    }
    debugCheckbox.checked = result.debugMode;
});
debugCheckbox.addEventListener("change", (e) => {
    debugLog('options.js:debugLog', "received change event on debug checkbox", e)
    const obj = {debugMode: e.target.checked};
    chrome.storage.local.set(obj, () => {
        debugLog('options.js:debugLog', `Saved settings to storage`, obj)
        statusText.textContent = "Settings saved!";
        clearStatusTextLater();
    });
});

const tooltipItemNumberElem = document.getElementById("tooltip-item-number");
chrome.storage.local.get(["tooltipItemNumber"], (result) => {
    debugLog('options.js:tooltipItemNumber', `loaded settings from storage`, result);
    if (!result.tooltipItemNumber) {
        result.tooltipItemNumber = option_defaults.tooltipItemNumber;
        chrome.storage.local.set(result).then(() => debugLog('options.js:tooltipItemNumber', "saved default value"));
    }
    tooltipItemNumberElem.value = result.tooltipItemNumber;
});
tooltipItemNumberElem.addEventListener("change", (e) => {
    const obj = {tooltipItemNumber: parseInt(e.target.value)};
    if (obj.tooltipItemNumber < tooltipItemNumberElem.min) {
        debugLog('options.js:tooltipItemNumber', `value ${obj.tooltipItemNumber} below threshold ${tooltipItemNumberElem.min} -> no save`);
        statusText.textContent = `Tooltip item number < ${tooltipItemNumberElem.min}! Save failed!`;
        tooltipItemNumberElem.value = tooltipItemNumberElem.min;
        clearStatusTextLater();
    } else {
        chrome.storage.local.set(obj, () => {
            debugLog('options.js:tooltipItemNumber', `Saved settings to storage:`, obj);
            statusText.textContent = "Settings saved!";
            clearStatusTextLater();
        });
    }
});
const overviewPageSizeElem = document.getElementById("overview-page-size");
chrome.storage.local.get(["overviewPageSize"], (result) => {
    debugLog('options.js:overviewPageSize', `loaded settings from storage`, result);
    if (!result.overviewPageSize) {
        result.overviewPageSize = option_defaults.overviewPageSize;
        chrome.storage.local.set(result).then(() => debugLog('options.js:overviewPageSize', "saved default value"));
    }
    overviewPageSizeElem.value = result.overviewPageSize;
});
overviewPageSizeElem.addEventListener("change", (e) => {
    const obj = {overviewPageSize: parseInt(e.target.value)};
    if (obj.overviewPageSize < overviewPageSizeElem.min) {
        debugLog('options.js:overviewPageSize', `value ${obj.overviewPageSize} below threshold ${overviewPageSizeElem.min} -> no save`);
        statusText.textContent = `Tooltip item number < ${overviewPageSizeElem.min}! Save failed!`;
        overviewPageSizeElem.value = overviewPageSizeElem.min;
        clearStatusTextLater();
    } else {
        chrome.storage.local.set(obj, () => {
            debugLog('options.js:overviewPageSize', `Saved settings to storage`, obj);
            statusText.textContent = "Settings saved!";
            clearStatusTextLater()
        });
    }
});

function createFileDialog(message) {
    const dialogElem = document.createElement("dialog");
    document.body.appendChild(dialogElem);
    dialogElem.style.textAlign = "center";
    const messageElem = document.createElement("p");
    messageElem.textContent = message;
    dialogElem.appendChild(messageElem);
    const progressElem = document.createElement("div");
    progressElem.classList.add("loader");
    progressElem.style.margin = "auto";
    progressElem.style.paddingTop = "15px";
    dialogElem.appendChild(progressElem);
    dialogElem.showModal()
    return {dialogElem, messageElem, progressElem};
}

const importFileElem = document.getElementById("import-file");
const importModeElem = document.getElementById("import-mode");
const importBtn = document.getElementById("import-data");
importBtn.addEventListener("click", () => {
    debugLog('options.js:importData', `received click event on import btn`, importFileElem.files);
    const file = importFileElem.files[0];
    if (!file) {
        debugLog('options.js:importData', `No file selected`);
        statusText.textContent = "Select JSON file to import.";
        clearStatusTextLater();
        return;
    }

    const {dialogElem, messageElem, progressElem} = createFileDialog("Importing data...");
    const reader = new FileReader();

    reader.onload = (e) => {
        debugLog('options.js:importData', `read file`, e);
        try {
            const importedRaids = JSON.parse(e.target.result);
            debugLog('options.js:importData', "parsed json", importedRaids);
            if (!Array.isArray(importedRaids)) {
                debugLog('options.js:importData', "parsed data is not a valid raid")
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("File contains invalid or corrupted data");
            }

            chrome.storage.local.get(["raids"], (result) => {
                debugLog('options.js:importData', `loaded raids from storage`, result);
                let raids = importModeElem.checked ? result.raids || [] : [];
                debugLog('options.js:importData', `set base for import (appending? ${importModeElem.checked})`, raids);
                raids = [...raids, ...importedRaids];
                debugLog('options.js:importData', "raids pre sort", raids);
                raids.sort((raidA, raidB) => new Date(raidA.timestamp) - new Date(raidB.timestamp));
                debugLog('options.js:importData', "raids post sort", raids);

                chrome.storage.local.set({raids: raids}, () => {
                    debugLog('options.js:importData', "new raid data saved", raids);
                    setTimeout(() => {
                        messageElem.textContent = "Import successful";
                        progressElem.classList.remove("loader")
                        progressElem.textContent = `Imported ${importedRaids.length} raids. Total raids: ${raids.length}`;
                        progressElem.style.paddingTop = "";

                        const closeBtn = document.createElement("button");
                        closeBtn.type = "reset";
                        closeBtn.textContent = "Close";
                        dialogElem.appendChild(document.createElement("br"));
                        dialogElem.appendChild(closeBtn);
                        closeBtn.addEventListener("click", () => {
                            dialogElem.close();
                            document.body.removeChild(dialogElem);
                            debugLog('options.js:importData', "closing dialog");
                        });
                        debugLog('options.js:importData', "imported data");
                    }, 3000);
                });
            });
        } catch (err) {
            debugLog("Caught error", err)
            messageElem.textContent = "Import failed!";
            progressElem.classList.remove("loader")
            progressElem.textContent = `Error: ${err.message}`;
            progressElem.style.paddingTop = "";

            const closeBtn = document.createElement("button");
            closeBtn.type = "reset";
            closeBtn.textContent = "Close";
            dialogElem.appendChild(document.createElement("br"));
            dialogElem.appendChild(closeBtn);
            closeBtn.addEventListener("click", () => {
                dialogElem.close();
                document.body.removeChild(dialogElem);
                debugLog('options.js:importData', "closing error dialog");
            });
            debugLog('options.js:importData', "imported data failed");
        }
    };

    debugLog('options.js:importData', "reading json", file);
    reader.readAsText(file);
});

const exportBtn = document.getElementById("export-data");
exportBtn.addEventListener("click", () => {
    debugLog('options.js:exportData', `received click event on export btn`);
    chrome.storage.local.get(["raids"], (result) => {
        debugLog('options.js:exportData', `loaded raids from storage`, result);
        if (result.raids && result.raids.length < 1) {
            debugLog('options.js:exportData', "no raids to export")
            statusText.textContent = "No data to export available."
            clearStatusTextLater();
            return;
        }

        const {dialogElem, messageElem, progressElem} = createFileDialog("Exporting data...");

        const data = JSON.stringify(result.raids, null, 4);
        debugLog('options.js:exportData', "converted to json", data);
        const dataBlob = new Blob([data], {type: "application/json"});
        debugLog('options.js:exportData', "converted to blob", dataBlob);
        const url = URL.createObjectURL(dataBlob);
        debugLog('options.js:exportData', "created download link", url)

        setTimeout(() => {
            messageElem.textContent = "Download started...";
            const dlLink = document.createElement("a");
            dlLink.href = url;
            dlLink.download = `raid_data_bkp_${new Date().toISOString().slice(0, 10)}.json`;
            dlLink.textContent = `${dlLink.download}`;
            progressElem.classList.remove("loader")
            progressElem.appendChild(dlLink);
            progressElem.style.paddingTop = "";
            const closeBtn = document.createElement("button");
            closeBtn.type = "reset";
            closeBtn.textContent = "Close";
            dialogElem.appendChild(document.createElement("br"));
            dialogElem.appendChild(closeBtn);
            closeBtn.addEventListener("click", () => {
                URL.revokeObjectURL(url);
                dialogElem.close();
                document.body.removeChild(dialogElem);
                debugLog('options.js:exportData', "closing dialog");
            });

            dlLink.click();
            debugLog('options.js:exportData', "exported data");
        }, 3000);
    });
});

const clearBtn = document.getElementById("clear-btn")
clearBtn.addEventListener("click", () => {
    debugLog("options.js:click-event-listener", "Got event on clear btn");
    (async () => {
        if (!await showConfirmationDialog(clearBtn.parentElement, "Are you sure you want to delete everything?")) {
            debugLog("options.js:click-event-listener", "User aborted")
            return;
        }
        debugLog("options.js:click-event-listener", "User confirmed deletion twice")
        chrome.storage.local.set({raids: []}, () => {
            debugLog("options.js:click-event-listener", "Cleared all data");
            statusText.textContent = "All data erased!";
            clearStatusTextLater();
        });
    })();
});