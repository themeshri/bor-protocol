chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'newData') {
        // Store the data
        chrome.storage.local.get({ storedData: [] }, (result) => {
            const updatedData = result.storedData;
            updatedData.push(message.data);
            chrome.storage.local.set({ storedData: updatedData });
        });

        // Send to first tab
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            const firstTab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: firstTab.id },
                func: function(data) {
                    // Post message to the React app
                    window.postMessage({
                        type: 'NEW_CHAT_DATA',
                        payload: data
                    }, '*');
                },
                args: [message.data]
            });
        });
    }
});

// More precise tab update handling
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        // First check if we're actually monitoring
        chrome.storage.local.get('isMonitoring', (result) => {
            if (result.isMonitoring) {
                // Get the monitored tab ID
                chrome.tabs.query({ currentWindow: true }, (tabs) => {
                    if (tabs.length >= 2 && tabId === tabs[1].id) {
                        // Only reset if the monitored tab (second tab) is reloading
                        chrome.storage.local.set({ isMonitoring: false });
                        // Notify popup if it's open
                        chrome.runtime.sendMessage({
                            type: 'MONITORING_STOPPED',
                            reason: 'tab_reload'
                        });
                    }
                });
            }
        });
    }
});