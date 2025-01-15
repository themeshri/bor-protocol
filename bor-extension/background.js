chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'newData') {
        // Store the data
        chrome.storage.local.get({ storedData: [] }, (result) => {
            const updatedData = result.storedData;
            updatedData.push(message.data);
            chrome.storage.local.set({ storedData: updatedData });
        });

        // Send to app window
        chrome.storage.local.get('appWindowId', async (result) => {
            if (result.appWindowId) {
                const windows = await chrome.windows.getAll({ populate: true });
                const appWindow = windows.find(w => w.id === result.appWindowId);
                if (appWindow && appWindow.tabs.length > 0) {
                    chrome.scripting.executeScript({
                        target: { tabId: appWindow.tabs[0].id },
                        func: function(data) {
                            window.postMessage({
                                type: 'NEW_CHAT_DATA',
                                payload: data
                            }, '*');
                        },
                        args: [message.data]
                    });
                }
            }
        });
    }
});

// Handle window removals
chrome.windows.onRemoved.addListener((windowId) => {
    chrome.storage.local.get(['broadcastWindowId', 'appWindowId', 'isMonitoring'], (result) => {
        if (windowId === result.broadcastWindowId || windowId === result.appWindowId) {
            chrome.storage.local.set({ 
                isMonitoring: false,
                broadcastWindowId: null,
                appWindowId: null 
            });
            chrome.runtime.sendMessage({
                type: 'MONITORING_STOPPED',
                reason: 'window_closed'
            });
        }
    });
});