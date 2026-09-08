import {debugLog, option_defaults} from "../shared.js";

const statusText = document.getElementById("status");

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
        setTimeout(() => statusText.textContent = "", 2000);
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
        setTimeout(() => statusText.textContent = "", 2000);
    } else {
        chrome.storage.local.set(obj, () => {
            debugLog('options.js:tooltipItemNumber', `Saved settings to storage:`, obj);
            statusText.textContent = "Settings saved!";
            setTimeout(() => statusText.textContent = "", 2000);
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
        setTimeout(() => statusText.textContent = "", 2000);
    } else {
        chrome.storage.local.set(obj, () => {
            debugLog('options.js:overviewPageSize', `Saved settings to storage`, obj);
            statusText.textContent = "Settings saved!";
            setTimeout(() => statusText.textContent = "", 2000);
        });
    }
});