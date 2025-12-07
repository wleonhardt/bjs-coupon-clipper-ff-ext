// background.js

browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({ isRunning: false, totalClipped: 0, status: "Idle", message: "" });
});

// Listen for tab URL updates and notify popup
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    browser.runtime.sendMessage({ type: "url-updated", url: changeInfo.url });
  }
});