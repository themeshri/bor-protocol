let isMonitoring = false;

// Function to find specific windows
async function findRequiredWindows() {
    const windows = await chrome.windows.getAll({ populate: true });
    let appWindow = null;
    let broadcastWindow = null;

    for (const window of windows) {
        for (const tab of window.tabs) {
            if (tab.url.startsWith('http://localhost:5173')) {
                appWindow = window;
            } else if (tab.url.includes('x.com/i/broadcasts/')) {
                broadcastWindow = window;
            }
        }
    }

    return { appWindow, broadcastWindow };
}

// Initialize state from storage when popup opens
chrome.storage.local.get(['isMonitoring', 'broadcastWindowId', 'appWindowId'], (result) => {
    isMonitoring = result.isMonitoring || false;
    updateUI(isMonitoring);
});

document.getElementById('toggleButton').addEventListener('click', async () => {
    const status = document.getElementById('status');
    
    if (!isMonitoring) {
        // Find required windows
        const { appWindow, broadcastWindow } = await findRequiredWindows();

        if (!appWindow || !broadcastWindow) {
            status.textContent = 'Error: Required windows not found!\nNeed:\n- localhost:5173\n- x.com/i/broadcasts/';
            return;
        }

        try {
            // Store window IDs
            await chrome.storage.local.set({
                appWindowId: appWindow.id,
                broadcastWindowId: broadcastWindow.id
            });

            // Execute monitoring script in the broadcast window
            await chrome.scripting.executeScript({
                target: { tabId: broadcastWindow.tabs[0].id },
                func: function() {
                    // Reset state
                    window.processedMessages = new Set();

                    // Create observer
                    window.myObserver = new MutationObserver(mutations => {
                        mutations.forEach(mutation => {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === 1 && node.matches('div[class="css-175oi2r r-1d5kdc7 r-173mzie"]')) {
                                    setTimeout(() => {
                                        const link = node.querySelector('a[class="css-175oi2r r-xoduu5 r-1wbh5a2 r-dnmrzs r-1ny4l3l r-1loqt21"]');
                                        let imageElement = node.querySelector('img.css-9pa8cd');
                                        
                                        if (!imageElement) {
                                            imageElement = node.querySelector('img[class*="css-9pa8cd"]');
                                        }
                                        
                                        let linkContent = '';
                                        let srcImageContent = '';
                                       
                                        if (imageElement) {
                                            srcImageContent = imageElement.src;
                                        } 
                                        
                                        if (link) {
                                            const firstDiv = link.querySelector('div');
                                            if (firstDiv) {
                                                const nestedSpan = firstDiv.querySelector('span');
                                                if (nestedSpan) {
                                                    const deepestSpan = nestedSpan.querySelector('span');
                                                    if (deepestSpan) {
                                                        linkContent = deepestSpan.textContent;
                                                    }
                                                }
                                            }
                                        }
                                        
                                        const innerDiv = node.querySelector('div.css-146c3p1.r-bcqeeo.r-1ttztb7.r-qvutc0');
                                        let content = '';
                                        if (innerDiv) {
                                            const directSpan = Array.from(innerDiv.childNodes)
                                                .find(node => node.nodeName === 'SPAN');
                                            
                                            if (directSpan) {
                                                content = directSpan.textContent.trim();
                                            }
                                        }

                                        if (linkContent || content) {
                                            const messageId = `${linkContent}-${content}-${srcImageContent}`;
                                            
                                            if (!window.processedMessages.has(messageId)) {
                                                window.processedMessages.add(messageId);
                                                
                                                window.postMessage({
                                                    type: 'FROM_INJECTED_SCRIPT',
                                                    content: {
                                                        username: linkContent,
                                                        chatContent: content,
                                                        avatar: srcImageContent,
                                                        timestamp: new Date().toISOString()
                                                    }
                                                }, '*');
                                            }
                                        }
                                    }, 40);
                                }
                            });
                        });
                    });

                    window.myObserver.observe(document.body, { childList: true, subtree: true });
                    return true;
                }
            });
            
            isMonitoring = true;
            chrome.storage.local.set({ isMonitoring: true });
            updateUI(true);
        } catch (err) {
            status.textContent = 'Error: ' + err.message;
        }
    } else {
        // Stop monitoring
        try {
            const result = await chrome.storage.local.get('broadcastWindowId');
            if (result.broadcastWindowId) {
                const windows = await chrome.windows.getAll({ populate: true });
                const broadcastWindow = windows.find(w => w.id === result.broadcastWindowId);
                if (broadcastWindow) {
                    await chrome.scripting.executeScript({
                        target: { tabId: broadcastWindow.tabs[0].id },
                        func: function() {
                            if (window.myObserver) {
                                window.myObserver.disconnect();
                                window.myObserver = null;
                            }
                            return true;
                        }
                    });
                }
            }

            isMonitoring = false;
            chrome.storage.local.set({ 
                isMonitoring: false,
                broadcastWindowId: null,
                appWindowId: null
            });
            updateUI(false);
        } catch (err) {
            status.textContent = 'Error stopping: ' + err.message;
        }
    }
});

function updateUI(monitoring) {
    const button = document.getElementById('toggleButton');
    const status = document.getElementById('status');
    
    if (monitoring) {
        button.textContent = 'Stop Monitoring';
        button.classList.add('stop');
        status.textContent = 'Monitoring active...';
    } else {
        button.textContent = 'Start Monitoring';
        button.classList.remove('stop');
        status.textContent = 'Ready to monitor';
    }
}

// Regular state check
async function checkWindowStates() {
    const { appWindow, broadcastWindow } = await findRequiredWindows();
    const result = await chrome.storage.local.get(['isMonitoring', 'appWindowId', 'broadcastWindowId']);

    if (result.isMonitoring) {
        // If monitoring but required windows are missing, stop monitoring
        if (!appWindow || !broadcastWindow || 
            appWindow.id !== result.appWindowId || 
            broadcastWindow.id !== result.broadcastWindowId) {
            
            chrome.storage.local.set({ 
                isMonitoring: false,
                broadcastWindowId: null,
                appWindowId: null
            });
            chrome.runtime.sendMessage({
                type: 'MONITORING_STOPPED',
                reason: 'windows_changed'
            });
        }
    }
}

// Check window states every 5 seconds
const stateCheckInterval = setInterval(checkWindowStates, 5000);

// Clean up interval when popup closes
window.addEventListener('unload', () => {
    clearInterval(stateCheckInterval);
});