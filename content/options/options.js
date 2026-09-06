import {debugLog} from "../shared.js";

const statusText = document.getElementById("status");

const debugCheckbox = document.getElementById("debug-mode");
chrome.storage.local.get({debugMode: false}, (result) => {
    debugLog('options.js:debugLog', `Loaded settings from storage: ${result}`);
    debugCheckbox.checked = result.debugMode;
});
debugCheckbox.addEventListener("change", (e) => {
    const obj = {debugMode: e.target.checked};
    chrome.storage.local.set(obj, () => {
        debugLog('options.js:debugLog', `Saved settings to storage: ${obj}`)
        statusText.textContent = "Settings saved!";
        setTimeout(() => statusText.textContent = "", 2000);
    });
});

const tooltipItemNumberElem = document.getElementById("tooltip-item-number");
chrome.storage.local.get({"toooltipItemNumber": 5}, (result) => {
    debugLog('options.js:tooltipItemNumber', `loaded settings from storage: ${result}`);
    if (!result.tooltipItemNumber) {
        result.tooltipItemNumber = 5;
        chrome.storage.local.set(result).then(() => debugLog('options.js:tooltipItemNumber', "saved default value"));
    }
    tooltipItemNumberElem.value = result.tooltipItemNumber;
});
tooltipItemNumberElem.addEventListener("change", (e) => {
    const obj = {tooltipItemNumber: parseInt(e.target.value)};
    if (obj.tooltipItemNumber < tooltipItemNumberElem.min) {
        debugLog('options.js:tooltipItemNumber', "value below threshold -> no save");
        statusText.textContent = `Tooltip item number < ${tooltipItemNumberElem.min}! Save failed!`;
        tooltipItemNumberElem.value = tooltipItemNumberElem.min;
        setTimeout(() => statusText.textContent = "", 2000);
    } else {
        chrome.storage.local.set(obj, () => {
            debugLog('options.js:tooltipItemNumber', `Saved settings to storage: ${obj}`);
            statusText.textContent = "Settings saved!";
            setTimeout(() => statusText.textContent = "", 2000);
        });
    }
});
const overviewPageSizeElem = document.getElementById("overview-page-size");
chrome.storage.local.get({"overviewPageSize": 15}, (result) => {
    debugLog('options.js:overviewPageSize', `loaded settings from storage: ${result}`);
    if (!result.overviewPageSize) {
        result.overviewPageSize = 15;
        chrome.storage.local.set(result).then(() => debugLog('options.js:overviewPageSize', "saved default value"));
    }
    overviewPageSizeElem.value = result.overviewPageSize;
});
overviewPageSizeElem.addEventListener("change", (e) => {
    const obj = {overviewPageSize: parseInt(e.target.value)};
    if (obj.overviewPageSize < overviewPageSizeElem.min) {
        debugLog('options.js:overviewPageSize', "value below threshold -> no save");
        statusText.textContent = `Tooltip item number < ${overviewPageSizeElem.min}! Save failed!`;
        overviewPageSizeElem.value = overviewPageSizeElem.min;
        setTimeout(() => statusText.textContent = "", 2000);
    } else {
        chrome.storage.local.set(obj, () => {
            debugLog('options.js:overviewPageSize', `Saved settings to storage: ${obj}`);
            statusText.textContent = "Settings saved!";
            setTimeout(() => statusText.textContent = "", 2000);
        });
    }
});